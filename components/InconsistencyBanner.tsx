'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { InconsistencyAlert } from '@/lib/types';

interface InconsistencyBannerProps {
  alerts: InconsistencyAlert[];
}

export const InconsistencyBanner: React.FC<InconsistencyBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div
      className="glass-card"
      style={{
        borderLeft: '4px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <AlertTriangle size={20} color="#f59e0b" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
          Informational Cross-Record Conflict Review ({alerts.length})
        </h3>
        <span className="badge badge-ai" style={{ marginLeft: 'auto' }}>AI DETECTED</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fde047' }}>
              {alert.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '2px' }}>
              {alert.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
