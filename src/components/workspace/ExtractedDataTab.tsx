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
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

interface ExtractedDataTabProps {
  patient: Patient;
}

export const ExtractedDataTab: React.FC<ExtractedDataTabProps> = ({ patient }) => {
  const { editFactValue } = useTriage();
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  const startEdit = (fact: ExtractedFact) => {
    setEditingFactId(fact.id);
    setEditValue(fact.value);
  };

  const saveEdit = (factId: string) => {
    if (editValue.trim()) {
      editFactValue(patient.id, factId, editValue.trim());
    }
    setEditingFactId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E6ECF2] gap-3">
        <div>
          <h3 className="text-base font-bold text-[#102033]">Structured Extracted Facts & Provenance</h3>
          <p className="text-xs text-[#6B7B8F]">
            Section 18 AI Transparency: Each extracted fact cites its exact source document, page, and table location
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-[#164FD6] border border-blue-200">
            {patient.facts.length} Verified Facts
          </span>
        </div>
      </div>

      {/* Facts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
              <th className="py-3 px-4">Parameter / What</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Reference Range</th>
              <th className="py-3 px-4">Source Provenance</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF2]">
            {patient.facts.map((fact) => {
              const isEditing = editingFactId === fact.id;

              return (
                <tr key={fact.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                  {/* Parameter Name */}
                  <td className="py-3.5 px-4 font-semibold text-[#102033]">
                    <div className="flex items-center gap-2">
                      <span>{fact.name}</span>
                      {fact.isEdited && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-[#996500] font-medium">
                          Edited
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B7B8F] font-normal">{fact.category}</span>
                  </td>

                  {/* Value */}
                  <td className="py-3.5 px-4">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 px-2 py-1 text-xs font-bold border border-[#2563EB] rounded bg-white"
                          autoFocus
                        />
                        <span className="text-slate-500">{fact.unit}</span>
                        <button
                          onClick={() => saveEdit(fact.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFactId(null)}
                          className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-sm text-[#102033] tabular-nums">
                        {fact.value}{' '}
                        <span className="text-xs font-normal text-[#6B7B8F]">{fact.unit}</span>
                      </span>
                    )}
                  </td>

                  {/* Reference Range */}
                  <td className="py-3.5 px-4 text-[#526276] tabular-nums">
                    {fact.referenceRange || '—'}
                  </td>

                  {/* Provenance */}
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-[#25364A] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2563EB] flex-shrink-0" />
                      <span className="font-medium truncate max-w-[170px]">{fact.sourceDocument}</span>
                    </div>
                    <div className="text-[11px] text-[#6B7B8F] mt-0.5">
                      Page {fact.sourcePage} · {fact.sourceLocation}
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4">
                    <ConfidenceBadge confidence={fact.confidence} />
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(fact)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#164FD6] px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
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

      <div className="mt-6 pt-4 border-t border-[#E6ECF2] flex items-center justify-between text-xs text-[#6B7B8F]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Every extracted lab parameter maintains an immutable audit record when edited.</span>
        </div>
      </div>
    </div>
  );
};
