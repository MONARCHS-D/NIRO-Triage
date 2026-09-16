import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from './Button';

interface ConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onCancel: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onConsent, onCancel }) => {
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#102033]">Patient Consent</h3>
              <p className="text-xs text-[#6B7B8F]">Triage-Support Information Session</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5 p-4 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-sm text-[#25364A] space-y-2.5">
          <p className="font-medium text-[#102033]">
            Use my information for this triage-support session
          </p>
          <p className="text-xs text-[#526276] leading-relaxed">
            We will use the symptoms, reports, and timeline you provide to organize a structured triage note for review by qualified healthcare staff.
          </p>
          <div className="pt-2 border-t border-slate-200/80 text-xs text-[#6B7B8F] flex flex-col gap-1">
            <span>• Non-diagnostic educational prototype</span>
            <span>• Retention: Session-scoped & synthetic IDs only</span>
            <span>• Human medical officer verifies every action</span>
          </div>
        </div>

        <label className="flex items-center gap-3 select-none cursor-pointer py-1">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-[#102033]">I understand and agree</span>
        </label>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!understood} onClick={onConsent}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
