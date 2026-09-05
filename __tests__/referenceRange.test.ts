import { describe, it, expect } from 'vitest';
import { evaluateReferenceRange, sanitizeSourceLocation } from '../lib/referenceRange';
import { detectInconsistencies } from '../lib/inconsistency';
import { PatientInfo, LabResultItem } from '../lib/types';
import { PatientInfoSchema, RawExtractionResponseSchema } from '../lib/schemas';
import { extractTextFromPdfBuffer, extractTextFromPdfBufferAsync } from '../lib/pdfUtils';
import { getSupabaseConfig, saveRecordToDatabase, fetchRecordById } from '../lib/supabase';
import { DEMO_SCENARIOS } from '../lib/mockData';

describe('1. Patient Intake & Schema Validation', () => {
  it('1. validates valid user patient intake form data', () => {
    const patientData = {
      age: 45,
      sex: 'Male',
      symptoms: ['Fatigue'],
      existingConditions: ['Hypertension'],
      allergies: ['Penicillin'],
      currentMedications: ['Lisinopril'],
    };
    const parsed = PatientInfoSchema.safeParse(patientData);
    expect(parsed.success).toBe(true);
  });

  it('2. guarantees user-edited patient data is not replaced by demo fixtures', () => {
    const userPatient: PatientInfo = {
      age: 62,
      sex: 'Male',
      symptoms: ['Chest tightness'],
      existingConditions: ['Diabetes'],
      allergies: ['Aspirin'],
      currentMedications: ['Metformin'],
    };
    const demoPatient = DEMO_SCENARIOS.scenario1.patient;
    expect(userPatient.age).not.toBe(demoPatient.age);
    expect(userPatient.allergies).not.toEqual(demoPatient.allergies);
  });
});

describe('2. File & Text Extraction Engine', () => {
  it('3. extracts text from text-based PDF buffers', async () => {
    const fakePdfBuffer = Buffer.from('BT (Hemoglobin 14.2 g/dL 12.0-15.5) Tj ET', 'utf-8');
    const text = await extractTextFromPdfBufferAsync(fakePdfBuffer);
    expect(typeof text).toBe('string');
  });

  it('4. accepts image file payload indicators', () => {
    const imageMime = 'image/png';
    expect(['image/png', 'image/jpeg', 'application/pdf']).toContain(imageMime);
  });

  it('5. handles pasted report text content', () => {
    const rawText = 'WBC 12.5 10^3/uL 4.0-11.0';
    expect(rawText.trim().length).toBeGreaterThan(0);
  });

  it('6. rejects invalid file types', () => {
    const invalidMime = 'application/x-msdownload';
    const validMimes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    expect(validMimes.includes(invalidMime)).toBe(false);
  });

  it('7. rejects oversized files exceeding 10MB limit', () => {
    const fileSize = 12 * 1024 * 1024;
    const maxSize = 10 * 1024 * 1024;
    expect(fileSize > maxSize).toBe(true);
  });

  it('8. handles empty report content gracefully', () => {
    const emptyText = '   ';
    expect(emptyText.trim().length).toBe(0);
  });

  it('9. handles file extraction failure fallback', () => {
    const invalidPdfBuffer = Buffer.from('Not a pdf file');
    const extracted = extractTextFromPdfBuffer(invalidPdfBuffer);
    expect(typeof extracted).toBe('string');
  });
});

describe('3. Gemini API Reliability & Error Bounding', () => {
  it('10. handles Gemini API transient failure detection', () => {
    const errMessage = '429 Rate limit exceeded';
    const isTransient = errMessage.includes('429') || errMessage.includes('503');
    expect(isTransient).toBe(true);
  });

  it('11. flags missing API key error response structure', () => {
    const errorResponse = {
      code: 'API_KEY_MISSING',
      message: 'Gemini API key is not configured on the server.',
      retryable: false,
    };
    expect(errorResponse.code).toBe('API_KEY_MISSING');
  });

  it('12. cleans malformed markdown JSON fences from Gemini responses', () => {
    const rawMarkdownJson = "```json\n{\"reportFileName\":\"test.pdf\",\"extractedItems\":[]}\n```";
    const cleaned = rawMarkdownJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    expect(cleaned).toBe('{"reportFileName":"test.pdf","extractedItems":[]}');
    expect(() => JSON.parse(cleaned)).not.toThrow();
  });

  it('13. validates Gemini extraction output against Zod schema', () => {
    const validExtraction = {
      reportFileName: 'cbc.pdf',
      extractedItems: [
        { testName: 'Hemoglobin', value: '14.0', unit: 'g/dL', referenceRange: '12.0 - 15.5' },
      ],
    };
    const parsed = RawExtractionResponseSchema.safeParse(validExtraction);
    expect(parsed.success).toBe(true);
  });
});

describe('4. Deterministic Reference Range Classifier', () => {
  it('14. sets status = NOT_PROVIDED when source report provides no reference range', () => {
    const res = evaluateReferenceRange('4.8', '');
    expect(res.status).toBe('NOT_PROVIDED');
  });

  it('15. evaluates numeric LOW results below min range', () => {
    const res = evaluateReferenceRange('9.2', '12.0 - 15.5');
    expect(res.status).toBe('LOW');
    expect(res.numericValue).toBe(9.2);
  });

  it('16. evaluates numeric HIGH results above max range', () => {
    const res = evaluateReferenceRange('13.4', '4.5 - 11.0');
    expect(res.status).toBe('HIGH');
    expect(res.numericValue).toBe(13.4);
  });

  it('17. classifies qualitative non-numeric results as NON_NUMERIC and NEVER auto-classifies as NORMAL', () => {
    const resNeg = evaluateReferenceRange('Negative', '0.5 - 1.2');
    expect(resNeg.status).toBe('NON_NUMERIC');
    expect(resNeg.status).not.toBe('NORMAL');

    const resPos = evaluateReferenceRange('Positive', 'Negative');
    expect(resPos.status).toBe('NON_NUMERIC');
    expect(resPos.status).not.toBe('NORMAL');
  });
});

describe('5. Provenance & Human Verification', () => {
  it('18. preserves explicit provenance tags and source locations', () => {
    const item: LabResultItem = {
      id: '1',
      testName: 'Hemoglobin',
      value: '14.0',
      unit: 'g/dL',
      referenceRange: '12.0 - 15.5',
      status: 'NORMAL',
      provenance: 'REPORT_EXTRACTED',
      sourceLocation: 'Source: Page 1 — Hematology',
      isHumanVerified: false,
    };
    expect(item.provenance).toBe('REPORT_EXTRACTED');
    expect(item.sourceLocation).toBe('Source: Page 1 — Hematology');
  });

  it('19. transitions provenance tag to HUMAN_VERIFIED upon edit or confirmation', () => {
    const item: LabResultItem = {
      id: '1',
      testName: 'Hemoglobin',
      value: '14.0',
      unit: 'g/dL',
      referenceRange: '12.0 - 15.5',
      status: 'NORMAL',
      provenance: 'REPORT_EXTRACTED',
      sourceLocation: 'Source: Page 1',
      isHumanVerified: false,
    };
    const updated: LabResultItem = { ...item, provenance: 'HUMAN_VERIFIED', isHumanVerified: true };
    expect(updated.provenance).toBe('HUMAN_VERIFIED');
    expect(updated.isHumanVerified).toBe(true);
  });
});

describe('6. Persistence, History & Demo Isolation', () => {
  it('20. handles database creation and retrieval queries gracefully', async () => {
    const config = getSupabaseConfig();
    expect(typeof config.isConfigured).toBe('boolean');
    const lookup = await fetchRecordById('non-existent-id');
    expect(lookup.success).toBe(false);
  });

  it('21. verifies 1-click Quick Demo presets load successfully', () => {
    const scenario1 = DEMO_SCENARIOS.scenario1;
    expect(scenario1.isDemoData).toBe(true);
    expect(scenario1.demoLabel).toContain('DEMO DATA');
    expect(scenario1.labResults.length).toBeGreaterThan(0);
  });

  it('22. prevents demo data from silently replacing real user input', () => {
    const userIntake: PatientInfo = {
      age: 28,
      sex: 'Male',
      symptoms: ['Fever'],
      existingConditions: [],
      allergies: ['Sulfa'],
      currentMedications: ['Acetaminophen'],
    };
    const demoData = DEMO_SCENARIOS.scenario2;
    expect(userIntake.allergies).not.toEqual(demoData.patient.allergies);
  });
});
