'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../common/Button';
import { VoiceIntakeStudio } from '../intake/VoiceIntakeStudio';
import { ReportExtractStudio } from '../intake/ReportExtractStudio';
import { ConsentModal } from '../common/ConsentModal';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { useNotifications } from '../../context/NotificationContext';
import { Patient, Symptom, ExtractedFact } from '../../types/triage';
import {
  Mic,
  Keyboard,
  Upload,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  ShieldCheck,
  FileCheck,
  Loader2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { consentApi } from '../../lib/api/consent';
import { caseApi } from '../../lib/api/cases';
import { evidenceApi } from '../../lib/api/evidence';
import { processingApi } from '../../lib/api/processing';
import { structuringApi } from '../../lib/api/structuring';
import { reviewApi } from '../../lib/api/review';

interface NewIntakeViewProps {
  onIntakeCompleted: (patientId: string) => void;
  onCancel: () => void;
}

export const NewIntakeView: React.FC<NewIntakeViewProps> = ({
  onIntakeCompleted,
  onCancel,
}) => {
  const { addPatient, addOutboxItem } = useTriage();
  const { currentFacility, isOffline, capabilities, currentUser } = useRole();
  const { notifyArrival } = useNotifications();

  // Stepper: 1 Patient Info -> 2 Input Details -> 3 Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedChannel, setSelectedChannel] = useState<'VOICE' | 'TYPE' | 'REPORT' | 'PHOTO'>('VOICE');

  // Step 1 State: Patient Info (Default empty for clean intake session)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('Odia (ଓଡ଼ିଆ)');
  const [contact, setContact] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Step 2 State: Multimodal Input
  const [typedComplaint, setTypedComplaint] = useState('');
  const [capturedVoiceData, setCapturedVoiceData] = useState<{
    language: string;
    transcript: string;
    translation: string;
    symptoms: Symptom[];
  } | null>(null);
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLoadBenchmarkDemo = () => {
    setName('Kamala Barik');
    setAge('38');
    setGender('Female');
    setPrimaryLanguage('Odia (ଓଡ଼ିଆ)');
    setContact('+91 94371 28912');
    setTypedComplaint('Severe bilateral knee pain and swelling for 4 days, difficulty bearing weight in the morning.');
    setConsentGranted(true);
  };

  const handleNextFromStep1 = () => {
    if (!consentGranted) {
      setShowConsentModal(true);
      return;
    }
    setCurrentStep(2);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const newId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const syntheticCode = `SYN-2026-${Math.floor(100 + Math.random() * 900)}`;
    let backendCaseId: string | undefined = undefined;
    let backendVersion = 1;

    try {
      // 1. Synthetic patient UUID
      const syntheticSubjectId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '3fa85f64-5717-4562-b3fc-2c963f66afa6';

      // 2. Request & Capture Consent for both ai_analysis and data_processing
      const consent = await consentApi.requestAndCapture(syntheticSubjectId, 'ai_analysis', '1.0');
      try {
        await consentApi.requestAndCapture(syntheticSubjectId, 'data_processing', '1.0');
        await consentApi.requestAndCapture(syntheticSubjectId, 'referral', '1.0');
      } catch (cErr) {
        // Optional secondary purposes
      }

      // 3. Create Case
      const caseRes = await caseApi.createCase({
        synthetic_subject_id: syntheticSubjectId,
        consent_id: consent.id,
      });

      backendCaseId = caseRes.case_id;
      backendVersion = caseRes.version;

      // 4. Ingest Evidence
      const complaintText = typedComplaint || capturedVoiceData?.translation || 'General symptoms recorded at intake';
      const evidenceRes = await evidenceApi.registerTextEvidence({
        case_id: caseRes.case_id,
        text_content: complaintText,
        consent_id: consent.id,
        source_language: capturedVoiceData?.language ? 'or' : 'en',
      });

      // 5. Trigger Processing
      await processingApi.triggerProcessing({
        evidence_id: evidenceRes.evidence_id,
        processor_type: 'candidate_extraction',
      });

      // 6. Enter Review Queue in backend
      try {
        await reviewApi.enterQueue(caseRes.case_id);
      } catch (qErr) {
        console.warn('Backend review queue entry note:', qErr);
      }
    } catch (e) {
      console.warn('Backend API intake pipeline bypassed with local fallback:', e);
    } finally {
      setIsSubmitting(false);
    }

    let symptomsList: Symptom[] = [];
    if (capturedVoiceData && capturedVoiceData.symptoms.length > 0) {
      symptomsList = capturedVoiceData.symptoms;
    } else {
      symptomsList = [
        {
          id: `sym-new-1`,
          name: typedComplaint.substring(0, 40),
          duration: '4 days',
          severity: 'MODERATE',
          source: selectedChannel === 'VOICE' ? 'VOICE' : 'MANUAL',
          confidence: 0.95,
        },
      ];
    }

    const newPatient: Patient = {
      id: newId,
      caseId: backendCaseId,
      version: backendVersion,
      syntheticCode,
      name,
      age: parseInt(age) || 35,
      gender,
      primaryLanguage: capturedVoiceData?.language || primaryLanguage || 'Odia (ଓଡ଼ିଆ)',
      translatedToEnglish: true,
      contactMasked: contact.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2'),
      visitId: `VST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      arrivalTime: 'Today · Just now',
      chiefComplaint: typedComplaint || capturedVoiceData?.translation || 'General symptoms at triage',
      symptoms: symptomsList,
      relevantHistory: ['Recorded during CHC intake session', 'Consent obtained and verified'],
      vitals: {
        bloodPressure: '122/80 mmHg',
        pulseRate: '82 bpm',
        temperature: '98.8 °F',
        spO2: '97%',
        respiratoryRate: '18 breaths/min',
      },
      facts: extractedFacts,
      missingInfo: [
        {
          id: `miss-new-1`,
          field: 'duration_onset',
          label: 'Exact onset of acute flare',
          category: 'SYMPTOM_DETAIL',
          status: 'NOT_PROVIDED',
          reason: 'Clarify if morning stiffness lasts > 30 minutes.',
          askPrompt: 'Does the joint stiffness last longer than 30 minutes after waking up?',
          quickOptions: ['Yes, > 30 mins', 'No, improves quickly', 'Constant stiffness'],
        },
      ],
      riskFlags: [],
      aiQuestions: [
        {
          id: `q-new-1`,
          missingInfoId: `miss-new-1`,
          questionText: 'Does the joint stiffness last longer than 30 minutes after waking up in the morning?',
          options: ['Yes, > 30 mins', 'No, improves quickly', 'Constant stiffness', 'Not sure'],
        },
      ],
      timeline: [
        {
          id: `tl-new-1`,
          timestamp: 'Just now',
          title: 'Patient Intake Completed',
          description: `Intake recorded via ${selectedChannel} channel.`,
          source: selectedChannel === 'VOICE' ? 'VOICE' : 'REPORT',
          actor: 'CHO Ramesh Sahoo',
        },
      ],
      auditLog: [
        {
          id: `aud-new-1`,
          timestamp: 'Just now',
          actor: 'CHO Ramesh Sahoo',
          actorRole: 'Community Health Officer',
          action: 'REGISTER_NEW_INTAKE',
          objectAffected: newId,
          details: `Registered ${name} (${gender}/${age}) with ${selectedChannel} input`,
        },
      ],
      status: 'PENDING_REVIEW',
      priority: 'YELLOW',
      facilityId: currentFacility?.id || 'fac-1',
    };

    addPatient(newPatient);

    if (isOffline || !backendCaseId) {
      addOutboxItem({
        patientId: newId,
        patientName: name,
        type: selectedChannel === 'VOICE' ? 'voice' : selectedChannel === 'REPORT' ? 'ocr' : 'text',
        summary: typedComplaint || capturedVoiceData?.translation || 'New clinical intake registered',
      });
    }

    notifyArrival({
      patientId: newId,
      patientName: name,
      patientAge: parseInt(age) || 35,
      patientGender: gender,
      department: 'CHC Outpatient Desk',
      priority: newPatient.priority,
      chiefComplaint: typedComplaint || capturedVoiceData?.translation || 'New patient intake registered',
      vitalsSnippet: `BP: ${newPatient.vitals.bloodPressure} · SpO2: ${newPatient.vitals.spO2} · Temp: ${newPatient.vitals.temperature}`,
      facilityName: currentFacility?.name || 'Nuapada District Hospital',
    });

    onIntakeCompleted(newId);
  };

  if (capabilities.isSuspended || !capabilities.canPerformIntake) {
    return (
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 shadow-xs text-center space-y-4 max-w-lg mx-auto my-12 animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#102033]">Clinical Intake Authority Suspended</h2>
          <p className="text-xs text-[#526276] leading-relaxed">
            Your practitioner account (<strong>{currentUser.name}</strong>) is currently suspended by Facility Administration. You cannot record patient vitals, capture multimodal symptoms, or initiate triage admissions.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={onCancel}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stepper Header (Section 7) */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#102033]">New Patient Intake</h2>
            <p className="text-xs text-[#6B7B8F] mt-0.5">
              Multimodal registration for Primary Health Centers & Community Health Units
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel Intake
          </Button>
        </div>

        {/* Stepper Bar: 1 Patient Info → 2 Input Details → 3 Review */}
        <div className="flex items-center justify-between relative max-w-xl mx-auto">
          {/* Connector line */}
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 z-0" />

          {/* Step 1 */}
          <div className="flex flex-col items-center relative z-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 1
                  ? 'bg-[#2563EB] text-white ring-4 ring-blue-50'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </div>
            <span className="text-xs font-semibold text-[#102033] mt-2">1. Patient Info</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center relative z-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 2
                  ? 'bg-[#2563EB] text-white ring-4 ring-blue-50'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold mt-2 ${
                currentStep >= 2 ? 'text-[#102033]' : 'text-[#6B7B8F]'
              }`}
            >
              2. Input Details
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center relative z-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep === 3
                  ? 'bg-[#2563EB] text-white ring-4 ring-blue-50'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-semibold mt-2 ${
                currentStep === 3 ? 'text-[#102033]' : 'text-[#6B7B8F]'
              }`}
            >
              3. Review & Submit
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Patient Info & Consent (Section 6) */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Demographics Form */}
          <div className="xl:col-span-8 bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E6ECF2] gap-2">
              <div>
                <h3 className="text-base font-bold text-[#102033]">Basic Patient Demographics</h3>
                <p className="text-xs text-[#6B7B8F] mt-0.5">
                  Register identity and obtain patient triage consent before beginning clinical session
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadBenchmarkDemo}
                icon={<Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />}
              >
                Load Clinical Demo Benchmark
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#25364A] mb-1">
                  Full Name / ରୋଗୀଙ୍କ ନାମ:
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Age (Years):</label>
                <input
                  type="number"
                  placeholder="e.g. 38"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Gender / ଲିଙ୍ଗ:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-[#2563EB] focus:outline-none bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Contact Phone (Optional):</label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Preferred Language / ଭାଷା:</label>
                <select
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:border-[#2563EB] focus:outline-none bg-white"
                >
                  <option value="Odia (ଓଡ଼ିଆ)">Odia (ଓଡ଼ିଆ)</option>
                  <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                  <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                  <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            {/* Consent Checkpoint */}
            <div className={`p-4 rounded-xl border transition-all ${
              consentGranted
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-amber-50/40 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  id="patient-consent-checkbox"
                  name="patient-consent-checkbox"
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="patient-consent-checkbox" className="text-xs cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#102033]">
                      Patient / Guardian Informed Consent Checkpoint
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      consentGranted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {consentGranted ? 'Verified' : 'Required'}
                    </span>
                  </div>
                  <p className="text-[#526276] leading-relaxed mt-1">
                    I confirm that the patient (or guardian) has received verbal disclosure in their primary language and consented to multimodal intake, voice recording, and AI diagnostic note organization.
                  </p>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E6ECF2]">
              <Button variant="primary" size="lg" onClick={handleNextFromStep1} icon={<ArrowRight className="w-4 h-4" />}>
                Next: Select Input Mode
              </Button>
            </div>
          </div>

          {/* Right Column: Section 6.1 Multilingual Human Illustration & Language Tags */}
          <div className="xl:col-span-4 bg-gradient-to-b from-[#F0F6FF] to-white rounded-xl border border-blue-100 p-5 shadow-xs flex flex-col justify-between overflow-hidden">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] block mb-1">
                Multimodal Intake Support
              </span>
              <h4 className="text-sm font-bold text-[#102033]">
                Regional Speech &amp; Voice Intake
              </h4>
              <p className="text-xs text-[#526276] mt-1 leading-relaxed">
                Patients can speak naturally in their mother tongue. CareIntel transcribes and structures chief complaints directly.
              </p>

              {/* Native Language Badges rendered in React per Section 6.1 */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[#164FD6] text-[11px] font-semibold shadow-2xs">
                  Odia (ଓଡ଼ିଆ)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[#164FD6] text-[11px] font-semibold shadow-2xs">
                  Hindi (हिन्दी)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-blue-200 text-[#164FD6] text-[11px] font-semibold shadow-2xs">
                  English
                </span>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative w-full h-72 mt-4 rounded-xl overflow-hidden border border-blue-100/60 bg-white/70 shadow-2xs">
              <Image
                src="/illustrations/intake/multilingual_user.png"
                alt="Multilingual patient voice assistant illustration"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-contain object-right-bottom"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Input Details (Multimodal Choice + Studio) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Main Question (Section 7) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#102033] mb-4">
              How would you like to provide information?
            </h3>

            {/* Four Cards (Section 7) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Speak */}
              <button
                type="button"
                onClick={() => setSelectedChannel('VOICE')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedChannel === 'VOICE'
                    ? 'border-[#2563EB] bg-[#E8F0FF] ring-2 ring-blue-100 shadow-xs'
                    : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3">
                  <Mic className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#102033]">Speak (Voice)</h4>
                <p className="text-xs text-[#6B7B8F] mt-1">Record symptoms in any language</p>
              </button>

              {/* Card 2: Type */}
              <button
                type="button"
                onClick={() => setSelectedChannel('TYPE')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedChannel === 'TYPE'
                    ? 'border-[#2563EB] bg-[#E8F0FF] ring-2 ring-blue-100 shadow-xs'
                    : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#25364A] flex items-center justify-center mb-3">
                  <Keyboard className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#102033]">Type (Manual)</h4>
                <p className="text-xs text-[#6B7B8F] mt-1">Enter symptoms manually</p>
              </button>

              {/* Card 3: Upload Report */}
              <button
                type="button"
                onClick={() => setSelectedChannel('REPORT')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedChannel === 'REPORT'
                    ? 'border-[#2563EB] bg-[#E8F0FF] ring-2 ring-blue-100 shadow-xs'
                    : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#102033]">Upload Report (OCR)</h4>
                <p className="text-xs text-[#6B7B8F] mt-1">Upload lab reports / prescriptions</p>
              </button>

              {/* Card 4: Take Photo */}
              <button
                type="button"
                onClick={() => setSelectedChannel('PHOTO')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedChannel === 'PHOTO'
                    ? 'border-[#2563EB] bg-[#E8F0FF] ring-2 ring-blue-100 shadow-xs'
                    : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#102033]">Capture Photo (Visual)</h4>
                <p className="text-xs text-[#6B7B8F] mt-1">Capture a basic visual input</p>
              </button>
            </div>
          </div>

          {/* Active Studio Channel View */}
          {selectedChannel === 'VOICE' && (
            <VoiceIntakeStudio
              onComplete={(data) => {
                setCapturedVoiceData(data);
                setTypedComplaint(data.translation);
                setCurrentStep(3);
              }}
              onSwitchToType={() => setSelectedChannel('TYPE')}
            />
          )}

          {selectedChannel === 'REPORT' && (
            <ReportExtractStudio
              onFactsExtracted={(f) => {
                setExtractedFacts(f);
                setCurrentStep(3);
              }}
            />
          )}

          {selectedChannel === 'TYPE' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-[#102033]">Type Symptoms</h3>
              <div>
                <label className="block text-xs font-semibold text-[#25364A] mb-1">
                  Describe symptoms, duration, and severity:
                </label>
                <textarea
                  value={typedComplaint}
                  onChange={(e) => setTypedComplaint(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-3">
                <Button variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={() => setCurrentStep(3)}>
                  Next: Review Intake
                </Button>
              </div>
            </div>
          )}

          {selectedChannel === 'PHOTO' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-[#102033]">Basic Visual Input Capture</h4>
              <p className="text-xs text-[#526276] max-w-sm mx-auto">
                Attach a clear photo of skin rash, eye conjunctiva, or clinical paper token for non-diagnostic orientation.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setTypedComplaint('Visual photo of right forearm erythematous rash attached.');
                  setCurrentStep(3);
                }}
              >
                Use Sample Clinical Photo & Continue
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Submit (Section 7 & 14.2) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 sm:p-8 shadow-xs space-y-6">
          {/* Section 14.2: Success & Confirmation Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-blue-50/60 border border-emerald-100">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
              <Image
                src="/illustrations/states/success.png"
                alt="Intake information successfully recorded illustration"
                fill
                priority
                sizes="112px"
                className="object-contain"
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block">
                Information Successfully Recorded
              </span>
              <h3 className="text-lg font-bold text-[#102033]">
                Ready for Clinical Triage Review
              </h3>
              <p className="text-xs text-[#526276] leading-relaxed max-w-lg">
                Your information has been recorded. A healthcare professional will review it in the operational triage queue.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="font-semibold text-[#6B7B8F] block mb-1">Patient Demographics</span>
              <div className="text-sm font-bold text-[#102033]">{name}</div>
              <div className="text-[#526276]">
                {age} yrs · {gender} · {contact}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <span className="font-semibold text-[#6B7B8F] block mb-1">Intake Mode & Language</span>
              <div className="text-sm font-bold text-[#102033]">{selectedChannel} Channel</div>
              <div className="text-[#526276]">
                {capturedVoiceData?.language || 'Odia / English'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-xs">
            <span className="font-semibold text-[#6B7B8F] block mb-1">Chief Complaint & Symptoms</span>
            <p className="text-sm font-semibold text-[#102033] leading-relaxed">
              &ldquo;{typedComplaint || capturedVoiceData?.translation}&rdquo;
            </p>
          </div>

          {/* Prototype Non-diagnostic declaration */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#164FD6] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>
              This note will be organized for qualified human review in the triage queue. AI does not diagnose or prescribe.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E6ECF2]">
            <Button variant="secondary" size="md" onClick={() => setCurrentStep(2)} icon={<ArrowLeft className="w-4 h-4" />} disabled={isSubmitting}>
              Back to Input
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Registering Intake & Creating Case…' : 'Send to Triage Queue'}
            </Button>
          </div>
        </div>
      )}

      {/* Consent Modal Dialog */}
      <ConsentModal
        isOpen={showConsentModal}
        onConsent={() => {
          setConsentGranted(true);
          setShowConsentModal(false);
          setCurrentStep(2);
        }}
        onCancel={() => setShowConsentModal(false)}
      />
    </div>
  );
};
