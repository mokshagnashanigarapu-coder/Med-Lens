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
    <div className="glass-card" style={{ borderLeft: '4px solid #6d28d9', backgroundColor: '#faf5ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} color="#6d28d9" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#5b21b6' }}>
            Step 5: Grounded Patient-Friendly Summary
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isDemoData && <span style={{ backgroundColor: '#7c3aed', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>DEMO DATA</span>}
          <span className="badge badge-ai">AI GENERATED</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          OVERVIEW SYNTHESIS
        </h4>
        <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{summary.overview}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <FileCheck2 size={16} color="var(--accent-blue)" /> KEY GROUNDED OBSERVATIONS
        </h4>
        <ul style={{ listStyleType: 'disc', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--text-main)' }}>
          {summary.keyObservations.map((obs, idx) => (
            <li key={idx} style={{ lineHeight: 1.4 }}>{obs}</li>
          ))}
        </ul>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid #e9d5ff', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Info size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
        <span>{summary.disclaimer}</span>
      </div>
    </div>
  );
};
