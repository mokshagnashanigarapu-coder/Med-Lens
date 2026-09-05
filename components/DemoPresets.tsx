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
    <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircle size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Evaluator Quick Demo Presets</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Instantly test full pipeline without local file uploads
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          className={`btn-secondary ${activeDemoKey === 'scenario1' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario1', DEMO_SCENARIOS.scenario1)}
          style={{
            border: activeDemoKey === 'scenario1' ? '1px solid var(--accent-cyan)' : undefined,
            background: activeDemoKey === 'scenario1' ? 'rgba(6, 182, 212, 0.2)' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario1' && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
          Sample 1: Abnormal CBC & Iron Deficiency
        </button>

        <button
          className={`btn-secondary ${activeDemoKey === 'scenario2' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario2', DEMO_SCENARIOS.scenario2)}
          style={{
            border: activeDemoKey === 'scenario2' ? '1px solid var(--accent-cyan)' : undefined,
            background: activeDemoKey === 'scenario2' ? 'rgba(6, 182, 212, 0.2)' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario2' && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
          Sample 2: Metabolic Panel (Missing Ranges & Qualitative)
        </button>

        <button
          className={`btn-secondary ${activeDemoKey === 'scenario3' ? 'active' : ''}`}
          onClick={() => onSelectScenario('scenario3', DEMO_SCENARIOS.scenario3)}
          style={{
            border: activeDemoKey === 'scenario3' ? '1px solid var(--accent-cyan)' : undefined,
            background: activeDemoKey === 'scenario3' ? 'rgba(6, 182, 212, 0.2)' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {activeDemoKey === 'scenario3' && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
          Sample 3: Penicillin Allergy vs Amoxicillin Conflict
        </button>

        {activeDemoKey && (
          <button
            className="btn-secondary"
            onClick={onReset}
            style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        )}
      </div>
    </div>
  );
};
