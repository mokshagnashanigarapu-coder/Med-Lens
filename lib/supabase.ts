import { MedicalRecord } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http')),
  };
}

/**
 * Persists a medical record to Supabase if credentials are configured.
 * Safely returns persistence status without crashing if unconfigured.
 */
export async function saveRecordToDatabase(
  record: MedicalRecord
): Promise<{ success: boolean; recordId?: string; message: string }> {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    return {
      success: false,
      message: 'Supabase storage unconfigured. Record retained in session memory.',
    };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/medical_records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        patient_age: record.patient.age,
        patient_sex: record.patient.sex,
        symptoms: record.patient.symptoms,
        existing_conditions: record.patient.existingConditions,
        allergies: record.patient.allergies,
        current_medications: record.patient.currentMedications,
        report_file_name: record.metadata.reportFileName,
        lab_results: record.labResults,
        inconsistencies: record.inconsistencies,
        summary_overview: record.summary.overview,
        summary_observations: record.summary.keyObservations,
        created_at: record.metadata.createdAt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const savedId = data[0]?.id || `REC-${Date.now()}`;
      return {
        success: true,
        recordId: savedId,
        message: 'Record successfully saved to persistent database.',
      };
    }
  } catch {
    // Fail gracefully
  }

  return {
    success: false,
    message: 'Could not connect to database. Record retained in local session.',
  };
}

/**
 * Retrieves a saved medical record from Supabase by ID if configured.
 */
export async function fetchRecordById(
  recordId: string
): Promise<{ success: boolean; data?: Partial<MedicalRecord>; message: string }> {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      message: 'Supabase database is not configured in environment variables.',
    };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/medical_records?id=eq.${recordId}`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        return {
          success: true,
          data: {
            isDemoData: false,
            patient: {
              age: item.patient_age,
              sex: item.patient_sex,
              symptoms: item.symptoms || [],
              existingConditions: item.existing_conditions || [],
              allergies: item.allergies || [],
              currentMedications: item.current_medications || [],
            },
            labResults: item.lab_results || [],
            inconsistencies: item.inconsistencies || [],
            summary: {
              overview: item.summary_overview,
              keyObservations: item.summary_observations || [],
              disclaimer: 'MedLens is an information organization tool. This summary does not constitute a medical diagnosis or treatment plan.',
            },
            metadata: {
              createdAt: item.created_at,
              reportFileName: item.report_file_name,
            },
          },
          message: 'Record successfully loaded from database.',
        };
      }
    }
  } catch {
    // Fail gracefully
  }

  return {
    success: false,
    message: 'Record ID not found in database.',
  };
}
