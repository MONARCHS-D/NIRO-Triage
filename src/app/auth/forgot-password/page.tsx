'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export default function ForgotPasswordPage() {
  const [emailOrId, setEmailOrId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOrId.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-xl border border-[#E6ECF2] shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563EB] text-white font-bold text-sm shadow-xs mb-1">
            NIRO
          </div>
          <h1 className="text-xl font-bold text-[#102033] tracking-tight">Reset your password</h1>
          <p className="text-xs text-[#526276]">
            Enter your staff email or ID. We&apos;ll show the next recovery step.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h2 className="text-sm font-bold text-[#102033]">Recovery link dispatched</h2>
            <p className="text-xs text-[#526276] leading-relaxed">
              If a registered clinical staff account matches <strong className="text-[#102033]">{emailOrId}</strong>, instructions have been sent to your registered department head.
            </p>
            <div className="pt-2">
              <Link href="/auth/login">
                <Button variant="secondary" size="md" fullWidth>
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">
                Staff email / ID
              </label>
              <input
                type="text"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="e.g. MO-4891 or dr.sharma@health.gov.in"
                required
                className="w-full px-3 py-2 text-xs rounded-md border border-[#E6ECF2] bg-[#F8FAFC] text-[#102033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg">
              Send reset link
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#164FD6] font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <span className="text-[11px] text-[#6B7B8F] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Educational prototype · Triage-support only</span>
          </span>
        </div>
      </div>
    </div>
  );
}
