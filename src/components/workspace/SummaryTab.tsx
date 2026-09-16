'use client';

import React, { useState } from 'react';
import { Patient, Priority } from '../../types/triage';
import { SourceBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  FileCheck2,
  FileText,
  ShieldAlert,
  Send,
  ArrowUpRight,
  Sparkles,
  Info,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Wind,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

interface SummaryTabProps {
  patient: Patient;
  onNavigateToTab?: (tabKey: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ patient, onNavigateToTab }) => {
  const { setPatientPriority, approvePatientNote, escalatePatientCase } = useTriage();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(
    `Patient presents with a 3-day history of high fever and productive cough, with acute exacerbation of shortness of breath over the past 24 hours. Laboratory findings demonstrate significant leukocytosis (13,800/µL) consistent with acute systemic infection, while hemoglobin is mildly subnormal (11.2 g/dL). Borderline hypoxemic reading (91%) warrants immediate clinical airway and auscultatory evaluation.`
  );

  const primaryRisk = patient.riskFlags[0];

  const handleApprove = () => {
    approvePatientNote(patient.id, approvalNotes);
    setShowApprovalDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Split: Clinical Inputs vs Triage Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Intake Facts & Vitals (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Chief Complaint Card */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] mb-2">
              Chief Complaint
            </h3>
            <p className="text-sm font-semibold text-[#102033] leading-snug">
              &ldquo;{patient.chiefComplaint}&rdquo;
            </p>
          </div>

          {/* Vitals Snapshot */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F]">
                Vitals at Intake
              </h3>
              <span className="text-[11px] text-[#6B7B8F]">Source: Nurse Triage</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Blood Pressure</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.bloodPressure || 'Not measured'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>Pulse Rate</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.pulseRate || 'Not measured'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.temperature || 'Not measured'}
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  patient.vitals.spO2 && parseInt(patient.vitals.spO2) < 94
                    ? 'bg-red-50/70 border-red-200 text-[#B3261E]'
                    : 'bg-[#F8FAFC] border-[#E6ECF2] text-[#102033]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Wind className="w-3.5 h-3.5" />
                  <span>SpO₂ Saturation</span>
                </div>
                <div className="text-sm font-bold mt-1 tabular-nums">
                  {patient.vitals.spO2 || 'Not recorded'}
                </div>
              </div>
            </div>
          </div>

          {/* Key Symptoms List */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F]">
                Reported Symptoms ({patient.symptoms.length})
              </h3>
              <span className="text-[11px] text-[#2563EB]">Voice & Form</span>
            </div>

            <div className="space-y-2.5">
              {patient.symptoms.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#102033]">{s.name}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          s.severity === 'SEVERE'
                            ? 'bg-red-100 text-red-800'
                            : s.severity === 'MODERATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7B8F] mt-1">
                      Duration: <strong className="text-[#25364A]">{s.duration}</strong>
                      {s.onset && ` · Onset: ${s.onset}`}
                    </div>
                  </div>
                  <SourceBadge source={s.source} />
                </div>
              ))}
            </div>
          </div>

          {/* Relevant Medical History */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] mb-2.5">
              Relevant Clinical History
            </h3>
            <ul className="space-y-1.5 text-xs text-[#25364A]">
              {patient.relevantHistory.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#2563EB] font-bold">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Center/Right Column: Triage Assessment (Advisory Block) & Evidence (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 10: Example Advisory Block */}
          {primaryRisk ? (
            <div className="rounded-xl border border-red-200 bg-[#FDECEC]/40 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-[#B3261E] flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#B3261E]">
                      Potential urgency signal
                    </span>
                    <span className="text-[10px] bg-red-200/80 text-red-900 px-1.5 py-0.2 rounded font-semibold">
                      Advisory Only
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#102033] mt-1">
                    {primaryRisk.label.replace('Potential urgency signal: ', '')}
                  </h4>
                  <p className="text-xs text-[#526276] mt-1 leading-relaxed">
                    {primaryRisk.description}
                  </p>

                  {/* Supporting Information & Missing Information (Section 10) */}
                  <div className="mt-4 pt-3 border-t border-red-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#102033] block mb-1.5">
                        Supporting information
                      </span>
                      <ul className="space-y-1 text-xs text-[#25364A]">
                        {patient.symptoms.slice(0, 2).map((sym) => (
                          <li key={sym.id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                            <span>{sym.name} ({sym.duration})</span>
                          </li>
                        ))}
                        {patient.facts.slice(0, 2).map((fact) => (
                          <li key={fact.id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                            <span>
                              {fact.name}: {fact.value} {fact.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-[#102033] block mb-1.5">
                        Missing information
                      </span>
                      <ul className="space-y-1 text-xs text-[#996500]">
                        {patient.missingInfo.map((m) => (
                          <li key={m.id} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{m.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 rounded-md bg-white border border-red-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#B3261E] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Human review required
                    </span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      AI never outputs definitive diagnosis
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-[#EAF8F1]/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#087443]">
                <CheckCircle className="w-5 h-5" />
                <h4 className="text-sm font-bold">Routine Triage Presentation</h4>
              </div>
              <p className="text-xs text-[#526276] mt-1">
                No acute respiratory or cardiovascular compromise detected. Vital parameters are stable.
              </p>
            </div>
          )}

          {/* AI-Generated Clinical Summary Note (Section 10 & 18) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Structured Triage Summary</h3>
                  <p className="text-[11px] text-[#6B7B8F]">
                    Based on {patient.facts.length} extracted facts & {patient.symptoms.length} symptoms
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToTab && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => onNavigateToTab('extracted')}
                  >
                    View Sources
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                >
                  {isEditingSummary ? 'Close Edit' : 'Edit Note'}
                </Button>
              </div>
            </div>

            <div className="mt-3">
              {isEditingSummary ? (
                <div className="space-y-2">
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={5}
                    className="w-full text-xs p-3 rounded-lg border border-[#2563EB] bg-white text-[#102033] leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsEditingSummary(false)}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#25364A] leading-relaxed whitespace-pre-line bg-[#F8FAFC] p-3.5 rounded-lg border border-slate-100">
                  {summaryText}
                </p>
              )}
            </div>

            {/* Non-diagnostic disclaimer footer */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#6B7B8F]">
              <Info className="w-3.5 h-3.5 text-[#526276] flex-shrink-0" />
              <span>Summary generated to accelerate intake comprehension. Prescriptions and medical diagnosis must come from qualified medical staff.</span>
            </div>
          </div>

          {/* Primary Review Actions Bar (Section 10 Specification) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#25364A]">
                Human Reviewer Decision
              </h4>
              <span className="text-[11px] font-semibold text-[#164FD6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Action Required by Doctor / MO
              </span>
            </div>

            {/* Action Buttons: [Mark as Low] [Mark as Medium] [Escalate] [Approve & Send to Queue] */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPatientPriority(patient.id, 'GREEN', 'Marked Routine by Reviewer')}
              >
                Mark as Low
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setPatientPriority(patient.id, 'YELLOW', 'Marked Medium by Reviewer')}
              >
                Mark as Medium
              </Button>
              <Button
                variant="outline-destructive"
                size="md"
                onClick={() => escalatePatientCase(patient.id, 'Escalated from summary decision bar')}
              >
                Escalate
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowApprovalDialog(true)}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Approve Note
              </Button>
            </div>

            {patient.status === 'APPROVED' && (
              <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-[#087443] flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Case Approved & Dispatched to OPD Consultation Queue
                </span>
                <span className="text-[11px]">Reviewer: {patient.assignedReviewer || 'Dr. A. Sharma'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApprovalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#2563EB]">
              <FileCheck2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-[#102033]">Approve Triage Note</h3>
            </div>
            <p className="mt-2 text-xs text-[#526276]">
              By approving, you confirm that you have reviewed the evidence, symptoms, and missing items. This case will be sent to the attending physician&apos;s OPD queue.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#25364A] mb-1">
                Attending Officer Notes (Optional):
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Advised immediate oxygen pulse oximetry re-check and nebulization..."
                rows={3}
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleApprove}>
                Approve & Send to Queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
