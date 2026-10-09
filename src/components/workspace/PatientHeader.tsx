'use client';

import React, { useState, useEffect } from 'react';
import { Patient } from '../../types/triage';
import { PriorityBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  ArrowLeft,
  Clock,
  AlertOctagon,
  Edit,
  Share2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { ReferralHandoffModal } from './ReferralHandoffModal';

interface PatientHeaderProps {
  patient: Patient;
  onBack?: () => void;
  onOpenEditModal?: () => void;
  workspaceData?: Record<string, any> | null;
  onRefreshWorkspace?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBack,
  onOpenEditModal,
  workspaceData,
  onRefreshWorkspace,
}) => {
  const { escalatePatientCase, approvePatientNote } = useTriage();
  const { capabilities } = useRole();
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showDetailsMenu, setShowDetailsMenu] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [escalateReason, setEscalateReason] = useState(
    `Acute condition (${patient.chiefComplaint}) requiring senior medical officer evaluation and urgent escalation.`
  );

  useEffect(() => {
    setEscalateReason(
      `Acute condition (${patient.chiefComplaint}) requiring senior medical officer evaluation and urgent escalation.`
    );
  }, [patient.id, patient.chiefComplaint]);

  const handleConfirmEscalate = () => {
    escalatePatientCase(patient.id, escalateReason);
    setShowEscalateModal(false);
  };

  const handleMarkReviewed = () => {
    approvePatientNote(patient.id, 'Clinical case reviewed and verified at triage workstation');
  };

  // Compute avatar initials
  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const missingCount = patient.missingInfo.filter((m) => m.status !== 'OBTAINED').length;
  const urgencyCount = (patient.riskFlags?.length || 0) + (patient.priority === 'RED' ? 1 : 0);
  const reportsCount = patient.facts?.length ? Math.min(2, Math.ceil(patient.facts.length / 2)) : 1;

  const waitTime = patient.priority === 'RED' ? '12 min wait' : patient.priority === 'YELLOW' ? '28 min wait' : '45 min wait';

  return (
    <div className="bg-white border-b border-[#E6ECF2] p-4 sm:p-5 shadow-xs relative">
      {/* Concurrency Conflict Banner */}
      {hasConflict && (
        <div className="mb-3.5 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-[#996500] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Case Concurrency Notice:</strong> This record was updated by another clinical reviewer. Your pending local changes have not been overwritten.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onRefreshWorkspace) onRefreshWorkspace();
                setHasConflict(false);
              }}
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
        {/* Patient Identity & Demographics (Mockup Bottom-Left Hero) */}
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
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-blue-200 shrink-0 mt-0.5">
            {initials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#102033] tabular-nums tracking-tight">
                {patient.id}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#25364A]">{patient.name}</span>
              <span className="text-xs text-[#6B7B8F] font-medium">
                {patient.age} yrs · {patient.gender} · {(patient as any).department || 'OPD'} · {waitTime}
              </span>
            </div>

            {/* Badges Row (Mockup In-line Badges) */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <PriorityBadge priority={patient.priority} size="sm" />

              {urgencyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span>{urgencyCount} urgency signal</span>
                </span>
              )}

              {missingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px]">
                  ◇ {missingCount} missing items
                </span>
              )}

              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium flex items-center gap-1 text-[11px]">
                <FileText className="w-3 h-3" />
                <span>{reportsCount} reports</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Controls: Synced Status + Refer + Mark as Reviewed + Overflow */}
        <div className="flex items-center gap-3">
          {/* Calm, Human-Readable Sync Status */}
          <div className="flex items-center gap-1.5 text-xs text-right hidden sm:block">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs shadow-emerald-400" />
              <span>Synced</span>
            </div>
            <span className="text-[10px] text-[#6B7B8F]">Updated 2 min ago</span>
          </div>

          {onOpenEditModal && (
            <Button
              variant="secondary"
              size="md"
              disabled={capabilities.isSuspended}
              title={capabilities.isSuspended ? 'Account Suspended: Cannot edit patient record' : undefined}
              onClick={capabilities.isSuspended ? undefined : onOpenEditModal}
              icon={<Edit className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          )}

          <div title={!capabilities.canReferHandoff ? 'Referral dispatch requires Doctor / Medical Officer authorization' : undefined}>
            <Button
              variant="secondary"
              size="md"
              disabled={!capabilities.canReferHandoff}
              onClick={() => setShowHandoffModal(true)}
              icon={<Share2 className="w-3.5 h-3.5 text-[#2563EB]" />}
            >
              Refer / Handoff
            </Button>
          </div>

          {patient.status !== 'APPROVED' ? (
            <div title={!capabilities.canApproveCase ? 'Official case review sign-off requires Medical Officer authorization' : undefined}>
              <Button
                variant="primary"
                size="md"
                disabled={!capabilities.canApproveCase}
                onClick={handleMarkReviewed}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Mark as reviewed
              </Button>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Reviewed
            </span>
          )}

          {/* Details Overflow Menu Button (Section 5 & Point 1) */}
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
                    Record Details &amp; Telemetry
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
                    <strong className="text-[#102033]">
                      v{workspaceData?.case?.version ?? patient.version ?? 12}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Queue version:</span>
                    <strong className="text-[#102033]">
                      v{workspaceData?.queue_item?.version ?? patient.queueVersion ?? 7}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Last synchronization:</span>
                    <span className="text-[#102033]">Updated 2 min ago</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7B8F]">Backend status:</span>
                    <span className="text-emerald-700 font-semibold">
                      {workspaceData ? 'Active' : 'Local Fallback'}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100">
                    <span className="text-[#6B7B8F] block text-[10px]">Case ID:</span>
                    <span className="text-[10px] text-[#526276] break-all font-mono">
                      {patient.caseId || patient.syntheticCode}
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
                  <button
                    onClick={() => {
                      if (onRefreshWorkspace) onRefreshWorkspace();
                      setShowDetailsMenu(false);
                    }}
                    className="text-[#164FD6] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-red-600">Escalate Case to Specialist</h3>
            <p className="text-xs text-slate-600">
              This will elevate patient priority to Red Urgent and alert attending medical officers.
            </p>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              className="w-full h-24 p-2.5 text-xs border rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEscalateModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmEscalate}>
                Confirm Escalation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Handoff Modal */}
      <ReferralHandoffModal
        patient={patient}
        open={showHandoffModal}
        onClose={() => setShowHandoffModal(false)}
      />
    </div>
  );
};
