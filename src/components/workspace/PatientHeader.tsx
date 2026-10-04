'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  ArrowLeft,
  Clock,
  AlertOctagon,
  Edit,
  Share2,
  MoreVertical,
  CheckCircle2,
  Database,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { ReferralHandoffModal } from './ReferralHandoffModal';

interface PatientHeaderProps {
  patient: Patient;
  onBack?: () => void;
  onOpenEditModal?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onOpenEditModal,
}) => {
  const { escalatePatientCase } = useTriage();
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showDetailsMenu, setShowDetailsMenu] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [escalateReason, setEscalateReason] = useState(
    'Potential respiratory instability observed with borderline SpO₂ 91% and severe tachypnea.'
  );

  const handleConfirmEscalate = () => {
    escalatePatientCase(patient.id, escalateReason);
    setShowEscalateModal(false);
  };

  // Compute avatar initials
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white border-b border-[#E6ECF2] p-4 sm:p-5 shadow-xs relative">
      {/* Concurrency Conflict Banner */}
      {hasConflict && (
        <div className="mb-3.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-[#996500] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Case Concurrency Notice:</strong> This record was updated by another clinical reviewer. Your pending local changes have not been overwritten.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasConflict(false)}
              className="font-bold underline hover:text-amber-900 cursor-pointer"
            >
              Reload Latest
            </button>
            <span>·</span>
            <button
              onClick={() => setHasConflict(false)}
              className="underline hover:text-amber-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Patient Identity & Demographics */}
        <div className="flex items-start gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to queue"
              className="mt-1 p-1.5 rounded-md hover:bg-slate-100 text-[#526276] hover:text-[#102033] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Patient Avatar Circle */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-blue-200 flex-shrink-0 mt-0.5">
            {initials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-bold text-[#102033] tabular-nums tracking-tight">
                {patient.id}
              </span>
              <span className="text-sm font-semibold text-[#25364A]">{patient.name}</span>
              <span className="text-xs text-[#526276]">
                {patient.age} yrs · {patient.gender}
              </span>

              {/* Status Badges */}
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Awaiting review
              </span>

              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Synced
              </span>

              <span className="text-[11px] text-[#6B7B8F] flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated 2 min ago
              </span>
            </div>

            {/* Demographics & Meta Row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7B8F]">
              <span className="flex items-center gap-1 font-medium text-[#25364A]">
                {patient.primaryLanguage}
                {patient.translatedToEnglish && (
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                    Translated
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="tabular-nums">Visit: {patient.visitId}</span>
              <span>•</span>
              <span className="flex items-center gap-1 tabular-nums">
                Intake Arrival: {patient.arrivalTime}
              </span>
              <span>•</span>
              <PriorityBadge priority={patient.priority} size="sm" />
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenEditModal && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenEditModal}
              icon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowHandoffModal(true)}
            icon={<Share2 className="w-4 h-4 text-[#2563EB]" />}
          >
            Refer / Handoff
          </Button>

          {patient.status !== 'ESCALATED' && (
            <Button
              variant="outline-destructive"
              size="md"
              onClick={() => setShowEscalateModal(true)}
              icon={<AlertOctagon className="w-4 h-4" />}
            >
              Escalate
            </Button>
          )}

          {/* Details Overflow Menu Button (Section 5) */}
          <div className="relative">
            <button
              onClick={() => setShowDetailsMenu(!showDetailsMenu)}
              title="Record Version & Technical Details"
              className="p-2 rounded-lg border border-[#E6ECF2] hover:bg-slate-100 text-[#526276] hover:text-[#102033] transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Details Popover Menu */}
            {showDetailsMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-[#E6ECF2] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 text-xs text-[#25364A] space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-[#102033] uppercase text-[11px] tracking-wider">
                    Technical Metadata
                  </span>
                  <button
                    onClick={() => setShowDetailsMenu(false)}
                    className="text-[#6B7B8F] hover:text-[#102033] font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Record version:</span>
                    <strong className="text-[#102033]">{patient.version || 12}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Queue version:</span>
                    <strong className="text-[#102033]">{patient.queueVersion || 7}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Last synchronized:</span>
                    <span className="text-[#102033]">14:32:05 UTC</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Synthetic ID:</span>
                    <span className="text-[#102033]">{patient.syntheticCode}</span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[#6B7B8F] block text-[10px]">Record UUID:</span>
                    <span className="text-[10px] text-[#526276] break-all">
                      {patient.caseId || 'c6a1072b-891c-43be-b94f-fbc03e18a994'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => {
                      setHasConflict(true);
                      setShowDetailsMenu(false);
                    }}
                    className="text-amber-700 hover:underline cursor-pointer"
                  >
                    Simulate Concurrency
                  </button>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Direct SSL DB
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Confirmation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-red-200 p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-[#B3261E]">
              <AlertOctagon className="w-6 h-6" />
              <h3 className="text-base font-bold">Escalate Patient Case</h3>
            </div>
            <p className="mt-2 text-xs text-[#526276]">
              Escalation notifies senior medical officers and flags this case as priority RED in the resuscitation/urgent assessment pathway.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#25364A] mb-1">
                Clinical Escalation Rationale:
              </label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="secondary" size="md" onClick={() => setShowEscalateModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="md" onClick={handleConfirmEscalate}>
                Confirm Urgent Escalation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Referral & Handoff Multi-Step Modal */}
      <ReferralHandoffModal
        patient={patient}
        open={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
      />
    </div>
  );
};
