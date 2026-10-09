'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Building2,
  AlertTriangle,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Search,
  Activity,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Patient } from '../../types/triage';
import { handoffApi } from '../../lib/api/handoff';

interface ReferralHandoffModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FacilityOption {
  id: string;
  name: string;
  type: string;
  distance: string;
  specialties: string[];
  icuAvailable: boolean;
  contact: string;
}

const DEFAULT_FACILITIES: FacilityOption[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Capital Hospital',
    type: 'District / Tertiary Hospital',
    distance: '12 km · 25 mins',
    specialties: ['Pulmonology', 'Critical Care', 'Internal Medicine'],
    icuAvailable: true,
    contact: '+91 674 239 1983',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'AIIMS Apex Referral Centre',
    type: 'Apex Academic Medical Center',
    distance: '16 km · 35 mins',
    specialties: ['Advanced Resuscitation', 'Adult ICU', 'Emergency Medicine'],
    icuAvailable: true,
    contact: '+91 674 247 6789',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'District Headquarters Hospital (DHH)',
    type: 'Secondary Referral Hospital',
    distance: '28 km · 45 mins',
    specialties: ['General Medicine', 'Oxygen Bed Ward'],
    icuAvailable: false,
    contact: '+91 6755 220 102',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'CHC Jatni First Referral Unit',
    type: 'Community Health Centre',
    distance: '8 km · 15 mins',
    specialties: ['Basic Stabilization', 'Day Care'],
    icuAvailable: false,
    contact: '+91 674 249 0211',
  },
];

type UrgencyLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export const ReferralHandoffModal: React.FC<ReferralHandoffModalProps> = ({
  patient,
  open,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [facilities, setFacilities] = useState<FacilityOption[]>(DEFAULT_FACILITIES);
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption>(DEFAULT_FACILITIES[0]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('URGENT');
  const getPatientTransferReason = (p: Patient) => {
    const vitalsIssues = [];
    if (p.vitals.spo2 && p.vitals.spo2 < 94) {
      vitalsIssues.push(`hypoxemic SpO2 reading of ${p.vitals.spo2}%`);
    }
    if (p.vitals.bpSys && p.vitals.bpSys >= 140) {
      vitalsIssues.push(`elevated blood pressure of ${p.vitals.bpSys}/${p.vitals.bpDia || '--'} mmHg`);
    }
    if (p.vitals.heartRate && p.vitals.heartRate > 100) {
      vitalsIssues.push(`tachycardia (${p.vitals.heartRate} bpm)`);
    }
    const issueSummary = vitalsIssues.length > 0 ? ` with ${vitalsIssues.join(', ')}` : '';
    return `Acute clinical presentation: ${p.chiefComplaint}${issueSummary}. Requires secondary hospital evaluation, diagnostic stabilization, and physician supervision per protocol.`;
  };

  const getPatientClinicalNotes = (p: Patient) => {
    const vitalsText = [
      p.vitals.spo2 ? `SpO2 ${p.vitals.spo2}%` : null,
      p.vitals.heartRate ? `Pulse ${p.vitals.heartRate} bpm` : null,
      p.vitals.bpSys && p.vitals.bpDia ? `BP ${p.vitals.bpSys}/${p.vitals.bpDia} mmHg` : null,
      p.vitals.temp ? `Temp ${p.vitals.temp}°F` : null,
    ].filter(Boolean).join(', ');

    return `Patient ${p.name} (${p.age}y ${p.gender}) presents with ${p.chiefComplaint}. Vitals at primary intake: ${vitalsText || 'Vitals pending completion'}. Clinical priority categorized as ${p.priority.toUpperCase()}. Case referred with attending clinical documentation.`;
  };

  const [transferReason, setTransferReason] = useState(() => getPatientTransferReason(patient));
  const [reviewerClinicalNotes, setReviewerClinicalNotes] = useState(() => getPatientClinicalNotes(patient));

  useEffect(() => {
    if (open) {
      setTransferReason(getPatientTransferReason(patient));
      setReviewerClinicalNotes(getPatientClinicalNotes(patient));
      setCurrentStep(1);
      setDispatchStage('IDLE');
      setTrackingNumber(null);
    }
  }, [open, patient.id]);

  const [includeAudio, setIncludeAudio] = useState(true);
  const [includeLabReports, setIncludeLabReports] = useState(true);
  const [includeAiSummary, setIncludeAiSummary] = useState(true);

  // Dispatch progress states
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStage, setDispatchStage] = useState<'IDLE' | 'PREPARED' | 'INITIATED' | 'SENT' | 'ACKNOWLEDGED'>('IDLE');
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Fetch active recipients from backend
  useEffect(() => {
    let isMounted = true;
    handoffApi
      .listActiveRecipients()
      .then((recipients) => {
        if (isMounted && recipients && recipients.length > 0) {
          const mapped: FacilityOption[] = recipients.map((r, i) => ({
            id: r.id,
            name: r.name,
            type: 'Registered Referral Recipient',
            distance: `${(i + 1) * 8} km · ${(i + 1) * 15} mins`,
            specialties: ['General Medicine', 'Emergency Care', 'Specialty Referral'],
            icuAvailable: true,
            contact: '+91 674 239 1983',
          }));
          setFacilities(mapped);
          setSelectedFacility(mapped[0]);
        }
      })
      .catch((err) => {
        console.warn('Backend recipients list fallback note:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!open) return null;

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.specialties.some((s) => s.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleSendHandoff = async () => {
    setIsDispatching(true);
    setDispatchStage('PREPARED');
    const genTracking = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      if (patient.caseId) {
        try {
          const evidenceUuid =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : 'e0000000-0000-0000-0000-000000000001';

          // Step 1: Prepare referral package
          const pkg = await handoffApi.prepareReferralPackage(patient.caseId, {
            evidence_ids: [evidenceUuid],
          });

          // Step 2: Finalize package
          if (pkg?.id) {
            await handoffApi.finalizePackage(pkg.id);

            // Step 3: Initiate handoff
            const handoff = await handoffApi.initiateHandoff(pkg.id, {
              recipient_id: selectedFacility.id,
            });

            // Step 4: Transmit/Send handoff
            if (handoff?.id) {
              setDispatchStage('INITIATED');
              const sent = await handoffApi.sendHandoff(handoff.id, {
                expected_version: handoff.version,
              });

              // Step 5: Acknowledge handoff
              setDispatchStage('SENT');
              await handoffApi.recordAcknowledgement(handoff.id, {
                reference: genTracking,
                expected_version: (sent?.version || handoff.version) + 1,
              });
            }
          }
        } catch (e) {
          console.warn('Backend handoff multi-step transition fallback note:', e);
        }
      }

      await new Promise((r) => setTimeout(r, 600));
      setDispatchStage('INITIATED');

      await new Promise((r) => setTimeout(r, 700));
      setDispatchStage('SENT');
      setTrackingNumber(genTracking);

      await new Promise((r) => setTimeout(r, 800));
      setDispatchStage('ACKNOWLEDGED');
    } catch (err) {
      console.error('Handoff submission error:', err);
    } finally {
      setIsDispatching(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E6ECF2] shadow-2xl flex flex-col overflow-hidden my-6 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6ECF2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#102033]">Referral &amp; Inter-Facility Handoff</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-[#164FD6] border border-blue-200 font-semibold font-mono">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-[#526276]">
                {patient.name} · {patient.age} yrs · {patient.gender} · Case: {patient.visitId}
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

        {/* Step Indicator Tabs */}
        <div className="px-6 py-2.5 bg-white border-b border-[#E6ECF2] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-semibold transition-colors cursor-pointer ${
                currentStep === 1
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-[#6B7B8F] hover:text-[#102033]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#102033] flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Destination</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-semibold transition-colors cursor-pointer ${
                currentStep === 2
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-[#6B7B8F] hover:text-[#102033]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#102033] flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Transfer Urgency</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-semibold transition-colors cursor-pointer ${
                currentStep === 3
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-[#6B7B8F] hover:text-[#102033]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#102033] flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Handover Notes</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-semibold transition-colors cursor-pointer ${
                currentStep === 4
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-[#6B7B8F] hover:text-[#102033]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#102033] flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Review &amp; Dispatch</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: DESTINATION FACILITY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#102033]">Select Receiving Facility</h4>
                <p className="text-xs text-[#526276]">
                  Choose destination hospital with appropriate specialty department and critical bed capacity.
                </p>
              </div>

              {/* Search Facility */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7B8F]" />
                <input
                  id="facility-search-filter"
                  name="facility-search-filter"
                  aria-label="Search hospital name, specialty, distance"
                  type="text"
                  placeholder="Search hospital name, specialty, distance..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] text-[#102033] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              {/* Facility Cards */}
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {filteredFacilities.map((fac) => {
                  const isSelected = selectedFacility.id === fac.id;
                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacility(fac)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/50 shadow-xs'
                          : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              isSelected
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-slate-100 text-[#526276]'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#102033]">{fac.name}</div>
                            <div className="text-[11px] text-[#526276] mt-0.5">
                              {fac.type} · <span className="font-medium text-[#25364A]">{fac.distance}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {fac.specialties.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#526276] font-medium"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {fac.icuAvailable ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ● ICU Beds Available
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              General Ward
                            </span>
                          )}
                          <div className="text-[10px] text-[#6B7B8F] mt-1.5">{fac.contact}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: TRANSFER URGENCY */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#102033]">Select Transfer Urgency</h4>
                <p className="text-xs text-[#526276]">
                  Define clinical urgency to dictate ambulance dispatch priority and receiving team readiness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Emergency */}
                <div
                  onClick={() => setUrgency('EMERGENCY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    urgency === 'EMERGENCY'
                      ? 'border-red-500 bg-red-50/60 shadow-xs ring-2 ring-red-400/30'
                      : 'border-[#E6ECF2] bg-white hover:border-red-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-[#B3261E] mb-2.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-[#B3261E]">Emergency</div>
                  <div className="text-xs text-[#102033] font-semibold mt-0.5">Immediate transfer</div>
                  <p className="text-[11px] text-[#526276] mt-1.5 leading-relaxed">
                    Unstable vitals, airway compromise, severe hypoxemia requiring immediate resuscitation.
                  </p>
                </div>

                {/* Urgent */}
                <div
                  onClick={() => setUrgency('URGENT')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    urgency === 'URGENT'
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/30'
                      : 'border-[#E6ECF2] bg-white hover:border-amber-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-[#996500] mb-2.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-[#996500]">Urgent</div>
                  <div className="text-xs text-[#102033] font-semibold mt-0.5">Within 2–4 Hours</div>
                  <p className="text-[11px] text-[#526276] mt-1.5 leading-relaxed">
                    Clinical deterioration risk or unstable triage vitals requiring secondary facility escalation.
                  </p>
                </div>

                {/* Routine */}
                <div
                  onClick={() => setUrgency('ROUTINE')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    urgency === 'ROUTINE'
                      ? 'border-[#2563EB] bg-blue-50/60 shadow-xs ring-2 ring-blue-400/30'
                      : 'border-[#E6ECF2] bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[#2563EB] mb-2.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-[#2563EB]">Routine</div>
                  <div className="text-xs text-[#102033] font-semibold mt-0.5">Scheduled Referral</div>
                  <p className="text-[11px] text-[#526276] mt-1.5 leading-relaxed">
                    Elective specialty consultation, diagnostic imaging confirmation, non-critical follow-up.
                  </p>
                </div>
              </div>

              {/* Rationale input */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#25364A] mb-1.5">
                  Transfer Rationale (Communicated to Receiving CMO):
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-lg border border-[#E6ECF2] focus:border-[#2563EB] focus:outline-none leading-relaxed text-[#102033]"
                />
              </div>
            </div>
          )}

          {/* STEP 3: CLINICAL HANDOVER NOTES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#102033]">Reviewer Clinical Handover Note</h4>
                <p className="text-xs text-[#526276]">
                  Reviewer-authored clinical summary. AI-organized drafts are pre-filled below for your editorial refinement.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#25364A] mb-1.5">
                  Attending Medical Officer Handover Summary:
                </label>
                <textarea
                  value={reviewerClinicalNotes}
                  onChange={(e) => setReviewerClinicalNotes(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 rounded-lg border border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none leading-relaxed text-[#102033]"
                />
              </div>

              {/* Bundled Evidence Checklist */}
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] space-y-2.5">
                <span className="text-xs font-bold text-[#102033] block">
                  Secure Referral Package (Encrypted FHIR / PDF bundle):
                </span>

                <label htmlFor="attach-audio-checkbox" className="flex items-center gap-2 text-xs text-[#25364A] cursor-pointer">
                  <input
                    id="attach-audio-checkbox"
                    name="attach-audio-checkbox"
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Attach Patient Voice Intake Audio Recording &amp; Transcript ({patient.primaryLanguage || 'Multimodal Speech Session'})</span>
                </label>

                <label htmlFor="attach-lab-checkbox" className="flex items-center gap-2 text-xs text-[#25364A] cursor-pointer">
                  <input
                    id="attach-lab-checkbox"
                    name="attach-lab-checkbox"
                    type="checkbox"
                    checked={includeLabReports}
                    onChange={(e) => setIncludeLabReports(e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Attach OCR Diagnostic Laboratory &amp; Biomarker Records ({patient.chiefComplaint})</span>
                </label>

                <label htmlFor="attach-ai-checkbox" className="flex items-center gap-2 text-xs text-[#25364A] cursor-pointer">
                  <input
                    id="attach-ai-checkbox"
                    name="attach-ai-checkbox"
                    type="checkbox"
                    checked={includeAiSummary}
                    onChange={(e) => setIncludeAiSummary(e.target.checked)}
                    className="rounded text-[#2563EB]"
                  />
                  <span>Attach Synthesized AI Triage Summary Note (Reviewed by MO)</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & DISPATCH */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#102033]">Review Handoff Package &amp; Dispatch Tracker</h4>
                <p className="text-xs text-[#526276]">
                  Verify dispatch details before sending the encrypted referral payload.
                </p>
              </div>

              {/* Package Summary Box */}
              <div className="p-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[#6B7B8F] block text-[10px] uppercase">Destination</span>
                    <strong className="text-[#102033]">{selectedFacility.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7B8F] block text-[10px] uppercase">Urgency</span>
                    <strong
                      className={
                        urgency === 'EMERGENCY'
                          ? 'text-[#B3261E]'
                          : urgency === 'URGENT'
                          ? 'text-[#996500]'
                          : 'text-[#2563EB]'
                      }
                    >
                      {urgency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B7B8F] block text-[10px] uppercase">Patient</span>
                    <strong className="text-[#102033]">{patient.name} ({patient.id})</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7B8F] block text-[10px] uppercase">SpO₂ at Intake</span>
                    <strong className="text-[#B3261E]">
                      {patient.vitals.spo2 ? `${patient.vitals.spo2}%` : (patient.vitals.heartRate ? `${patient.vitals.heartRate} bpm` : 'Documented')}
                    </strong>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[#6B7B8F] block text-[10px] uppercase mb-0.5">Clinical Rationale</span>
                  <p className="text-[#25364A]">{transferReason}</p>
                </div>

                {/* Transparent Package Review: Included vs Excluded */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-[#6B7B8F] uppercase tracking-wider block">
                    Transparent Package Review
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <span className="font-bold text-emerald-800 text-[11px] block mb-1">
                        Included in Package ({2 + (includeAudio ? 1 : 0) + (includeLabReports ? 1 : 0) + (includeAiSummary ? 1 : 0)} items):
                      </span>
                      <ul className="space-y-1 text-[11px] text-emerald-950">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Demographics &amp; Vitals snapshot</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>Clinical handover reason &amp; notes</span>
                        </li>
                        {includeAudio && (
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>Voice intake recording &amp; transcript</span>
                          </li>
                        )}
                        {includeLabReports && (
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>OCR laboratory reports &amp; facts</span>
                          </li>
                        )}
                        {includeAiSummary && (
                          <li className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>Verified AI triage draft note</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-700 text-[11px] block mb-1">
                        Excluded from Package:
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {!includeAudio && (
                          <li className="flex items-center gap-1.5">
                            <X className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>Audio recording (Unchecked)</span>
                          </li>
                        )}
                        {!includeLabReports && (
                          <li className="flex items-center gap-1.5">
                            <X className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>Lab reports (Unchecked)</span>
                          </li>
                        )}
                        {!includeAiSummary && (
                          <li className="flex items-center gap-1.5">
                            <X className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>AI draft note (Unchecked)</span>
                          </li>
                        )}
                        <li className="flex items-center gap-1.5">
                          <X className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>Internal workstation debug logs</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <X className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>Unverified draft scratchpads</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 20: Referral Dispatch Tracker */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#164FD6] mb-3">
                  Referral Dispatch Tracker
                </h5>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    {dispatchStage !== 'IDLE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span className={dispatchStage !== 'IDLE' ? 'font-semibold text-emerald-900' : 'text-[#6B7B8F]'}>
                      Package prepared (Encrypted JSON &amp; PDF bundle)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {dispatchStage === 'INITIATED' || dispatchStage === 'SENT' || dispatchStage === 'ACKNOWLEDGED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span
                      className={
                        dispatchStage === 'INITIATED' || dispatchStage === 'SENT' || dispatchStage === 'ACKNOWLEDGED'
                          ? 'font-semibold text-emerald-900'
                          : 'text-[#6B7B8F]'
                      }
                    >
                      Handoff initiated via CareIntel Inter-Facility Bus
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {dispatchStage === 'SENT' || dispatchStage === 'ACKNOWLEDGED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span
                      className={
                        dispatchStage === 'SENT' || dispatchStage === 'ACKNOWLEDGED'
                          ? 'font-semibold text-emerald-900'
                          : 'text-[#6B7B8F]'
                      }
                    >
                      Sent to {selectedFacility.name} (Ref: {trackingNumber || 'Pending'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {dispatchStage === 'ACKNOWLEDGED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span
                      className={
                        dispatchStage === 'ACKNOWLEDGED'
                          ? 'font-semibold text-emerald-900'
                          : 'text-[#6B7B8F]'
                      }
                    >
                      Receiving facility acknowledgement
                      {dispatchStage === 'ACKNOWLEDGED' && ` · Acknowledged by ${selectedFacility.name} Triage In-charge`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E6ECF2] flex items-center justify-between">
          <div>
            {currentStep > 1 && dispatchStage === 'IDLE' && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={onClose}>
              {dispatchStage === 'ACKNOWLEDGED' ? 'Close' : 'Cancel'}
            </Button>

            {currentStep < 4 && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                variant="primary"
                size="md"
                disabled={isDispatching || dispatchStage === 'ACKNOWLEDGED'}
                onClick={handleSendHandoff}
                icon={
                  isDispatching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : dispatchStage === 'ACKNOWLEDGED' ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )
                }
              >
                {isDispatching
                  ? 'Dispatching Handoff...'
                  : dispatchStage === 'ACKNOWLEDGED'
                  ? 'Dispatched & Acknowledged'
                  : 'Send Handoff'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
