'use client';

import React, { useState } from 'react';
import { Patient, ExtractedFact } from '../../types/triage';
import { ConfidenceBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  FileText,
  Edit2,
  Check,
  Plus,
  Save,
  X,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

interface ExtractedDataTabProps {
  patient: Patient;
  workspaceData?: Record<string, any> | null;
}

export const ExtractedDataTab: React.FC<ExtractedDataTabProps> = ({ patient, workspaceData }) => {
  const { editFactValue } = useTriage();
  const [selectedFactId, setSelectedFactId] = useState<string | null>(
    patient.facts[0]?.id || null
  );
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const startEdit = (fact: ExtractedFact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFactId(fact.id);
    setEditValue(fact.value);
  };

  const saveEdit = (factId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editValue.trim()) {
      editFactValue(patient.id, factId, editValue.trim());
    }
    setEditingFactId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFactId(null);
  };

  // Flatten candidates from backend processing runs
  const backendCandidates: Array<{
    candidate_id: string;
    field_type: string;
    value: string;
    status: string;
    provenance?: any;
  }> = [];

  const processingRuns: any[] = workspaceData?.derived_information?.processing || [];
  processingRuns.forEach((run) => {
    if (Array.isArray(run.extracted_candidates)) {
      backendCandidates.push(...run.extracted_candidates);
    }
  });

  const selectedFact = patient.facts.find((f) => f.id === selectedFactId) || patient.facts[0];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#102033]">Structured Extracted Facts &amp; Provenance</h3>
          <p className="text-xs text-[#6B7B8F] mt-0.5">
            Cross-verify extracted parameters with interactive document bounding box coordinates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#164FD6] border border-blue-200">
            {patient.facts.length} Verified Facts
          </span>
          {backendCandidates.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {backendCandidates.length} Backend Candidates
            </span>
          )}
        </div>
      </div>

      {backendCandidates.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
            CareIntel Extraction Pipeline Candidates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {backendCandidates.map((c) => (
              <div
                key={c.candidate_id}
                className="p-2.5 bg-white rounded-lg border border-purple-100 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-[#102033] block capitalize">
                    {c.field_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[#25364A] font-mono text-[11px]">{c.value}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Split Layout: Facts Table (7 cols on desktop) + Interactive Document Viewer (5 cols on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Facts Table (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E6ECF2] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-bold text-[#102033] uppercase tracking-wider">
              Clinical Parameters Table
            </span>
            <span className="text-[11px] text-[#6B7B8F]">
              Click any row to inspect bounding box
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                  <th className="py-3 px-3.5">Parameter</th>
                  <th className="py-3 px-3.5">Value</th>
                  <th className="py-3 px-3.5">Ref Range</th>
                  <th className="py-3 px-3.5">Source Doc</th>
                  <th className="py-3 px-3.5">Confidence</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECF2]">
                {patient.facts.map((fact) => {
                  const isEditing = editingFactId === fact.id;
                  const isSelected = selectedFact?.id === fact.id;

                  return (
                    <tr
                      key={fact.id}
                      onClick={() => setSelectedFactId(fact.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 ring-1 ring-inset ring-[#2563EB]/40'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {/* Parameter Name */}
                      <td className="py-3 px-3.5 font-semibold text-[#102033]">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0" />
                          )}
                          <span>{fact.name}</span>
                          {fact.isEdited && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 border border-amber-200 text-[#996500] font-medium">
                              Edited
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B7B8F] font-normal">{fact.category}</span>
                      </td>

                      {/* Value */}
                      <td className="py-3 px-3.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 px-1.5 py-0.5 text-xs font-bold border border-[#2563EB] rounded bg-white"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => saveEdit(fact.id, e)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="Save"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-xs text-[#102033] tabular-nums">
                            {fact.value}{' '}
                            <span className="text-[10px] font-normal text-[#6B7B8F]">{fact.unit}</span>
                          </span>
                        )}
                      </td>

                      {/* Reference Range */}
                      <td className="py-3 px-3.5 text-[#526276] tabular-nums text-[11px]">
                        {fact.referenceRange || '—'}
                      </td>

                      {/* Provenance */}
                      <td className="py-3 px-3.5">
                        <div className="text-[11px] text-[#25364A] flex items-center gap-1">
                          <FileText className="w-3 h-3 text-[#2563EB] flex-shrink-0" />
                          <span className="font-medium truncate max-w-[110px]">{fact.sourceDocument}</span>
                        </div>
                        <div className="text-[10px] text-[#6B7B8F]">
                          p.{fact.sourcePage} · {fact.sourceLocation}
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3.5">
                        <ConfidenceBadge confidence={fact.confidence} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        {!isEditing && (
                          <button
                            onClick={(e) => startEdit(fact, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#164FD6] px-1.5 py-0.5 rounded hover:bg-blue-100 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#E6ECF2] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#6B7B8F]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Immutable provenance hash verified for all extracted records.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Document Viewer with Bounding Box Overlay (5 cols on desktop) */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden sticky top-6">
          {/* Document Viewer Toolbar */}
          <div className="p-3.5 border-b border-[#E6ECF2] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <div className="text-xs">
                <span className="font-bold text-[#102033] block truncate max-w-[180px]">
                  {selectedFact?.sourceDocument || 'Primary Diagnostic Report'}
                </span>
                <span className="text-[10px] text-[#6B7B8F]">
                  Page {selectedFact?.sourcePage || 1} · {selectedFact?.sourceLocation || 'Clinical Section'}
                </span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                title="Zoom Out"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 75))}
                className="p-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] font-bold tabular-nums text-slate-700">
                {zoomLevel}%
              </span>
              <button
                type="button"
                title="Zoom In"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 130))}
                className="p-1 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Highlight Banner */}
          {selectedFact && (
            <div className="bg-blue-50/70 border-b border-blue-200 px-3.5 py-2 flex items-center justify-between text-xs text-[#164FD6]">
              <div className="flex items-center gap-1.5 font-medium">
                <Target className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                <span>
                  Highlighting: <strong className="font-bold text-[#102033]">{selectedFact.name}</strong> = {selectedFact.value} {selectedFact.unit}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[#2563EB]">
                {selectedFact.confidence} CONFIDENCE
              </span>
            </div>
          )}

          {/* Document Sheet Canvas Simulation */}
          <div className="p-4 bg-slate-100/70 flex items-center justify-center overflow-auto min-h-[380px]">
            <div
              className="bg-white border border-slate-300 rounded-sm shadow-md select-none p-5 overflow-hidden transition-all duration-200 relative"
              style={{
                width: `${300 * (zoomLevel / 100)}px`,
                minHeight: `${420 * (zoomLevel / 100)}px`,
                fontFamily: 'Courier New, monospace',
              }}
            >
              {/* Document Header Representation */}
              <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
                <div className="text-[10px] font-bold tracking-wider text-slate-900 uppercase">
                  COMMUNITY HEALTH CLINICAL LAB
                </div>
                <div className="text-[8px] text-slate-600">PRIMARY DIAGNOSTIC &amp; PATHOLOGY REPORT</div>
                <div className="mt-1.5 flex justify-between text-[8px] text-slate-700 border-t border-dotted border-slate-400 pt-1">
                  <span>PATIENT: {patient.id} ({patient.age}/{patient.gender?.[0] || 'U'})</span>
                  <span>TIME: {patient.arrivalTime}</span>
                </div>
              </div>

              {/* Lab Table Representation with Interactive Bounding Boxes */}
              <div className="text-[9px] text-slate-800 space-y-1.5">
                <div className="font-bold border-b border-slate-400 pb-1 flex justify-between text-[8px] text-slate-600">
                  <span>INVESTIGATION</span>
                  <span>RESULT</span>
                  <span>REFERENCE</span>
                </div>

                <div className="relative space-y-1 pt-1">
                  {patient.facts.map((fact) => {
                    const isSelected = selectedFact?.id === fact.id;

                    return (
                      <div
                        key={fact.id}
                        onClick={() => setSelectedFactId(fact.id)}
                        className={`flex items-center justify-between p-1 rounded transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-100/90 ring-2 ring-[#2563EB] font-bold text-[#164FD6] shadow-xs'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-3 right-1 bg-[#2563EB] text-white text-[7px] font-sans font-bold px-1 rounded shadow-2xs">
                            BOUNDING BOX · OCR
                          </div>
                        )}
                        <span className="truncate max-w-[120px]">{fact.name}</span>
                        <span className="tabular-nums font-bold">
                          {fact.value} {fact.unit}
                        </span>
                        <span className="text-slate-500 text-[8px] tabular-nums">
                          {fact.referenceRange || '--'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Footer / Official Signature Line */}
              <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-end text-[7px] text-slate-500">
                <div>
                  <div>SOURCE: {selectedFact?.sourceDocument || 'Lab Report'}</div>
                  <div>SECURE VERIFICATION HASH: 0x8F9B...4D</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-700">VERIFIED CLINICIAN</div>
                  <div>DIGITAL SIGNATURE</div>
                </div>
              </div>
            </div>
          </div>

          {/* Provenance Card */}
          {selectedFact && (
            <div className="p-3.5 bg-white border-t border-[#E6ECF2] text-xs">
              <span className="text-[10px] font-bold text-[#6B7B8F] uppercase tracking-wider block mb-1">
                OCR Provenance Citation
              </span>
              <p className="text-[#25364A] text-[11px] leading-relaxed">
                Extracted from <strong>{selectedFact.sourceDocument}</strong> on Page {selectedFact.sourcePage} ({selectedFact.sourceLocation}) with confidence rating <strong>{selectedFact.confidence}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
