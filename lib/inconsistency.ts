import { PatientInfo, LabResultItem, InconsistencyAlert } from './types';

// Map of common drug allergy classes and cross-reactive medications
const DRUG_ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin'],
  sulfa: ['bactrim', 'sulfamethoxazole', 'sulfasalazine', 'trimethoprim-sulfamethoxazole'],
  nsaid: ['ibuprofen', 'naproxen', 'aspirin', 'ketorolac', 'celecoxib'],
  aspirin: ['aspirin', 'ibuprofen', 'naproxen'],
};

/**
 * Deterministically checks for potential information conflicts between
 * patient intake data and report-extracted records.
 * Uses neutral non-diagnostic wording ("Potential information conflict — review required").
 */
export function detectInconsistencies(
  patient: PatientInfo,
  labResults: LabResultItem[]
): InconsistencyAlert[] {
  const alerts: InconsistencyAlert[] = [];

  // Check 1: Patient-reported allergy vs extracted report items (testName, value, observation)
  if (patient.allergies.length > 0) {
    patient.allergies.forEach((allergy) => {
      const allergyLower = allergy.toLowerCase().trim();
      if (!allergyLower) return;

      const crossMedList = DRUG_ALLERGY_MAP[allergyLower] || [allergyLower];

      // Check extracted lab results and prescription notes
      labResults.forEach((item) => {
        const textToSearch = `${item.testName} ${item.value} ${item.observation || ''}`.toLowerCase();
        
        crossMedList.forEach((med) => {
          if (textToSearch.includes(med)) {
            alerts.push({
              id: `conflict-allergy-${allergyLower}-${item.id}`,
              title: 'Potential Medication-Allergy Conflict',
              description: `Potential information conflict — review required: Patient-reported allergy to "${allergy}" conflicts with reference to "${item.testName} (${item.value})" in the report.`,
              conflictingFields: ['patient.allergies', `labResults.${item.id}`],
            });
          }
        });
      });

      // Check user-provided current medications
      patient.currentMedications.forEach((med) => {
        const medLower = med.toLowerCase().trim();
        crossMedList.forEach((crossMed) => {
          if (medLower.includes(crossMed)) {
            alerts.push({
              id: `conflict-intake-allergy-${allergyLower}-${medLower}`,
              title: 'Potential Intake Medication-Allergy Conflict',
              description: `Potential information conflict — review required: Patient-reported allergy to "${allergy}" conflicts with current medication "${med}".`,
              conflictingFields: ['patient.allergies', 'patient.currentMedications'],
            });
          }
        });
      });
    });
  }

  // Check 2: Low/High Lab Value Warning flags
  const abnormalItems = labResults.filter((r) => r.status === 'LOW' || r.status === 'HIGH');
  if (abnormalItems.length > 0) {
    alerts.push({
      id: 'alert-abnormal-values',
      title: 'Out-of-Range Test Values Noted',
      description: `Potential information conflict — review required: ${abnormalItems.length} test result(s) fall outside source report reference ranges (${abnormalItems.map(i => i.testName).join(', ')}).`,
      conflictingFields: abnormalItems.map((i) => `labResults.${i.id}`),
    });
  }

  return alerts;
}
