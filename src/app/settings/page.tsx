'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { Button } from '../../components/common/Button';
import {
  User,
  Hospital,
  Globe,
  ShieldCheck,
  LogOut,
  Wifi,
  WifiOff,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const {
    currentUser,
    currentFacility,
    facilities,
    setCurrentFacility,
    setUserRole,
    isOffline,
    setIsOffline,
    logout,
  } = useRole();
  const { resetToDefaults } = useTriage();

  const handleSignOut = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <ShellLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header Section (Section 37) */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">Settings</h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Operational profile, assigned facility, regional language, and privacy controls
          </p>
        </div>

        {/* Section 1: Profile (Section 37) */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6ECF2]">
            <User className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#102033]">Staff Profile</h3>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-sm font-bold text-[#102033]">{currentUser.name}</div>
              <div className="text-[#6B7B8F]">{currentUser.title} · {currentUser.department}</div>
              {currentUser.registrationNumber && (
                <div className="text-[11px] text-[#526276] font-mono mt-0.5">
                  Reg: {currentUser.registrationNumber}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#526276]">Active Role:</span>
              <select
                value={currentUser.role}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="text-xs font-semibold py-1 px-2.5 rounded-md border border-blue-200 bg-blue-50 text-[#164FD6] cursor-pointer"
              >
                <option value="DOCTOR">Doctor (Medical Officer)</option>
                <option value="NURSE">Staff Nurse</option>
                <option value="HEALTH_WORKER">Community Health Officer</option>
                <option value="ADMIN">Facility Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Facility (Section 37) */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6ECF2]">
            <Hospital className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#102033]">Assigned Health Facility</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">Facility Name:</label>
              <select
                value={currentFacility.id}
                onChange={(e) => {
                  const found = facilities.find((f) => f.id === e.target.value);
                  if (found) setCurrentFacility(found);
                }}
                className="w-full p-2 rounded-md border border-slate-300 bg-white font-medium text-xs"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.district})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">Registry Code:</label>
              <input
                type="text"
                readOnly
                value={currentFacility.code}
                className="w-full p-2 rounded-md border border-slate-200 bg-[#F8FAFC] text-[#526276] font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Language (Section 37: English · Hindi · Odia) */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6ECF2]">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#102033]">Language Settings</h3>
          </div>

          <p className="text-xs text-[#526276]">
            Primary Indic dialects active for voice capture and clinical schema translation:
          </p>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#164FD6] border border-blue-200 font-semibold">
              English (Clinical Standard)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              Odia (ଓଡ଼ିଆ) · Primary
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Hindi (हिन्दी)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Bengali (বাংলা)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Tamil (தமிழ்)
            </span>
          </div>
        </div>

        {/* Section 4: Privacy & Retention (Section 37) */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E6ECF2]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-[#102033]">Privacy & Compliance</h3>
          </div>

          <div className="space-y-2 text-xs text-[#25364A]">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#F8FAFC] border border-[#E6ECF2]">
              <span>Consent Information: Explicit opt-in verified at intake</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-[#F8FAFC] border border-[#E6ECF2]">
              <span>Retention Scope: Session-scoped synthetic patient records</span>
              <span className="text-slate-700 font-medium">Local Cache</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-[#6B7B8F]">Restore benchmark cases (P-1042, P-1035, P-1018):</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={resetToDefaults}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Demo Data
            </Button>
          </div>
        </div>

        {/* Section 5: Security & Sign Out (Section 37) */}
        <div className="bg-white rounded-xl border border-red-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#102033]">Security & Session</h3>
            <p className="text-xs text-[#6B7B8F] mt-0.5">
              Signed in as <strong className="text-[#25364A]">{currentUser.name}</strong> ({currentUser.title})
            </p>
          </div>

          <Button
            variant="outline-destructive"
            size="md"
            onClick={handleSignOut}
            icon={<LogOut className="w-4 h-4" />}
          >
            Sign out
          </Button>
        </div>
      </div>
    </ShellLayout>
  );
}
