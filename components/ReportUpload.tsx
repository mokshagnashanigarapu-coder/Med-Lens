'use client';

import React, { useState } from 'react';
import { Upload, FileText, Loader2, FileCheck } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

interface ReportUploadProps {
  onProcessReport: (file: File | null, rawText: string) => Promise<void>;
  isLoading: boolean;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  onProcessReport,
  isLoading,
}) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > APP_CONFIG.limits.maxFileUploadSizeBytes) {
      setErrorMsg('Selected file exceeds 10MB size limit.');
      setSelectedFile(null);
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'file' && !selectedFile) {
      setErrorMsg('Please select a PDF or image medical report file.');
      return;
    }
    if (mode === 'text' && !rawText.trim()) {
      setErrorMsg('Please paste medical report text content.');
      return;
    }

    setErrorMsg(null);
    await onProcessReport(mode === 'file' ? selectedFile : null, mode === 'text' ? rawText : '');
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={20} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Step 2: Medical Report Upload / Input
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              backgroundColor: mode === 'file' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'file' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
            }}
            onClick={() => setMode('file')}
          >
            File Upload (PDF/Image)
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              backgroundColor: mode === 'text' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'text' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
            }}
            onClick={() => setMode('text')}
          >
            Paste Text Report
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'file' ? (
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '32px 16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileChange}
              id="report-file-input"
              style={{ display: 'none' }}
              disabled={isLoading}
            />
            <label htmlFor="report-file-input" style={{ cursor: 'pointer', display: 'block' }}>
              {selectedFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={44} color="var(--accent-blue)" />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{selectedFile.name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change selected file
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={44} color="var(--accent-blue)" />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    Click to select or drag & drop PDF / Image medical report
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Supports PDF, PNG, JPEG, TXT (Max 10MB)
                  </span>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div>
            <textarea
              className="input-field"
              rows={6}
              placeholder="Paste raw medical lab report text or clinical diagnostic scan notes here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isLoading}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        )}

        {errorMsg && (
          <div style={{ color: '#c2410c', fontSize: '0.85rem', marginTop: '10px', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Processing report…
              </>
            ) : (
              <>
                <FileText size={20} /> Extract Structured Medical Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
