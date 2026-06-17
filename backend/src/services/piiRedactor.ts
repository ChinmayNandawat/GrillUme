import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { detectPii, PiiMatch } from './piiDetector';

export async function detectPiiInPdfBuffer(buffer: Buffer): Promise<{ piiFound: PiiMatch[] }> {
  let fullText = '';
  try {
    const data = await pdfParse(buffer);
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
