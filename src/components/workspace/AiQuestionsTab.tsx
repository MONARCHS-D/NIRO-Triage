'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { CheckCircle2, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { audioApi } from '../../lib/api/audio';

interface AiQuestionsTabProps {
  patient: Patient;
}

export const AiQuestionsTab: React.FC<AiQuestionsTabProps> = ({ patient }) => {
  const { answerQuestion } = useTriage();
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handlePlayQuestionAudio = async (questionId: string, text: string) => {
    try {
      setPlayingAudioId(questionId);
      const audioUrl = await audioApi.createAudioUrl(text);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      console.warn('TTS playback error, falling back to Web Speech API:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E6ECF2] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#102033]">AI Clinical Follow-up Questions</h3>
          </div>
          <p className="text-xs text-[#6B7B8F] mt-0.5">
            Targeted, language-aware clinical queries generated to clarify missing facts
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
          {patient.aiQuestions.length} Follow-up Questions
        </span>
      </div>

      {patient.aiQuestions.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-[#E6ECF2]">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#102033]">No Active Follow-up Questions</h4>
          <p className="text-xs text-[#526276] mt-1">
            Current patient data is sufficient for qualified physician evaluation.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {patient.aiQuestions.map((q, idx) => {
            const isAnswered = !!q.answeredOption;
            const isPlaying = playingAudioId === q.id;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-xl border transition-all ${
                  isAnswered
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        isAnswered
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-[#2563EB]'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      {/* English Question */}
                      <h4 className="text-sm font-bold text-[#102033] leading-snug">
                        {q.questionText}
                      </h4>

                      {/* Regional Indic Script Question */}
                      {q.questionTextIndic && (
                        <div className="mt-1.5 space-y-1">
                          {q.questionTextIndic.odia && (
                            <p className="text-xs font-medium text-[#2563EB]">
                              ଓଡ଼ିଆ: {q.questionTextIndic.odia}
                            </p>
                          )}
                          {q.questionTextIndic.hindi && (
                            <p className="text-xs font-medium text-[#526276]">
                              हिन्दी: {q.questionTextIndic.hindi}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Answered Banner */}
                      {isAnswered && (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Selected: &ldquo;{q.answeredOption}&rdquo; ({q.answeredAt})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TTS Speech Button */}
                  <button
                    type="button"
                    onClick={() => handlePlayQuestionAudio(q.id, q.questionText)}
                    disabled={isPlaying}
                    title="Play question aloud in spoken voice (TTS)"
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs cursor-pointer shadow-2xs"
                  >
                    {isPlaying ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {isPlaying ? 'Playing…' : 'Read Aloud'}
                    </span>
                  </button>
                </div>

                {/* Option Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2.5">
                  {q.options.map((opt) => {
                    const isSelected = q.answeredOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => answerQuestion(patient.id, q.id, opt)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB] text-white shadow-xs ring-2 ring-blue-200'
                            : 'bg-[#F8FAFC] border border-[#E6ECF2] text-[#25364A] hover:bg-[#E8F0FF] hover:border-blue-300 hover:text-[#164FD6]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
