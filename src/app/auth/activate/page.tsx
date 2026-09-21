'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRole } from '../../../context/RoleContext';
import { activateStaff } from '../../../lib/api/onboardingService';
import {
  KeyRound,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

function ActivateStaffForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveAuthSession } = useRole();

  const prefilledToken = searchParams.get('token') || '';
  const prefilledEmail = searchParams.get('email') || '';

  const [inviteToken, setInviteToken] = useState(prefilledToken);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inviteToken.trim()) {
      setErrorMsg('Please enter a valid invitation token.');
      return;
    }

    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMsg('Please enter the one-time verification code (OTP).');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const authTokens = await activateStaff({
        inviteToken: inviteToken.trim(),
        otp: otp.trim(),
        password,
      });

      // Save credentials and set active authenticated session
      saveAuthSession(
        authTokens,
        {
          id: 'staff-' + Math.random().toString(36).substring(2, 8),
          name: prefilledEmail ? prefilledEmail.split('@')[0] : 'Activated Clinician',
          role: 'DOCTOR',
          title: 'Registered Staff Member',
        }
      );

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Activation failed. Please check your token and OTP.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1)] p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#102033]">Account Activated!</h2>
            <p className="text-xs text-slate-500">
              Your clinical credentials have been established. Launching your workstation…
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 mb-1">
              <UserCheck className="w-3 h-3" />
              <span>Clinician Invitation</span>
            </div>
            <h1 className="text-2xl font-bold text-[#102033] tracking-tight">
              Activate Staff Account
            </h1>
            <p className="text-xs text-slate-500">
              Verify your invitation code and set your clinical account password
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invitation Token <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Paste invitation token"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 bg-[#F8FAFC]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                One-Time Password (OTP) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={10}
                  required
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 tracking-widest font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Check your email or backend console logs for the generated OTP
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Create Password <span className="text-red-500">*</span> (min 8 chars)
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Verifying and Activating Account…</span>
              ) : (
                <>
                  <span>Activate Account &amp; Proceed</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="text-xs text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ActivateStaffPage() {
  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] flex flex-col justify-between py-6 px-4">
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#2563EB] text-white font-bold text-xs shadow-xs">
            NIRO
          </div>
          <div>
            <span className="text-sm font-bold text-[#102033] block">NIRO Triage</span>
            <span className="text-[10px] text-slate-500">Staff Account Activation</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-600 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Institutional Verification</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading activation form…</div>}>
          <ActivateStaffForm />
        </Suspense>
      </main>

      <footer className="w-full max-w-4xl mx-auto pt-6 text-center text-[10px] text-slate-400">
        NIRO Triage · TriageMitra Core Security &amp; Credential Activation
      </footer>
    </div>
  );
}
