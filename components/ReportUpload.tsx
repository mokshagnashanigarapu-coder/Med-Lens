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
      setErrorMsg('Please select a PDF or image medical report.');
      return;
    }
    if (mode === 'text' && !rawText.trim()) {
      setErrorMsg('Please paste report text content.');
      return;
    }

    setErrorMsg(null);
    await onProcessReport(mode === 'file' ? selectedFile : null, mode === 'text' ? rawText : '');
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step 2: Medical Report Upload / Input</h3>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              padding: '4px 12px',
              fontSize: '0.75rem',
              background: mode === 'file' ? 'var(--accent-cyan)' : 'transparent',
              color: mode === 'file' ? 'white' : 'var(--text-muted)',
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
              padding: '4px 12px',
              fontSize: '0.75rem',
              background: mode === 'text' ? 'var(--accent-cyan)' : 'transparent',
              color: mode === 'text' ? 'white' : 'var(--text-muted)',
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
              border: '2px dashed var(--bg-card-border)',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              cursor: 'pointer',
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
                  <FileCheck size={40} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change file
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={40} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600 }}>Click to select or drag & drop PDF / Image report</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports PDF, PNG, JPEG (Max 10MB)
                  </span>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div>
            <textarea
              className="input-field"
              rows={5}
              placeholder="Paste raw lab report text or clinical note here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isLoading}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        )}

        {errorMsg && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '10px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing & Extracting Report...
              </>
            ) : (
              <>
                <FileText size={18} /> Extract Structured Medical Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
