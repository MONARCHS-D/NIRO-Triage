'use client';

import React, { useState } from 'react';
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
  Eye,
  Plus,
  Scan,
} from 'lucide-react';
import { Button } from '../common/Button';
import { SAMPLE_REPORTS, ReportDocument } from '../../lib/ocrSimulator';
import { ExtractedFact } from '../../types/triage';

interface ReportExtractStudioProps {
  initialReport?: ReportDocument;
  onFactsExtracted?: (facts: ExtractedFact[]) => void;
}

export const ReportExtractStudio: React.FC<ReportExtractStudioProps> = ({
  initialReport = SAMPLE_REPORTS[0],
  onFactsExtracted,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<ReportDocument>(initialReport);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [highlightedFactId, setHighlightedFactId] = useState<string | null>('fact-1');
  const [facts, setFacts] = useState<ExtractedFact[]>(initialReport.facts);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [isSimulatingOcrFailure, setIsSimulatingOcrFailure] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 2200);
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

  const activeHighlightedFact = facts.find((f) => f.id === highlightedFactId);

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-sm overflow-hidden">
      {/* Header with status */}
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

        {/* Toggle sample document / simulate uncertainty */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDoc.id}
            onChange={(e) => {
              const doc = SAMPLE_REPORTS.find((d) => d.id === e.target.value);
              if (doc) {
                setSelectedDoc(doc);
                setFacts(doc.facts);
                setCurrentPage(1);
                setHighlightedFactId(doc.facts[0]?.id || null);
              }
            }}
            className="text-xs font-medium py-1 px-2 border border-[#E6ECF2] rounded bg-white text-[#25364A] cursor-pointer"
          >
            {SAMPLE_REPORTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.type})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsSimulatingOcrFailure(!isSimulatingOcrFailure)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              isSimulatingOcrFailure
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isSimulatingOcrFailure ? 'Uncertainty Active' : 'Test OCR Uncertainty'}
          </button>
        </div>
      </div>

      {/* Success / Uncertainty notice banner with Section 16.1 OCR Failure Illustration */}
      {isSimulatingOcrFailure ? (
        <div className="bg-[#FFF9EE] border-b border-[#FDE68A] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#996500]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/illustrations/states/ocr_error.png"
                alt="Document broken extraction indicator illustration"
                fill
                priority
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-[#102033] block">
                Broken Extraction Indicator (Non-Fatal Notice)
              </span>
              <span className="text-[#6B7B8F] text-[11px]">
                Could not read 1 parameter with full confidence due to faint ink. Original values preserved.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulatingOcrFailure(false)}
              className="px-2.5 py-1 rounded bg-amber-100/70 border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer text-[11px]"
            >
              Clear Simulation
            </button>
            <button
              onClick={() => {
                alert('Opened manual entry mode for unreadable fields.');
              }}
              className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer text-[11px]"
            >
              Enter manually
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#EAF8F1] border-b border-[#A7F3D0] px-4 py-2 flex items-center justify-between text-xs text-[#087443] font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A36A] flex-shrink-0" />
            <span>✓ Information extracted successfully. Please verify and edit values if needed.</span>
          </div>
          {isScanning && (
            <span className="text-[11px] font-semibold text-[#2563EB] animate-pulse">
              Active Optical Scan in Progress…
            </span>
          )}
        </div>
      )}

      {/* Main 50/50 Split Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Left Column: Document Preview (6 cols) */}
        <div className="lg:col-span-6 bg-[#25364A]/5 border-r border-[#E6ECF2] p-4 flex flex-col justify-between">
          {/* Document Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-[#25364A]">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span className="truncate max-w-[200px]">{selectedDoc.name}</span>
              <span className="text-[10px] text-[#6B7B8F]">({selectedDoc.fileSizeBytes})</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Section 9.1: Scan trigger button */}
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
                <span>{isScanning ? 'Scanning…' : 'Simulate Scan'}</span>
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
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium text-slate-600 px-1">
                  {currentPage} of {selectedDoc.pagesCount}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= selectedDoc.pagesCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Document Sheet Canvas Simulation */}
          <div className="my-4 flex-1 flex items-center justify-center overflow-auto p-2">
            <div
              className="relative bg-white border border-slate-300 rounded-sm shadow-md transition-all duration-200 select-none p-6 overflow-hidden"
              style={{
                width: `${340 * (zoomLevel / 100)}px`,
                minHeight: `${480 * (zoomLevel / 100)}px`,
                fontFamily: 'Courier New, monospace',
              }}
            >
              {/* Section 9.1: OCR Scan Line Animation (top -> bottom, easeInOut) */}
              {isScanning && (
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 h-1 bg-[#2563EB] shadow-[0_0_12px_#2563EB,0_0_6px_#38BDF8] z-30 pointer-events-none animate-ocr-scan"
                />
              )}
              {/* Document Header Representation */}
              <div className="border-b-2 border-slate-900 pb-2 mb-4 text-center">
                <div className="text-[11px] font-bold tracking-widest text-slate-900 uppercase">
                  COMMUNITY HEALTH CENTER · CLINICAL LAB
                </div>
                <div className="text-[9px] text-slate-600">DEPARTMENT OF PATHOLOGY & BIOCHEMISTRY</div>
                <div className="mt-2 flex justify-between text-[9px] text-slate-700 border-t border-dotted border-slate-400 pt-1">
                  <span>PATIENT: P-1042 (28/F)</span>
                  <span>DATE: 12 AUG 2026</span>
                </div>
              </div>

              {/* Lab Table Preview */}
              <div className="text-[9px] text-slate-800 space-y-2">
                <div className="font-bold border-b border-slate-400 pb-1 flex justify-between">
                  <span>TEST NAME</span>
                  <span>RESULT</span>
                  <span>REFERENCE</span>
                </div>

                {/* Simulated rows with bounding box highlighting */}
                <div className="relative space-y-1.5 pt-1">
                  {facts
                    .filter((f) => f.sourcePage === currentPage)
                    .map((fact) => {
                      const isHighlighted = highlightedFactId === fact.id;
                      return (
                        <div
                          key={fact.id}
                          onClick={() => setHighlightedFactId(fact.id)}
                          className={`flex items-center justify-between p-1 rounded transition-all cursor-pointer ${
                            isHighlighted
                              ? 'bg-blue-100/90 ring-2 ring-[#2563EB] font-bold text-[#164FD6]'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <span className="truncate max-w-[140px]">{fact.name}</span>
                          <span className="tabular-nums font-bold">
                            {fact.value} {fact.unit}
                          </span>
                          <span className="text-slate-500 text-[8px]">{fact.referenceRange}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Simulated stamp / signature */}
              <div className="mt-12 pt-3 border-t border-slate-300 flex justify-between items-end text-[8px] text-slate-500">
                <div>VERIFIED BY: LAB TECH S.DAS</div>
                <div className="border border-slate-400 px-2 py-1 text-slate-700 font-bold rotate-[-4deg]">
                  CHC VERIFIED
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#6B7B8F] text-center">
            Click on any row in the document or the table on the right to cross-verify bounding box provenance.
          </div>
        </div>

        {/* Right Column: Extracted Information (AI) (6 cols) */}
        <div className="lg:col-span-6 p-6 flex flex-col justify-between space-y-6">
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
            <div className="space-y-3">
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

                    {/* Source Provenance Line (Section 9 Requirement) */}
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
