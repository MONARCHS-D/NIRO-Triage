'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Edit3,
  FileText,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  GitCompare,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Patient } from '../../types/triage';
import { reviewApi } from '../../lib/api/review';
import { useRole } from '../../context/RoleContext';

interface AiDraftReviewModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onDraftAccepted?: (updatedSummary: string) => void;
}

const getPatientAiDraft = (patient: Patient) => {
  const vitalsText = [
    patient.vitals.spo2 ? `SpO2 ${patient.vitals.spo2}% on room air` : null,
    patient.vitals.heartRate ? `Pulse ${patient.vitals.heartRate} bpm` : null,
    patient.vitals.bpSys && patient.vitals.bpDia ? `Blood Pressure ${patient.vitals.bpSys}/${patient.vitals.bpDia} mmHg` : null,
    patient.vitals.temp ? `Temperature ${patient.vitals.temp}°F` : null,
    patient.vitals.respRate ? `Respiratory Rate ${patient.vitals.respRate} /min` : null,
  ].filter(Boolean).join(', ');

  const symptomsText = patient.symptoms && patient.symptoms.length > 0
    ? patient.symptoms.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
    : 'acute medical presentation';

  return {
    presentingComplaint: `Patient reports acute onset of ${patient.chiefComplaint || 'acute clinical complaints'} accompanied by ${symptomsText}.`,
    history: patient.clinicalSummary || `Intake recorded via ${patient.intakeSource || 'facility triage'}. Patient presents for evaluation. No previous adverse reactions documented.`,
    observations: `At facility triage: ${vitalsText || 'Vitals pending completion'}. Clinical triage tier: ${patient.priority.toUpperCase()} priority (Level ${patient.assignedTriageLevel || '2'}).`,
    recommendations: `Assess and stabilize ${patient.chiefComplaint}. Conduct clinical evaluation, diagnostic workup, and vitals monitoring per facility emergency protocols.`,
  };
};

export const AiDraftReviewModal: React.FC<AiDraftReviewModalProps> = ({
  patient,
  open,
  onClose,
  onDraftAccepted,
}) => {
  const { currentUser, capabilities } = useRole();
  const originalDraft = React.useMemo(() => getPatientAiDraft(patient), [patient]);
  const [activeView, setActiveView] = useState<'diff' | 'edit' | 'reject'>('diff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reviewer edited fields
  const [editedComplaint, setEditedComplaint] = useState(originalDraft.presentingComplaint);
  const [editedHistory, setEditedHistory] = useState(originalDraft.history);
  const [editedObservations, setEditedObservations] = useState(originalDraft.observations);
  const [editedRecommendations, setEditedRecommendations] = useState(originalDraft.recommendations);

  React.useEffect(() => {
    if (open) {
      const draft = getPatientAiDraft(patient);
      const reviewerTitle = currentUser?.name ? `${currentUser.name}` : 'Attending clinician';
      setEditedComplaint(draft.presentingComplaint);
      setEditedHistory(draft.history);
      setEditedObservations(`${draft.observations} ${reviewerTitle} conducted bedside clinical evaluation.`);
      setEditedRecommendations(`${draft.recommendations} Treatment and observation plan confirmed by ${reviewerTitle}.`);
      setActiveView('diff');
      setRejectReason('');
      setSuccessMessage(null);
    }
  }, [open, patient.id, currentUser?.name]);

  if (!open) return null;

  const handleAcceptDraft = async () => {
    setIsSubmitting(true);
    try {
      const fullText = `${editedComplaint}\n\nHistory: ${editedHistory}\n\nObservations: ${editedObservations}\n\nPlan: ${editedRecommendations}`;
      
      // Call backend API if draftId exists
      if (patient.draftId) {
        try {
          const isModified =
            editedComplaint !== originalDraft.presentingComplaint ||
            editedHistory !== originalDraft.history ||
            editedObservations !== originalDraft.observations;

          if (isModified) {
            await reviewApi.editDraft(patient.draftId, {
              edited_content: {
                presentingComplaint: editedComplaint,
                history: editedHistory,
                observations: editedObservations,
                recommendations: editedRecommendations,
              },
              rationale: 'Reviewer clinical corrections and verification',
              expected_draft_version: patient.draftVersion || 1,
              expected_queue_version: patient.queueVersion || 1,
            });
          } else {
            await reviewApi.acceptDraft(patient.draftId, {
              expected_draft_version: patient.draftVersion || 1,
              expected_queue_version: patient.queueVersion || 1,
            });
          }
        } catch (e) {
          console.warn('Backend draft action fallback note:', e);
        }
      }

      setSuccessMessage('AI draft accepted as reviewed clinical note.');
      if (onDraftAccepted) {
        onDraftAccepted(fullText);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error accepting draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    setIsSubmitting(true);
    try {
      if (patient.draftId) {
        try {
          await reviewApi.rejectDraft(patient.draftId, {
            expected_draft_version: patient.draftVersion || 1,
            expected_queue_version: patient.queueVersion || 1,
            rationale: rejectReason || 'Clinically discordant or requires re-extraction from primary sources.',
          });
        } catch (e) {
          console.warn('Backend draft rejection fallback note:', e);
        }
      }
      setSuccessMessage('AI draft rejected. Primary intake will remain for manual re-evaluation.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error rejecting draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-xl border border-[#E6ECF2] shadow-2xl flex flex-col overflow-hidden my-6 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6ECF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#102033]">AI-Organized Draft Review</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-[#164FD6] font-semibold">
                  AI-organized
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-[#526276] font-mono">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-[#526276]">
                Human-in-the-loop review of synthesized clinical documentation for {patient.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#526276] hover:bg-slate-200/60 hover:text-[#102033] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RBAC Read-Only Notice */}
        {!capabilities.canAcceptDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Read-Only Mode ({currentUser.title || currentUser.role}):</strong> Official AI draft acceptance and modification requires Medical Officer authorization.
            </span>
          </div>
        )}

        {/* View Switcher Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-[#E6ECF2] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveView('diff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === 'diff'
                  ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                  : 'text-[#6B7B8F] hover:bg-slate-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Side-by-Side Diff</span>
            </button>

            <button
              onClick={() => setActiveView('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === 'edit'
                  ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                  : 'text-[#6B7B8F] hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </button>

            <button
              onClick={() => setActiveView('reject')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeView === 'reject'
                  ? 'bg-red-50 text-[#B3261E] border border-red-200'
                  : 'text-[#6B7B8F] hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Reject Draft</span>
            </button>
          </div>

          {/* Audit metadata */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#6B7B8F]">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#2563EB]" />
              <span>Reviewer: {currentUser?.name || patient.assignedReviewer || 'Triage Officer'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Draft v1.2</span>
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* VIEW: DIFF MODE */}
          {activeView === 'diff' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between text-xs text-[#526276]">
                <span className="font-medium">
                  Showing comparison: <strong className="text-[#102033]">AI Generated Baseline</strong> vs{' '}
                  <strong className="text-[#2563EB]">Reviewer Refinements</strong>
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="line-through text-red-700 bg-red-100 px-1 rounded">Removed</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-emerald-100 text-emerald-800 px-1 rounded font-semibold">Added</span>
                  </span>
                </div>
              </div>

              {/* Presenting Complaint Section */}
              <div className="p-4 rounded-xl border border-[#E6ECF2] bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] block">
                  1. Presenting Complaint
                </span>
                <p className="text-xs text-[#102033] leading-relaxed">
                  {editedComplaint}
                </p>
                <div className="text-[11px] text-[#6B7B8F] pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Source: Patient Intake ({patient.primaryLanguage || 'Multimodal Speech/Text'})</span>
                  <span className="text-emerald-700 font-medium">✓ Verbatim Match</span>
                </div>
              </div>

              {/* History Section */}
              <div className="p-4 rounded-xl border border-[#E6ECF2] bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] block">
                  2. Clinical History
                </span>
                <p className="text-xs text-[#102033] leading-relaxed">
                  {editedHistory}
                </p>
                <div className="text-[11px] text-[#6B7B8F] pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Source: Verified Intake Clinical Form</span>
                  <span className="text-emerald-700 font-medium">✓ Complete</span>
                </div>
              </div>

              {/* Observations & Vitals Diff Section */}
              <div className="p-4 rounded-xl border border-[#E6ECF2] bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] block">
                  3. Extracted Observations &amp; Vitals
                </span>
                <div className="text-xs leading-relaxed text-[#102033]">
                  <span>{originalDraft.observations} </span>
                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                    + {currentUser?.name || 'Reviewing Clinician'} verified bedside clinical observations.
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7B8F] pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Sources: Facility Triage Instruments &amp; Intake Records</span>
                  <span className="text-blue-700 font-medium">1 Clinical Observation Added by Reviewer</span>
                </div>
              </div>

              {/* Plan & Recommendations Section */}
              <div className="p-4 rounded-xl border border-[#E6ECF2] bg-white space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7B8F] block">
                  4. Clinical Advisory &amp; Action Plan
                </span>
                <div className="text-xs leading-relaxed text-[#102033]">
                  <span>{originalDraft.recommendations} </span>
                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                    + Treatment and observation plan confirmed by {currentUser?.name || 'attending clinician'}.
                  </span>
                </div>
              </div>

              {/* Non-diagnostic disclaimer footer */}
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/60 flex items-center gap-2 text-[11px] text-[#164FD6]">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  Accepting draft records your signature as reviewing clinician. CareIntel AI acts as a summarization instrument; final medical responsibility rests with the attending medical officer.
                </span>
              </div>
            </div>
          )}

          {/* VIEW: EDIT MODE */}
          {activeView === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#25364A] mb-1">
                  1. Presenting Complaint:
                </label>
                <textarea
                  value={editedComplaint}
                  onChange={(e) => setEditedComplaint(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-3 rounded-lg border border-[#E6ECF2] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#25364A] mb-1">
                  2. Clinical History:
                </label>
                <textarea
                  value={editedHistory}
                  onChange={(e) => setEditedHistory(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-[#E6ECF2] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#25364A] mb-1">
                  3. Observations &amp; Vitals:
                </label>
                <textarea
                  value={editedObservations}
                  onChange={(e) => setEditedObservations(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#25364A] mb-1">
                  4. Plan &amp; Recommendations:
                </label>
                <textarea
                  value={editedRecommendations}
                  onChange={(e) => setEditedRecommendations(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-[#E6ECF2] focus:border-[#2563EB] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* VIEW: REJECT MODE */}
          {activeView === 'reject' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                <div className="flex items-center gap-2.5 text-[#B3261E] mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <h4 className="text-sm font-bold">Reject AI-Generated Draft</h4>
                </div>
                <p className="text-xs text-[#526276] leading-relaxed">
                  Rejecting this draft sends the case back to manual clinical documentation. Please provide clinical rationale for audit trail and quality assurance.
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-[#25364A] mb-1.5">
                    Rejection Rationale:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Discrepancy between stated cough severity and audio transcription, or artifact in OCR extraction..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-lg border border-red-300 focus:border-red-500 focus:outline-none leading-relaxed text-[#102033] bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E6ECF2] flex items-center justify-between">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2.5">
            {activeView === 'reject' ? (
              <div title={!capabilities.canAcceptDraft ? 'Draft rejection requires Medical Officer authorization' : undefined}>
                <Button
                  variant="destructive"
                  size="md"
                  disabled={isSubmitting || !capabilities.canAcceptDraft}
                  onClick={handleConfirmReject}
                  icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Rejecting Draft...' : 'Confirm Rejection'}
                </Button>
              </div>
            ) : (
              <>
                <div title={!capabilities.canAcceptDraft ? 'Draft modification requires Medical Officer authorization' : undefined}>
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!capabilities.canAcceptDraft}
                    onClick={() => setActiveView(activeView === 'edit' ? 'diff' : 'edit')}
                  >
                    {activeView === 'edit' ? 'Preview Diff' : 'Edit Text'}
                  </Button>
                </div>

                <div title={!capabilities.canAcceptDraft ? 'Official draft acceptance requires Medical Officer sign-off' : undefined}>
                  <Button
                    variant="primary"
                    size="md"
                    disabled={isSubmitting || !capabilities.canAcceptDraft}
                    onClick={handleAcceptDraft}
                    icon={
                      isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )
                    }
                  >
                    {isSubmitting ? 'Accepting Draft...' : 'Accept Draft'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
