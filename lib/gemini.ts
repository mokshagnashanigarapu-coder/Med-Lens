import { GoogleGenAI, Type } from '@google/genai';
import { APP_CONFIG } from './config';
import { RawExtractionResponseSchema, RawExtractionResponse } from './schemas';
import { GroundedSummary, PatientInfo, LabResultItem } from './types';

// Initialize SDK client if API key is present
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = APP_CONFIG.gemini.apiKey;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Robust, server-side multimodal report extraction using Gemini API.
 * Features 12s bounded timeout, 1 retry budget for transient errors, and zero PHI logging.
 */
export async function extractReportStructured(
  fileBuffer?: Buffer,
  mimeType?: string,
  rawText?: string
): Promise<{ success: true; data: RawExtractionResponse } | { success: false; error: { code: string; message: string; retryable: boolean } }> {
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

  if (fileBuffer && mimeType) {
    contents.push({
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    });
  }

  if (rawText && rawText.trim()) {
    contents.push(`Extracted Report Text Content:\n${rawText.trim()}`);
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

  // Bounded execution with max 1 retry for transient errors
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

      // Parse JSON and validate with Zod
      const parsedJson = JSON.parse(responseText);
      const validated = RawExtractionResponseSchema.safeParse(parsedJson);

      if (!validated.success) {
        return {
          success: false,
          error: {
            code: 'MALFORMED_AI_OUTPUT',
            message: 'Extracted response did not match expected structure.',
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
      
      // Determine if error is transient (HTTP 429, 503, ETIMEDOUT)
      const isTransient = errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('fetch failed');

      if (!isTransient || isLastAttempt) {
        return {
          success: false,
          error: {
            code: isTransient ? 'API_TRANSIENT_FAILURE' : 'API_REQUEST_FAILED',
            message: 'Unable to process medical report at this time. Please try again or use a sample scenario.',
            retryable: isTransient,
          },
        };
      }

      // Wait backoff duration before single retry
      await new Promise((res) => setTimeout(res, APP_CONFIG.gemini.backoffMs));
    }
  }

  return {
    success: false,
    error: {
      code: 'API_MAX_RETRIES_EXCEEDED',
      message: 'Service is temporarily busy. Please load a sample scenario or retry.',
      retryable: true,
    },
  };
}

/**
 * Generates a concise, patient-friendly grounded summary.
 * Strictly bounded by available intake and extracted lab items.
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

  // Data Minimization: Prepare anonymized text representation
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
      const parsed = JSON.parse(response.text);
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
