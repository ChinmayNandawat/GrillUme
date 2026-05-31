/**
 * PII Detection Service
 *
 * Two-layer detection:
 *   1. Regex patterns — fast, deterministic, catches well-formatted PII.
 *   2. Gemini Flash LLM — catches context-dependent PII that regex misses
 *      (names embedded in sentences, non-standard formats, etc.).
 *
 * Results from both layers are merged and deduplicated before being returned
 * to the redaction service.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Core Types ---

export interface PiiMatch {
  /** Category of PII detected. */
  type:
    | 'email'
    | 'phone'
    | 'address'
    | 'url'
    | 'ssn'
    | 'dob'
    | 'name'
    | 'id_number'
    | 'username'
    | 'company'
    | 'college'
    | 'project_name'
    | 'other';
  /** The literal text that was identified as PII. */
  value: string;
  /** Which detector found this match. */
  source: 'regex' | 'llm';
}

// --- Regex Fallback Layer ---
// These patterns are our safety net if the LLM fails or hits rate limits.

interface PatternEntry {
  type: PiiMatch['type'];
  pattern: RegExp;
}

const PII_PATTERNS: PatternEntry[] = [
  // Email addresses
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },

  // Phone numbers (International generic)
  {
    type: 'phone',
    pattern: /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g,
  },

  // Phone numbers (Strict Indian Mobile: optional +91 or 0, followed by 10 digits starting with 6-9)
  {
    type: 'phone',
    pattern: /\b(?:\+?91[\s.-]?)?(?:0[\s.-]?)?[6789]\d{9}\b/g,
  },

  // Phone numbers (Generic 10-digit blocks often used in India)
  {
    type: 'phone',
    pattern: /\b\d{5}[\s.-]?\d{5}\b/g,
  },

  // SSN / national ID patterns (US SSN)
  {
    type: 'ssn',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  },

  // Aadhaar-style (India): 4-4-4 digits
  {
    type: 'id_number',
    pattern: /\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g,
  },

  // PAN Card (India): 5 letters, 4 digits, 1 letter
  {
    type: 'id_number',
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi,
  },
  
  // Indian Passport Number: 1 letter, 7 digits
  {
    type: 'id_number',
    pattern: /\b[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]\b/g,
  },

  // Street addresses (US-style & generic)
  {
    type: 'address',
    pattern: /\b\d{1,5}\s[a-zA-Z0-9\s]{1,40}\b(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\b\.?/gi,
  },

  // Zip / postal codes (US 5-digit or 5+4, India 6-digit PIN code)
  {
    type: 'address',
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
  },
  {
    type: 'address',
    pattern: /\b[1-9]\d{2}\s?\d{3}\b/g, // Indian PIN code format (e.g. 110 001 or 110001)
  },

  // LinkedIn / GitHub / Developer profiles
  {
    type: 'url',
    pattern: /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|leetcode\.com|hackerrank\.com|codechef\.com|codeforces\.com|geeksforgeeks\.org|topcoder\.com|kaggle\.com|behance\.net|dribbble\.com)\/[^\s)>,]+/gi,
  },

  // Generic personal website URLs (with http)
  {
    type: 'url',
    pattern: /https?:\/\/(?!(?:www\.)?(?:google|youtube|wikipedia|stackoverflow|medium|dev\.to|npmjs|pypi)\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)>,]*)?/gi,
  },

  // Personal website URLs without http but with common dev TLDs (excluding common tech skills like socket.io)
  {
    type: 'url',
    pattern: /\b(?!(?:socket\.io)\b)[a-zA-Z0-9.-]+\.(?:dev|me|io|tech|co)\b/gi,
  },

  // GitHub Repositories (e.g. ChinmayNandawat/GrillUme)
  {
    type: 'url',
    pattern: /\b(?:github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)\b/gi,
  },

  // Usernames or handles (@username)
  {
    type: 'username',
    pattern: /(?:^|\s)@[a-zA-Z0-9_]{3,15}\b/g,
  },

  // Educational Institutions
  {
    type: 'college',
    pattern: /\b(?:[A-Z][a-zA-Z.\-']+[ \t]+){1,5}(?:Institute of Technology|University|College|Academy|School)(?:,[ \t]*[A-Z][a-zA-Z.\-']+){0,2}\b/g,
  },

  // Company Names (Ending in Pvt Ltd, Inc, LLC, etc.)
  {
    type: 'company',
    pattern: /\b(?:[a-zA-Z0-9.\-']+\s+){1,4}(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Limited|GmbH)\b/gi,
  },

  // Certificate IDs, Registration Numbers, Award IDs (Generic alphanumeric with dashes)
  {
    type: 'id_number',
    pattern: /\b(?:[A-Z0-9]{4,}[-]){2,}[A-Z0-9]{4,}\b/g,
  },
  {
    type: 'id_number',
    pattern: /\b(?=.*[0-9])[A-Z0-9]{12,32}\b/g, // Long generic alphanumeric strings (hashes/ids), must contain at least one digit
  },

  // Date of birth patterns
  {
    type: 'dob',
    pattern: /\b(?:DOB|Date\s+of\s+Birth|Born|Birthday|D\.O\.B\.?)[:\s]+[\d/.\-]+\b/gi,
  },

  // Dates in common formats that might be DOB (DD/MM/YYYY, MM-DD-YYYY, etc.)
  {
    type: 'dob',
    pattern: /\b(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:19|20)\d{2}\b/g,
  },

  // Common Name Prefixes (If they explicitly write "Name: John Doe")
  {
    type: 'name',
    pattern: /\b(?:Name|Full Name|First Name|Last Name)\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/gi,
  }
];

/**
 * Run all regex patterns against text and collect matches.
 */
export function detectPiiWithRegex(text: string): PiiMatch[] {
  const matches: PiiMatch[] = [];

  for (const { type, pattern } of PII_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // If there's a capture group (like in Name Prefix), use the captured part, else the whole match
      const value = match[1] ? match[1].trim() : match[0].trim();
      
      if (value.length > 2) {
        matches.push({ type, value, source: 'regex' });
      }
    }
  }

  // Heuristic: The first non-empty line of a resume is almost always the candidate's name
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Make sure it doesn't look like contact info
    if (firstLine.length < 50 && !firstLine.includes('@') && !/\d{5}/.test(firstLine)) {
      matches.push({ type: 'name', value: firstLine, source: 'regex' });
    }
  }

  return matches;
}

// --- LLM Detection Layer (Gemini Flash) ---
// This handles the messy, context-dependent PII that regex naturally misses.

const GEMINI_PII_PROMPT = `You are a PII (Personally Identifiable Information) detector for resume documents. 
Your task is to identify ALL personal information and organizational entities in the following text.

IMPORTANT RULES:
1. Return ONLY a JSON array of objects with "type" and "value" fields.
2. Types must be one of: "name", "email", "phone", "address", "url", "id_number", "company", "college", "project_name", "username", "other"
3. You MUST redact the following:
   - Personal Information: Full Name, Email, Phone, Home Address
   - URLs: LinkedIn URL, GitHub URL, Portfolio Website, Social Media Links, Repository URLs, Project URLs/Domains
   - Education: College/University Name, School Name, Student/Roll Number
   - Work Experience: Company Names, Client Names, Employee IDs
   - Projects: Internal Project Names
   - Achievements: Certificate IDs, Registration Numbers, Unique Award IDs
   - References: References' Names and Contact Details
   - Handles: Any usernames or handles (e.g. chinmay123, john_dev)
4. DO NOT redact academic grades, CGPA, percentages, scores, or graduation years (e.g. 8.51, 95%, 2023-2027). These are NOT PII.
5. DO NOT redact technical skills (e.g. React, Node.js, Socket.io, SQL, Machine Learning).
6. DO NOT redact standard job titles (e.g. Software Engineer, Business Analyst).
7. If there is no PII found, return an empty array: []
8. Return ONLY valid JSON. No explanation, no markdown, no code fences.

TEXT TO ANALYZE:
---
{TEXT}
---

JSON ARRAY:`;

/**
 * Use Gemini Flash (free tier) to detect PII that regex might miss.
 * Returns null if the API is unavailable, fails, or rate-limits, allowing for fallback.
 */
export async function detectPiiWithLlm(text: string): Promise<PiiMatch[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — skipping LLM PII detection.');
    return null;
  }

  // Truncate very long texts to stay within free-tier token limits
  const truncatedText = text.length > 8000 ? text.slice(0, 8000) : text;
  const prompt = GEMINI_PII_PROMPT.replace('{TEXT}', truncatedText);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const rawText = response.text().trim();

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      console.warn('Gemini returned non-array PII response, skipping.');
      return null;
    }

    return parsed
      .filter(
        (item: { type?: string; value?: string }) =>
          typeof item.type === 'string' && typeof item.value === 'string' && item.value.trim().length > 0
      )
      .map((item: { type: string; value: string }) => ({
        type: normalizeType(item.type),
        value: item.value.trim(),
        source: 'llm' as const,
      }));
  } catch (error) {
    console.error('Gemini PII detection failed (rate limit or network error).');
    return null;
  }
}

function normalizeType(raw: string): PiiMatch['type'] {
  const lowered = raw.toLowerCase().trim();
  const validTypes: PiiMatch['type'][] = [
    'email',
    'phone',
    'address',
    'url',
    'ssn',
    'dob',
    'name',
    'id_number',
    'username',
    'company',
    'college',
    'project_name',
    'other',
  ];
  return (validTypes.includes(lowered as PiiMatch['type'])
    ? lowered
    : 'other') as PiiMatch['type'];
}

// --- Utility functions for merging both layers ---

/**
 * Merge regex and LLM results, removing exact-duplicate values.
 *
 * Deduplication is case-insensitive on the `value` field.  If a value is
 * found by both regex and LLM the regex entry is kept (it is more precise).
 */
function deduplicateMatches(matches: PiiMatch[]): PiiMatch[] {
  const seen = new Map<string, PiiMatch>();

  for (const match of matches) {
    const key = `${match.type}::${match.value.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, match);
    }
    // If already present via regex, keep the regex entry (skip LLM duplicate).
  }

  return Array.from(seen.values());
}

/**
 * Run LLM PII detection first. If it succeeds, use its highly-accurate results.
 * If the LLM fails (e.g. rate limit exceeded or API key missing), automatically
 * fall back to the robust Regex engine.
 */
export async function detectPii(text: string): Promise<PiiMatch[]> {
  const llmMatches = await detectPiiWithLlm(text);

  if (llmMatches !== null) {
    console.log(`PII Detection complete: Used LLM Engine. Found ${llmMatches.length} matches.`);
    return deduplicateMatches(llmMatches);
  }

  console.log('LLM Engine failed or skipped. Falling back to Regex Engine...');
  
  const regexMatches = detectPiiWithRegex(text);
  console.log(`PII Detection complete: Used Regex Engine. Found ${regexMatches.length} matches.`);
  
  return deduplicateMatches(regexMatches);
}
