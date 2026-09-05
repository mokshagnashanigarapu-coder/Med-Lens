'use client';

import React, { useState } from 'react';
import { Table, CheckCircle2, Edit2, ShieldCheck, MapPin, Eye } from 'lucide-react';
import { LabResultItem, ProvenanceSource } from '@/lib/types';
import { evaluateReferenceRange } from '@/lib/referenceRange';

interface StructuredDataTableProps {
  labResults: LabResultItem[];
  onUpdateItem: (updatedItem: LabResultItem) => void;
  rawReportContent?: string;
}

export const StructuredDataTable: React.FC<StructuredDataTableProps> = ({
  labResults,
  onUpdateItem,
  rawReportContent,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'structured' | 'sideBySide'>('structured');

  const handleStartEdit = (item: LabResultItem) => {
    setEditingId(item.id);
    setEditValue(item.value);
  };

  const handleSaveEdit = (item: LabResultItem) => {
    const rangeEvaluation = evaluateReferenceRange(editValue, item.referenceRange);
    const updated: LabResultItem = {
      ...item,
      value: editValue,
      numericValue: rangeEvaluation.numericValue,
      status: rangeEvaluation.status,
      provenance: 'HUMAN_VERIFIED',
      isHumanVerified: true,
    };
    onUpdateItem(updated);
    setEditingId(null);
  };

  const handleConfirmVerified = (item: LabResultItem) => {
    const updated: LabResultItem = {
      ...item,
      provenance: 'HUMAN_VERIFIED',
      isHumanVerified: true,
    };
    onUpdateItem(updated);
  };

  const renderProvenanceBadge = (provenance: ProvenanceSource) => {
    switch (provenance) {
      case 'USER_PROVIDED':
        return <span className="badge badge-user">USER PROVIDED</span>;
      case 'REPORT_EXTRACTED':
        return <span className="badge badge-report">REPORT EXTRACTED</span>;
      case 'HUMAN_VERIFIED':
        return <span className="badge badge-human">✓ HUMAN VERIFIED</span>;
      case 'AI_GENERATED':
        return <span className="badge badge-ai">AI GENERATED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={20} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Step 3 & 4: Structured Clinical Record & Provenance Grid
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderColor: activeTab === 'structured' ? 'var(--accent-blue)' : undefined,
              backgroundColor: activeTab === 'structured' ? '#eff6ff' : undefined,
              color: activeTab === 'structured' ? 'var(--accent-blue)' : undefined,
            }}
            onClick={() => setActiveTab('structured')}
          >
            <Table size={14} style={{ display: 'inline', marginRight: '4px' }} /> Structured Table
          </button>
          <button
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderColor: activeTab === 'sideBySide' ? 'var(--accent-blue)' : undefined,
              backgroundColor: activeTab === 'sideBySide' ? '#eff6ff' : undefined,
              color: activeTab === 'sideBySide' ? 'var(--accent-blue)' : undefined,
            }}
            onClick={() => setActiveTab('sideBySide')}
          >
            <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} /> Side-by-Side Source View
          </button>
        </div>
      </div>

      {labResults.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
          <Table size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
          <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>No laboratory test items extracted yet.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>Upload a report above or select an AI Evaluator Quick Preset to view structured results.</p>
        </div>
      ) : activeTab === 'structured' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result Value</th>
                <th>Source Reference Range</th>
                <th>Deterministic Status</th>
                <th>Source Location</th>
                <th>Provenance Tag</th>
                <th>Human Verification</th>
              </tr>
            </thead>
            <tbody>
              {labResults.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.testName}</td>
                  <td>
                    {editingId === item.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ width: '110px', padding: '4px 8px', margin: 0 }}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <button
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleSaveEdit(item)}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {item.value} {item.unit}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    {item.referenceRange || 'Not provided'}
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="var(--accent-blue)" />
                      {item.sourceLocation}
                    </div>
                  </td>
                  <td>{renderProvenanceBadge(item.provenance)}</td>
                  <td>
                    {item.isHumanVerified ? (
                      <span style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbebf5', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                        <ShieldCheck size={15} /> Verified
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleStartEdit(item)}
                          title="Edit extracted value"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#047857', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}
                          onClick={() => handleConfirmVerified(item)}
                          title="Confirm accuracy"
                        >
                          <CheckCircle2 size={12} /> Confirm
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              SOURCE REPORT TEXT PREVIEW
            </h4>
            <pre style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', backgroundColor: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {rawReportContent || 'Sample Clinical Scan Preview / Report Text (Loaded in active scenario context)'}
            </pre>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px' }}>
              EXTRACTED STRUCTURED ITEMS ({labResults.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {labResults.map((item) => (
                <div key={item.id} style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{item.testName}</span>
                    <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Result: <strong>{item.value} {item.unit}</strong> | Range: {item.referenceRange}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '4px' }}>
                    📍 {item.sourceLocation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
