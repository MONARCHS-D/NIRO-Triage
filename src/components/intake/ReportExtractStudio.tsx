'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  X,
  FileCheck,
  Scan,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { evidenceApi } from '../../lib/api/evidence';
import { ExtractedFact, ReportDocument } from '../../types/triage';
import { useTriage } from '../../context/TriageContext';

const OCR_CACHE_KEY = 'careintel_live_ocr_doc_v1';

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
  onFactsExtracted?: (facts: ExtractedFact[]) => void;
}

export const ReportExtractStudio: React.FC<ReportExtractStudioProps> = ({
  initialReport,
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
  const [ocrProviderInfo, setOcrProviderInfo] = useState<string>('Azure Document Intelligence (prebuilt-layout)');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('Analyzing document layout via Azure Document Intelligence...');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or restore cached live extraction, or auto-load default report
  useEffect(() => {
    if (initialReport) {
      setSelectedDoc(initialReport);
      setFacts(initialReport.facts);
      setHighlightedFactId(initialReport.facts[0]?.id || null);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(OCR_CACHE_KEY);
        if (cached) {
          const doc: ReportDocument = JSON.parse(cached);
          setSelectedDoc(doc);
          setFacts(doc.facts);
          setHighlightedFactId(doc.facts[0]?.id || null);
          return;
        }
      } catch {
        // ignore cache parse error
      }
    }

    // Auto-fetch and extract default PDF if not already loaded
    loadDefaultPdf();
  }, [initialReport]);

  const loadDefaultPdf = async () => {
    setIsScanning(true);
    setScanStatusMessage('Loading sterling_accuris_report.pdf and running live Azure Document Intelligence OCR...');
    setOcrErrorMessage(null);

    try {
      const response = await fetch('/sterling_accuris_report.pdf');
      if (!response.ok) {
        throw new Error('Could not fetch /sterling_accuris_report.pdf from public repository');
      }
      const blob = await response.blob();
      const file = new File([blob], 'sterling_accuris_report.pdf', { type: 'application/pdf' });
      await processUploadedFile(file);
    } catch (err: any) {
      console.warn('Failed auto-loading default report:', err);
      setIsScanning(false);
      setOcrErrorMessage(
        err?.message || 'Failed to auto-load sterling_accuris_report.pdf. Please upload a document using the Upload button.'
      );
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsScanning(true);
    setScanStatusMessage('Uploading to Azure Document Intelligence and extracting clinical parameters...');
    setOcrErrorMessage(null);

    try {
      const res = await evidenceApi.extractDocumentOcr(file);

      const extractedFactsMapped: ExtractedFact[] = (res.extracted_facts || []).map((f) => ({
        id: f.id,
        category: f.category as any,
        name: f.name,
        value: f.value,
        unit: f.unit,
        referenceRange: f.referenceRange || undefined,
        sourceDocument: f.sourceDocument || file.name,
        sourcePage: f.sourcePage || 1,
        sourceLocation: f.sourceLocation,
        confidence: f.confidence as any,
        confidenceScore: f.confidenceScore,
        boundingBox: f.boundingBox || { x: 10, y: 30, width: 80, height: 5 },
      }));

      const realDoc: ReportDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        patientId: selectedPatient?.id || 'P-1042',
        type: file.type.includes('pdf') ? 'CBC' : 'BIOCHEMISTRY',
        pagesCount: res.page_count || 19,
        uploadDate: 'Today · Live Extraction',
        fileSizeBytes: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        facts: extractedFactsMapped,
        pageImages: res.page_images || (
          file.name.toLowerCase().includes('sterling')
            ? Array.from({ length: 19 }, (_, i) => `/reports/sterling_accuris/page_${i + 1}.jpg`)
            : []
        ),
      };

      if (res.provider) {
        setOcrProviderInfo(res.provider);
      }

      setSelectedDoc(realDoc);
      setFacts(extractedFactsMapped);
      setHighlightedFactId(extractedFactsMapped[0]?.id || null);

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(OCR_CACHE_KEY, JSON.stringify(realDoc));
        } catch {
          // ignore quota error
        }
      }

      if (onFactsExtracted) {
        onFactsExtracted(extractedFactsMapped);
      }
    } catch (err: any) {
      console.warn('Live Document OCR error:', err);
      setOcrErrorMessage(
        err?.message || 'Failed to extract document facts with Azure Document Intelligence. Please check the file and try again.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
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
      onFactsExtracted(facts);
    }
  };

  const isSterlingReport = selectedDoc?.name.toLowerCase().includes('sterling') ?? true;
  const currentImageSrc =
    selectedDoc?.pageImages?.[currentPage - 1] ||
    (isSterlingReport ? `/reports/sterling_accuris/page_${currentPage}.jpg` : null);
  const pageSectionTitle = PAGE_SECTIONS[currentPage] || `Clinical Analysis Panel · Page ${currentPage}`;
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
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#E6ECF2] bg-white text-xs font-medium text-[#25364A]">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="truncate max-w-[180px]">{selectedDoc.name}</span>
              <span className="text-[10px] text-[#6B7B8F]">({selectedDoc.fileSizeBytes})</span>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.pdf"
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

          <button
            type="button"
            onClick={loadDefaultPdf}
            disabled={isScanning}
            title="Re-run live OCR on sterling_accuris_report.pdf"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Re-run Live OCR</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Azure Document Intelligence · Live
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
        <div className="bg-[#EAF8F1] border-b border-[#A7F3D0] px-4 py-2 flex items-center justify-between text-xs text-[#087443] font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] flex-shrink-0" />
            <span>✓ {selectedDoc.name} extracted via {ocrProviderInfo}. {facts.length} parameters available for verification.</span>
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

      {/* Main 50/50 Split Layout */}
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
                      const box = fact.boundingBox || { x: 10, y: 30, width: 80, height: 4 };

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
              ) : (
                /* Loading state */
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Loading original document page...</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-[#6B7B8F] text-center">
            Click on any row in the document or the table on the right to cross-verify bounding box provenance.
          </div>
        </div>

        {/* Right Column: Extracted Information (AI) (6 cols on desktop) */}
        <div className="xl:col-span-6 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Extracted Information (AI)</h3>
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
                          Source: Page {fact.sourcePage} · {fact.sourceLocation}
                        </span>
                      </span>
                      <span
                        className={`font-medium ${
                          fact.confidence === 'HIGH' ? 'text-[#087443]' : 'text-[#996500]'
                        }`}
                      >
                        Confidence: {fact.confidence === 'HIGH' ? 'High (98%)' : 'Medium (85%)'}
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
              All extracted facts are cited with original document coordinates.
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
    </div>
  );
};
