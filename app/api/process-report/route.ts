import { NextRequest, NextResponse } from 'next/server';
import { PatientInfoSchema } from '@/lib/schemas';
import { extractReportStructured, generateGroundedSummary } from '@/lib/gemini';
import { evaluateReferenceRange, sanitizeSourceLocation } from '@/lib/referenceRange';
import { detectInconsistencies } from '@/lib/inconsistency';
import { LabResultItem, MedicalRecord, PatientInfo } from '@/lib/types';
import { APP_CONFIG } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const patientJsonStr = formData.get('patient') as string;
    const file = formData.get('file') as File | null;
    const rawText = (formData.get('rawText') as string) || '';

    if (!patientJsonStr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PATIENT_INPUT',
            message: 'Patient intake information is required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    let patientInfo: PatientInfo;
    try {
      const parsed = JSON.parse(patientJsonStr);
      patientInfo = PatientInfoSchema.parse(parsed);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PATIENT_INPUT',
            message: 'Patient information contains invalid or missing fields.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    let reportFileName: string | undefined;

    if (file) {
      if (file.size > APP_CONFIG.limits.maxFileUploadSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Uploaded file exceeds the maximum 10MB limit.',
              retryable: false,
            },
          },
          { status: 400 }
        );
      }

      reportFileName = file.name;
      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    if (!fileBuffer && (!rawText || !rawText.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_REPORT_PROVIDED',
            message: 'Please upload a PDF/image report or paste text report content.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Perform structured extraction via Gemini API
    const extractionResult = await extractReportStructured(fileBuffer, mimeType, rawText);

    if (!extractionResult.success) {
      return NextResponse.json(extractionResult, { status: 400 });
    }

    const rawExtracted = extractionResult.data;

    // Apply Deterministic Reference-Range Engine in TypeScript code
    const labResults: LabResultItem[] = rawExtracted.extractedItems.map((item, idx) => {
      const rangeEvaluation = evaluateReferenceRange(item.value, item.referenceRange || '');
      const sourceLocation = sanitizeSourceLocation(item.sourceLocation);

      return {
        id: `extracted-${Date.now()}-${idx}`,
        testName: item.testName,
        value: item.value,
        numericValue: rangeEvaluation.numericValue,
        unit: item.unit || '',
        referenceRange: item.referenceRange || 'Not provided',
        rangeMin: rangeEvaluation.rangeMin,
        rangeMax: rangeEvaluation.rangeMax,
        status: rangeEvaluation.status,
        testDate: item.testDate || new Date().toISOString().split('T')[0],
        observation: item.observation || '',
        provenance: 'REPORT_EXTRACTED',
        sourceLocation: sourceLocation,
        isHumanVerified: false,
      };
    });

    // Run Deterministic Inconsistency Engine
    const inconsistencies = detectInconsistencies(patientInfo, labResults);

    // Generate Grounded Patient-Friendly Summary
    const summary = await generateGroundedSummary(patientInfo, labResults);

    const record: MedicalRecord = {
      isDemoData: false,
      patient: patientInfo,
      labResults: labResults,
      inconsistencies: inconsistencies,
      summary: summary,
      metadata: {
        createdAt: new Date().toISOString(),
        reportFileName: reportFileName || 'pasted_text_report.txt',
      },
    };

    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while processing the request.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
