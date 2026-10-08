'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { CheckCircle2, Sparkles, Volume2, Loader2, HelpCircle } from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { audioApi } from '../../lib/api/audio';

interface AiQuestionsTabProps {
  patient: Patient;
  workspaceData?: Record<string, any> | null;
}

export const AiQuestionsTab: React.FC<AiQuestionsTabProps> = ({ patient, workspaceData }) => {
  const { answerQuestion, resolveMissingInfo } = useTriage();
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [answeredBackend, setAnsweredBackend] = useState<Record<string, string>>({});

  const backendQuestions: Array<{
    id: string;
    requirement_key: string;
    text: string;
    status: string;
  }> = workspaceData?.derived_information?.questions || [];

  const handlePlayQuestionAudio = async (questionId: string, text: string, lang = 'en-US') => {
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
      console.warn('TTS playback note, falling back to Web Speech API:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        if (lang) utterance.lang = lang;
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioId(null);
      }
    }
  };

  const handleAnswerBackendQuestion = (bqId: string, requirementKey: string, option: string) => {
    setAnsweredBackend((prev) => ({ ...prev, [bqId]: option }));
    resolveMissingInfo(patient.id, requirementKey, option);
  };

  // Find unaddressed missing items that can be clarified
  const unaddressedMissing = patient.missingInfo.filter(
    (m) => m.status !== 'OBTAINED' && !patient.aiQuestions.some((q) => q.missingInfoId === m.id)
  );

  const totalQuestions =
    patient.aiQuestions.length + backendQuestions.length + unaddressedMissing.length;

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E6ECF2] gap-3">
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
          {totalQuestions} Active Follow-up Query{totalQuestions === 1 ? '' : 'ies'}
        </span>
      </div>

      {/* Backend CareIntel Questions */}
      {backendQuestions.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> CareIntel Structuring Generated Queries
            </h4>
            <span className="text-[11px] text-purple-700 font-medium">Real-time LLM derivation</span>
          </div>
          <div className="space-y-2.5">
            {backendQuestions.map((bq) => {
              const selectedAnswer = answeredBackend[bq.id];
              const isPlaying = playingAudioId === bq.id;
              return (
                <div
                  key={bq.id}
                  className="p-3.5 bg-white rounded-lg border border-purple-100 shadow-2xs space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block mb-0.5">
                        Target Requirement: {bq.requirement_key.replace(/_/g, ' ')}
                      </span>
                      <p className="font-semibold text-[#102033] leading-relaxed">{bq.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayQuestionAudio(bq.id, bq.text)}
                      disabled={isPlaying}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 cursor-pointer disabled:opacity-50 flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      <span>{isPlaying ? 'Playing...' : 'Read Aloud'}</span>
                    </button>
                  </div>

                  {selectedAnswer ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Answered: &ldquo;{selectedAnswer}&rdquo;</span>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-purple-100 flex flex-wrap gap-2">
                      {['Yes / Confirmed', 'No / Absent', 'Not Known / Unclear'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerBackendQuestion(bq.id, bq.requirement_key, opt)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-[#25364A] hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 cursor-pointer transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Seed & Structured Follow-up Questions */}
      {patient.aiQuestions.length > 0 && (
        <div className="space-y-4">
          {patient.aiQuestions.map((q, idx) => {
            const isAnswered = !!q.answeredOption;
            const isPlayingEn = playingAudioId === `${q.id}-en`;
            const isPlayingOdia = playingAudioId === `${q.id}-odia`;
            const isPlayingHindi = playingAudioId === `${q.id}-hindi`;

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

                    <div className="space-y-2">
                      {/* English Question */}
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#102033] leading-snug">
                          {q.questionText}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handlePlayQuestionAudio(`${q.id}-en`, q.questionText, 'en-US')}
                          disabled={isPlayingEn}
                          title="Read aloud in English"
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          {isPlayingEn ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Regional Indic Script Question */}
                      {q.questionTextIndic && (
                        <div className="space-y-1.5 pt-1">
                          {q.questionTextIndic.odia && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-[#2563EB]">
                                ଓଡ଼ିଆ: {q.questionTextIndic.odia}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlayQuestionAudio(
                                    `${q.id}-odia`,
                                    q.questionTextIndic!.odia,
                                    'or-IN'
                                  )
                                }
                                disabled={isPlayingOdia}
                                title="Play Odia audio"
                                className="p-1 rounded text-[#2563EB] hover:bg-blue-50 cursor-pointer"
                              >
                                {isPlayingOdia ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {q.questionTextIndic.hindi && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-[#526276]">
                                हिन्दी: {q.questionTextIndic.hindi}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePlayQuestionAudio(
                                    `${q.id}-hindi`,
                                    q.questionTextIndic!.hindi,
                                    'hi-IN'
                                  )
                                }
                                disabled={isPlayingHindi}
                                title="Play Hindi audio"
                                className="p-1 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                              >
                                {isPlayingHindi ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Answered Banner */}
                      {isAnswered && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Selected: &ldquo;{q.answeredOption}&rdquo; ({q.answeredAt})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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

      {/* Derived Missing Info Prompts */}
      {unaddressedMissing.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7B8F]">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Additional Clarification Prompts (from Missing Information items)</span>
          </div>
          {unaddressedMissing.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 space-y-2.5 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
                    {item.label} · {item.category}
                  </span>
                  <p className="font-semibold text-[#102033]">{item.askPrompt}</p>
                  <p className="text-[11px] text-[#6B7B8F] mt-0.5">{item.reason}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100 flex flex-wrap gap-2">
                {(item.quickOptions || ['Confirmed', 'Not present', 'Requires doctor check']).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => resolveMissingInfo(patient.id, item.id, opt)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-amber-200 text-[#25364A] hover:bg-amber-100 hover:text-amber-900 cursor-pointer transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {patient.aiQuestions.length === 0 && backendQuestions.length === 0 && unaddressedMissing.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-[#F8FAFC] border border-[#E6ECF2]">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#102033]">All Clinical Questions & Gaps Resolved</h4>
          <p className="text-xs text-[#526276] mt-1">
            Current patient data is comprehensive and ready for physician sign-off.
          </p>
        </div>
      )}
    </div>
  );
};
