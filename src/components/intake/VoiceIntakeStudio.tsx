'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Volume2,
  Languages,
} from 'lucide-react';
import { Button } from '../common/Button';
import { LanguageSelector } from '../common/LanguageSelector';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../../lib/audioSimulator';
import { Symptom } from '../../types/triage';

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PAUSED'
  | 'PROCESSING'
  | 'TRANSCRIBING'
  | 'UNCERTAIN'
  | 'SUCCESS'
  | 'FAILURE';

interface VoiceIntakeStudioProps {
  onComplete?: (data: {
    language: string;
    transcript: string;
    translation: string;
    symptoms: Symptom[];
  }) => void;
  onSwitchToType?: () => void;
}

export const VoiceIntakeStudio: React.FC<VoiceIntakeStudioProps> = ({
  onComplete,
  onSwitchToType,
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]); // Odia default
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [translationText, setTranslationText] = useState<string>('');
  const [waveHeights, setWaveHeights] = useState<number[]>([
    20, 35, 60, 45, 80, 55, 90, 70, 40, 65, 85, 30, 45, 95, 60, 40, 75, 50, 30, 20,
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer loop when listening
  useEffect(() => {
    if (voiceState === 'LISTENING') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((d) => d + 1);
        // Animate simulated waveform
        setWaveHeights(
          Array.from({ length: 24 }, () => Math.floor(Math.random() * 70) + 15)
        );
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [voiceState]);

  const startRecording = () => {
    setVoiceState('LISTENING');
    setDurationSeconds(0);
    setTranscriptText('');
    setTranslationText('');
  };

  const pauseRecording = () => {
    setVoiceState('PAUSED');
  };

  const resumeRecording = () => {
    setVoiceState('LISTENING');
  };

  const stopAndProcess = () => {
    setVoiceState('PROCESSING');
    setTimeout(() => {
      setVoiceState('TRANSCRIBING');
      setTranscriptText(selectedLang.sampleTranscript);

      setTimeout(() => {
        setTranslationText(selectedLang.sampleTranslation);
        setVoiceState('SUCCESS');
      }, 900);
    }, 800);
  };

  const triggerUncertainty = () => {
    setVoiceState('UNCERTAIN');
    setTranscriptText(selectedLang.sampleTranscript.substring(0, 35) + '... [ଗୁଣୁଗୁଣୁ ସ୍ୱର / inaudible]');
    setTranslationText(selectedLang.sampleTranslation.substring(0, 40) + '... [audio segment unclear]');
  };

  const triggerFailure = () => {
    setVoiceState('FAILURE');
  };

  const resetRecording = () => {
    setVoiceState('IDLE');
    setDurationSeconds(0);
    setTranscriptText('');
    setTranslationText('');
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    if (onComplete) {
      const parsedSymptoms: Symptom[] = selectedLang.sampleSymptoms.map((s, idx) => ({
        id: `sym-voice-${Date.now()}-${idx}`,
        name: s.name,
        duration: s.duration,
        severity: s.severity,
        source: 'VOICE',
        confidence: 0.96,
      }));

      onComplete({
        language: `${selectedLang.name} (${selectedLang.nativeName})`,
        transcript: transcriptText || selectedLang.sampleTranscript,
        translation: translationText || selectedLang.sampleTranslation,
        symptoms: parsedSymptoms,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-[#E6ECF2] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <h2 className="text-base font-bold text-[#102033]">Voice Intake Studio</h2>
          </div>
          <p className="text-xs text-[#6B7B8F] mt-0.5">
            Multilingual speech capture with regional language transcription and clinical translation
          </p>
        </div>

        {/* Demo trigger pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={triggerUncertainty}
            className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] hover:bg-amber-100 cursor-pointer"
          >
            Simulate Uncertainty
          </button>
          <button
            type="button"
            onClick={triggerFailure}
            className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-[11px] hover:bg-red-100 cursor-pointer"
          >
            Simulate Failure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E6ECF2]">
        {/* Left Column: Recording Controls & Waveform (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6">
          <div>
            {/* Language Selector */}
            <LanguageSelector
              selectedLanguage={selectedLang.code}
              onSelect={(lang) => {
                setSelectedLang(lang);
                if (voiceState === 'SUCCESS') {
                  setTranscriptText(lang.sampleTranscript);
                  setTranslationText(lang.sampleTranslation);
                }
              }}
            />
          </div>

          {/* Large Audio Display Area with Section 8.1 Processing Gradient */}
          <div
            className={`my-4 p-6 rounded-xl border border-[#E6ECF2] flex flex-col items-center justify-center min-h-[220px] transition-all duration-700 relative overflow-hidden ${
              voiceState === 'PROCESSING' || voiceState === 'TRANSCRIBING'
                ? 'bg-gradient-to-br from-blue-50/90 via-teal-50/70 to-indigo-50/80 shadow-inner'
                : 'bg-[#F8FAFC]'
            }`}
          >
            {/* Ambient subtle glow when processing */}
            {(voiceState === 'PROCESSING' || voiceState === 'TRANSCRIBING') && (
              <div className="absolute inset-0 bg-radial from-blue-400/10 via-transparent to-transparent animate-pulse pointer-events-none" />
            )}
            {/* State Badge */}
            <div className="mb-4">
              {voiceState === 'IDLE' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-[#526276]">
                  Ready to Listen
                </span>
              )}
              {voiceState === 'LISTENING' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-[#B3261E] flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Listening…
                </span>
              )}
              {voiceState === 'PAUSED' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-[#996500]">
                  Recording Paused
                </span>
              )}
              {voiceState === 'PROCESSING' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-[#164FD6] animate-pulse">
                  Processing Audio Stream…
                </span>
              )}
              {voiceState === 'TRANSCRIBING' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-[#4338CA] animate-pulse">
                  Transcribing Indic Dialect…
                </span>
              )}
              {voiceState === 'UNCERTAIN' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-[#996500] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Translation Uncertain
                </span>
              )}
              {voiceState === 'SUCCESS' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-[#087443] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transcription Complete
                </span>
              )}
              {voiceState === 'FAILURE' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-[#B3261E] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Recording Unclear
                </span>
              )}
            </div>

            {/* Waveform Visualizer */}
            <div className="h-16 flex items-center justify-center gap-1 w-full max-w-sm px-4">
              {waveHeights.map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    voiceState === 'LISTENING'
                      ? 'bg-[#2563EB]'
                      : voiceState === 'PAUSED'
                      ? 'bg-amber-400'
                      : voiceState === 'SUCCESS'
                      ? 'bg-emerald-500'
                      : voiceState === 'FAILURE'
                      ? 'bg-red-400'
                      : 'bg-slate-300'
                  }`}
                  style={{
                    height: voiceState === 'LISTENING' ? `${h}px` : '8px',
                  }}
                />
              ))}
            </div>

            {/* Duration Display (Tabular numbers) */}
            <div className="mt-4 text-2xl font-bold tabular-nums text-[#102033] tracking-wide">
              {formatTime(durationSeconds)}
            </div>
            <div className="text-[11px] text-[#6B7B8F] mt-0.5">
              Selected: <span className="font-semibold text-[#25364A]">{selectedLang.name} ({selectedLang.nativeName})</span>
            </div>
          </div>

          {/* Interactive Button Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {voiceState === 'IDLE' && (
              <Button
                variant="primary"
                size="lg"
                onClick={startRecording}
                icon={<Mic className="w-5 h-5" />}
                className="px-6"
              >
                Start Recording
              </Button>
            )}

            {voiceState === 'LISTENING' && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={pauseRecording}
                  icon={<Pause className="w-4 h-4" />}
                >
                  Pause
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={stopAndProcess}
                  icon={<Square className="w-4 h-4" />}
                  className="px-6"
                >
                  Stop & Process
                </Button>
              </>
            )}

            {voiceState === 'PAUSED' && (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={resumeRecording}
                  icon={<Play className="w-4 h-4" />}
                >
                  Resume
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={stopAndProcess}
                  icon={<Square className="w-4 h-4" />}
                >
                  Process Audio
                </Button>
              </>
            )}

            {(voiceState === 'SUCCESS' || voiceState === 'UNCERTAIN' || voiceState === 'FAILURE') && (
              <Button
                variant="secondary"
                size="md"
                onClick={resetRecording}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Record Again
              </Button>
            )}

            {/* Section 16.2: Voice failure compact editorial state */}
            {voiceState === 'FAILURE' && (
              <div className="w-full mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3 animate-in fade-in duration-200">
                <div className="relative w-20 h-20 mx-auto">
                  <Image
                    src="/illustrations/states/voice_error.png"
                    alt="Audio input interrupted illustration"
                    fill
                    priority
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102033]">Audio Input Interrupted or Unclear</h4>
                  <p className="text-[11px] text-[#6B7B8F] mt-0.5 max-w-xs mx-auto leading-normal">
                    Could not cleanly isolate speech audio. Tap below to retry recording or enter symptoms via keyboard.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Button variant="secondary" size="sm" onClick={resetRecording} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                    Try Recording Again
                  </Button>
                  {onSwitchToType && (
                    <Button variant="primary" size="sm" onClick={onSwitchToType}>
                      Type Instead
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Transcription & Translation (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-[#F8FAFC] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Live Transcription Box */}
            <div className="bg-white rounded-lg border border-[#E6ECF2] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-[#25364A] flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#2563EB]" />
                  Live Transcription ({selectedLang.nativeName})
                </span>
                <span className="text-[10px] text-[#6B7B8F]">Native Script</span>
              </div>
              <p className="mt-2 text-sm text-[#102033] leading-relaxed min-h-[56px] font-medium">
                {transcriptText || (
                  <span className="text-slate-400 font-normal italic">
                    Speech transcription in {selectedLang.name} will appear here live as patient speaks...
                  </span>
                )}
              </p>
            </div>

            {/* English Translation Box */}
            <div className="bg-white rounded-lg border border-[#E6ECF2] p-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-[#25364A] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#16A36A]" />
                  Translated (English)
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Clinical Schema
                </span>
              </div>
              <p className="mt-2 text-sm text-[#25364A] leading-relaxed min-h-[56px]">
                {translationText || (
                  <span className="text-slate-400 italic">
                    Standardized clinical translation will populate automatically...
                  </span>
                )}
              </p>
            </div>

            {/* Suggested Follow-up Questions Box */}
            {voiceState === 'SUCCESS' && (
              <div className="bg-blue-50/60 rounded-lg border border-blue-200 p-3.5 text-xs text-[#25364A]">
                <span className="font-bold text-[#164FD6] block mb-1.5">
                  AI-Detected Follow-up Questions:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#25364A]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#2563EB] font-bold">•</span>
                    <span>Are you having difficulty breathing when lying down?</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#2563EB] font-bold">•</span>
                    <span>When did the fever first spike above 101°F?</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Action to proceed with extracted voice data */}
          {voiceState === 'SUCCESS' && (
            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleFinish}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Use Voice Data in Triage Note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
