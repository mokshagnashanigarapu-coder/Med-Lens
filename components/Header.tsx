'use client';

import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="glass-card" style={{ borderTop: '4px solid var(--accent-blue)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            backgroundColor: 'var(--accent-blue)',
            padding: '12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={30} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
              MEDLENS
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
              AI-Powered Clinical Information Intelligence
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Transform patient information and medical reports into a structured, traceable record for human review.
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
          <strong>Responsible AI Notice:</strong> MedLens is an information organization and review tool. It does <strong>NOT</strong> provide medical diagnoses, treatment recommendations, or dosage modifications. Always consult a qualified healthcare professional.
        </div>
      </div>
    </header>
  );
};
