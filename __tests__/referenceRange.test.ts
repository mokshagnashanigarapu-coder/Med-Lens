import { describe, it, expect } from 'vitest';
import { evaluateReferenceRange, sanitizeSourceLocation } from '../lib/referenceRange';
import { detectInconsistencies } from '../lib/inconsistency';
import { PatientInfo, LabResultItem } from '../lib/types';

describe('Deterministic Reference Range Classification Engine', () => {
  it('correctly evaluates numeric values within standard min-max range', () => {
    const res = evaluateReferenceRange('14.0', '13.5 - 17.5');
    expect(res.status).toBe('NORMAL');
    expect(res.numericValue).toBe(14.0);
    expect(res.rangeMin).toBe(13.5);
    expect(res.rangeMax).toBe(17.5);
  });

  it('correctly classifies LOW values below min range', () => {
    const res = evaluateReferenceRange('9.2', '12.0 - 15.5');
    expect(res.status).toBe('LOW');
    expect(res.numericValue).toBe(9.2);
  });

  it('correctly classifies HIGH values above max range', () => {
    const res = evaluateReferenceRange('13.4', '4.5 - 11.0');
    expect(res.status).toBe('HIGH');
    expect(res.numericValue).toBe(13.4);
  });

  it('correctly evaluates inequality ranges (< 5.0)', () => {
    const resNormal = evaluateReferenceRange('3.2', '< 5.0');
    expect(resNormal.status).toBe('NORMAL');

    const resHigh = evaluateReferenceRange('6.8', '< 5.0');
    expect(resHigh.status).toBe('HIGH');
  });

  it('correctly evaluates inequality ranges (> 10)', () => {
    const resNormal = evaluateReferenceRange('15.0', '> 10');
    expect(resNormal.status).toBe('NORMAL');

    const resLow = evaluateReferenceRange('8.0', '> 10');
    expect(resLow.status).toBe('LOW');
  });

  it('assigns NOT_PROVIDED when source report has no reference range', () => {
    const resEmpty = evaluateReferenceRange('4.8', '');
    expect(resEmpty.status).toBe('NOT_PROVIDED');

    const resNA = evaluateReferenceRange('145', 'N/A');
    expect(resNA.status).toBe('NOT_PROVIDED');
  });

  it('assigns NON_NUMERIC for qualitative non-numeric values and NEVER auto-classifies as NORMAL', () => {
    const resNeg = evaluateReferenceRange('Negative', '0.5 - 1.2');
    expect(resNeg.status).toBe('NON_NUMERIC');
    expect(resNeg.status).not.toBe('NORMAL');

    const resPos = evaluateReferenceRange('Positive', 'Negative');
    expect(resPos.status).toBe('NON_NUMERIC');
    expect(resPos.status).not.toBe('NORMAL');
  });
});

describe('Source Location Integrity', () => {
  it('preserves valid source locations', () => {
    expect(sanitizeSourceLocation('Source: Page 1 — CBC')).toBe('Source: Page 1 — CBC');
  });

  it('falls back to "Source location unavailable" when unconfirmed or missing', () => {
    expect(sanitizeSourceLocation('')).toBe('Source location unavailable');
    expect(sanitizeSourceLocation(undefined)).toBe('Source location unavailable');
    expect(sanitizeSourceLocation('unknown')).toBe('Source location unavailable');
  });
});

describe('Deterministic Inconsistency Engine', () => {
  it('flags penicillin allergy vs amoxicillin report reference with neutral wording', () => {
    const patient: PatientInfo = {
      age: 30,
      sex: 'Female',
      symptoms: ['Fever'],
      existingConditions: [],
      allergies: ['Penicillin'],
      currentMedications: [],
    };

    const labResults: LabResultItem[] = [
      {
        id: 'test-1',
        testName: 'Amoxicillin prescription note',
        value: '500mg',
        unit: 'mg',
        referenceRange: 'N/A',
        status: 'NOT_PROVIDED',
        provenance: 'REPORT_EXTRACTED',
        sourceLocation: 'Source: Page 1',
        isHumanVerified: false,
      },
    ];

    const alerts = detectInconsistencies(patient, labResults);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].description).toContain('Potential information conflict — review required');
    expect(alerts[0].description).not.toContain('emergency');
    expect(alerts[0].description).not.toContain('warning!');
  });

  it('flags penicillin allergy vs amoxicillin when medication is in the item value field', () => {
    const patient: PatientInfo = {
      age: 30,
      sex: 'Female',
      symptoms: ['Fever'],
      existingConditions: [],
      allergies: ['Penicillin'],
      currentMedications: [],
    };

    const labResults: LabResultItem[] = [
      {
        id: 'test-2',
        testName: 'Historical Prescription Note',
        value: 'Amoxicillin 500mg BID',
        unit: '',
        referenceRange: 'N/A',
        status: 'NOT_PROVIDED',
        provenance: 'REPORT_EXTRACTED',
        sourceLocation: 'Source: Page 2',
        isHumanVerified: false,
      },
    ];

    const alerts = detectInconsistencies(patient, labResults);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].description).toContain('Potential information conflict — review required');
    expect(alerts[0].description).toContain('Penicillin');
    expect(alerts[0].description).toContain('Historical Prescription Note');
  });
});
