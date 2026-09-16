'use client';

import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { Button } from '../common/Button';
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
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
          Facility & System Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
          Configure facility context, role permissions, retention scopes, and offline cache behavior
        </p>
      </div>

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
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-[#102033] font-medium"
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
              <span className="text-[#526276] ml-2">
                {currentUser.name} ({currentUser.title})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
              {currentUser.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="font-bold text-[#102033] block mb-1">Doctor / Medical Officer</span>
              <span className="text-[#6B7B8F] text-[11px]">
                Full authority to edit values, override priorities, escalate, and approve triage notes.
              </span>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="font-bold text-[#102033] block mb-1">Staff Nurse & CHO</span>
              <span className="text-[#6B7B8F] text-[11px]">
                Can register intakes, record voice & OCR reports, and answer missing information questions.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Retention Policy (Section 21) */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-[#102033]">Privacy & Responsible AI Architecture</h3>
            <p className="text-xs text-[#6B7B8F]">
              Section 21: Consent verification, synthetic identity tokens, and minimal retention
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-[#25364A]">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
            <span>Synthetic Patient Identifiers (e.g. P-1042 / SYN-2026-001)</span>
            <span className="text-emerald-700 font-semibold">Active & Enforced</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
            <span>Data Retention Policy</span>
            <span className="text-slate-700 font-semibold">Session-Scoped (Client IndexedDB)</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
            <span>ABDM / FHIR Principle</span>
            <span className="text-blue-700 font-semibold">Optional Adapter Ready</span>
          </div>
        </div>
      </div>

      {/* Offline & Cache Management (Section 20) */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
          <Database className="w-5 h-5 text-[#2563EB]" />
          <div>
            <h3 className="text-sm font-bold text-[#102033]">Low-Bandwidth & Offline Resilience</h3>
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
            <span className="text-xs font-semibold text-[#102033] block">Reset Prototype Data</span>
            <span className="text-[11px] text-[#6B7B8F]">
              Restore P-1042, P-1035, and P-1018 to original benchmark state
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
  );
};
