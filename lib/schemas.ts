import { z } from 'zod';

export const PatientInfoSchema = z.object({
  age: z.number().min(0).max(120),
  sex: z.enum(['Male', 'Female', 'Other']),
  symptoms: z.array(z.string()),
  existingConditions: z.array(z.string()),
  allergies: z.array(z.string()),
  currentMedications: z.array(z.string()),
});

export const RawExtractedLabItemSchema = z.object({
  testName: z.string(),
  value: z.string(),
  unit: z.string().optional().default(''),
  referenceRange: z.string().optional().default(''),
  testDate: z.string().optional().default(''),
  observation: z.string().optional().default(''),
  sourceLocation: z.string().optional().default(''),
});

export const RawExtractionResponseSchema = z.object({
  reportFileName: z.string().optional(),
  extractedItems: z.array(RawExtractedLabItemSchema),
});

export type RawExtractedLabItem = z.infer<typeof RawExtractedLabItemSchema>;
export type RawExtractionResponse = z.infer<typeof RawExtractionResponseSchema>;
