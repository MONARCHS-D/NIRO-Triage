'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRole } from '../../../context/RoleContext';
import { onboardFacilityWithAdmin } from '../../../lib/api/onboardingService';
import { FacilityType, OnboardFacilityRequest, OnboardFacilityResponse } from '../../../lib/api/types';
import {
  Building2,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function RegisterFacilityPage() {
  const router = useRouter();
  const { addOrSelectFacility, saveAuthSession } = useRole();

  const [formData, setFormData] = useState<OnboardFacilityRequest>({
    facilityName: '',
    facilityType: 'CHC',
    district: '',
    state: 'Odisha',
    adminFullName: '',
    adminPhoneNumber: '+91',
    adminEmail: '',
    adminPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<OnboardFacilityResponse | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formData.facilityName.trim()) return 'Facility Name is required.';
    if (!formData.district.trim()) return 'District is required.';
    if (!formData.state.trim()) return 'State is required.';
    if (!formData.adminFullName.trim()) return 'Admin Full Name is required.';
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(formData.adminPhoneNumber.replace(/\s+/g, ''))) {
      return 'Valid phone number required in E.164 format (e.g. +919876543210).';
    }
    if (formData.adminPassword.length < 8) {
      return 'Admin password must be at least 8 characters long.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await onboardFacilityWithAdmin(formData);
      setSuccessResult(result);

      // Register newly created facility in local application state
      addOrSelectFacility({
        id: result.facilityPublicId || 'fac-' + Date.now(),
        name: result.facilityName,
        code: result.facilityCode,
        type: formData.facilityType,
        district: formData.district,
        state: formData.state,
        activePatients: 0,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Failed to onboard facility. Check backend logs or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDashboard = () => {
    if (successResult) {
      saveAuthSession(
        { accessToken: 'admin_session_' + Date.now() },
        {
          id: successResult.adminUserPublicId || 'admin-user',
          name: successResult.adminFullName,
          role: 'ADMIN',
          title: 'Facility Administrator',
          facility: successResult.facilityName,
        },
        {
          id: successResult.facilityPublicId,
          name: successResult.facilityName,
          code: successResult.facilityCode,
          type: formData.facilityType,
          district: formData.district,
          state: formData.state,
          activePatients: 0,
        }
      );
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F4F7FB] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 py-6 px-4 sm:px-8">
      {/* Background Ambient Decorator */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-full lg:w-2/3 h-96 pointer-events-none select-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0284C7 1px, transparent 1px),
            linear-gradient(to bottom, #0284C7 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Header */}
      <header className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-xs transition-colors"
            title="Back to Sign In"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-xs shadow-sm">
              NIRO
            </div>
            <div>
              <span className="text-base font-bold text-[#102033] block">Facility Onboarding</span>
              <span className="text-[11px] text-slate-500">ABDM &amp; TriageMitra Health Network</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] text-slate-600 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Institutional Registration</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 w-full max-w-5xl mx-auto flex-1 flex items-center justify-center">
        {successResult ? (
          /* Success Screen */
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1)] p-8 sm:p-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#102033]">
                Facility Registered Successfully!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {successResult.message || 'Your health facility has been provisioned and the institutional administrator profile created.'}
              </p>
            </div>

            {/* Credential Details Card */}
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Facility Name:</span>
                <span className="font-bold text-[#102033]">{successResult.facilityName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Facility Registry Code:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {successResult.facilityCode}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Facility ID (UUID):</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                  {successResult.facilityPublicId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Facility Admin:</span>
                <span className="font-semibold text-emerald-700">{successResult.adminFullName}</span>
              </div>
            </div>

            {/* Next Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleLaunchDashboard}
                className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>Launch Facility Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/auth/login"
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.1)] p-6 sm:p-10">
            <div className="mb-6 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
                <Sparkles className="w-3 h-3" />
                <span>Facility Onboarding · Step 1 of 1</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#102033] tracking-tight">
                Register Healthcare Facility
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Connect your Primary Health Centre, Community Health Centre, or Referral Hospital to the NIRO Network
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Section 1: Facility Information */}
              <div>
                <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Facility Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Facility Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="facilityName"
                      value={formData.facilityName}
                      onChange={handleChange}
                      placeholder="e.g. CHC Baripada Central"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Facility Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="facilityType"
                      value={formData.facilityType}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="PHC">Primary Health Centre (PHC)</option>
                      <option value="CHC">Community Health Centre (CHC)</option>
                      <option value="CLINIC">Urban Health Post / Clinic</option>
                      <option value="CAMP">Outreach Camp Unit</option>
                      <option value="DISTRICT_HOSPITAL">District Referral Hospital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="e.g. Mayurbhanj"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      State / Union Territory <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Odisha"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Facility Administrator Information */}
              <div>
                <h3 className="text-sm font-bold text-[#102033] flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Facility Administrator Credentials</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Admin Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adminFullName"
                      value={formData.adminFullName}
                      onChange={handleChange}
                      placeholder="e.g. Dr. P. Mohanty (Chief Medical Officer)"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number (E.164) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="adminPhoneNumber"
                      value={formData.adminPhoneNumber}
                      onChange={handleChange}
                      placeholder="+919876543210"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@health.gov.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Master Password <span className="text-red-500">*</span> (min 8 chars)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        required
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit & Action Row */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <Link
                  href="/auth/login"
                  className="text-xs text-slate-500 hover:text-blue-600 font-medium underline"
                >
                  Already onboarded? Sign in to existing facility
                </Link>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span>Registering with Health Network…</span>
                  ) : (
                    <>
                      <span>Complete Facility Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full max-w-5xl mx-auto pt-6 text-center text-[10px] text-slate-400">
        NIRO Triage System · TriageMitra Core Service Integration (Spring Boot 3.3 / PostgreSQL 16)
      </footer>
    </div>
  );
}
