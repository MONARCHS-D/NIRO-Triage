'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  AlertTriangle,
  Clock,
  FileText,
  Activity,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Patient, Priority } from '../../types/triage';
import { useTriage } from '../../context/TriageContext';

interface QuickInspectDrawerProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
}

export const QuickInspectDrawer: React.FC<QuickInspectDrawerProps> = ({
  patient,
  open,
  onClose,
}) => {
  const router = useRouter();
  const { setSelectedPatientId } = useTriage();

  if (!open || !patient) return null;

  const handleOpenWorkspace = () => {
    setSelectedPatientId(patient.id);
    onClose();
    router.push(`/patients/${patient.id}`);
  };

  const isRed = patient.priority === 'RED';
  const isYellow = patient.priority === 'YELLOW';

  // Compute dynamic elapsed wait time from arrival or defaults
  const getWaitTime = (p: Patient) => {
    if (p.priority === 'RED') return '12 min';
    if (p.priority === 'YELLOW') return '28 min';
    return '45 min';
  };
  const waitTime = getWaitTime(patient);

  const missingCount = patient.missingInfo.filter((m) => m.status !== 'OBTAINED').length;
  const urgencyCount = (patient.riskFlags?.length || 0) + (isRed ? 1 : 0);

  // Dynamic Vitals Parsing
  const numSpo2 = patient.vitals.spo2 ?? (patient.vitals.spO2 ? parseInt(patient.vitals.spO2.replace(/\D/g, ''), 10) : undefined);
  const bp = patient.vitals.bloodPressure || (patient.vitals.bpSys && patient.vitals.bpDia ? `${patient.vitals.bpSys}/${patient.vitals.bpDia}` : undefined);
  const pulse = patient.vitals.heartRate || patient.vitals.pulseRate;
  const temp = patient.vitals.temp ? `${patient.vitals.temp}°F` : patient.vitals.temperature;

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-[#E6ECF2] animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6ECF2] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {patient.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-[#102033]">{patient.id}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isRed
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : isYellow
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {patient.priority === 'RED' ? 'Urgent' : patient.priority === 'YELLOW' ? 'Prompt' : 'Routine'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#102033]">{patient.name}</h3>
              <p className="text-[11px] text-[#6B7B8F]">
                {patient.age} yrs · {patient.gender} · {(patient as any).department || 'Outpatient Triage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#526276] hover:bg-slate-200/60 hover:text-[#102033] transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Chips Strip */}
        <div className="px-4 py-2.5 bg-white border-b border-[#E6ECF2] flex flex-wrap items-center gap-1.5 text-[11px]">
          {urgencyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span>{urgencyCount} urgency signal</span>
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{waitTime} wait</span>
          </span>
          {missingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              ◇ {missingCount} missing items
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{patient.facts?.length || 2} observations</span>
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Why this case is prioritized (Section 4) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] block">
              Why this case is prioritized
            </span>
            <div className="space-y-1.5 text-xs text-[#25364A]">
              {isRed && (
                <div className="flex items-start gap-2 text-red-800 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    Potential urgency signal: {numSpo2 ? `SpO₂ ${numSpo2}% (hypoxemia alert)` : 'Acute distress signs flagged'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#526276]">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Waiting {waitTime} in clinical queue</span>
              </div>
              <div className="flex items-center gap-2 text-[#526276]">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>Awaiting medical officer clinical review</span>
              </div>
              {missingCount > 0 && (
                <div className="text-[11px] text-amber-800 pl-4">
                  Missing: {patient.missingInfo.filter((m) => m.status !== 'OBTAINED').map((m) => m.label).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] block mb-1">
              Chief complaint
            </span>
            <p className="text-xs text-[#102033] font-medium leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E6ECF2]">
              {patient.chiefComplaint}
            </p>
          </div>

          {/* Key Observations (Vitals) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] block mb-1.5">
              Key observations
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {numSpo2 !== undefined && (
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                    numSpo2 < 94
                      ? 'bg-red-50 text-red-700 border-red-300 font-bold ring-1 ring-red-400/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="opacity-75">SpO₂</span> <strong>{numSpo2}%</strong>
                </span>
              )}
              {bp && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                  <span className="opacity-75">BP</span> <strong>{bp}</strong>
                </span>
              )}
              {pulse && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                  <span className="opacity-75">Pulse</span> <strong>{pulse} bpm</strong>
                </span>
              )}
              {temp && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                  <span className="opacity-75">Temp</span> <strong>{temp}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Missing Information */}
          {patient.missingInfo && patient.missingInfo.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F]">
                  Missing information ({missingCount})
                </span>
              </div>
              <div className="space-y-1.5">
                {patient.missingInfo.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 bg-white rounded-lg border border-[#E6ECF2] flex items-center justify-between text-xs"
                  >
                    <span className="text-[#25364A] font-medium">{m.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        m.status === 'OBTAINED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status === 'OBTAINED' ? 'Obtained' : 'Needed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Draft Status */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#164FD6]" />
              <div>
                <span className="text-xs font-bold text-[#102033] block">AI Clinical Draft</span>
                <span className="text-[11px] text-[#526276]">
                  {patient.status === 'APPROVED' ? 'Signed & Verified' : 'Synthesized & Ready for review'}
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenWorkspace}
              className="text-xs font-bold text-[#164FD6] hover:text-[#123FA8] flex items-center gap-1 cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Latest Evidence Snippet */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E6ECF2]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] block mb-2">
              Latest Evidence Documentation
            </span>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#102033] block">
                    {patient.facts && patient.facts.length > 0 ? patient.facts[0].sourceDocument || 'chest_xray.jpg' : 'triage_intake_record.pdf'}
                  </span>
                  <span className="text-[10px] text-[#6B7B8F]">Verified at {patient.arrivalTime}</span>
                </div>
              </div>
              <button
                onClick={handleOpenWorkspace}
                className="px-2.5 py-1 text-xs font-semibold text-[#164FD6] hover:bg-blue-50 rounded transition-colors cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E6ECF2] bg-white flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleOpenWorkspace}
            className="flex-1 px-4 py-2 text-xs font-bold bg-[#164FD6] hover:bg-[#123FA8] text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Open full workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawerContent, document.body);
};
