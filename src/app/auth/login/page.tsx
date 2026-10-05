'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRole } from '../../../context/RoleContext';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useRole();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bgChoice, setBgChoice] = useState<'clinic' | 'facility'>('clinic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffId.trim()) {
      setErrorMsg("We couldn't sign you in. Check your staff ID and password and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(staffId, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setErrorMsg("We couldn't sign you in. Check your staff ID and password and try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "We couldn't sign you in. Check your staff ID and password and try again.");
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (roleIdentifier: string) => {
    setIsLoading(true);
    await login(roleIdentifier, 'demo123');
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#F4F7FB] overflow-x-hidden lg:overflow-hidden flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Background Layer: Coordinate grid in top-right ambient area matching reference */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-full lg:w-2/3 h-96 pointer-events-none select-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0284C7 1px, transparent 1px),
            linear-gradient(to bottom, #0284C7 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse at 80% 20%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 80% 20%, black 30%, transparent 80%)',
        }}
      />

      {/* Hero Illustration inside graceful organic wave frame matching reference mockup */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* Soft upper curved ambient arc */}
        <div className="absolute -top-24 left-1/4 w-[650px] h-[450px] rounded-full bg-gradient-to-b from-sky-100/40 via-blue-50/20 to-transparent blur-2xl" />

        {/* The Clinic Landscape Scene */}
        <div className="relative w-full h-[65vh] lg:h-[75vh] max-w-[1500px]">
          <Image
            src={
              bgChoice === 'clinic'
                ? '/illustrations/auth/clinic_community_hero.jpg'
                : '/illustrations/auth/healthcare_facility.png'
            }
            alt="Indian Community Healthcare Facility"
            fill
            sizes="100vw"
            priority
            quality={95}
            className="object-cover object-[center_60%] lg:object-[68%_50%] opacity-95 transition-all duration-700"
          />

          {/* Seamless sky and edge blends: Strong left fade mask so text sits on 100% clean canvas */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#F4F7FB]/25 to-[#F4F7FB]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FB] via-[#F4F7FB] to-transparent via-35% lg:w-[60%]" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#F4F7FB]/70 via-transparent to-transparent lg:w-1/4 ml-auto" />
        </div>

        {/* Organic swooping bottom curve (SVG) with subtle shadow matching reference mockup */}
        <div className="absolute bottom-0 left-0 w-full h-28 lg:h-40 overflow-hidden">
          <svg
            viewBox="0 0 1440 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,120 C320,180 580,80 960,140 C1200,180 1360,110 1440,90 L1440,200 L0,200 Z"
              fill="#F4F7FB"
              className="drop-shadow-[0_-12px_20px_rgba(15,23,42,0.04)]"
            />
            <path
              d="M0,150 C400,210 750,110 1100,160 C1280,185 1380,140 1440,125 L1440,200 L0,200 Z"
              fill="#F4F7FB"
              fillOpacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Top Navigation Bar - anchored cleanly without clipping */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-4 sm:pt-6 pb-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 border border-blue-400/30">
            NIRO
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#102033] block">NIRO Triage</span>
            <span className="text-[11px] font-medium text-slate-500 tracking-wide">People First. Care Faster.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-slate-200/80 text-[11px] text-slate-600 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ayushman Bharat / ABDM-Compatible Prototype</span>
          </div>

          {/* Quick theme / scene toggle */}
          <button
            type="button"
            onClick={() => setBgChoice(bgChoice === 'clinic' ? 'facility' : 'clinic')}
            title="Toggle between Community Clinic and Network Facility background"
            className="p-1.5 rounded-lg border border-slate-200/80 bg-white/80 hover:bg-white text-slate-500 hover:text-blue-600 transition-colors cursor-pointer text-xs flex items-center gap-1 shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden md:inline font-medium">
              {bgChoice === 'clinic' ? 'CHC Riverside' : 'Network Hospital'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content: Left Editorial Typography + Right Welcome Back Card */}
      <main className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-2 lg:py-4 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Reference Image Editorial Layout with crystal-clear negative space */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4 lg:space-y-5">
            {/* Blue accent dash */}
            <div className="w-10 h-1 bg-[#2563EB] rounded-full" />

            {/* Headline with serif italic and bold sans matching reference */}
            <div className="space-y-2">
              <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-[2.75rem] text-[#102033] tracking-tight leading-[1.12]">
                Better <br />
                Healthcare <br />
                <span className="not-italic font-sans font-extrabold text-[#102033]">
                  for Every Patient
                </span>
              </h1>

              {/* Sub-tagline pills: People · Communities · Technology */}
              <div className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide flex items-center gap-2 pt-0.5">
                <span>People</span>
                <span className="text-slate-300">·</span>
                <span>Communities</span>
                <span className="text-slate-300">·</span>
                <span>Technology</span>
              </div>

              {/* Mission statement description */}
              <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
                A more accessible, inclusive and human-centered healthcare system with the help of technology. Designed for primary health centres, community hospitals, and outreach camps.
              </p>
            </div>

            {/* Capabilities Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="font-medium text-[11px]">Voice (Odia, Hindi, Eng)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-[11px]">OCR Extraction</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-xs backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-medium text-[11px]">Protocol Cues</span>
              </div>
            </div>
          </div>

          {/* Right Column: "Welcome back" Card matching reference mockup */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[390px] bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1)] p-6 sm:p-7 space-y-4">
              {/* Card Header */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#102033] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in to continue
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span className="text-slate-600 text-[11px]">Remember me</span>
                  </label>

                  <Link
                    href="/auth/forgot-password"
                    className="text-blue-600 hover:text-blue-700 font-medium text-[11px] underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-70 mt-1"
                >
                  {isLoading ? (
                    <span>Signing in…</span>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* "or" Divider */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-2.5 text-slate-400 font-medium">or</span>
                </div>
              </div>

              {/* Demo Quick Logins Styled as Primary Provider Buttons */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('doctor')}
                  className="w-full py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
                  <span>Sign in as Dr. Sharma (Medical Officer)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('nurse')}
                  className="w-full py-1.5 px-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-[11px] font-medium text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Sign in as Sunita B. (Triage Nurse)</span>
                </button>
              </div>

              {/* Create account link per mockup */}
              <div className="text-center text-xs text-slate-500 pt-0.5">
                <span>Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('doctor')}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Request demo access
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer with Left & Right watermarks matching reference mockup */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
        {/* Left Watermark from mockup: HEALTHIER TOMORROW TOGETHER */}
        <div className="space-y-0.5 text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase text-center sm:text-left">
          <div>HEALTHIER</div>
          <div>TOMORROW</div>
          <div>TOGETHER</div>
        </div>

        {/* Right Watermark from mockup: CARE ENABLED BY PEOPLE · POWERED BY TECHNOLOGY */}
        <div className="flex items-center gap-3 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] text-slate-400">
          <span className="h-px w-8 bg-slate-300 hidden sm:inline-block" />
          <span>CARE ENABLED BY PEOPLE · POWERED BY TECHNOLOGY</span>
        </div>
      </footer>
    </div>
  );
}
