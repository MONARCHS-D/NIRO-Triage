'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRole } from '../../../context/RoleContext';
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffId.trim()) {
      setErrorMsg("We couldn't sign you in. Check your staff ID and password and try again.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = login(staffId, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setErrorMsg("We couldn't sign you in. Check your staff ID and password and try again.");
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoLogin = (roleIdentifier: string) => {
    login(roleIdentifier, 'demo123');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      {/* Centered Panel, max 420px per Section 34 */}
      <div className="w-full max-w-[420px] bg-white rounded-xl border border-[#E6ECF2] shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Product Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563EB] text-white font-bold text-sm shadow-xs mb-1">
            NIRO
          </div>
          <h1 className="text-xl font-bold text-[#102033] tracking-tight">NIRO Triage</h1>
          <p className="text-xs text-[#6B7B8F] font-medium">People First. Care Faster.</p>
        </div>

        {/* Welcome Text */}
        <div className="text-center">
          <h2 className="text-base font-bold text-[#102033]">Welcome back</h2>
          <p className="text-xs text-[#526276] mt-0.5">
            Sign in to continue to your health facility workspace.
          </p>
        </div>

        {/* Error Alert if any (Section 34 copy) */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B3261E] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#25364A] mb-1">
              Work email / Staff ID
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. dr.sharma@health.odisha.gov.in"
              className="w-full px-3 py-2 text-xs rounded-md border border-[#E6ECF2] bg-[#F8FAFC] text-[#102033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#25364A] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 text-xs rounded-md border border-[#E6ECF2] bg-[#F8FAFC] text-[#102033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#2563EB] focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-slate-600 text-[11px]">Remember this device</span>
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-[#2563EB] hover:text-[#164FD6] font-medium text-[11px] underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={isLoading}
            className="mt-2"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div className="pt-3 border-t border-[#E6ECF2]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] block mb-2 text-center">
            One-Click Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('doctor')}
              className="p-2 text-left rounded-md border border-[#E6ECF2] hover:bg-blue-50 hover:border-blue-200 transition-colors text-[11px] cursor-pointer"
            >
              <div className="font-bold text-[#102033]">Dr. A. Sharma</div>
              <div className="text-[#6B7B8F]">Medical Officer</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('nurse')}
              className="p-2 text-left rounded-md border border-[#E6ECF2] hover:bg-blue-50 hover:border-blue-200 transition-colors text-[11px] cursor-pointer"
            >
              <div className="font-bold text-[#102033]">Sunita B.</div>
              <div className="text-[#6B7B8F]">Staff Nurse</div>
            </button>
          </div>
        </div>

        {/* Prototype Disclaimer Footer */}
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
