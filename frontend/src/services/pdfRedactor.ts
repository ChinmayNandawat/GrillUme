import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs in a Vite environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type PiiMatch = {
  type: string;
  value: string;
  source: string;
};

/**
 * Renders a PDF file to a set of canvas images, draws black boxes over
 * any text that matches the PII strings, and reconstructs a flattened PDF.
 * @param file The original PDF file.
 * @param piiMatches The array of PII strings to redact.
 * @returns A new flattened File object.
 */
export async function createRedactedPdf(file: File, piiMatches: PiiMatch[]): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Extract PDF document from the uploaded file buffer
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const numPages = pdfDoc.numPages;

  // Set up jsPDF instance to re-assemble the redacted images into a final PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4', // We will update this per page
  });
  doc.deletePage(1); // Remove default page

  const piiValues = piiMatches.map(m => m.value);

  // Loop through every page, rasterize it, and apply redaction masks
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    
    // Use a higher scale for better resolution of the output image
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    // Create a hidden canvas for rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render the page to the canvas
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    // Extract text items from the page so we know exactly where to draw the black boxes
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      width: number;
      height: number;
    }>;

    // Create a unified text string without whitespace, mapped back to item indices
    let fullText = "";
    const charToItem: number[] = [];
    
    for (let j = 0; j < items.length; j++) {
      const str = items[j].str.toLowerCase().replace(/\s+/g, '');
      for (let c = 0; c < str.length; c++) {
        fullText += str[c];
        charToItem.push(j);
      }
    }

    for (const piiValue of piiValues) {
      const cleanPii = piiValue.toLowerCase().replace(/\s+/g, '');
      if (!cleanPii) continue;

      let startIndex = 0;
      while ((startIndex = fullText.indexOf(cleanPii, startIndex)) !== -1) {
        const endIndex = startIndex + cleanPii.length - 1;
        const startItemIdx = charToItem[startIndex];
        const endItemIdx = charToItem[endIndex];
        
        for (let idx = startItemIdx; idx <= endItemIdx; idx++) {
          drawRedactionOnCanvas(ctx, items[idx], viewport);
        }
        startIndex += cleanPii.length;
      }
    }

    // Convert our edited canvas directly into a JPEG blob
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Slap the newly redacted image back onto a clean jsPDF page
    // Ensure we match the original viewport dimensions perfectly so it doesn't look stretched
    const originalViewport = page.getViewport({ scale: 1.0 });
    doc.addPage([originalViewport.width, originalViewport.height], originalViewport.width > originalViewport.height ? 'landscape' : 'portrait');
    doc.addImage(imgData, 'JPEG', 0, 0, originalViewport.width, originalViewport.height);
  }

  // Export the finalized PDF as a blob
  const redactedBlob = doc.output('blob');
  
  // Return as a File object
  return new File([redactedBlob], file.name.replace(/\.[^/.]+$/, "") + "-redacted.pdf", {
    type: 'application/pdf',
  });
}

/**
 * Draws a redaction rectangle directly on the 2D canvas.
 */
function drawRedactionOnCanvas(
  ctx: CanvasRenderingContext2D,
  item: { transform: number[]; width: number; height: number },
  viewport: any
) {
  const pdfX = item.transform[4];
  const pdfY = item.transform[5];
  const scaleY = item.transform[3];
  
  const pt1 = viewport.convertToViewportPoint(pdfX, pdfY); 
  const approxHeight = item.height > 0 ? item.height : (scaleY > 0 ? scaleY : 12);
  const pt2 = viewport.convertToViewportPoint(pdfX + item.width, pdfY + approxHeight); 

  const vx = pt1[0];
  const vy = pt2[1]; 
  const vw = pt2[0] - pt1[0];
  const vh = pt1[1] - pt2[1];

  const padding = 4;
  
  // Draw black box over text
  ctx.fillStyle = '#000000';
  ctx.fillRect(vx - padding, vy - padding, vw + (padding * 2), vh + (padding * 2));
  
  // Draw [CLASSIFIED] text inside the box
  ctx.fillStyle = '#ffffff';
  const fontSize = Math.max(10, Math.floor(vh * 0.7)); 
  ctx.font = `bold ${fontSize}px sans-serif`;
  if (vw > 50) {
    ctx.fillText('[CLASSIFIED]', vx, pt1[1] - padding/2);
  }
}
