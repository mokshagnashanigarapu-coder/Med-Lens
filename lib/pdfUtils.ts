/**
 * Pure TypeScript text extractor for PDF files.
 * Deconstructs text operators (BT...ET, Tj, TJ) from PDF stream buffers
 * to ensure robust text extraction across Node.js environments.
 */
export function extractTextFromPdfBuffer(pdfBuffer: Buffer): string {
  try {
    const pdfString = pdfBuffer.toString('latin1');
    const textSegments: string[] = [];

    // Match text blocks enclosed in BT (Begin Text) and ET (End Text) operators
    const btRegex = /BT[\s\S]*?ET/g;
    const matches = pdfString.match(btRegex);

    if (matches) {
      for (const block of matches) {
        // Extract string content from (text) Tj and [(text)] TJ operators
        const tjRegex = /\(([^()]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
          if (tjMatch[1]) {
            textSegments.push(cleanPdfString(tjMatch[1]));
          }
        }

        const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
        let arrayMatch;
        while ((arrayMatch = arrayTjRegex.exec(block)) !== null) {
          const inner = arrayMatch[1];
          const innerStrRegex = /\(([^()]*)\)/g;
          let innerMatch;
          while ((innerMatch = innerStrRegex.exec(inner)) !== null) {
            if (innerMatch[1]) {
              textSegments.push(cleanPdfString(innerMatch[1]));
            }
          }
        }
      }
    }

    const extracted = textSegments.join(' ').replace(/\s+/g, ' ').trim();
    return extracted;
  } catch {
    return '';
  }
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([()])/g, '$1')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\');
}
