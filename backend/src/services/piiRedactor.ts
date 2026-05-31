const pdfParseMod = require('pdf-parse');
const PDFParse = pdfParseMod.PDFParse;
import { detectPii, PiiMatch } from './piiDetector';

export async function detectPiiInPdfBuffer(buffer: Buffer): Promise<{ piiFound: PiiMatch[] }> {
  let fullText = '';
  try {
    const parser = new (PDFParse as any)({ data: buffer });
    const result = await parser.getText();
    fullText = result.text;
    await parser.destroy();
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
