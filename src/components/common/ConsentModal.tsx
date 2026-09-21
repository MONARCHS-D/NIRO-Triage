import React, { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, X, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface ConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

/**
 * ConsentModal: Implements Section 17 Privacy / Consent specification.
 * Integrates restrained editorial privacy illustration with protected document and shield motif.
 */
export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onConsent, onCancel }) => {
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E6ECF2] p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-[#E6ECF2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102033]">Patient Consent &amp; Privacy</h3>
              <p className="text-xs text-[#6B7B8F]">Triage-Support Information Session</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 17: Restrained Privacy Illustration & Details */}
        <div className="my-5 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E6ECF2]">
          <div className="relative w-28 h-28 flex-shrink-0">
            <Image
              src="/illustrations/privacy/privacy.png"
              alt="Data privacy and protection illustration"
              fill
              priority
              sizes="112px"
              className="object-contain"
            />
          </div>
          <div className="space-y-1.5 text-xs text-[#25364A]">
            <p className="font-bold text-sm text-[#102033]">
              Use information for this triage session only
            </p>
            <p className="text-[#526276] leading-relaxed text-[11px]">
              We will use the symptoms, reports, and timeline you provide strictly to organize a structured triage note for review by qualified healthcare staff.
            </p>
            <div className="pt-1.5 text-[10px] text-[#6B7B8F] flex flex-col gap-0.5">
              <span>• Non-diagnostic educational prototype</span>
              <span>• Retention: Session-scoped &amp; synthetic identifiers</span>
              <span>• Qualified medical officer verifies every action</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 select-none cursor-pointer py-1 px-1">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-[#102033]">
            I understand and consent to session-scoped clinical intake processing
          </span>
        </label>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!understood} onClick={onConsent}>
            Agree &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
