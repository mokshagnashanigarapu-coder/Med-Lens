'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { DemoPresets } from '@/components/DemoPresets';
import { PatientIntakeForm } from '@/components/PatientIntakeForm';
import { ReportUpload } from '@/components/ReportUpload';
import { StructuredDataTable } from '@/components/StructuredDataTable';
import { InconsistencyBanner } from '@/components/InconsistencyBanner';
import { SummaryCard } from '@/components/SummaryCard';
import { RecordHistory } from '@/components/RecordHistory';
import { PatientInfo, LabResultItem, InconsistencyAlert, GroundedSummary, MedicalRecord } from '@/lib/types';
import { DEMO_SCENARIOS } from '@/lib/mockData';
import { detectInconsistencies } from '@/lib/inconsistency';
import { saveRecordToDatabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const INITIAL_PATIENT: PatientInfo = {
  age: 42,
  sex: 'Female',
  symptoms: ['Fatigue', 'Dizziness'],
  existingConditions: [],
  allergies: ['Penicillin'],
  currentMedications: [],
};

export default function Home() {
  const [patient, setPatient] = useState<PatientInfo>(INITIAL_PATIENT);
  const [labResults, setLabResults] = useState<LabResultItem[]>([]);
  const [inconsistencies, setInconsistencies] = useState<InconsistencyAlert[]>([]);
  const [summary, setSummary] = useState<GroundedSummary | null>(null);
  
  const [isDemoData, setIsDemoData] = useState<boolean>(false);
  const [demoLabel, setDemoLabel] = useState<string>('');
  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);
  const [rawReportContent, setRawReportContent] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSavedRecordId, setLastSavedRecordId] = useState<string | null>(null);

  // 1-Click Demo Mode Handler (Explicitly labeled DEMO DATA)
  const handleSelectDemoScenario = (scenarioKey: string, record: MedicalRecord) => {
    setActiveDemoKey(scenarioKey);
    setIsDemoData(true);
    setDemoLabel(record.demoLabel || 'DEMO DATA — SAMPLE RECORD');
    setPatient(record.patient);
    setLabResults(record.labResults);
    setInconsistencies(record.inconsistencies);
    setSummary(record.summary);
    setRawReportContent(`Sample Report Fixture: ${record.metadata.reportFileName || 'sample_report.pdf'}\n\nClinical Scan Data loaded for Demo Mode.`);
    setErrorMsg(null);
    setSuccessMsg('Loaded evaluator demo preset scenario.');
  };

  const handleReset = () => {
    setActiveDemoKey(null);
    setIsDemoData(false);
    setDemoLabel('');
    setPatient(INITIAL_PATIENT);
    setLabResults([]);
    setInconsistencies([]);
    setSummary(null);
    setRawReportContent('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Real-time Patient Intake Change Handler (Preserves user input)
  const handlePatientChange = (newPatient: PatientInfo) => {
    setPatient(newPatient);
    if (labResults.length > 0) {
      const updatedConflicts = detectInconsistencies(newPatient, labResults);
      setInconsistencies(updatedConflicts);
    }
  };

  // Live File / Text Processing Handler
  const handleProcessReport = async (file: File | null, rawText: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDemoData(false);
    setActiveDemoKey(null);
    setDemoLabel('');
    setRawReportContent(rawText || (file ? `File Upload: ${file.name}` : ''));

    try {
      const formData = new FormData();
      // Send CURRENT patient state entered by user
      formData.append('patient', JSON.stringify(patient));
      if (file) {
        formData.append('file', file);
      }
      if (rawText) {
        formData.append('rawText', rawText);
      }

      const res = await fetch('/api/process-report', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMsg(json.error?.message || 'The medical report file could not be parsed. Please check the file or paste text content.');
        setIsLoading(false);
        return;
      }

      const data: MedicalRecord = json.data;
      setLabResults(data.labResults);
      setInconsistencies(data.inconsistencies);
      setSummary(data.summary);
      setSuccessMsg('Report processed successfully.');

      // Persist to Supabase if database is configured
      const dbResult = await saveRecordToDatabase(data);
      if (dbResult.recordId) {
        setLastSavedRecordId(dbResult.recordId);
      }
    } catch {
      setErrorMsg('Network error connecting to MedLens processing engine. Please check your network connection or try pasting text report.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Human Inline Verification / Field Edits
  const handleUpdateItem = (updatedItem: LabResultItem) => {
    const newResults = labResults.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    setLabResults(newResults);

    const newConflicts = detectInconsistencies(patient, newResults);
    setInconsistencies(newConflicts);
  };

  // Load record retrieved from database
  const handleLoadRecordFromHistory = (record: MedicalRecord) => {
    setIsDemoData(false);
    setActiveDemoKey(null);
    setPatient(record.patient);
    setLabResults(record.labResults);
    setInconsistencies(record.inconsistencies);
    setSummary(record.summary);
    setSuccessMsg('Retrieved saved record from database.');
  };

  return (
    <main className="container">
      <Header />

      {/* Evaluator Quick Presets */}
      <DemoPresets
        activeDemoKey={activeDemoKey}
        onSelectScenario={handleSelectDemoScenario}
        onReset={handleReset}
      />

      {/* Explicit Demo Mode Banner */}
      {isDemoData && (
        <div className="demo-banner">
          <span>⚡ {demoLabel} ACTIVE — EVALUATOR DEMO MODE</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
            All pipeline states pre-populated for instant testing
          </span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMsg && !isDemoData && (
        <div className="glass-card" style={{ borderLeft: '4px solid #059669', background: '#ecfdf5', color: '#047857' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={20} color="#059669" />
            <div>
              <strong>Success:</strong> {successMsg}
            </div>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="glass-card" style={{ borderLeft: '4px solid #c2410c', background: '#fff7ed', color: '#c2410c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} color="#c2410c" />
            <div>
              <strong>Processing Alert:</strong> {errorMsg}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Patient Intake Form */}
      <PatientIntakeForm patient={patient} onChange={handlePatientChange} disabled={isLoading} />

      {/* Step 2: Medical Report Upload & Input */}
      <ReportUpload onProcessReport={handleProcessReport} isLoading={isLoading} />

      {/* Record History & Database Status */}
      <RecordHistory onLoadRecord={handleLoadRecordFromHistory} lastSavedRecordId={lastSavedRecordId} />

      {/* Step 3: Structured Medical Table & Provenance Grid */}
      <StructuredDataTable
        labResults={labResults}
        onUpdateItem={handleUpdateItem}
        rawReportContent={rawReportContent}
      />

      {/* Step 4: Informational Inconsistency Detection */}
      <InconsistencyBanner alerts={inconsistencies} />

      {/* Step 5: Grounded Patient-Friendly AI Summary */}
      {summary && <SummaryCard summary={summary} isDemoData={isDemoData} />}
    </main>
  );
}
