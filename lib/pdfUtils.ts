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
    const pdfModule = require('pdf-parse');
    const PDFParse = pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse) || (typeof pdfModule === 'function' ? pdfModule : null);
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

        const sanitized = sanitizeExtractedText(extracted);
        if (sanitized && sanitized.length > 0) {
          return sanitized;
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
 * Strips non-printable control characters while preserving readable text layout.
 */
function sanitizeExtractedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
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
        try {
          const decompressedRaw = zlib.inflateRawSync(streamBytes);
          decompressedStr = decompressedRaw.toString('latin1');
        } catch {
          decompressedStr = match[1];
        }
      }

      // 1. Literal PDF strings: (text) Tj
      const tjRegex = /\(([^()]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(decompressedStr)) !== null) {
        if (tjMatch[1]) {
          textSegments.push(cleanPdfString(tjMatch[1]));
        }
      }

      // 2. PDF Array strings: [(t1) -10 (t2)] TJ
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

      // 3. Hexadecimal PDF strings: <48656c6c6f> Tj or TJ
      const hexTjRegex = /<([0-9a-fA-F]+)>\s*(?:Tj|TJ)/g;
      let hexMatch;
      while ((hexMatch = hexTjRegex.exec(decompressedStr)) !== null) {
        const hex = hexMatch[1];
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.substring(i, i + 2), 16);
          if (code >= 32 && code <= 126) {
            decoded += String.fromCharCode(code);
          }
        }
        if (decoded.trim()) {
          textSegments.push(decoded);
        }
      }
    }

    return sanitizeExtractedText(textSegments.join(' '));
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
