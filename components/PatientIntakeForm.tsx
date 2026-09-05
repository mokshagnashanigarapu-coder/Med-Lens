'use client';

import React from 'react';
import { User, AlertCircle, Pill, Stethoscope, HeartPulse } from 'lucide-react';
import { PatientInfo } from '@/lib/types';

interface PatientIntakeFormProps {
  patient: PatientInfo;
  onChange: (updated: PatientInfo) => void;
  disabled?: boolean;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  patient,
  onChange,
  disabled = false,
}) => {
  const handleStringArrayChange = (field: keyof PatientInfo, rawValue: string) => {
    const items = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
    onChange({
      ...patient,
      [field]: items,
    });
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step 1: Patient Information Intake</h3>
        </div>
        <span className="badge badge-user">USER PROVIDED</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Age</label>
          <input
            type="number"
            min="0"
            max="120"
            className="input-field"
            value={patient.age || ''}
            onChange={(e) => onChange({ ...patient, age: parseInt(e.target.value) || 0 })}
            disabled={disabled}
            placeholder="e.g. 42"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Biological Sex</label>
          <select
            className="input-field"
            value={patient.sex}
            onChange={(e) => onChange({ ...patient, sex: e.target.value as PatientInfo['sex'] })}
            disabled={disabled}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Stethoscope size={14} /> Reported Symptoms
          </label>
          <input
            type="text"
            className="input-field"
            value={patient.symptoms.join(', ')}
            onChange={(e) => handleStringArrayChange('symptoms', e.target.value)}
            disabled={disabled}
            placeholder="Fatigue, Shortness of breath, Dizziness"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HeartPulse size={14} /> Existing Conditions
          </label>
          <input
            type="text"
            className="input-field"
            value={patient.existingConditions.join(', ')}
            onChange={(e) => handleStringArrayChange('existingConditions', e.target.value)}
            disabled={disabled}
            placeholder="Mild Asthma, Hypertension"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={14} /> Known Allergies
          </label>
          <input
            type="text"
            className="input-field"
            style={{ borderColor: patient.allergies.length ? 'rgba(239, 68, 68, 0.4)' : undefined }}
            value={patient.allergies.join(', ')}
            onChange={(e) => handleStringArrayChange('allergies', e.target.value)}
            disabled={disabled}
            placeholder="Penicillin, Sulfa"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Pill size={14} /> Current Medications
          </label>
          <input
            type="text"
            className="input-field"
            value={patient.currentMedications.join(', ')}
            onChange={(e) => handleStringArrayChange('currentMedications', e.target.value)}
            disabled={disabled}
            placeholder="Albuterol Inhaler, Lisinopril"
          />
        </div>
      </div>
    </div>
  );
};
