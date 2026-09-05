'use client';

import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MedLens
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              AI-Powered Clinical Information Intelligence & Data Provenance System
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-user">USER PROVIDED</span>
          <span className="badge badge-report">REPORT EXTRACTED</span>
          <span className="badge badge-human">HUMAN VERIFIED</span>
          <span className="badge badge-ai">AI GENERATED</span>
        </div>
      </div>

      <div className="disclaimer-banner" style={{ marginTop: '16px' }}>
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Responsible AI Notice:</strong> MedLens is an information organization and review tool designed to structure fragmented medical reports. It does <strong>NOT</strong> provide medical diagnoses, treatment recommendations, or dosage modifications. Always consult a qualified healthcare professional.
        </div>
      </div>
    </header>
  );
};
