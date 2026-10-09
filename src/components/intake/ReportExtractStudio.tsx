'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { evidenceApi } from '../../lib/api/evidence';
import { processingApi } from '../../lib/api/processing';
import { tasksApi } from '../../lib/api/tasks';
import type { DocumentResultsResponse, EvidenceResponse } from '../../lib/api/types';
import { assertDocumentIdentity, documentStatusLabel } from '../../lib/documentResults';

export const ReportExtractStudio: React.FC<{ caseId?: string | null }> = ({ caseId: suppliedCaseId }) => {
  const { selectedPatient, patients, setSelectedPatientId } = useTriage();
  const caseId = suppliedCaseId === undefined ? selectedPatient?.caseId : suppliedCaseId;
  return <div className="space-y-3">
    {suppliedCaseId === undefined && <label className="block text-sm">Case
      <select aria-label="Case" value={selectedPatient?.id || ''}
        onChange={e => setSelectedPatientId(e.target.value)} className="border rounded p-2 ml-2">
        <option value="">Select a case</option>
        {patients.filter(p => p.caseId).map(p => <option key={p.id} value={p.id}>{p.name} · {p.caseId}</option>)}
      </select>
    </label>}
    <DocumentStudio key={caseId || 'no-case'} caseId={caseId} />
  </div>;
};

const DocumentStudio: React.FC<{ caseId?: string | null }> = ({ caseId }) => {
  const [documents, setDocuments] = useState<EvidenceResponse[]>([]);
  const [documentId, setDocumentId] = useState('');
  const [result, setResult] = useState<DocumentResultsResponse | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('Select a case and upload a document.');
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!caseId) return;
    const current = generation.current;
    try {
      const items = await evidenceApi.listCaseEvidence(caseId);
      if (generation.current === current) setDocuments(items.filter(d => ['DOCUMENT', 'IMAGE'].includes(d.modality.toUpperCase())));
    } catch {
      if (generation.current === current) setError('Unable to read documents. Check your session and case access.');
    }
  }, [caseId]);

  useEffect(() => {
    const guard = generation;
    guard.current++;
    const current = guard.current;
    if (caseId) {
      evidenceApi.listCaseEvidence(caseId).then(items => {
        if (guard.current === current) setDocuments(items.filter(d => ['DOCUMENT', 'IMAGE'].includes(d.modality.toUpperCase())));
      }).catch(() => {
        if (guard.current === current) setError('Unable to read documents. Check your session and case access.');
      });
    }
    return () => { guard.current++; };
  }, [caseId]);

  const readResults = async (id: string, current: number) => {
    if (!caseId) return null;
    const data = await processingApi.getDocumentResults(id);
    assertDocumentIdentity(data, caseId, id);
    if (generation.current === current) { setResult(data); setNotice(documentStatusLabel(data)); }
    return data;
  };

  const selectDocument = async (id: string) => {
    const current = ++generation.current;
    setDocumentId(id); setResult(null); setPreview(null); setError(null); setBusy(true);
    setNotice('Loading document evidence…');
    try {
      await readResults(id, current);
      const metadata = await evidenceApi.getEvidence(id);
      if (metadata.state !== 'READY') return;
      const download = await evidenceApi.getDownloadUrl(id);
      if (generation.current === current) setPreview(download.download_url);
    } catch {
      if (generation.current === current) setError('Unable to read this document. Check your session and access.');
    } finally { if (generation.current === current) setBusy(false); }
  };

  const processDocument = async (id: string, current: number) => {
    const step = async (processor_type: string, parameters = {}) => {
      const task = await processingApi.triggerProcessing({ evidence_id: id, processor_type, parameters });
      // /trigger returns an async task ID, not a processing run ID.
      await tasksApi.pollUntilComplete(task.run_id, {
        maxAttempts: 180,
        onProgress: taskState => {
          if (generation.current === current) setNotice(`Processing: ${taskState.status.toLowerCase()}`);
        },
      });
      return await readResults(id, current);
    };
    let data = await step('document_ocr');
    if (generation.current !== current) return;
    if (data?.ocr_run?.status !== 'COMPLETED' || data.status === 'DEMO_UNVERIFIED') return;
    data = await step('candidate_extraction', { source_processing_run_id: data.ocr_run.run_id });
    if (generation.current === current && data) setNotice(documentStatusLabel(data));
  };

  const upload = async (file: File) => {
    if (!caseId) return;
    const current = ++generation.current;
    setBusy(true); setResult(null); setDocumentId(''); setPreview(null); setError(null);
    setNotice('Uploading original document…');
    let uploadedId: string | null = null;
    try {
      const context = await evidenceApi.getUploadContext(caseId);
      if (generation.current !== current) return;
      if (context.case_id !== caseId) throw new Error('Upload case identity mismatch.');
      const evidence = await evidenceApi.uploadFileEvidence({
        caseId, consentId: context.consent_id, file,
        modality: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
      });
      if (evidence.case_id !== caseId) throw new Error('Document case identity mismatch.');
      uploadedId = evidence.evidence_id;
      if (generation.current !== current) return;
      setDocumentId(uploadedId);
      await loadDocuments();
      if (evidence.state !== 'READY') {
        await readResults(uploadedId, current);
        return;
      }
      const download = await evidenceApi.getDownloadUrl(uploadedId);
      if (generation.current !== current) return;
      setPreview(download.download_url);
      await processDocument(uploadedId, current);
    } catch {
      if (generation.current === current) {
        // Recover persisted failure information; never fabricate replacement fields.
        if (uploadedId) await readResults(uploadedId, current).catch(() => null);
        setError('Upload or processing could not finish. Check the document status and retry; session, consent, or provider access may be required.');
      }
    } finally { if (generation.current === current) setBusy(false); }
  };

  const retry = async () => {
    const current = ++generation.current;
    setBusy(true); setError(null); setResult(null);
    try {
      let evidence = await evidenceApi.getEvidence(documentId);
      if (evidence.state === 'STORED') evidence = await evidenceApi.retryScan(documentId);
      if (evidence.state !== 'READY') { await readResults(documentId, current); return; }
      const download = await evidenceApi.getDownloadUrl(documentId);
      if (generation.current === current) setPreview(download.download_url);
      await processDocument(documentId, current);
    }
    catch {
      if (generation.current === current) {
        await readResults(documentId, current).catch(() => null);
        setError('Processing did not finish. The persisted status is shown below.');
      }
    } finally { if (generation.current === current) setBusy(false); }
  };

  const selectedDocument = documents.find(d => d.evidence_id === documentId);
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4" aria-label="Document OCR and extraction">
      <h2 className="font-bold text-slate-900">Document evidence & extraction</h2>
      {!caseId && <p className="text-sm">A registered backend case with active data-processing consent is required before uploading.</p>}
      <div className="flex flex-wrap gap-3">
        <select aria-label="Document" value={documentId} disabled={busy || !caseId}
          onChange={e => { if (e.target.value) void selectDocument(e.target.value); }} className="border rounded p-2">
          <option value="">Select a document</option>
          {documents.map(d => <option key={d.evidence_id} value={d.evidence_id}>{d.original_filename || 'Unnamed document'}</option>)}
        </select>
        <input ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff" className="hidden" aria-label="Upload clinical document"
          onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ''; }} />
        <button type="button" disabled={busy || !caseId} onClick={() => fileInput.current?.click()} className="border rounded px-3 py-2 disabled:opacity-40">Upload document</button>
        <button type="button" disabled={busy || !documentId} onClick={() => void retry()} className="border rounded px-3 py-2 disabled:opacity-40">Process / retry</button>
      </div>
      <p role="status" className="text-sm">{notice}</p>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {result && <p className="text-xs text-slate-600">Document {result.evidence_id} · Case {result.case_id}<br />OCR run {result.ocr_run?.run_id || 'Not started'} · Extraction run {result.extraction_run?.run_id || 'Not started'}<br />{result.extraction_run?.failure_reason || result.ocr_run?.failure_reason || ''}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="font-semibold mb-2">Original uploaded document</h3>
          {preview ? (selectedDocument?.content_type.startsWith('image/')
            // Original secured evidence URL; Next image proxy would cache sensitive evidence.
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="Original uploaded evidence" className="max-w-full" />
            : <iframe src={preview} title="Original uploaded document" className="w-full h-[540px] border" />)
            : <p className="text-sm text-slate-600">No document selected.</p>}
          {preview && <a href={preview} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline text-sm">Open original document</a>}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Extracted evidence — needs human verification</h3>
          <p className="text-xs text-slate-600 mb-3">Only supported source rows are structured. Missing, unreadable, and ambiguous fields require review of the original document. No clinical approval is implied.</p>
          {result?.candidates.length ? result.candidates.map(c => <article key={c.candidate_id} className="border rounded p-3 mb-3">
            <h4 className="font-semibold">{c.field_type.replace(/^lab_/, '').replaceAll('_', ' ')}</h4>
            <p className="font-mono">{c.value}</p>
            <p className="text-xs">{c.status} · Confidence {c.confidence === null ? 'Not provided' : c.confidence}</p>
            {c.provenance.map((p, i) => <div key={i} className="text-xs mt-2">
              <p>Reference interval: {p.reference_interval ?? 'Not provided'} · Source flag: {p.source_flag ?? 'Not provided'}</p>
              <p>Page {p.page_number ?? 'Not available'} · Region {p.region_id ?? 'Not available'}</p>
              <p className="whitespace-pre-wrap">Source row: {p.raw_source_text ?? 'Not available'}</p>
            </div>)}
          </article>) : <p className="text-sm">No structured fields available.</p>}
          {result?.pages.map(page => <details key={page.page_id} className="mt-3">
            <summary>OCR source evidence — page {page.page_number}</summary>
            {page.regions.map(r => <pre key={r.region_id} className="text-xs whitespace-pre-wrap border p-2">{r.text}</pre>)}
          </details>)}
        </div>
      </div>
    </section>
  );
};
