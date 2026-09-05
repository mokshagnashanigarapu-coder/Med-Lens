import { GoogleGenAI, Type } from '@google/genai';
import { APP_CONFIG } from './config';
import { RawExtractionResponseSchema, RawExtractionResponse } from './schemas';
import { GroundedSummary, PatientInfo, LabResultItem } from './types';
import { extractTextFromPdfBufferAsync } from './pdfUtils';

// Initialize SDK client if API key is present
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = APP_CONFIG.gemini.apiKey;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Clean raw response text by removing markdown code block fences (```json ... ```)
 */
function cleanJsonResponseText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }
  return cleaned.trim();
}

export type ExtractionErrorResult = {
  success: false;
  error: {
    code: 'API_KEY_MISSING' | 'INVALID_INPUT' | 'PDF_TEXT_EXTRACTION_FAILED' | 'PDF_EMPTY_TEXT' | 'UNSUPPORTED_FILE_TYPE' | 'FILE_TOO_LARGE' | 'GEMINI_PROCESSING_FAILED' | 'SCHEMA_VALIDATION_FAILED';
    message: string;
    retryable: boolean;
  };
};

/**
 * Server-side report extraction pipeline supporting PDF, Image, and Pasted Text.
 */
export async function extractReportStructured(
  fileBuffer?: Buffer,
  mimeType?: string,
  rawText?: string
): Promise<{ success: true; data: RawExtractionResponse } | ExtractionErrorResult> {
  const ai = getGeminiClient();

  if (!ai) {
    return {
      success: false,
      error: {
        code: 'API_KEY_MISSING',
        message: 'Gemini API key is not configured on the server. Please load a sample scenario or configure GEMINI_API_KEY.',
        retryable: false,
      },
    };
  }

  const systemInstruction = `You are a specialized clinical report extraction engine.
Your single job is to extract structured laboratory and diagnostic test items from medical reports.
Rules:
1. Extract test names, numerical or qualitative values, units, reference ranges, test dates, and observations.
2. Extract source location (e.g. "Source: Page 1 — Hematology") IF explicitly present. If unconfirmed or absent, leave sourceLocation empty.
3. Do NOT invent, guess, or extrapolate reference ranges. If missing, leave referenceRange empty ("").
4. Do NOT output diagnoses, prescriptions, or medical conclusions.
5. Output MUST strictly match the required JSON schema.`;

  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  // PATH 1: PDF Document Processing
  const isPdf = fileBuffer && (mimeType === 'application/pdf' || mimeType === 'application/x-pdf' || (mimeType && mimeType.includes('pdf')));
  if (isPdf && fileBuffer) {
    let pdfText = '';
    try {
      pdfText = await extractTextFromPdfBufferAsync(fileBuffer);
    } catch (e) {
      console.error('[PDF Text Extraction Error]:', e);
    }
    
    if (pdfText && pdfText.trim().length > 0) {
      contents.push(`Extracted PDF Medical Report Text:\n${pdfText.trim()}`);
    } else {
      // Fallback: Send PDF inlineData if PDF contains scanned image objects or text extraction yielded empty string
      contents.push({
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: 'application/pdf',
        },
      });
    }
  }

  // PATH 2: Image Processing (PNG/JPEG)
  if (fileBuffer && mimeType && mimeType.startsWith('image/')) {
    contents.push({
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    });
  }

  // Fallback for fileBuffer if mimeType was generic octet-stream
  if (fileBuffer && contents.length === 0) {
    contents.push({
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    });
  }

  // PATH 3: Pasted Medical Report Text
  if (rawText && rawText.trim()) {
    contents.push(`Extracted Medical Report Text Content:\n${rawText.trim()}`);
  }

  if (contents.length === 0) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'No report file or text content was provided for processing.',
        retryable: false,
      },
    };
  }

  contents.push('Extract all lab/test result items from this report according to the JSON schema.');

  // JSON Schema definition for Gemini Structured Output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      reportFileName: { type: Type.STRING },
      extractedItems: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            testName: { type: Type.STRING },
            value: { type: Type.STRING },
            unit: { type: Type.STRING },
            referenceRange: { type: Type.STRING },
            testDate: { type: Type.STRING },
            observation: { type: Type.STRING },
            sourceLocation: { type: Type.STRING },
          },
          required: ['testName', 'value'],
        },
      },
    },
    required: ['extractedItems'],
  };

  let attempt = 0;
  const maxAttempts = APP_CONFIG.gemini.maxRetries + 1;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await ai.models.generateContent({
        model: APP_CONFIG.gemini.model,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.0, // Zero creativity for extraction
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('EMPTY_GEMINI_RESPONSE');
      }

      const cleanedJsonText = cleanJsonResponseText(responseText);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedJsonText);
      } catch {
        return {
          success: false,
          error: {
            code: 'GEMINI_PROCESSING_FAILED',
            message: 'AI response contained malformed structure. Please retry or paste report text.',
            retryable: true,
          },
        };
      }

      const validated = RawExtractionResponseSchema.safeParse(parsedJson);

      if (!validated.success) {
        return {
          success: false,
          error: {
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'Extracted response did not contain valid test items.',
            retryable: false,
          },
        };
      }

      return {
        success: true,
        data: validated.data,
      };

    } catch (err: unknown) {
      const isLastAttempt = attempt >= maxAttempts;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini Extraction Error - Attempt ${attempt}]:`, errorMessage);
      
      const isTransient = errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('fetch failed');

      if (!isTransient || isLastAttempt) {
        return {
          success: false,
          error: {
            code: 'GEMINI_PROCESSING_FAILED',
            message: isTransient 
              ? 'The AI processing service is temporarily busy. Please retry in a moment.' 
              : `The PDF or report file could not be parsed by the AI engine: ${errorMessage}. Please verify the file or paste the report text.`,
            retryable: isTransient,
          },
        };
      }

      await new Promise((res) => setTimeout(res, APP_CONFIG.gemini.backoffMs));
    }
  }

  return {
    success: false,
    error: {
      code: 'GEMINI_PROCESSING_FAILED',
      message: 'Service is temporarily busy. Please load a sample scenario or retry.',
      retryable: true,
    },
  };
}

/**
 * Generates a concise, patient-friendly grounded summary.
 */
export async function generateGroundedSummary(
  patient: PatientInfo,
  labResults: LabResultItem[]
): Promise<GroundedSummary> {
  const ai = getGeminiClient();

  const fallbackSummary: GroundedSummary = {
    overview: `Consolidated record for ${patient.age}-year-old ${patient.sex} with ${labResults.length} reported diagnostic result(s).`,
    keyObservations: labResults.map(
      (r) => `${r.testName}: ${r.value} ${r.unit} (Source Reference Range: ${r.referenceRange || 'Not provided'}, Status: ${r.status})`
    ),
    disclaimer: 'MedLens is an information organization tool. This summary does not constitute a medical diagnosis or treatment plan.',
  };

  if (!ai) {
    return fallbackSummary;
  }

  const sanitizedIntake = `Patient Age: ${patient.age}, Sex: ${patient.sex}\nReported Symptoms: ${patient.symptoms.join(', ') || 'None'}\nReported Conditions: ${patient.existingConditions.join(', ') || 'None'}`;
  const sanitizedResults = labResults
    .map(
      (r) =>
        `- ${r.testName}: ${r.value} ${r.unit} (Reference Range: ${r.referenceRange || 'Not provided'}, Code Status: ${r.status})`
    )
    .join('\n');

  const prompt = `You are a patient-friendly medical information summarizer.
Summarize the following clinical details into plain, understandable, non-jargon language.
RULES:
1. Ground your response STRICTLY on the provided data below. Do NOT invent unmentioned tests or symptoms.
2. Do NOT diagnose diseases, prescribe medications, or recommend treatment/dosage modifications.
3. Clearly state that values marked as LOW or HIGH reflect report reference boundaries.
4. Output JSON with fields:
   - overview: string (1-2 sentence overview)
   - keyObservations: array of strings (3-5 concise bullet points)

DATA:
${sanitizedIntake}

LAB RESULTS:
${sanitizedResults}`;

  try {
    const response = await ai.models.generateContent({
      model: APP_CONFIG.gemini.model,
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    if (response.text) {
      const cleaned = cleanJsonResponseText(response.text);
      const parsed = JSON.parse(cleaned);
      return {
        overview: parsed.overview || fallbackSummary.overview,
        keyObservations: parsed.keyObservations || fallbackSummary.keyObservations,
        disclaimer: fallbackSummary.disclaimer,
      };
    }
  } catch {
    // Fail gracefully to deterministic fallback summary
  }

  return fallbackSummary;
}
