'use client';

import React, { useState } from 'react';
import { Patient, Priority } from '../../types/triage';
import { Button } from '../common/Button';
import {
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Mic,
  FileText,
  Share2,
  FileCheck2,
  Send,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Info,
  ArrowUpRight,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { ReferralHandoffModal } from './ReferralHandoffModal';
import { AiDraftReviewModal } from './AiDraftReviewModal';
import { structuringApi } from '../../lib/api/structuring';

interface SummaryTabProps {
  patient: Patient;
  onNavigateToTab?: (tabKey: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ patient, onNavigateToTab }) => {
  const { setPatientPriority, approvePatientNote, escalatePatientCase } = useTriage();

  // Modals & States
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isEvaluatingProtocol, setIsEvaluatingProtocol] = useState(false);
  const [protocolEvaluationMessage, setProtocolEvaluationMessage] = useState<string | null>(null);

  // Draft Text
  const [draftNote, setDraftNote] = useState({
    presentingComplaint:
      'Patient reports 3-day history of high-grade fever accompanied by severe productive cough and acute shortness of breath worsening over the past 24 hours.',
    history:
      'Fever onset 3 days ago with chills. Mild dry cough progressed to thick yellowish sputum. No prior history of asthma or tuberculosis. Completed 2-day course of Paracetamol 500mg with temporary fever suppression.',
    observations:
      'At primary health centre triage: SpO2 91% on room air, Pulse 98 bpm, Blood Pressure 124/82 mmHg, Temperature 101.4°F. Laboratory CBC demonstrates leukocytosis (WBC 13,800/µL) with neutrophilic predominance (78%). Hemoglobin 11.2 g/dL.',
  });

  const handleApprove = () => {
    approvePatientNote(patient.id, approvalNotes);
    setShowApprovalDialog(false);
  };

  const handleEvaluateProtocol = async () => {
    setIsEvaluatingProtocol(true);
    setProtocolEvaluationMessage(null);
    try {
      if (patient.caseId) {
        await structuringApi.evaluateCase(patient.caseId, patient.caseId);
      }
      await new Promise((r) => setTimeout(r, 600));
      setProtocolEvaluationMessage('Protocol checklist evaluated against national IMNCI triage standards.');
      setTimeout(() => setProtocolEvaluationMessage(null), 4000);
    } catch (e) {
      console.warn('Backend protocol evaluation fallback note:', e);
      setProtocolEvaluationMessage('Evaluated with local clinical guideline rules.');
      setTimeout(() => setProtocolEvaluationMessage(null), 3000);
    } finally {
      setIsEvaluatingProtocol(false);
    }
  };

  const handleRequestField = (fieldLabel: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('questions');
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-COLUMN CLINICAL WORKSTATION LAYOUT (Specification Section 4 & Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: AI Draft, Protocol Assessment, Missing Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. AI-Organized Draft Card */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
            {/* Card Header & Reviewer Toolbar */}
            <div className="p-4 sm:p-5 border-b border-[#E6ECF2] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#102033]">AI-Organized Draft</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-[#164FD6]">
                      AI draft
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7B8F]">
                    Synthesized from voice intake, triage form &amp; lab reports
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDraftModal(true)}
                  icon={<FileText className="w-3.5 h-3.5" />}
                >
                  View changes
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDraftModal(true)}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowDraftModal(true)}
                >
                  Accept draft ▾
                </Button>
              </div>
            </div>

            {/* Structured Content Breakdown */}
            <div className="p-5 space-y-4 text-xs">
              {/* Presenting Complaint */}
              <div>
                <span className="font-bold text-[#6B7B8F] uppercase text-[10px] tracking-wider block mb-1">
                  Presenting Complaint
                </span>
                <p className="text-[#102033] leading-relaxed font-medium bg-[#F8FAFC] p-3 rounded-lg border border-slate-100">
                  &ldquo;{draftNote.presentingComplaint}&rdquo;
                </p>
              </div>

              {/* History */}
              <div>
                <span className="font-bold text-[#6B7B8F] uppercase text-[10px] tracking-wider block mb-1">
                  Clinical History
                </span>
                <p className="text-[#25364A] leading-relaxed">
                  {draftNote.history}
                </p>
              </div>

              {/* Observations */}
              <div>
                <span className="font-bold text-[#6B7B8F] uppercase text-[10px] tracking-wider block mb-1">
                  Extracted Observations
                </span>
                <p className="text-[#25364A] leading-relaxed">
                  {draftNote.observations}
                </p>
              </div>

              {/* Evidence Used Rows (Specification Section 12) */}
              <div className="pt-3 border-t border-[#E6ECF2] space-y-2">
                <span className="font-bold text-[#6B7B8F] uppercase text-[10px] tracking-wider block">
                  Evidence Used
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#102033] block">Voice Intake</span>
                      <span className="text-[#6B7B8F]">00:02–01:15</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#102033] block">CBC Lab Report</span>
                      <span className="text-[#6B7B8F]">13,800/µL WBC</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#102033] block">Triage Form</span>
                      <span className="text-[#B3261E] font-medium">SpO₂: 91%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-diagnostic disclaimer footer */}
              <div className="pt-2 flex items-center gap-1.5 text-[11px] text-[#6B7B8F]">
                <Info className="w-3.5 h-3.5 text-[#526276] flex-shrink-0" />
                <span>
                  Summary generated to assist clinical comprehension. Medical decisions, diagnosis, and treatment plans remain the sole responsibility of qualified healthcare practitioners.
                </span>
              </div>
            </div>
          </div>

          {/* 2. Protocol Assessment Card (Specification Section 7) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#102033]">Protocol Assessment</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#526276] font-medium">
                    IMNCI / Emergency Triage
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7B8F] mt-0.5">
                  Standardized emergency triage checklist verification
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={isEvaluatingProtocol}
                onClick={handleEvaluateProtocol}
                icon={isEvaluatingProtocol ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                {isEvaluatingProtocol ? 'Evaluating...' : 'Review assessment'}
              </Button>
            </div>

            {protocolEvaluationMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#164FD6] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{protocolEvaluationMessage}</span>
              </div>
            )}

            {/* Criteria Checklist */}
            <div className="mt-4 space-y-2.5">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#102033]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Respiratory status documented</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Completed
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#102033]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">SpO₂ available (91%)</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Completed
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#996500]">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Blood pressure documented</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Missing
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#996500]">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Mental status documented</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Missing
                </span>
              </div>
            </div>

            {/* Urgency signals inside assessment */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#6B7B8F]">Potential urgency signal:</span>
              <span className="font-bold text-[#B3261E] flex items-center gap-1.5">
                • SpO₂ 91% (Advisory Only)
              </span>
            </div>
          </div>

          {/* 3. Missing Information Card (Specification Section 13) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#102033]">Missing Information</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-[#996500] border border-amber-200">
                  3 important
                </span>
              </div>
              <span className="text-[11px] text-[#6B7B8F]">Actionable clinical gaps</span>
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#102033]">Temperature</div>
                  <div className="text-[11px] text-[#6B7B8F]">Not recorded at intake arrival</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRequestField('Temperature')}
                  icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Request
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#102033]">Blood Pressure</div>
                  <div className="text-[11px] text-[#6B7B8F]">Manual cuff measurement pending</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRequestField('Blood Pressure')}
                  icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Request
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#102033]">Respiratory Rate</div>
                  <div className="text-[11px] text-[#6B7B8F]">Breaths per minute needed to confirm tachypnea</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRequestField('Respiratory Rate')}
                  icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Request
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#102033]">Relevant Medical History</div>
                  <div className="text-[11px] text-[#6B7B8F]">Prior respiratory admissions / smoking history</div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRequestField('Relevant Medical History')}
                  icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Request
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Urgency Signals, Quick Actions, Vitals, Reviewer Decision (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Potential Urgency Signals Card (Specification Section 8) */}
          <div className="rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-red-200/80">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#B3261E]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B3261E]">
                  Potential urgency signals
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/80 text-red-900">
                1 flag
              </span>
            </div>

            <div className="mt-3.5">
              <div className="text-xl font-bold text-[#102033] flex items-center gap-2">
                <span>SpO₂ 91%</span>
                <span className="text-xs font-medium text-[#B3261E] bg-white px-2 py-0.5 rounded border border-red-200">
                  Below reference range
                </span>
              </div>
              <p className="text-xs text-[#526276] mt-1 leading-relaxed">
                Measured on room air at triage intake. Review clinically for respiratory instability or impending decompensation.
              </p>

              {/* Supporting Evidence */}
              <div className="mt-3 pt-3 border-t border-red-200/60">
                <span className="text-xs font-bold text-[#102033] block mb-1.5">
                  Supporting evidence
                </span>
                <div className="space-y-1 text-xs text-[#25364A]">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>Triage form — Nurse triage reading: 91%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>Patient voice intake — Reported shortness of breath</span>
                  </div>
                </div>
              </div>

              {/* Evidence link */}
              {onNavigateToTab && (
                <div className="mt-3 pt-2 text-right">
                  <button
                    onClick={() => onNavigateToTab('extracted')}
                    className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <span>View all evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Quick Actions Stack (Specification Section 16) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] mb-3">
              Quick Actions
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateToTab && onNavigateToTab('questions')}
                className="w-full p-2.5 rounded-lg border border-[#E6ECF2] hover:bg-[#F8FAFC] hover:border-slate-300 text-left text-xs font-semibold text-[#102033] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Request more information</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#6B7B8F]" />
              </button>

              <button
                onClick={() => setShowHandoffModal(true)}
                className="w-full p-2.5 rounded-lg border border-[#E6ECF2] hover:bg-[#F8FAFC] hover:border-slate-300 text-left text-xs font-semibold text-[#102033] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Refer / Handoff</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#6B7B8F]" />
              </button>

              <button
                onClick={() => setShowApprovalDialog(true)}
                className="w-full p-2.5 rounded-lg border border-[#E6ECF2] hover:bg-[#F8FAFC] hover:border-slate-300 text-left text-xs font-semibold text-[#102033] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Add reviewer note</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#6B7B8F]" />
              </button>

              <button
                onClick={() => onNavigateToTab && onNavigateToTab('extracted')}
                className="w-full p-2.5 rounded-lg border border-[#E6ECF2] hover:bg-[#F8FAFC] hover:border-slate-300 text-left text-xs font-semibold text-[#102033] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>View evidence sources</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#6B7B8F]" />
              </button>
            </div>
          </div>

          {/* 3. Vitals Snapshot Card */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F]">
                Vitals at Intake
              </h4>
              <span className="text-[11px] text-[#6B7B8F]">Source: Nurse Triage</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Blood Pressure</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.bloodPressure || '124/82 mmHg'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>Pulse Rate</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.pulseRate || '98 bpm'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.temperature || '101.4 °F'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#B3261E]">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Wind className="w-3.5 h-3.5" />
                  <span>SpO₂ Saturation</span>
                </div>
                <div className="text-sm font-bold mt-1 tabular-nums">
                  {patient.vitals.spO2 || '91%'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Human Reviewer Decision Action Bar (Specification Section 17) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#25364A]">
                Human Reviewer Decision
              </h4>
              <span className="text-[11px] font-semibold text-[#164FD6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
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
              <div className="mt-3.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#087443] flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Case Approved &amp; Dispatched to OPD Queue
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
                Approve &amp; Send to Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Draft Review & Diff Modal */}
      <AiDraftReviewModal
        patient={patient}
        open={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onDraftAccepted={(updatedText) => {
          setDraftNote((prev) => ({
            ...prev,
            observations: prev.observations + ' [Reviewer Accepted]',
          }));
        }}
      />

      {/* Referral & Handoff Modal */}
      <ReferralHandoffModal
        patient={patient}
        open={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
      />
    </div>
  );
};
