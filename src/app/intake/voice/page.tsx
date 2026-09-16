'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { VoiceIntakeStudio } from '../../../components/intake/VoiceIntakeStudio';
import { useTriage } from '../../../context/TriageContext';
import { Patient } from '../../../types/triage';

export default function VoiceIntakePage() {
  const router = useRouter();
  const { addPatient, setSelectedPatientId } = useTriage();

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
          actor: 'Patient Ranjan Mahapatra',
        },
      ],
      auditLog: [
        {
          id: `aud-voice-1`,
          timestamp: 'Just now',
          actor: 'Dr. A. Sharma',
          actorRole: 'Medical Officer',
          action: 'REGISTER_VOICE_INTAKE',
          objectAffected: newId,
          details: `Captured ${data.language} voice intake`,
        },
      ],
      status: 'PENDING_REVIEW',
      priority: 'YELLOW',
      facilityId: 'fac-1',
    };

    addPatient(newPatient);
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
