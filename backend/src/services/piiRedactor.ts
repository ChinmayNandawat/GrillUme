import pdfParse from 'pdf-parse';
import { detectPii, PiiMatch } from './piiDetector';

export async function detectPiiInPdfBuffer(buffer: Buffer): Promise<{ piiFound: PiiMatch[] }> {
  let fullText = '';
  try {
    // Bypass TS signature strictness for CommonJS module
    const parser = pdfParse as any;
    const data = await parser(buffer);
    fullText = data.text;
  } catch (err) {
    console.error('Error extracting text from PDF:', err);
  }

  if (!fullText || fullText.trim().length === 0) {
    console.warn('PDF text extraction returned empty — possibly a scanned PDF. Skipping redaction.');
    return { piiFound: [] };
  }

  const piiMatches = await detectPii(fullText);
  return { piiFound: piiMatches };
}
