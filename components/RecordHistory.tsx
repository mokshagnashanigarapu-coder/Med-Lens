'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, CheckCircle, Info } from 'lucide-react';
import { getSupabaseConfig, fetchRecordById } from '@/lib/supabase';
import { MedicalRecord } from '@/lib/types';

interface RecordHistoryProps {
  onLoadRecord: (record: MedicalRecord) => void;
  lastSavedRecordId?: string | null;
}

export const RecordHistory: React.FC<RecordHistoryProps> = ({
  onLoadRecord,
  lastSavedRecordId,
}) => {
  const [dbConfig, setDbConfig] = useState<{ isConfigured: boolean }>({ isConfigured: false });
  const [searchId, setSearchId] = useState<string>('');
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    setDbConfig(getSupabaseConfig());
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setSearchMsg(null);

    const result = await fetchRecordById(searchId.trim());

    if (result.success && result.data) {
      onLoadRecord(result.data as MedicalRecord);
      setSearchMsg('Record retrieved successfully from database.');
    } else {
      setSearchMsg(result.message);
    }

    setIsSearching(false);
  };

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} color="var(--accent-blue)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Saved Records & Persistence Status
          </h3>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
          {dbConfig.isConfigured ? (
            <span style={{ color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
              🟢 Supabase Database: Connected
            </span>
          ) : (
            <span style={{ color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #cbd5e1' }}>
              ⚪ Session Storage Active (Supabase Unconfigured)
            </span>
          )}
        </div>
      </div>

      {lastSavedRecordId && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} />
          <span>Last Processed Record ID: <strong>{lastSavedRecordId}</strong></span>
        </div>
      )}

      {dbConfig.isConfigured ? (
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            style={{ margin: 0 }}
            placeholder="Enter Record ID to retrieve..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            disabled={isSearching}
          />
          <button type="submit" className="btn-primary" disabled={isSearching} style={{ flexShrink: 0 }}>
            <Search size={16} /> Lookup Record
          </button>
        </form>
      ) : (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} />
          <span>
            Records are currently organized and processed in active session memory. To enable PostgreSQL persistence, configure <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>.
          </span>
        </div>
      )}

      {searchMsg && (
        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: searchMsg.includes('success') ? '#047857' : '#c2410c' }}>
          {searchMsg}
        </div>
      )}
    </div>
  );
};
