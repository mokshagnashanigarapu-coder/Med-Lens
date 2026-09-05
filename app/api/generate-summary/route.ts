import { NextRequest, NextResponse } from 'next/server';
import { generateGroundedSummary } from '@/lib/gemini';
import { detectInconsistencies } from '@/lib/inconsistency';
import { PatientInfo, LabResultItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient, labResults } = body as { patient: PatientInfo; labResults: LabResultItem[] };

    if (!patient || !labResults) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Patient intake and lab results are required.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const inconsistencies = detectInconsistencies(patient, labResults);
    const summary = await generateGroundedSummary(patient, labResults);

    return NextResponse.json({
      success: true,
      data: {
        inconsistencies,
        summary,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to regenerate summary.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
