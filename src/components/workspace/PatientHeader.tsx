'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertOctagon,
  Edit,
  Shield,
  FileBadge,
  Sparkles,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

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
  const [escalateReason, setEscalateReason] = useState(
    'Potential respiratory instability observed with borderline SpO₂ 91% and severe tachypnea.'
  );

  const handleConfirmEscalate = () => {
    escalatePatientCase(patient.id, escalateReason);
    setShowEscalateModal(false);
  };

  return (
    <div className="bg-white border-b border-[#E6ECF2] p-4 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Patient Identity & Demographics */}
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to queue"
              className="mt-1 p-1.5 rounded-md hover:bg-slate-100 text-[#526276] hover:text-[#102033] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-bold text-[#102033] tabular-nums tracking-tight">
                {patient.id}
              </span>
              <span className="text-sm font-semibold text-[#25364A]">{patient.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#526276] font-mono">
                {patient.syntheticCode}
              </span>
              <PriorityBadge priority={patient.priority} size="md" />
              <StatusBadge status={patient.status} />
            </div>

            {/* Demographics & Meta Row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7B8F]">
              <span>
                <strong className="text-[#25364A]">{patient.age} yrs</strong> · {patient.gender}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-[#25364A]">
                {patient.primaryLanguage}
                {patient.translatedToEnglish && (
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Translated
                  </span>
                )}
              </span>
              <span>•</span>
              <span className="tabular-nums">Visit: {patient.visitId}</span>
              <span>•</span>
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#6B7B8F]" />
                {patient.arrivalTime}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onOpenEditModal && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenEditModal}
              icon={<Edit className="w-4 h-4" />}
            >
              Edit Details
            </Button>
          )}

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
    </div>
  );
};
