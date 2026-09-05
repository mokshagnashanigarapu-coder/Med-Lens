'use client';

import React from 'react';
import { PlayCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { DEMO_SCENARIOS } from '@/lib/mockData';
import { MedicalRecord } from '@/lib/types';

interface DemoPresetsProps {
  activeDemoKey: string | null;
  onSelectScenario: (scenarioKey: string, record: MedicalRecord) => void;
  onReset: () => void;
}

export const DemoPresets: React.FC<DemoPresetsProps> = ({
  activeDemoKey,
  onSelectScenario,
  onReset,
}) => {
  return (
    <div className="glass-card" style={{ borderLeft: '4px solid #8b5cf6', backgroundColor: '#faf5ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircle size={20} color="#7c3aed" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#5b21b6' }}>AI Evaluator Quick Demo Presets</h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed' }}>
          Instantly test full pipeline without uploading local files
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeDemoKey === 'scenario1' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario1', DEMO_SCENARIOS.scenario1)}
          style={{
            borderColor: activeDemoKey === 'scenario1' ? '#7c3aed' : undefined,
            backgroundColor: activeDemoKey === 'scenario1' ? '#f3e8ff' : '#ffffff',
            color: activeDemoKey === 'scenario1' ? '#6b21a8' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario1' && <CheckCircle2 size={16} color="#7c3aed" />}
          Sample 1: Abnormal CBC & Iron Deficiency
        </button>

        <button
          className={`btn-secondary ${activeDemoKey === 'scenario2' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario2', DEMO_SCENARIOS.scenario2)}
          style={{
            borderColor: activeDemoKey === 'scenario2' ? '#7c3aed' : undefined,
            backgroundColor: activeDemoKey === 'scenario2' ? '#f3e8ff' : '#ffffff',
            color: activeDemoKey === 'scenario2' ? '#6b21a8' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario2' && <CheckCircle2 size={16} color="#7c3aed" />}
          Sample 2: Metabolic Panel (Missing Ranges & Qualitative)
        </button>

        <button
          className={`btn-secondary ${activeDemoKey === 'scenario3' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario3', DEMO_SCENARIOS.scenario3)}
          style={{
            borderColor: activeDemoKey === 'scenario3' ? '#7c3aed' : undefined,
            backgroundColor: activeDemoKey === 'scenario3' ? '#f3e8ff' : '#ffffff',
            color: activeDemoKey === 'scenario3' ? '#6b21a8' : 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario3' && <CheckCircle2 size={16} color="#7c3aed" />}
          Sample 3: Penicillin Allergy vs Amoxicillin Conflict
        </button>

        {activeDemoKey && (
          <button
            className="btn-secondary"
            onClick={onReset}
            style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};
