import { extractText } from 'unpdf';
import { detectPii, PiiMatch } from './piiDetector';

export async function detectPiiInPdfBuffer(buffer: Buffer): Promise<{ piiFound: PiiMatch[] }> {
  let fullText = '';
  try {
    const extracted = await extractText(new Uint8Array(buffer));
    console.log('Unpdf extraction result:', JSON.stringify(extracted).substring(0, 500));
    const { text } = extracted;
    fullText = Array.isArray(text) ? text.join('\n') : (text as string);
    console.log('Extracted fullText length:', fullText?.length);
  } catch (err) {
    console.error('Error extracting text from PDF with unpdf:', err);
  }

  if (!fullText || fullText.trim().length === 0) {
    console.warn('PDF text extraction returned empty — possibly a scanned PDF. Skipping redaction.');
    return { piiFound: [] };
  }

  const piiMatches = await detectPii(fullText);
  return { piiFound: piiMatches };
}
