export type ProvenanceSource = 
  | 'USER_PROVIDED' 
  | 'REPORT_EXTRACTED' 
  | 'AI_GENERATED' 
  | 'HUMAN_VERIFIED';

export type RangeStatus = 
  | 'LOW' 
  | 'NORMAL' 
  | 'HIGH' 
  | 'NOT_PROVIDED' 
  | 'NON_NUMERIC' 
  | 'UNKNOWN';

export interface PatientInfo {
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  symptoms: string[];
  existingConditions: string[];
  allergies: string[];
  currentMedications: string[];
}

export interface LabResultItem {
  id: string;
  testName: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  rangeMin?: number;
  rangeMax?: number;
  status: RangeStatus;
  testDate?: string;
  observation?: string;
  provenance: ProvenanceSource;
  sourceLocation: string;
  isHumanVerified: boolean;
}

export interface InconsistencyAlert {
  id: string;
  title: string;
  description: string;
  conflictingFields: string[];
}

export interface GroundedSummary {
  overview: string;
  keyObservations: string[];
  disclaimer: string;
}

export interface MedicalRecord {
  isDemoData: boolean;
  demoLabel?: string;
  patient: PatientInfo;
  labResults: LabResultItem[];
  inconsistencies: InconsistencyAlert[];
  summary: GroundedSummary;
  metadata: {
    createdAt: string;
    reportFileName?: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
