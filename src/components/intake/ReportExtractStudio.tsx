'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Edit2,
  Save,
  X,
  FileCheck,
  Scan,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { evidenceApi } from '../../lib/api/evidence';
import { ConfidenceLevel, ExtractedFact, ReportDocument } from '../../types/triage';
import { useTriage } from '../../context/TriageContext';

const PAGE_SECTIONS: Record<number, string> = {
  1: 'Complete Blood Count (CBC) & Hemogram',
  2: 'Blood Group (ABO & Rh Serology)',
  3: 'Lipid Profile',
  4: 'Biochemistry (Fasting Blood Sugar)',
  5: 'Glycosylated Hemoglobin (HbA1c & Mean Glucose)',
  6: 'Thyroid Function Test (T3, T4, TSH)',
  7: 'Biochemistry (Microalbumin / Urine Volume)',
  8: 'Protein & Bilirubin Profile',
  9: 'Iron Studies (Iron, TIBC, Transferrin Saturation)',
  10: 'Immunoassay (Serum Homocysteine)',
  11: 'Renal Function & Electrolytes (Creatinine, BUN, Na+, K+, Cl-)',
  12: 'Immunoassay (25(OH) Vitamin D)',
  13: 'Immunoassay (Vitamin B12)',
  14: 'Immunoassay (PSA-Prostate Specific Antigen)',
  15: 'Immunoassay (Total IgE Allergy / Atopy)',
  16: 'Infectious Serology (HIV I & II, HBsAg)',
  17: 'Hemoglobin Electrophoresis (HPLC / Beta Thal)',
  18: 'Bio-Rad CDM System (Chromatogram Peaks)',
  19: 'Physical & Chemical Urine Examination',
};

interface ReportExtractStudioProps {
  initialReport?: ReportDocument;
  ocrConsent?: { subjectId: string; consentId: string; aiConsentId: string };
  onFactsExtracted?: (facts: ExtractedFact[], file?: File) => void;
}

export const ReportExtractStudio: React.FC<ReportExtractStudioProps> = ({
  initialReport,
  ocrConsent,
  onFactsExtracted,
}) => {
  const { selectedPatient } = useTriage();
  const [selectedDoc, setSelectedDoc] = useState<ReportDocument | null>(initialReport || null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [highlightedFactId, setHighlightedFactId] = useState<string | null>(null);
  const [facts, setFacts] = useState<ExtractedFact[]>(initialReport?.facts || []);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [ocrErrorMessage, setOcrErrorMessage] = useState<string | null>(null);
  const [ocrProviderInfo, setOcrProviderInfo] = useState<string>('Ready for OCR');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('Preparing document for the configured OCR provider...');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [reportCategory, setReportCategory] = useState<string>('ALL');
  const [selectedSampleDoc, setSelectedSampleDoc] = useState<string>('');
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processUploadedFile = async (file: File) => {
    if (!ocrConsent) {
      setOcrErrorMessage('Record patient or guardian data-processing consent in New Intake before uploading a report. Use the synthetic sample for an offline demo.');
      return;
    }
    const supportedFile = file.type === 'application/pdf' || file.type === 'image/png' || file.type === 'image/jpeg';
    if (!supportedFile) {
      setOcrErrorMessage('Choose a PDF, PNG, or JPEG report.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setOcrErrorMessage('This file is larger than the 20 MB upload limit. Choose a smaller report.');
      return;
    }

    setIsScanning(true);
    setSelectedDoc(null);
    setFacts([]);
    setHighlightedFactId(null);
    setActiveFile(null);
    setCurrentPage(1);
    setScanStatusMessage('Sending the document to the configured OCR provider...');
    setOcrErrorMessage(null);

    try {
      const res = await evidenceApi.extractDocumentOcr(file, ocrConsent);
      setActiveFile(file);

      const extractedFactsMapped: ExtractedFact[] = (res.extracted_facts || []).map((f) => ({
        id: f.id,
        category: (['LAB_CBC', 'LAB_BIOCHEM', 'VITALS', 'HISTORY', 'EXAM'].includes(f.category)
          ? f.category
          : 'LAB_BIOCHEM') as ExtractedFact['category'],
        name: f.name,
        value: f.value,
        unit: f.unit,
        referenceRange: f.referenceRange || undefined,
        sourceDocument: f.sourceDocument || file.name,
        sourcePage: f.sourcePage || 1,
        sourceLocation: f.sourceLocation,
        confidence: (f.confidence === 'HIGH' ? 'HIGH' : f.confidence === 'LOW' ? 'LOW' : 'MEDIUM') as ConfidenceLevel,
        confidenceScore: f.confidenceScore,
        boundingBox: f.boundingBox || undefined,
      }));

      const realDoc: ReportDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        patientId: selectedPatient?.id || 'P-1042',
        type: file.type.includes('pdf') ? 'CBC' : 'BIOCHEMISTRY',
        pagesCount: res.page_count || 1,
        uploadDate: 'Today - OCR processed',
        fileSizeBytes: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        facts: extractedFactsMapped,
        pageImages: res.page_images || [],
      };

      if (res.provider) {
        setOcrProviderInfo(res.provider);
      }

      setSelectedDoc(realDoc);
      setFacts(extractedFactsMapped);
      setHighlightedFactId(extractedFactsMapped[0]?.id || null);

    } catch (err: unknown) {
      console.warn('Live Document OCR error:', err);
      setOcrErrorMessage(err instanceof Error ? err.message : 'OCR could not process this file. Check the document and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
    e.target.value = '';
  };

  const handleClearDocument = () => {
    setSelectedDoc(null);
    setFacts([]);
    setHighlightedFactId(null);
    setCurrentPage(1);
    setSelectedSampleDoc('');
    setActiveFile(null);
    setOcrErrorMessage(null);
    setOcrProviderInfo('Ready for OCR');
  };

  const triggerScan = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditClick = (fact: ExtractedFact) => {
    setEditingFactId(fact.id);
    setTempValue(fact.value);
    setHighlightedFactId(fact.id);
  };

  const handleSaveEdit = (factId: string) => {
    const updated = facts.map((f) => {
      if (f.id === factId) {
        return {
          ...f,
          value: tempValue,
          isEdited: true,
          originalValue: f.originalValue || f.value,
        };
      }
      return f;
    });
    setFacts(updated);
    setEditingFactId(null);
  };

  const handleApplyToWorkspace = () => {
    if (onFactsExtracted) {
      onFactsExtracted(facts, activeFile || undefined);
    }
  };

  const loadSyntheticSample = () => {
    const sourceDocument = 'CareIntel Synthetic CBC (Demo)';
    const sampleFacts: ExtractedFact[] = [
      { id: 'demo-hb', category: 'LAB_CBC', name: 'Hemoglobin', value: '12.8', unit: 'g/dL', referenceRange: '12.0-16.0', sourceDocument, sourcePage: 1, sourceLocation: 'Synthetic sample row 1', confidence: 'LOW', confidenceScore: 0.75 },
      { id: 'demo-wbc', category: 'LAB_CBC', name: 'White blood cell count', value: '8,200', unit: '/uL', referenceRange: '4,000-10,000', sourceDocument, sourcePage: 1, sourceLocation: 'Synthetic sample row 2', confidence: 'LOW', confidenceScore: 0.75 },
      { id: 'demo-platelets', category: 'LAB_CBC', name: 'Platelet count', value: '240,000', unit: '/uL', referenceRange: '150,000-400,000', sourceDocument, sourcePage: 1, sourceLocation: 'Synthetic sample row 3', confidence: 'LOW', confidenceScore: 0.75 },
    ];
    const sample: ReportDocument = {
      id: 'demo-synthetic-cbc',
      name: sourceDocument,
      patientId: selectedPatient?.id || 'DEMO',
      type: 'CBC',
      pagesCount: 1,
      uploadDate: 'Synthetic demonstration data',
      fileSizeBytes: 'Demo fixture',
      facts: sampleFacts,
      pageImages: ['/reports/synthetic-cbc-demo.svg'],
    };
    setSelectedSampleDoc('synthetic_cbc');
    setSelectedDoc(sample);
    setActiveFile(null);
    setFacts(sampleFacts);
    setHighlightedFactId(sampleFacts[0].id);
    setOcrProviderInfo('Synthetic sample - no OCR provider called');
    setOcrErrorMessage(null);
  };

  const isSyntheticSample = selectedDoc?.id === 'demo-synthetic-cbc';
  const currentImageSrc = selectedDoc?.pageImages?.[currentPage - 1] || null;
  const pageFacts = facts.filter((f) => f.sourcePage === currentPage);

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-sm overflow-hidden">
      {/* Header with status & actions */}
      <div className="p-4 sm:p-5 border-b border-[#E6ECF2] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <h2 className="text-base font-bold text-[#102033]">Document OCR & Extraction Studio</h2>
          </div>
          <p className="text-xs text-[#6B7B8F] mt-0.5">
            50/50 Split Review: Inspect source document bounding boxes alongside extracted parameters
          </p>
        </div>

        {/* Live Controls & Document Status */}
        <div className="flex items-center gap-2">
          {selectedDoc && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#E6ECF2] bg-white text-xs font-medium text-[#25364A]">
                <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="truncate max-w-[180px]">{selectedDoc.name}</span>
                <span className="text-[10px] text-[#6B7B8F]">({selectedDoc.fileSizeBytes})</span>
              </div>

              {/* Document Switcher Dropdown */}
              <div className="relative">
                <select
                  value={selectedSampleDoc || (isSyntheticSample ? 'synthetic_cbc' : 'current')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSampleDoc(val);
                    if (val === 'synthetic_cbc') {
                      loadSyntheticSample();
                    } else if (val === 'upload_new') {
                      triggerScan();
                    }
                  }}
                  className="text-xs py-1 px-2.5 pr-7 rounded border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="current">
                    {selectedDoc.name}
                  </option>
                  <option value="synthetic_cbc">CareIntel synthetic CBC sample</option>
                  <option value="upload_new">+ Upload different file...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clear / New Intake Button */}
              <button
                type="button"
                onClick={handleClearDocument}
                title="Clear current report and start fresh intake upload"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">New Intake</span>
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={triggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-[#2563EB] bg-blue-50 text-[#164FD6] font-semibold hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          {selectedDoc && activeFile && (
            <button
              type="button"
              onClick={() => processUploadedFile(activeFile)}
              disabled={isScanning}
              title="Re-run OCR on the selected report"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-run Live OCR</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
            {ocrProviderInfo}
          </span>
        </div>
      </div>

      {/* Success / Error / Scanning notice banner */}
      {ocrErrorMessage ? (
        <div className="bg-[#FFF9EE] border-b border-[#FDE68A] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#996500]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/illustrations/states/ocr_error.png"
                alt="Document extraction notice illustration"
                fill
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-[#102033] block">
                OCR Notice: Extraction Interrupted
              </span>
              <span className="text-[#6B7B8F] text-[11px]">
                {ocrErrorMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOcrErrorMessage(null)}
              className="px-2.5 py-1 rounded bg-amber-100/70 border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer text-[11px]"
            >
              Dismiss
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer text-[11px]"
            >
              Try Another File
            </button>
          </div>
        </div>
      ) : selectedDoc ? (
        <div className={`${isSyntheticSample ? 'bg-blue-50 border-blue-200 text-blue-800' : facts.length ? 'bg-[#EAF8F1] border-[#A7F3D0] text-[#087443]' : 'bg-amber-50 border-amber-200 text-amber-800'} border-b px-4 py-2 flex items-center justify-between text-xs font-medium`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              {isSyntheticSample
                ? `${selectedDoc.name}: synthetic example only; no OCR was run.`
                : facts.length
                  ? `${selectedDoc.name} processed by ${ocrProviderInfo}. ${facts.length} values are ready for human verification.`
                  : `${selectedDoc.name} processed by ${ocrProviderInfo}, but no structured values were found. Review the source or retry.`}
            </span>
          </div>
          {isScanning && (
            <span className="text-[11px] font-semibold text-[#2563EB] animate-pulse flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {scanStatusMessage}
            </span>
          )}
        </div>
      ) : isScanning ? (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-xs text-blue-800 font-medium">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          <span>{scanStatusMessage}</span>
        </div>
      ) : null}

      {/* Upload File & Dropdown UI (Rendered when NO document is loaded) */}
      {!selectedDoc && (
        <div className="p-6 sm:p-10 space-y-6">
          {/* Scanning Progress if uploading/scanning */}
          {isScanning && (
            <div className="p-8 sm:p-12 text-center bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-9 h-9 text-[#2563EB] animate-spin" />
              <h4 className="text-base font-bold text-[#102033]">Processing Clinical Document...</h4>
              <p className="text-xs text-[#526276] max-w-md">{scanStatusMessage}</p>
              <div className="w-56 h-1.5 bg-blue-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#2563EB] rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {!isScanning && (
            <>
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    processUploadedFile(file);
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                  isDragging
                    ? 'border-[#2563EB] bg-blue-50/80 scale-[1.01] shadow-md ring-4 ring-blue-100'
                    : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-slate-50 hover:border-blue-400'
                }`}
              >
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#102033]">
                      Upload Medical Report or Lab Document
                    </h3>
                    <p className="text-xs sm:text-sm text-[#526276] mt-1 leading-relaxed">
                      Drag and drop clinical PDF, scanned blood report, or pathology image directly here to begin OCR extraction.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={triggerScan}
                      disabled={isScanning}
                    >
                      Browse File to Upload
                    </Button>
                    <Button variant="secondary" size="lg" onClick={loadSyntheticSample} disabled={isScanning}>
                      Use Synthetic Sample
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-[#6B7B8F]">
                    <span className="flex items-center gap-1 font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      PDF (Multi-page supported)
                    </span>
                    <span>•</span>
                    <span className="font-medium">PNG, JPG, JPEG</span>
                    <span>•</span>
                    <span className="font-medium">Up to 20 MB</span>
                  </div>
                </div>
              </div>

              {/* Dropdown UI Section */}
              <div className="bg-[#F8FAFC] border border-[#E6ECF2] rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#2563EB]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#102033]">
                    Document Selection & Clinical Category
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dropdown 1: Clinical Panel / Report Category Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#25364A] mb-1.5">
                      Clinical Panel / Report Category
                    </label>
                    <div className="relative">
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full text-xs py-2 px-3 pr-8 rounded-lg border border-slate-300 bg-white text-[#102033] font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none cursor-pointer appearance-none shadow-2xs"
                      >
                        <option value="ALL">Auto-detect Clinical Specialty (Comprehensive)</option>
                        <option value="CBC">Complete Blood Count (CBC) & Hemogram</option>
                        <option value="BIOCHEM">Biochemistry & Renal Profile (Creatinine, BUN, LFT)</option>
                        <option value="LIPID">Lipid & Cardiovascular Panel</option>
                        <option value="DIABETES">Glycemic Profile (HbA1c & Fasting Glucose)</option>
                        <option value="THYROID">Thyroid Function (T3, T4, TSH)</option>
                        <option value="PRESCRIPTION">Hospital Discharge Summary / Prescription</option>
                        <option value="OTHER">General Medical Report / Scanned Requisition</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-[#6B7B8F] mt-1">
                    Live extraction runs only when an OCR provider is configured. The included sample is synthetic.
                    </p>
                  </div>

                  {/* Dropdown 2: Available Hospital / Sample Document Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#25364A] mb-1.5">
                      Or Choose Available Document
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedSampleDoc}
                          onChange={(e) => {
                            setSelectedSampleDoc(e.target.value);
                            if (e.target.value === 'synthetic_cbc') {
                              loadSyntheticSample();
                            }
                          }}
                          disabled={isScanning}
                          className="w-full text-xs py-2 px-3 pr-8 rounded-lg border border-slate-300 bg-white text-[#102033] font-medium focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none cursor-pointer appearance-none shadow-2xs disabled:opacity-50"
                        >
                          <option value="">-- Select an available document to inspect --</option>
                          <option value="synthetic_cbc">CareIntel synthetic CBC sample</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {selectedSampleDoc && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={loadSyntheticSample}
                          disabled={isScanning}
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />}
                        >
                          Load
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7B8F] mt-1">
                      This is fictional demonstration data. It does not run OCR or represent a patient.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main 50/50 Split Layout (Only shown when document is selected/loaded) */}
      {selectedDoc && (
        <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[560px]">
        {/* Left Column: Document Preview (6 cols on desktop) */}
        <div className="xl:col-span-6 bg-[#25364A]/5 border-r border-[#E6ECF2] p-4 flex flex-col justify-between">
          {/* Document Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-[#25364A]">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span className="truncate max-w-[200px]">{selectedDoc?.name || 'Loading document...'}</span>
              <span className="text-[10px] text-[#6B7B8F]">({selectedDoc?.fileSizeBytes || '--'})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerScan}
                disabled={isScanning}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                  isScanning
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white hover:bg-blue-50 text-[#2563EB] border-blue-200 shadow-2xs'
                }`}
              >
                <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning…' : 'Scan Document'}</span>
              </button>

              {/* Zoom controls */}
              <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden">
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 70))}
                  className="p-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[11px] font-semibold tabular-nums text-slate-700">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 140))}
                  className="p-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Page controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium text-slate-600 px-1">
                  {currentPage} of {selectedDoc?.pagesCount || 19}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= (selectedDoc?.pagesCount || 19)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Authentic Document Canvas with Real Original Preview & Bounding Box Layer */}
          <div className="my-3 flex-1 flex items-start justify-center overflow-auto p-2 max-h-[780px]">
            <div
              className="relative bg-white border border-slate-300 rounded-md shadow-lg transition-all duration-200 select-none overflow-hidden"
              style={{
                width: `${540 * (zoomLevel / 100)}px`,
                minHeight: `${760 * (zoomLevel / 100)}px`,
              }}
            >
              {/* OCR Scan Line Animation */}
              {isScanning && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 h-1 bg-[#2563EB] shadow-[0_0_12px_#2563EB,0_0_6px_#38BDF8] z-30 pointer-events-none animate-ocr-scan"
                />
              )}

              {/* Real Original Document Image */}
              {currentImageSrc ? (
                <div className="relative w-full h-auto">
                  <img
                    src={currentImageSrc}
                    alt={`Original document page ${currentPage}`}
                    className="w-full h-auto block select-none pointer-events-none"
                    loading="eager"
                  />

                  {/* Interactive Bounding Box Layer directly over the real document */}
                  <div className="absolute inset-0 pointer-events-auto">
                    {pageFacts.map((fact) => {
                      const isHighlighted = highlightedFactId === fact.id;
                      const box = fact.boundingBox;
                      if (!box) return null;

                      return (
                        <div
                          key={fact.id}
                          onClick={() => setHighlightedFactId(fact.id)}
                          title={`${fact.name}: ${fact.value} ${fact.unit}`}
                          className={`absolute rounded transition-all cursor-pointer ${
                            isHighlighted
                              ? 'border-2 border-[#2563EB] bg-blue-500/25 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(37,99,235,0.45)] z-20'
                              : 'border border-blue-400/50 hover:border-blue-600 bg-blue-500/10 hover:bg-blue-500/20 z-10'
                          }`}
                          style={{
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                          }}
                        >
                          {/* Provenance Pill on Highlight */}
                          {isHighlighted && (
                            <span className="absolute -top-6 left-0 bg-[#164FD6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-30 pointer-events-none flex items-center gap-1">
                              <span>{fact.name}:</span>
                              <span className="text-blue-100">{fact.value} {fact.unit}</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : isScanning ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Loading original document page...</p>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600 flex flex-col items-center justify-center min-h-[400px]">
                  <FileText className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Document preview unavailable</p>
                  <p className="text-xs max-w-sm mt-2">
                    The OCR provider returned extracted content without a page image. Review the cited page and source details on the right.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-[#6B7B8F] text-center">
            OCR coordinates appear only when the provider returns them; sample facts are clearly marked as synthetic.
          </div>
        </div>

        {/* Right Column: Extracted Information (AI) (6 cols on desktop) */}
        <div className="xl:col-span-6 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Extracted Information for Review</h3>
                <p className="text-xs text-[#6B7B8F]">
                  Structured values with provenance citations and confidence scores
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                {facts.length} Fields Extracted
              </span>
            </div>

            {/* Extracted Lab Values List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {facts.map((fact) => {
                const isSelected = highlightedFactId === fact.id;
                const isEditing = editingFactId === fact.id;

                return (
                  <div
                    key={fact.id}
                    onClick={() => {
                      setHighlightedFactId(fact.id);
                      if (fact.sourcePage !== currentPage) {
                        setCurrentPage(fact.sourcePage);
                      }
                    }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#F8FAFC] ring-1 ring-[#2563EB]'
                        : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#102033]">{fact.name}</span>
                          {fact.isEdited && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                              Edited
                            </span>
                          )}
                        </div>

                        {/* Value & Unit with inline editing */}
                        <div className="mt-1.5 flex items-baseline gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="w-24 px-2 py-1 text-sm font-bold border border-[#2563EB] rounded bg-white text-[#102033]"
                                autoFocus
                              />
                              <span className="text-xs text-[#6B7B8F]">{fact.unit}</span>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(fact.id)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                title="Save"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFactId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-[#102033] tabular-nums">
                              {fact.value} <span className="text-xs font-normal text-[#6B7B8F]">{fact.unit}</span>
                            </span>
                          )}

                          {fact.referenceRange && !isEditing && (
                            <span className="text-xs text-[#6B7B8F] ml-1">
                              (Ref: {fact.referenceRange})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(fact);
                          }}
                          className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#164FD6] font-medium p-1 rounded hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>

                    {/* Source Provenance Line */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#6B7B8F]">
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-[#2563EB]" />
                        <span>
                          Source: Page {fact.sourcePage} - {fact.sourceLocation}
                        </span>
                      </span>
                      <span
                        className={`font-medium ${
                          fact.confidence === 'HIGH' ? 'text-[#087443]' : 'text-[#996500]'
                        }`}
                      >
                        Confidence: {fact.confidenceScore !== undefined
                          ? `${Math.round(fact.confidenceScore * 100)}% (${fact.confidence.toLowerCase()})`
                          : fact.confidence.toLowerCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Confirmation Action */}
          <div className="pt-3 border-t border-[#E6ECF2] flex items-center justify-between">
            <div className="text-xs text-[#6B7B8F]">
              {isSyntheticSample
                ? 'Synthetic example data only. No patient document was uploaded or processed.'
                : 'Values retain their source page and confidence; coordinates are shown when returned by OCR.'}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleApplyToWorkspace}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Verify & Add to Patient Record
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
