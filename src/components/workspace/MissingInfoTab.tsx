'use client';

import React, { useState } from 'react';
import { Patient, MissingInformationItem } from '../../types/triage';
import { Button } from '../common/Button';
import {
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

interface MissingInfoTabProps {
  patient: Patient;
  onNavigateToAiQuestions?: () => void;
}

export const MissingInfoTab: React.FC<MissingInfoTabProps> = ({
  patient,
  onNavigateToAiQuestions,
}) => {
  const { resolveMissingInfo } = useTriage();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>('');

  const handleQuickResolve = (item: MissingInformationItem, option: string) => {
    resolveMissingInfo(patient.id, item.id, option);
    setResolvingId(null);
  };

  const handleCustomResolve = (item: MissingInformationItem) => {
    if (customInput.trim()) {
      resolveMissingInfo(patient.id, item.id, customInput.trim());
      setCustomInput('');
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E6ECF2] gap-3">
        <div>
          <h3 className="text-base font-bold text-[#102033]">
            Information Needed for Safer Review
          </h3>
          <p className="text-xs text-[#6B7B8F]">
            Section 12: Missing clinical parameters detected during intake to prevent premature or incomplete review
          </p>
        </div>

        {onNavigateToAiQuestions && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={onNavigateToAiQuestions}
            icon={<Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />}
          >
            Open Interactive AI Questions
          </Button>
        )}
      </div>

      {patient.missingInfo.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#102033]">All Baseline Information Collected</h4>
          <p className="text-xs text-[#526276] mt-1">
            No critical missing triage parameters detected for this patient case.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patient.missingInfo.map((item) => {
            const isObtained = item.status === 'OBTAINED';
            const isResolving = resolvingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isObtained
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : item.status === 'PARTIALLY_KNOWN'
                    ? 'border-amber-200 bg-[#FFF6DD]/40'
                    : 'border-slate-300 bg-[#F8FAFC]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isObtained
                          ? 'bg-emerald-100 text-emerald-700'
                          : item.status === 'PARTIALLY_KNOWN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isObtained ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#102033]">{item.label}</h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isObtained
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'PARTIALLY_KNOWN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isObtained
                            ? 'Resolved'
                            : item.status === 'PARTIALLY_KNOWN'
                            ? 'Partially Known'
                            : 'Not Provided'}
                        </span>
                      </div>

                      <p className="text-xs text-[#526276] mt-1">{item.reason}</p>

                      {isObtained && (
                        <div className="mt-2 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Obtained value: &ldquo;{item.resolvedValue}&rdquo;</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isObtained && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setResolvingId(isResolving ? null : item.id)}
                        icon={<MessageSquare className="w-3 h-3" />}
                      >
                        {item.status === 'PARTIALLY_KNOWN' ? 'Ask follow-up' : 'Ask patient'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick select options expansion */}
                {isResolving && !isObtained && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <p className="text-xs font-semibold text-[#25364A] mb-2">
                      {item.askPrompt}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {item.quickOptions?.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQuickResolve(item, opt)}
                          className="text-xs px-2.5 py-1.5 rounded-md border border-[#E6ECF2] bg-white hover:bg-blue-50 hover:border-blue-300 text-[#25364A] font-medium transition-colors cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Or enter custom value manually..."
                        className="text-xs px-3 py-1.5 rounded border border-slate-300 flex-1 bg-white focus:outline-none focus:border-[#2563EB]"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCustomResolve(item)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
