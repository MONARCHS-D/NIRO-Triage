'use client';

import React, { useState } from 'react';
import {
  Mic,
  Edit3,
  Upload,
  Camera,
  CheckCircle2,
  Calendar,
  MessageSquare,
  User,
  Home,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { LanguageSelector } from '../common/LanguageSelector';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../../lib/audioSimulator';
import { VoiceIntakeStudio } from '../intake/VoiceIntakeStudio';
import { useTriage } from '../../context/TriageContext';
import { Patient } from '../../types/triage';

export const PatientMobileExperience: React.FC = () => {
  const { addPatient } = useTriage();
  const [activeTab, setActiveTab] = useState<'HOME' | 'VISITS' | 'MESSAGES' | 'PROFILE'>('HOME');
  const [activeFlow, setActiveFlow] = useState<'SELECTION' | 'VOICE' | 'TYPE' | 'SUCCESS'>('SELECTION');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);
  const [typedSymptom, setTypedSymptom] = useState('');
  const [patientName, setPatientName] = useState('Ananya Jena');
  const [patientAge, setPatientAge] = useState('29');

  const handleVoiceComplete = (data: {
    language: string;
    transcript: string;
    translation: string;
  }) => {
    const newId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      id: newId,
      syntheticCode: `SYN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: patientName,
      age: parseInt(patientAge) || 30,
      gender: 'Female',
      primaryLanguage: data.language,
      translatedToEnglish: true,
      contactMasked: '+91 94*** **902',
      visitId: `VST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      arrivalTime: 'Today · Just now',
      chiefComplaint: data.translation.substring(0, 80) + '...',
      symptoms: [
        {
          id: `sym-mob-1`,
          name: 'Recorded Voice Symptoms',
          duration: '3 days',
          severity: 'MODERATE',
          source: 'VOICE',
          confidence: 0.96,
        },
      ],
      relevantHistory: ['Recorded via citizen mobile intake portal'],
      vitals: {},
      facts: [],
      missingInfo: [
        {
          id: `miss-mob-1`,
          field: 'vitals_check',
          label: 'In-person vitals measurement',
          category: 'VITALS',
          status: 'NOT_PROVIDED',
          reason: 'Patient submitted remote mobile intake. In-clinic oximetry required.',
          askPrompt: 'Measure blood pressure and pulse oximeter upon clinic arrival.',
        },
      ],
      riskFlags: [],
      aiQuestions: [],
      timeline: [
        {
          id: `tl-mob-1`,
          timestamp: 'Just now',
          title: 'Mobile intake completed by citizen',
          description: data.translation,
          source: 'VOICE',
          actor: patientName,
        },
      ],
      auditLog: [
        {
          id: `aud-mob-1`,
          timestamp: 'Just now',
          actor: patientName,
          actorRole: 'Citizen / Patient',
          action: 'SUBMIT_CITIZEN_MOBILE_INTAKE',
          objectAffected: newId,
          details: `Submitted mobile voice intake in ${data.language}`,
        },
      ],
      status: 'PENDING_REVIEW',
      priority: 'YELLOW',
      facilityId: 'fac-1',
    };

    addPatient(newPatient);
    setActiveFlow('SUCCESS');
  };

  const handleTypeSubmit = () => {
    if (!typedSymptom.trim()) return;
    const newId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      id: newId,
      syntheticCode: `SYN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: patientName,
      age: parseInt(patientAge) || 30,
      gender: 'Female',
      primaryLanguage: selectedLanguage.name,
      translatedToEnglish: true,
      contactMasked: '+91 94*** **902',
      visitId: `VST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      arrivalTime: 'Today · Just now',
      chiefComplaint: typedSymptom,
      symptoms: [
        {
          id: `sym-mob-2`,
          name: typedSymptom,
          duration: 'Recent',
          severity: 'MILD',
          source: 'MANUAL',
          confidence: 0.95,
        },
      ],
      relevantHistory: ['Entered via citizen mobile app'],
      vitals: {},
      facts: [],
      missingInfo: [],
      riskFlags: [],
      aiQuestions: [],
      timeline: [
        {
          id: `tl-mob-2`,
          timestamp: 'Just now',
          title: 'Symptoms submitted via mobile app',
          description: typedSymptom,
          source: 'MANUAL',
          actor: patientName,
        },
      ],
      auditLog: [
        {
          id: `aud-mob-2`,
          timestamp: 'Just now',
          actor: patientName,
          actorRole: 'Citizen / Patient',
          action: 'SUBMIT_CITIZEN_MOBILE_INTAKE',
          objectAffected: newId,
          details: 'Submitted manual text intake',
        },
      ],
      status: 'PENDING_REVIEW',
      priority: 'GREEN',
      facilityId: 'fac-1',
    };

    addPatient(newPatient);
    setActiveFlow('SUCCESS');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] border-x border-[#E6ECF2] flex flex-col justify-between shadow-lg">
      {/* Mobile Top Header */}
      <div className="bg-white border-b border-[#E6ECF2] p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2563EB] text-white font-bold flex items-center justify-center text-xs">
              SS
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#102033]">SwasthyaSetu</h1>
              <p className="text-[10px] text-[#6B7B8F]">Government Health Facility Portal</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Citizen Mode
          </span>
        </div>
      </div>

      {/* Main Content Area based on Flow */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeFlow === 'SELECTION' && (
          <div className="space-y-5">
            {/* Friendly Greeting Banner */}
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
              <h2 className="text-xl font-bold text-[#102033]">
                How are you feeling today?
              </h2>
              <p className="text-xs text-[#526276] mt-1">
                ଆଜି ଆପଣଙ୍କୁ କିପରି ଲାଗୁଛି? / आज आप कैसा महसूस कर रहे हैं?
              </p>
              <p className="text-[11px] text-[#6B7B8F] mt-2 leading-relaxed">
                Provide your symptoms below. We will organize them for doctor review at your local Community Health Center.
              </p>
            </div>

            {/* Language Quick Selector */}
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 shadow-xs">
              <label className="text-xs font-semibold text-[#25364A] block mb-2">
                Preferred Language / ଭାଷା ବାଛନ୍ତୁ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.slice(0, 4).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      selectedLanguage.code === lang.code
                        ? 'border-[#2563EB] bg-blue-50 text-[#164FD6] font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>{lang.name}</div>
                    <div className="text-[11px] opacity-80">{lang.nativeName}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Primary Multimodal Input Cards (Section 15, Touch target 44px min) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setActiveFlow('VOICE')}
                className="w-full min-h-[56px] p-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/50 flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#E8F0FF] text-[#2563EB] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">
                      Speak in your language
                    </h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Record voice in Odia, Hindi, Bengali, etc.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB]" />
              </button>

              <button
                type="button"
                onClick={() => setActiveFlow('TYPE')}
                className="w-full min-h-[56px] p-4 rounded-xl border border-[#E6ECF2] bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-[#25364A] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">
                      Type symptoms
                    </h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Enter health complaint in your words
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => alert('Report upload mode: Use camera or file picker')}
                className="w-full min-h-[56px] p-4 rounded-xl border border-[#E6ECF2] bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">
                      Upload report
                    </h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Attach blood test, ECG or prescription photo
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => alert('Photo capture: Open camera to capture skin patch or eye')}
                className="w-full min-h-[56px] p-4 rounded-xl border border-[#E6ECF2] bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">
                      Take photo
                    </h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Capture visible rash, swelling or symptom
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* Voice Flow Sub-View */}
        {activeFlow === 'VOICE' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveFlow('SELECTION')}
              className="text-xs font-semibold text-[#2563EB] flex items-center gap-1 cursor-pointer mb-2"
            >
              ← Back to choices
            </button>
            <VoiceIntakeStudio
              onComplete={handleVoiceComplete}
              onSwitchToType={() => setActiveFlow('TYPE')}
            />
          </div>
        )}

        {/* Type Flow Sub-View */}
        {activeFlow === 'TYPE' && (
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 space-y-4 shadow-xs">
            <button
              onClick={() => setActiveFlow('SELECTION')}
              className="text-xs font-semibold text-[#2563EB] flex items-center gap-1 cursor-pointer"
            >
              ← Back to choices
            </button>

            <h3 className="text-base font-bold text-[#102033]">Type Your Symptoms</h3>

            <div>
              <label className="block text-xs font-semibold text-[#25364A] mb-1">
                What problems are you experiencing?
              </label>
              <textarea
                value={typedSymptom}
                onChange={(e) => setTypedSymptom(e.target.value)}
                placeholder="e.g. Fever for 3 days, body pain, loss of appetite..."
                rows={4}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!typedSymptom.trim()}
              onClick={handleTypeSubmit}
            >
              Submit Information
            </Button>
          </div>
        )}

        {/* Confirmation Screen (Section 15 Explicit Specification) */}
        {activeFlow === 'SUCCESS' && (
          <div className="bg-white rounded-xl border border-emerald-200 p-6 text-center space-y-4 shadow-xs animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#102033]">
                Your information has been recorded.
              </h3>
              <p className="text-xs text-[#526276] mt-1">
                A healthcare professional will review it upon your turn.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-left text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-[#087443]">
                <span>✓</span>
                <span>No diagnosis has been made.</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-[#102033]">
                <span>✓</span>
                <span>This is a triage-support tool.</span>
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={() => {
                setActiveFlow('SELECTION');
                setTypedSymptom('');
              }}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Done / Start Another Intake
            </Button>
          </div>
        )}
      </div>

      {/* Section 15 Bottom Navigation: Home | My Visits | Messages | Profile */}
      <nav className="bg-white border-t border-[#E6ECF2] grid grid-cols-4 py-2 px-1 sticky bottom-0 z-20">
        <button
          onClick={() => {
            setActiveTab('HOME');
            setActiveFlow('SELECTION');
          }}
          className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'HOME' ? 'text-[#2563EB]' : 'text-[#6B7B8F]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('VISITS')}
          className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'VISITS' ? 'text-[#2563EB]' : 'text-[#6B7B8F]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">My Visits</span>
        </button>

        <button
          onClick={() => setActiveTab('MESSAGES')}
          className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'MESSAGES' ? 'text-[#2563EB]' : 'text-[#6B7B8F]'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Messages</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center justify-center py-1.5 min-h-[44px] cursor-pointer ${
            activeTab === 'PROFILE' ? 'text-[#2563EB]' : 'text-[#6B7B8F]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};
