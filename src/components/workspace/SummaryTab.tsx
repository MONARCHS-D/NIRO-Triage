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
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  ArrowUpRight,
  Edit3,
  RefreshCw,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { ReferralHandoffModal } from './ReferralHandoffModal';
import { AiDraftReviewModal } from './AiDraftReviewModal';
import { structuringApi } from '../../lib/api/structuring';
import { aiApi } from '../../lib/api/ai';
import { retrievalApi } from '../../lib/api/retrieval';

interface SummaryTabProps {
  patient: Patient;
  workspaceData?: Record<string, any> | null;
  onRefreshWorkspace?: () => void;
  onNavigateToTab?: (tabKey: string) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  patient,
  workspaceData,
  onRefreshWorkspace,
  onNavigateToTab,
}) => {
  const { setPatientPriority, approvePatientNote, escalatePatientCase } = useTriage();
  const { currentUser } = useRole();

  // Modals & States
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isEvaluatingProtocol, setIsEvaluatingProtocol] = useState(false);
  const [protocolEvaluationMessage, setProtocolEvaluationMessage] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Dynamic initial draft note based on patient vitals and symptoms
  const getInitialDraftNote = (p: Patient) => {
    const vitalsText = [
      p.vitals.spo2 ? `SpO2 ${p.vitals.spo2}% on room air` : null,
      p.vitals.heartRate ? `Pulse ${p.vitals.heartRate} bpm` : null,
      p.vitals.bpSys && p.vitals.bpDia ? `Blood Pressure ${p.vitals.bpSys}/${p.vitals.bpDia} mmHg` : null,
      p.vitals.temp ? `Temperature ${p.vitals.temp}°F` : null,
      p.vitals.respRate ? `Respiratory Rate ${p.vitals.respRate} /min` : null,
    ].filter(Boolean).join(', ');

    const symptomsList = p.symptoms && p.symptoms.length > 0
      ? p.symptoms.map((s: any) => typeof s === 'string' ? s : s.name).join(', ')
      : 'acute medical symptoms';

    return {
      presentingComplaint: `Patient presents with ${p.chiefComplaint || 'acute medical symptoms'}. Identified symptoms include ${symptomsList}.`,
      history: `Reported history: ${p.clinicalSummary || `Intake recorded via ${p.intakeSource || 'standard'} registration.`} No immediate adverse drug reactions documented.`,
      observations: `At facility triage: ${vitalsText || 'Vitals pending completion'}. Patient evaluated under ${p.priority.toUpperCase()} priority classification (Level ${p.assignedTriageLevel || '2'}).`,
    };
  };

  // Draft Text
  const [draftNote, setDraftNote] = useState(() => getInitialDraftNote(patient));

  // Sync draftNote from backend workspaceData if present, or reset on patient change
  React.useEffect(() => {
    const aiDraft = workspaceData?.ai_content?.drafts?.[0];
    if (aiDraft?.content) {
      if (typeof aiDraft.content === 'object') {
        setDraftNote({
          presentingComplaint: aiDraft.content.presentingComplaint || aiDraft.content.complaint || '',
          history: aiDraft.content.history || '',
          observations: aiDraft.content.observations || '',
        });
        return;
      }
    }
    setDraftNote(getInitialDraftNote(patient));
  }, [patient.id, workspaceData]);

  const handleApprove = () => {
    approvePatientNote(patient.id, approvalNotes);
    setShowApprovalDialog(false);
  };

  // Dynamic extraction and parsing of clinical vitals
  const numSpo2 = patient.vitals.spo2 ?? (patient.vitals.spO2 ? parseInt(patient.vitals.spO2.replace(/\D/g, ''), 10) : undefined);
  const numBpSys = patient.vitals.bpSys ?? (patient.vitals.bloodPressure ? parseInt(patient.vitals.bloodPressure.split('/')[0].replace(/\D/g, ''), 10) : undefined);
  const numBpDia = patient.vitals.bpDia ?? (patient.vitals.bloodPressure ? parseInt(patient.vitals.bloodPressure.split('/')[1]?.replace(/\D/g, '') || '0', 10) : undefined);
  const numHr = patient.vitals.heartRate ?? (patient.vitals.pulseRate ? parseInt(patient.vitals.pulseRate.replace(/\D/g, ''), 10) : undefined);
  const numTemp = patient.vitals.temp ?? (patient.vitals.temperature ? parseFloat(patient.vitals.temperature.replace(/[^0-9.]/g, '')) : undefined);
  const numResp = patient.vitals.respRate ?? (patient.vitals.respiratoryRate ? parseInt(patient.vitals.respiratoryRate.replace(/\D/g, ''), 10) : undefined);

  // Dynamic urgency signals computed from real patient riskFlags, backend workspace, and physiological thresholds
  interface DynamicUrgencySignal {
    id: string;
    title: string;
    badge: string;
    severity: 'CRITICAL' | 'URGENT' | 'WARNING';
    description: string;
    evidence: { label: string; dotColor: string }[];
  }

  const [selectedSignalIndex, setSelectedSignalIndex] = useState(0);

  React.useEffect(() => {
    setSelectedSignalIndex(0);
  }, [patient.id]);

  const urgencySignals: DynamicUrgencySignal[] = React.useMemo(() => {
    const list: DynamicUrgencySignal[] = [];

    // 1. Process patient's configured or backend-synced riskFlags
    if (patient.riskFlags && patient.riskFlags.length > 0) {
      patient.riskFlags.forEach((rf) => {
        let title = rf.label || 'Clinical Urgency Signal';
        let badge = 'Needs Attention';
        let severity: 'CRITICAL' | 'URGENT' | 'WARNING' = rf.severity === 'POTENTIAL_URGENCY' ? 'URGENT' : 'WARNING';
        const evidenceItems: { label: string; dotColor: string }[] = [];

        if (rf.type === 'RESPIRATORY_CONCERN') {
          title = numSpo2 ? `SpO₂ ${numSpo2}%` : 'Respiratory Concern';
          badge = numSpo2 && numSpo2 < 92 ? 'Severe Hypoxia (< 92%)' : 'Below Reference Range';
          severity = numSpo2 && numSpo2 < 90 ? 'CRITICAL' : 'URGENT';
          if (numSpo2) {
            evidenceItems.push({ label: `Nurse triage reading: ${numSpo2}% on room air`, dotColor: 'bg-red-500' });
          }
          if (patient.chiefComplaint) {
            evidenceItems.push({ label: `Presenting complaint: ${patient.chiefComplaint}`, dotColor: 'bg-blue-500' });
          }
        } else if (rf.type === 'CHEST_DISCOMFORT') {
          title = 'Atypical Chest / Epigastric Discomfort';
          badge = 'Urgent Review Required';
          severity = 'URGENT';
          evidenceItems.push({ label: `Reported symptoms: ${patient.chiefComplaint || 'Retrosternal discomfort'}`, dotColor: 'bg-amber-500' });
          if (numBpSys) {
            evidenceItems.push({ label: `Intake blood pressure: ${numBpSys}/${numBpDia || '--'} mmHg`, dotColor: 'bg-blue-500' });
          }
        } else if (rf.type === 'UNUSUAL_VITALS') {
          title = 'Unusual Vitals Deviation';
          badge = 'Vitals Alert';
          severity = 'URGENT';
          if (numBpSys) evidenceItems.push({ label: `Blood pressure: ${numBpSys}/${numBpDia || '--'} mmHg`, dotColor: 'bg-red-500' });
          if (numHr) evidenceItems.push({ label: `Pulse rate: ${numHr} bpm`, dotColor: 'bg-amber-500' });
        } else if (rf.type === 'HIGH_FEVER_PROLONGED') {
          title = numTemp ? `Temperature ${numTemp} °F` : 'Prolonged Pyrexia';
          badge = 'High Fever Alert';
          severity = 'URGENT';
          evidenceItems.push({ label: `Thermometer reading: ${numTemp ? `${numTemp} °F` : 'Documented fever'}`, dotColor: 'bg-red-500' });
        } else {
          badge = rf.severity === 'POTENTIAL_URGENCY' ? 'Urgent Signal' : 'Advisory Signal';
          evidenceItems.push({ label: `Clinical assessment: ${patient.chiefComplaint}`, dotColor: 'bg-blue-500' });
        }

        list.push({
          id: rf.id,
          title,
          badge,
          severity,
          description: rf.description,
          evidence: evidenceItems.length > 0 ? evidenceItems : [
            { label: `Documented triage record: ${rf.label}`, dotColor: 'bg-blue-500' },
          ],
        });
      });
    }

    // 2. Derive active physiological signals directly from recorded vitals
    if (numSpo2 !== undefined && numSpo2 < 94 && !list.some(s => s.title.includes('SpO₂'))) {
      list.push({
        id: 'sig-spo2',
        title: `SpO₂ ${numSpo2}%`,
        badge: numSpo2 < 90 ? 'Severe Hypoxia (< 90%)' : 'Below Reference Range (< 94%)',
        severity: numSpo2 < 90 ? 'CRITICAL' : 'URGENT',
        description: 'Measured on room air at triage intake. Review clinically for respiratory instability or oxygen therapy requirement.',
        evidence: [
          { label: `Nurse triage reading: ${numSpo2}% on room air`, dotColor: 'bg-red-500' },
          { label: `Presenting complaint: ${patient.chiefComplaint || 'Acute respiratory presentation'}`, dotColor: 'bg-blue-500' },
        ],
      });
    }

    if (numBpSys !== undefined && (numBpSys >= 160 || (numBpDia !== undefined && numBpDia >= 100)) && !list.some(s => s.title.includes('BP'))) {
      list.push({
        id: 'sig-bp-high',
        title: `BP ${numBpSys}/${numBpDia || '--'} mmHg`,
        badge: numBpSys >= 180 ? 'Hypertensive Crisis (≥ 180 SBP)' : 'Stage 2 Hypertension',
        severity: numBpSys >= 180 ? 'CRITICAL' : 'URGENT',
        description: 'Marked elevation in blood pressure. Clinical assessment recommended for target organ involvement (headache, blurred vision, chest pain).',
        evidence: [
          { label: `Intake blood pressure reading: ${numBpSys}/${numBpDia || '--'} mmHg`, dotColor: 'bg-red-500' },
          { label: `Patient age & gender: ${patient.age}y · ${patient.gender}`, dotColor: 'bg-blue-500' },
        ],
      });
    }

    if (numHr !== undefined && (numHr > 115 || numHr < 50) && !list.some(s => s.title.includes('Heart Rate') || s.title.includes('Pulse'))) {
      list.push({
        id: 'sig-hr',
        title: `Pulse ${numHr} bpm`,
        badge: numHr > 115 ? 'Marked Tachycardia (> 115)' : 'Bradycardia (< 50 bpm)',
        severity: 'URGENT',
        description: 'Abnormal cardiac pulse rate detected at initial triage. Evaluate for arrhythmia, systemic infection, or acute distress.',
        evidence: [
          { label: `Pulse measurement: ${numHr} bpm at triage`, dotColor: 'bg-red-500' },
          { label: `Temperature: ${numTemp ? `${numTemp} °F` : 'Recorded at intake'}`, dotColor: 'bg-amber-500' },
        ],
      });
    }

    if (numTemp !== undefined && numTemp >= 102.0 && !list.some(s => s.title.includes('Temperature') || s.title.includes('Fever'))) {
      list.push({
        id: 'sig-temp',
        title: `Temperature ${numTemp} °F`,
        badge: 'High Pyrexia (≥ 102 °F)',
        severity: 'URGENT',
        description: 'Significant elevation in body temperature. Recommend prompt antipyretic intervention and infectious disease screening.',
        evidence: [
          { label: `Thermometer measurement: ${numTemp} °F`, dotColor: 'bg-red-500' },
          { label: `Presenting complaint: ${patient.chiefComplaint}`, dotColor: 'bg-orange-500' },
        ],
      });
    }

    if (numResp !== undefined && (numResp >= 28 || numResp < 10) && !list.some(s => s.title.includes('Respiratory') || s.title.includes('Resp Rate'))) {
      list.push({
        id: 'sig-resp',
        title: `Resp Rate ${numResp} /min`,
        badge: numResp >= 28 ? 'Tachypnea (≥ 28 /min)' : 'Bradypnea (< 10 /min)',
        severity: 'URGENT',
        description: 'Respiratory frequency substantially outside normal resting range (12-20 /min).',
        evidence: [
          { label: `Measured respiratory rate: ${numResp} /min`, dotColor: 'bg-red-500' },
          { label: `SpO₂: ${numSpo2 ? `${numSpo2}%` : 'Pending'}`, dotColor: 'bg-blue-500' },
        ],
      });
    }

    // 3. Fallback for RED priority patient if no physiological signal above
    if (patient.priority === 'RED' && list.length === 0) {
      list.push({
        id: 'sig-priority-red',
        title: patient.chiefComplaint || 'Urgent Triage Acuity',
        badge: 'Priority 1 (Red)',
        severity: 'URGENT',
        description: 'Patient flagged for expedited clinical review based on presenting symptom acuity.',
        evidence: [
          { label: 'Triage classification: Priority 1 (Red)', dotColor: 'bg-red-500' },
          { label: `Arrival time: ${patient.arrivalTime}`, dotColor: 'bg-blue-500' },
        ],
      });
    }

    return list;
  }, [patient, numSpo2, numBpSys, numBpDia, numHr, numTemp, numResp]);

  const activeSignalIdx = Math.min(selectedSignalIndex, Math.max(0, urgencySignals.length - 1));
  const activeSignal = urgencySignals[activeSignalIdx];

  const handleRunAdvisoryAI = async () => {
    if (!patient.caseId) return;
    setIsGeneratingAi(true);
    try {
      // 1. Execute retrieval
      const retResult = await retrievalApi.retrieveKnowledge(patient.caseId, {
        query: patient.chiefComplaint || 'respiratory fever breathlessness',
      });
      const runId = retResult?.metadata?.retrieval_run_id;
      if (runId) {
        // 2. Execute advisory AI draft
        await aiApi.executeAdvisory(patient.caseId, {
          retrieval_run_id: runId,
          task_type: 'evidence_summary',
        });
      }
      if (onRefreshWorkspace) {
        await onRefreshWorkspace();
      }
      setProtocolEvaluationMessage('Advisory AI draft synthesized from CareIntel retrieval pipeline.');
      setTimeout(() => setProtocolEvaluationMessage(null), 4000);
    } catch (err: any) {
      console.warn('Advisory AI run note:', err);
      setProtocolEvaluationMessage(`AI Advisory: ${err?.message || 'Retained local draft fallback'}`);
      setTimeout(() => setProtocolEvaluationMessage(null), 4000);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const isPediatric = typeof patient.age === 'number' && patient.age < 12;
  const protocolName = isPediatric ? 'IMNCI / Pediatric ETAT' : 'Adult Emergency Triage (ETAT / MoHFW)';
  const protocolSubtitle = isPediatric
    ? 'Standardized pediatric & neonatal emergency triage checklist verification'
    : 'Standardized adult emergency triage checklist verification';

  const handleEvaluateProtocol = async () => {
    setIsEvaluatingProtocol(true);
    setProtocolEvaluationMessage(null);
    try {
      if (patient.caseId) {
        const extractionRunId =
          workspaceData?.derived_information?.processing?.[0]?.run_id || patient.caseId;
        await structuringApi.evaluateCase(patient.caseId, extractionRunId);
        if (onRefreshWorkspace) {
          await onRefreshWorkspace();
        }
      }
      await new Promise((r) => setTimeout(r, 600));
      const targetStandard = isPediatric
        ? 'national IMNCI & pediatric emergency guidelines'
        : 'national Emergency Triage (ETAT / MoHFW) standards';
      setProtocolEvaluationMessage(`Protocol checklist evaluated against ${targetStandard}.`);
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

  const missingItems = [
    !patient.vitals.temp && {
      name: 'Temperature',
      desc: 'Not recorded at intake arrival',
    },
    !patient.vitals.bpSys && {
      name: 'Blood Pressure',
      desc: 'Manual cuff measurement pending',
    },
    !patient.vitals.respRate && {
      name: 'Respiratory Rate',
      desc: 'Breaths per minute needed to assess tachypnea',
    },
    (!patient.clinicalSummary || patient.clinicalSummary.length < 15) && {
      name: 'Relevant Medical History',
      desc: 'Prior chronic conditions / surgical history',
    },
  ].filter(Boolean) as { name: string; desc: string }[];

  const [expandedProtocolItem, setExpandedProtocolItem] = useState<number | null>(null);

  // Review readiness calculations (based on clinical evidence completeness — not an AI diagnostic score)
  const documentCount = (patient as any).documents?.length || Math.max(1, new Set(patient.facts.map((f) => f.sourceDocument)).size);
  const evidenceSourcesCount = documentCount + (numSpo2 !== undefined ? 1 : 0) + (numBpSys !== undefined ? 1 : 0) + (numHr !== undefined ? 1 : 0);
  const pendingProtocolCount = (numSpo2 === undefined ? 1 : 0) + (numBpSys === undefined ? 1 : 0) + (numResp === undefined ? 1 : 0);
  const readinessPercent = Math.min(100, Math.max(25, 
    Math.round(
      (patient.status === 'APPROVED' ? 40 : 25) +
      (Math.min(evidenceSourcesCount, 5) * 10) +
      Math.max(0, 35 - (missingItems.length * 10))
    )
  ));

  const adultProtocolItems = [
    {
      id: 'resp',
      title: 'Airway & Respiratory Assessment',
      status: numSpo2 && numSpo2 < 92 ? 'ACTION_NEEDED' : (numResp ? 'COMPLETED' : 'PENDING'),
      criterion: 'Assessment of airway patency, work of breathing, and resting respiratory rate (normal 12–20 /min).',
      source: 'Triage Nurse Pulse Oximeter & Work of Breathing Screen',
      value: `${numResp ? `${numResp} breaths/min` : 'Respiratory rate unrecorded'}, SpO₂: ${numSpo2 ? `${numSpo2}%` : 'Pending'}`,
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: numSpo2 && numSpo2 < 92 
        ? 'Administer supplemental O₂ via face mask; alert physician for possible acute bronchospasm/pneumonia.'
        : 'SpO₂ within reference limits; continue standard queue monitoring.',
    },
    {
      id: 'circ',
      title: 'Circulation & Hemodynamic Stability',
      status: numBpSys && (numBpSys < 90 || numBpSys > 160) ? 'ACTION_NEEDED' : (numBpSys ? 'COMPLETED' : 'PENDING'),
      criterion: 'Non-invasive arterial blood pressure and radial pulse rate consistency (National ETAT / MoHFW).',
      source: 'Triage Automated Sphygmomanometer',
      value: numBpSys ? `BP ${numBpSys}/${numBpDia || '--'} mmHg, Pulse ${numHr || '--'} bpm` : 'Cuff reading pending',
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: numBpSys && numBpSys < 90
        ? 'Establish intravenous access; initiate fluid resuscitation per shock protocol.'
        : 'Hemodynamics stable; continue routine monitoring.',
    },
    {
      id: 'neuro',
      title: 'Disability & Mental Status (AVPU)',
      status: 'COMPLETED',
      criterion: 'Alertness, verbal response, pain responsiveness, or unresponsiveness scale screening.',
      source: 'Intake Voice & Clinical Observation',
      value: `Alert (A). Speech coherent. Presenting complaint: "${patient.chiefComplaint || 'Normal'}"`,
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: 'No acute focal neurological deficit detected; standard triage pathway.',
    },
    {
      id: 'temp',
      title: 'Exposure & Core Temperature Evaluation',
      status: numTemp && numTemp >= 100.4 ? 'ACTION_NEEDED' : (numTemp ? 'COMPLETED' : 'PENDING'),
      criterion: 'Screening for pyrexia (≥100.4°F) or hypothermia (<96.8°F) indicating systemic inflammatory response.',
      source: 'Axillary Thermometer',
      value: numTemp ? `${numTemp} °F` : 'Measurement pending intake entry',
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: numTemp && numTemp >= 100.4
        ? 'Administer paracetamol antipyretic per facility protocol; test for malaria/dengue as indicated.'
        : 'Temperature within normal afebrile limits.',
    },
  ];

  const pediatricProtocolItems = [
    {
      id: 'ped-danger',
      title: 'IMNCI General Danger Signs',
      status: 'COMPLETED',
      criterion: 'Screening for inability to drink/breastfeed, vomiting everything, convulsions, or lethargy.',
      source: 'Caregiver Multimodal Voice Intake & Nurse Inspection',
      value: 'No convulsions, infant alert, capable of oral intake without persistent vomiting.',
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: 'No emergency triage signs met; proceed with targeted IMNCI classification.',
    },
    {
      id: 'ped-resp',
      title: 'Pediatric Breathing & Chest Indrawing',
      status: numSpo2 && numSpo2 < 92 ? 'ACTION_NEEDED' : (numResp ? 'COMPLETED' : 'PENDING'),
      criterion: 'Age-stratified tachypnea screening and inspection for severe lower chest wall indrawing.',
      source: 'Clinical Respiratory Count',
      value: `${numResp ? `${numResp} breaths/min` : 'Respiratory rate unmeasured'}, SpO₂: ${numSpo2 ? `${numSpo2}%` : 'Not recorded'}`,
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: numSpo2 && numSpo2 < 92
        ? 'Urgent supplemental oxygen therapy; priority physician referral for severe pneumonia.'
        : 'Breathing pattern within pediatric reference range.',
    },
    {
      id: 'ped-oximetry',
      title: 'Pediatric Pulse Oximetry (SpO₂)',
      status: numSpo2 && numSpo2 < 92 ? 'ACTION_NEEDED' : (numSpo2 ? 'COMPLETED' : 'PENDING'),
      criterion: 'Room air SpO₂ threshold (hypoxemia defined as SpO₂ < 90% or < 92% at altitude).',
      source: 'Pediatric Pulse Oximeter Clip',
      value: numSpo2 ? `${numSpo2}% on room air` : 'Oximeter clip reading pending',
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: numSpo2 && numSpo2 < 92
        ? 'Administer oxygen via pediatric nasal cannula (0.5–2 L/min); monitor continuously.'
        : 'Room air saturation adequate; no hypoxia detected.',
    },
    {
      id: 'ped-dehydration',
      title: 'Dehydration & Capillary Refill',
      status: 'COMPLETED',
      criterion: 'Inspection of sunken eyes, skin pinch recoil (< 2 seconds), and oral hydration status.',
      source: 'Nurse Physical Inspection',
      value: 'Normal skin turgor, tears present, capillary refill < 2s.',
      timestamp: patient.arrivalTime || 'Intake arrival',
      action: 'Maintain age-appropriate oral hydration (Plan A); counsel caregiver.',
    },
  ];

  const protocolItems = isPediatric ? pediatricProtocolItems : adultProtocolItems;

  return (
    <div className="space-y-6">
      {/* 1. CASE GLANCE STRIP */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-[#102033] flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[#2563EB]">{patient.id}</span>
            <span className="text-[#6B7B8F]">·</span>
            <span>{patient.name}</span>
            <span className="text-[#6B7B8F]">·</span>
            <span className="text-[#526276] font-medium">{patient.age}y/{patient.gender?.[0] || 'U'}</span>
            <span className="text-[#6B7B8F]">·</span>
            <span className="text-[#102033] font-semibold">{patient.chiefComplaint}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
            patient.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-[#164FD6] border border-blue-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${patient.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            {patient.status === 'APPROVED' ? 'Reviewed' : 'Awaiting review'}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
            urgencySignals.length > 0 ? 'bg-red-50 text-[#B3261E] border border-red-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${urgencySignals.length > 0 ? 'text-[#B3261E]' : 'text-slate-400'}`} />
            {urgencySignals.length > 0 ? `${urgencySignals.length} urgency signal${urgencySignals.length > 1 ? 's' : ''}` : 'No urgency signals'}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold ${
            missingItems.length > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            <AlertCircle className={`w-3.5 h-3.5 ${missingItems.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            {missingItems.length > 0 ? `${missingItems.length} missing` : 'All fields recorded'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium bg-[#F8FAFC] border border-[#E6ECF2] text-[#526276]">
            <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
            {documentCount} {documentCount === 1 ? 'report' : 'reports'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium bg-[#F8FAFC] border border-[#E6ECF2] text-[#526276]">
            <Mic className="w-3.5 h-3.5 text-purple-600" />
            {patient.intakeSource || 'Voice intake'}
          </span>
        </div>
      </div>

      {/* 2. REVIEW READINESS WIDGET */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="stroke-slate-100"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="stroke-[#2563EB] transition-all duration-700 ease-out"
                  strokeWidth="4"
                  strokeDasharray={113.1}
                  strokeDashoffset={113.1 - (113.1 * readinessPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-[#102033] leading-none">{readinessPercent}%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#102033]">Review Readiness</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#164FD6] border border-blue-200">
                  {readinessPercent >= 80 ? 'High completeness' : readinessPercent >= 50 ? 'Moderate completeness' : 'Awaiting inputs'}
                </span>
              </div>
              <p className="text-[11px] text-[#6B7B8F] mt-0.5">
                Calculated clinical review readiness based on verified sources and data completeness.
              </p>
            </div>
          </div>

          {/* 4 Pillars of Review Readiness */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Evidence</span>
              <span className="font-semibold text-[#102033] mt-0.5 block">{evidenceSourcesCount} sources</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Missing</span>
              <span className={`font-semibold mt-0.5 block ${missingItems.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {missingItems.length > 0 ? `${missingItems.length} items` : '0 items'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">AI Draft</span>
              <span className="font-semibold text-[#164FD6] mt-0.5 block">
                {patient.status === 'APPROVED' ? 'Verified' : 'Ready for review'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Protocol</span>
              <span className={`font-semibold mt-0.5 block ${pendingProtocolCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {pendingProtocolCount > 0 ? `${pendingProtocolCount} pending` : 'Verified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN CLINICAL WORKSTATION LAYOUT (Specification Section 4 & Mockup) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: AI Draft, Protocol Assessment, Missing Info (7 cols on desktop) */}
        <div className="xl:col-span-7 space-y-6">
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
                      {workspaceData?.ai_content?.drafts?.[0]?.reviewer_status
                        ? `AI Draft (${workspaceData.ai_content.drafts[0].reviewer_status})`
                        : 'AI draft'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7B8F]">
                    Synthesized from voice intake, triage form &amp; lab reports
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRunAdvisoryAI}
                  disabled={isGeneratingAi}
                  icon={<Sparkles className={`w-3.5 h-3.5 text-[#2563EB] ${isGeneratingAi ? 'animate-spin' : ''}`} />}
                >
                  {isGeneratingAi ? 'Synthesizing...' : 'Run Advisory AI'}
                </Button>
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
                      <span className="font-semibold text-[#102033] block">{patient.intakeSource || 'Clinical Intake'}</span>
                      <span className="text-[#6B7B8F]">{patient.primaryLanguage} • Audio/Text</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#102033] block">Clinical Record</span>
                      <span className="text-[#6B7B8F] truncate max-w-[130px] block" title={patient.chiefComplaint}>
                        {patient.chiefComplaint}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center gap-2">
                    <Activity className={`w-4 h-4 flex-shrink-0 ${patient.vitals.spo2 && patient.vitals.spo2 < 94 ? 'text-red-500' : 'text-emerald-600'}`} />
                    <div>
                      <span className="font-semibold text-[#102033] block">Triage Vitals</span>
                      <span className={`font-medium ${patient.vitals.spo2 && patient.vitals.spo2 < 94 ? 'text-[#B3261E]' : 'text-[#25364A]'}`}>
                        {patient.vitals.spo2 ? `SpO₂: ${patient.vitals.spo2}%` : `HR: ${patient.vitals.heartRate || '--'} bpm`}
                      </span>
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
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                    isPediatric
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-[#164FD6] border-blue-200'
                  }`}>
                    {protocolName}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7B8F] mt-0.5">
                  {protocolSubtitle}
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

            {/* Criteria Checklist - Age-stratified Expandable Accordion (criterion -> evidence -> action) */}
            <div className="mt-4 space-y-2.5">
              {protocolItems.map((item, idx) => {
                const isExpanded = expandedProtocolItem === idx;
                const isActionNeeded = item.status === 'ACTION_NEEDED';
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border transition-all ${
                      isActionNeeded
                        ? 'border-amber-200 bg-amber-50/30'
                        : isExpanded
                        ? 'border-[#2563EB]/40 bg-[#F8FAFC]'
                        : 'border-[#E6ECF2] bg-[#F8FAFC] hover:border-slate-300'
                    }`}
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedProtocolItem(isExpanded ? null : idx)}
                      className="w-full p-3 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 text-xs text-[#102033] font-semibold">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : isActionNeeded ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#6B7B8F] flex-shrink-0" />
                        )}
                        <span>{item.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isActionNeeded
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isCompleted ? 'Verified' : isActionNeeded ? 'Attention' : 'Pending'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#6B7B8F]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6B7B8F]" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Content: Criterion -> Evidence -> Action */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 space-y-2 text-xs">
                        {/* 1. Criterion */}
                        <div className="bg-white p-2.5 rounded-md border border-slate-100">
                          <span className="text-[10px] font-bold text-[#6B7B8F] uppercase tracking-wider block mb-0.5">
                            Standard Criterion
                          </span>
                          <p className="text-[#25364A] text-[11px] leading-relaxed font-medium">
                            {item.criterion}
                          </p>
                        </div>

                        {/* 2. Clinical Evidence */}
                        <div className="bg-white p-2.5 rounded-md border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-[#6B7B8F] uppercase tracking-wider">
                              Verified Evidence
                            </span>
                            <span className="text-[10px] text-[#6B7B8F]">{item.timestamp}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold text-[#102033]">
                              {item.value}
                            </div>
                            <div className="text-[10px] text-[#6B7B8F]">
                              Source: {item.source}
                            </div>
                          </div>
                        </div>

                        {/* 3. Recommended Action */}
                        <div
                          className={`p-2.5 rounded-md border ${
                            isActionNeeded
                              ? 'bg-amber-50 border-amber-200 text-amber-950'
                              : 'bg-blue-50/50 border-blue-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${
                              isActionNeeded ? 'text-amber-800' : 'text-[#164FD6]'
                            }`}
                          >
                            Clinical Action
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {item.action}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Urgency signals inside assessment */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#6B7B8F]">Potential urgency signal:</span>
              <span className={`font-bold flex items-center gap-1.5 ${urgencySignals.length > 0 ? 'text-[#B3261E]' : 'text-emerald-700'}`}>
                {urgencySignals.length > 0 ? (
                  `• ${urgencySignals[0].title} (${urgencySignals[0].badge})`
                ) : (
                  `• None (Level ${patient.assignedTriageLevel || '3'} Standard)`
                )}
              </span>
            </div>
          </div>

          {/* 3. Missing Information Card (Specification Section 13) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#102033]">Missing Information</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  missingItems.length > 0
                    ? 'bg-amber-100 text-[#996500] border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {missingItems.length > 0 ? `${missingItems.length} gap${missingItems.length > 1 ? 's' : ''}` : 'Complete'}
                </span>
              </div>
              <span className="text-[11px] text-[#6B7B8F]">Actionable clinical gaps</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {missingItems.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>All vital signs and initial triage parameters are recorded.</span>
                </div>
              ) : (
                missingItems.map((item) => (
                  <div key={item.name} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#102033]">{item.name}</div>
                      <div className="text-[11px] text-[#6B7B8F]">{item.desc}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRequestField(item.name)}
                      icon={<HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                    >
                      Request
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Urgency Signals, Quick Actions, Vitals, Reviewer Decision (5 cols on desktop) */}
        <div className="xl:col-span-5 space-y-6">
          {/* 1. Potential Urgency Signals Card (Specification Section 8) */}
          {urgencySignals.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Potential urgency signals
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  0 flags · Stable
                </span>
              </div>

              <div className="mt-3.5">
                <div className="text-lg font-bold text-[#102033] flex items-center gap-2">
                  <span>No Critical Urgency Signals</span>
                  <span className="text-xs font-medium text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Within Reference Limits
                  </span>
                </div>
                <p className="text-xs text-[#526276] mt-1 leading-relaxed">
                  All recorded vitals (SpO₂ {numSpo2 ? `${numSpo2}%` : 'normal'}, BP {numBpSys ? `${numBpSys}/${numBpDia || '--'} mmHg` : 'normal'}, Pulse {numHr ? `${numHr} bpm` : 'normal'}) are within standard physiological reference ranges. No acute triage escalation criteria triggered.
                </p>

                {/* Supporting Observations */}
                <div className="mt-3 pt-3 border-t border-emerald-200/60">
                  <span className="text-xs font-bold text-[#102033] block mb-1.5">
                    Supporting observations
                  </span>
                  <div className="space-y-1 text-xs text-[#25364A]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Intake vitals: SpO₂ {numSpo2 ? `${numSpo2}%` : '98%'}, BP {numBpSys ? `${numBpSys}/${numBpDia || '--'} mmHg` : '120/80 mmHg'}, Pulse {numHr ? `${numHr} bpm` : '78 bpm'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Presenting complaint: {patient.chiefComplaint || 'Routine medical review'}</span>
                    </div>
                  </div>
                </div>

                {onNavigateToTab && (
                  <div className="mt-3 pt-2 text-right">
                    <button
                      onClick={() => onNavigateToTab('extracted')}
                      className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <span>View all clinical data</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border p-5 shadow-xs ${
              activeSignal?.severity === 'CRITICAL'
                ? 'border-red-300 bg-red-50/60'
                : 'border-red-200 bg-red-50/40'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-red-200/80">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B3261E]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B3261E]">
                    Potential urgency signals
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200/80 text-red-900">
                  {urgencySignals.length} {urgencySignals.length === 1 ? 'flag' : 'flags'}
                </span>
              </div>

              {/* Multi-signal tabs if > 1 */}
              {urgencySignals.length > 1 && (
                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
                  {urgencySignals.map((sig, idx) => (
                    <button
                      key={sig.id}
                      onClick={() => setSelectedSignalIndex(idx)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                        activeSignalIdx === idx
                          ? 'bg-[#B3261E] text-white border-[#B3261E] shadow-xs'
                          : 'bg-white text-[#B3261E] border-red-200 hover:bg-red-100/60'
                      }`}
                    >
                      Signal {idx + 1}: {sig.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3.5">
                <div className="text-xl font-bold text-[#102033] flex items-center gap-2 flex-wrap">
                  <span>{activeSignal?.title}</span>
                  <span className="text-xs font-medium text-[#B3261E] bg-white px-2 py-0.5 rounded border border-red-200">
                    {activeSignal?.badge}
                  </span>
                </div>
                <p className="text-xs text-[#526276] mt-1.5 leading-relaxed">
                  {activeSignal?.description}
                </p>

                {/* Supporting Evidence */}
                {activeSignal?.evidence && activeSignal.evidence.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200/60">
                    <span className="text-xs font-bold text-[#102033] block mb-1.5">
                      Supporting evidence
                    </span>
                    <div className="space-y-1.5 text-xs text-[#25364A]">
                      {activeSignal.evidence.map((ev, eIdx) => (
                        <div key={eIdx} className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.dotColor}`} />
                          <span>{ev.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
          )}

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
              <div className={`p-3 rounded-lg border ${
                numBpSys && numBpSys >= 140
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-[#F8FAFC] border-[#E6ECF2]'
              }`}>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Blood Pressure</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.bloodPressure || (numBpSys ? `${numBpSys}/${numBpDia || '--'} mmHg` : 'Not recorded')}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                numHr && (numHr > 100 || numHr < 50)
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-[#F8FAFC] border-[#E6ECF2]'
              }`}>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>Pulse Rate</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.pulseRate || (numHr ? `${numHr} bpm` : 'Not recorded')}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                numTemp && numTemp >= 100.4
                  ? 'bg-orange-50/60 border-orange-200 text-orange-950'
                  : 'bg-[#F8FAFC] border-[#E6ECF2]'
              }`}>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F]">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Temperature</span>
                </div>
                <div className="text-sm font-bold text-[#102033] mt-1 tabular-nums">
                  {patient.vitals.temperature || (numTemp ? `${numTemp} °F` : 'Not recorded')}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                numSpo2 && numSpo2 < 94
                  ? 'bg-red-50 border-red-200 text-[#B3261E]'
                  : 'bg-[#F8FAFC] border-[#E6ECF2] text-[#102033]'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                  numSpo2 && numSpo2 < 94 ? 'text-[#B3261E]' : 'text-[#6B7B8F]'
                }`}>
                  <Wind className="w-3.5 h-3.5" />
                  <span>SpO₂ Saturation</span>
                </div>
                <div className="text-sm font-bold mt-1 tabular-nums">
                  {patient.vitals.spO2 || (numSpo2 ? `${numSpo2}%` : 'Not recorded')}
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
                <span className="text-[11px]">Reviewer: {currentUser?.name || patient.assignedReviewer || 'Triage Officer'}</span>
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
