import { createRequire } from 'module';
import zlib from 'zlib';

const require = createRequire(import.meta.url);

/**
 * Production-grade async PDF text extraction using pdf-parse v2.4.5 API format:
 *   const parser = new PDFParse({ data: pdfBuffer });
 *   const result = await parser.getText();
 *   await parser.destroy();
 * 
 * Fully compatible with Next.js 15 Node.js Serverless & Cloud Run runtimes.
 */
export async function extractTextFromPdfBufferAsync(pdfBuffer: Buffer): Promise<string> {
  let parser: { getText: () => Promise<any>; destroy?: () => Promise<any> } | null = null;
  try {
    const { PDFParse } = require('pdf-parse');
    if (typeof PDFParse === 'function') {
      parser = new PDFParse({ data: pdfBuffer });
      if (parser) {
        const res = await parser.getText();
        const extracted = typeof res === 'string' ? res : (res && res.text ? res.text : '');

        if (typeof parser.destroy === 'function') {
          try {
            await parser.destroy();
          } catch {
            // Ignore cleanup warnings
          }
        }

        if (extracted && extracted.trim().length > 0) {
          return extracted.trim();
        }
      }
    }
  } catch {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch {
        // Ignore cleanup warnings
      }
    }
  }

  return extractTextFromCompressedPdfBuffer(pdfBuffer);
}

/**
 * Synchronous PDF text extraction alias for stream decompression fallback.
 */
export function extractTextFromPdfBuffer(pdfBuffer: Buffer): string {
  return extractTextFromCompressedPdfBuffer(pdfBuffer);
}

/**
 * Decompresses /FlateDecode streams manually using zlib if pdf-parse encounters an unhandled stream edge case.
 */
function extractTextFromCompressedPdfBuffer(pdfBuffer: Buffer): string {
  try {
    const pdfString = pdfBuffer.toString('latin1');
    const textSegments: string[] = [];

    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamBytes = Buffer.from(match[1], 'latin1');
      let decompressedStr = '';
      try {
        const decompressed = zlib.inflateSync(streamBytes);
        decompressedStr = decompressed.toString('latin1');
      } catch {
        decompressedStr = match[1];
      }

      const tjRegex = /\(([^()]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(decompressedStr)) !== null) {
        if (tjMatch[1]) {
          textSegments.push(cleanPdfString(tjMatch[1]));
        }
      }

      const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch;
      while ((arrayMatch = arrayTjRegex.exec(decompressedStr)) !== null) {
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

    return textSegments.join(' ').replace(/\s+/g, ' ').trim();
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
