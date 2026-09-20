'use client';

import React from 'react';
import Image from 'next/image';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { UserRole } from '../../types/roles';
import { Button } from '../common/Button';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import {
  ShieldCheck,
  Hospital,
  User,
  Database,
  Wifi,
  WifiOff,
  RotateCcw,
  KeyRound,
  FileCheck,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    currentFacility,
    facilities,
    setCurrentFacility,
    setUserRole,
    isOffline,
    setIsOffline,
  } = useRole();
  const { resetToDefaults } = useTriage();

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Ambient subtle technical grid */}
      <AppAmbientGrid opacity={0.03} position="top-right" />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
          Facility &amp; System Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
          Configure facility context, role permissions, retention scopes, and offline cache behavior
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Settings Forms */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Facility Configuration */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
              <Hospital className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Primary Health Facility Context</h3>
                <p className="text-xs text-[#6B7B8F]">
                  Select which health post or hospital unit this workstation is assigned to
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Assigned Facility:</label>
                <select
                  value={currentFacility.id}
                  onChange={(e) => {
                    const found = facilities.find((f) => f.id === e.target.value);
                    if (found) setCurrentFacility(found);
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-[#102033] font-medium cursor-pointer"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.type} - {fac.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Facility Registry Code:</label>
                <input
                  type="text"
                  readOnly
                  value={currentFacility.code}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-[#F8FAFC] text-[#526276] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Role & Permissions (Section 21) */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
              <User className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-[#6B7B8F]">
                  Section 21: Permissions reflected in available actions across clinical staff
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#102033]">Active User Profile:</span>
                  <div className="text-[#526276]">
                    {currentUser.name} ({currentUser.role})
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#2563EB] bg-blue-50 px-2 py-1 rounded">
                  {currentUser.id}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#25364A] mb-1">Switch Active Role (Demo):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { role: 'DOCTOR', label: 'Doctor' },
                      { role: 'NURSE', label: 'Nurse' },
                      { role: 'ADMIN', label: 'Admin' },
                      { role: 'HEALTH_WORKER', label: 'CHO / Worker' },
                    ] as const satisfies { role: UserRole; label: string }[]
                  ).map(({ role, label }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setUserRole(role)}
                      className={`p-2 rounded-lg border text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        currentUser.role === role
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white text-[#25364A] border-[#E6ECF2] hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Low-Bandwidth & Offline Resilience */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
              <Database className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Low-Bandwidth &amp; Offline Resilience</h3>
                <p className="text-xs text-[#6B7B8F]">
                  Section 20: Offline simulation for remote facilities with intermittent connectivity
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-semibold text-[#102033] block">Simulate Offline Mode</span>
                <span className="text-[11px] text-[#6B7B8F]">
                  Disables network calls, routes all intakes through local storage queue
                </span>
              </div>
              <Button
                variant={isOffline ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setIsOffline(!isOffline)}
                icon={isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              >
                {isOffline ? 'Offline Mode Active' : 'Toggle Offline Mode'}
              </Button>
            </div>

            <div className="pt-3 border-t border-[#E6ECF2] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#102033] block">Reset Prototype Benchmark Data</span>
                <span className="text-[11px] text-[#6B7B8F]">
                  Restore synthetic triage queue cases to original benchmark state
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetToDefaults}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset All Cases
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Section 13.1 Community & Architecture Illustration */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] block mb-1">
              Healthcare Ecosystem Context
            </span>
            <h3 className="text-sm font-bold text-[#102033]">Community Care Infrastructure</h3>
            <p className="text-xs text-[#526276] mt-1 leading-relaxed">
              Designed for public health sub-centres, urban primary facilities, and district referral hubs.
            </p>
          </div>

          {/* Section 13.1 Illustration */}
          <div className="relative w-full h-72 rounded-lg overflow-hidden border border-slate-100 shadow-2xs group">
            <Image
              src="/illustrations/settings/community_context.png"
              alt="Contemporary Indian community healthcare technology environment"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 380px"
              className="object-cover object-center group-hover:scale-102 transition-transform duration-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-[11px] text-[#6B7B8F] space-y-1">
            <div className="font-semibold text-[#102033] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Human-in-the-Loop Protocol</span>
            </div>
            <p className="leading-normal">
              Digital intake assists frontline workers; registered physicians make all clinical triage &amp; disposition decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
