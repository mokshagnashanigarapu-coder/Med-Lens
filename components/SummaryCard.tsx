'use client';

import React from 'react';
import { Sparkles, FileCheck2, Info } from 'lucide-react';
import { GroundedSummary } from '@/lib/types';

interface SummaryCardProps {
  summary: GroundedSummary;
  isDemoData?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isDemoData }) => {
  return (
    <div className="glass-card" style={{ borderLeft: '4px solid var(--prov-ai)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#c084fc" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step 4: Grounded Patient-Friendly Summary</h3>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isDemoData && <span style={{ background: '#7c3aed', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>DEMO DATA</span>}
          <span className="badge badge-ai">AI GENERATED</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px', background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '8px', border: '1px solid var(--bg-card-border)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
          OVERVIEW SYNTHESIS
        </h4>
        <p style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{summary.overview}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileCheck2 size={16} color="var(--accent-cyan)" /> KEY GROUNDED OBSERVATIONS
        </h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem', color: '#cbd5e1' }}>
          {summary.keyObservations.map((obs, idx) => (
            <li key={idx}>{obs}</li>
          ))}
        </ul>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-card-border)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Info size={14} color="#a855f7" />
        <span>{summary.disclaimer}</span>
      </div>
    </div>
  );
};
