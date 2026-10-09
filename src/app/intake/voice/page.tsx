'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { VoiceIntakeStudio } from '../../../components/intake/VoiceIntakeStudio';
import { useTriage } from '../../../context/TriageContext';
import { useRole } from '../../../context/RoleContext';
import { useNotifications } from '../../../context/NotificationContext';
import { Patient } from '../../../types/triage';
import { Button } from '../../../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export default function VoiceIntakePage() {
  const router = useRouter();
  const { addPatient, setSelectedPatientId } = useTriage();
  const { currentFacility, currentUser, capabilities } = useRole();
  const { notifyArrival } = useNotifications();

  if (capabilities.isSuspended || !capabilities.canPerformIntake) {
    return (
      <ShellLayout>
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 shadow-xs text-center space-y-4 max-w-lg mx-auto my-12 animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#102033]">Voice Intake Authority Suspended</h2>
            <p className="text-xs text-[#526276] leading-relaxed">
              Your practitioner account (<strong>{currentUser.name}</strong>) has been suspended by Facility Administration. You cannot record patient voice sessions or conduct triage intake.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </ShellLayout>
    );
  }

  const handleVoiceComplete = (data: {
    language: string;
    transcript: string;
    translation: string;
    symptoms: any[];
  }) => {
    const newId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      id: newId,
      syntheticCode: `SYN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Ranjan Mahapatra',
      age: 42,
      gender: 'Male',
      primaryLanguage: data.language,
      translatedToEnglish: true,
      contactMasked: '+91 98*** **814',
      visitId: `VST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      arrivalTime: 'Today · Just now',
      chiefComplaint: data.translation,
      symptoms: data.symptoms,
      relevantHistory: ['Voice intake captured in clinic'],
      vitals: {
        bloodPressure: '126/82 mmHg',
        pulseRate: '84 bpm',
        temperature: '100.2 °F',
        spO2: '96%',
      },
      facts: [],
      missingInfo: [
        {
          id: `miss-voice-1`,
          field: 'auscultation',
          label: 'Chest Auscultation Check',
          category: 'EXAM',
          status: 'NOT_PROVIDED',
          reason: 'Voice symptoms include breathlessness; physician auscultation advised.',
          askPrompt: 'Are adventitious breath sounds present?',
        },
      ],
      riskFlags: [],
      aiQuestions: [],
      timeline: [
        {
          id: `tl-voice-1`,
          timestamp: 'Just now',
          title: `Voice recorded in ${data.language}`,
          description: data.translation,
          source: 'VOICE',
          actor: 'Patient (Voice Recording)',
        },
      ],
      auditLog: [
        {
          id: `aud-voice-1`,
          timestamp: 'Just now',
          actor: currentUser?.name || 'Triage Officer',
          actorRole: currentUser?.role || 'Medical Officer',
          action: 'REGISTER_VOICE_INTAKE',
          objectAffected: newId,
          details: `Captured ${data.language} voice intake`,
        },
      ],
      status: 'PENDING_REVIEW',
      priority: 'YELLOW',
      facilityId: currentFacility?.id || 'fac-1',
    };

    addPatient(newPatient);

    notifyArrival({
      patientId: newId,
      patientName: newPatient.name,
      patientAge: newPatient.age,
      patientGender: newPatient.gender,
      department: 'Voice Studio / OPD',
      priority: newPatient.priority,
      chiefComplaint: newPatient.chiefComplaint,
      vitalsSnippet: `BP: ${newPatient.vitals.bloodPressure} · SpO2: ${newPatient.vitals.spO2}`,
      facilityName: currentFacility?.name || 'Nuapada District Hospital',
    });

    setSelectedPatientId(newId);
    router.push(`/patients/${newId}`);
  };

  return (
    <ShellLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
            Dedicated Voice Intake Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Regional language speech recognition with waveform analysis and clinical schema translation
          </p>
        </div>

        <VoiceIntakeStudio
          onComplete={handleVoiceComplete}
          onSwitchToType={() => router.push('/intake')}
        />
      </div>
    </ShellLayout>
  );
}
