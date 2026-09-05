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
        borderLeft: '4px solid #d97706',
        backgroundColor: '#fffbebf5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <AlertTriangle size={20} color="#d97706" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b45309' }}>
          Informational Cross-Record Conflict Review ({alerts.length})
        </h3>
        <span className="badge badge-ai" style={{ marginLeft: 'auto' }}>AI DETECTED</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e' }}>
              {alert.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#78350f', marginTop: '2px', lineHeight: 1.4 }}>
              {alert.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
