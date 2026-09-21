'use client';

import React from 'react';
import {
  Search,
  Bell,
  Hospital,
  ChevronDown,
  User,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { UserRole } from '../../types/roles';

export const Topbar: React.FC = () => {
  const {
    currentUser,
    currentFacility,
    facilities,
    setCurrentFacility,
    setUserRole,
    isOffline,
    setIsOffline,
    isBackendOnline,
  } = useRole();
  const { searchQuery, setSearchQuery, resetToDefaults } = useTriage();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E6ECF2] shadow-xs">
      {/* Top operational disclaimer banner */}
      <div className="bg-[#102033] text-white text-[11px] px-4 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Educational prototype — triage-support only. Not a medical diagnosis or treatment system.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="hidden sm:inline">Retention: session-scoped (Synthetic Data)</span>
          <button
            onClick={resetToDefaults}
            title="Reset synthetic data to default state"
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Demo
          </button>
        </div>
      </div>

      {/* Main Topbar Row */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7B8F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, ID (e.g. P-1042), chief complaint..."
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-md border border-[#E6ECF2] bg-[#F8FAFC] text-[#102033] placeholder-[#6B7B8F] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-all"
          />
        </div>

        {/* Action Controls & Switchers */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Facility Selector */}
          <div className="relative flex items-center">
            <label htmlFor="facility-select" className="sr-only">Select Facility</label>
            <Hospital className="w-4 h-4 text-[#6B7B8F] absolute left-2.5 pointer-events-none" />
            <select
              id="facility-select"
              value={currentFacility.id}
              onChange={(e) => {
                const found = facilities.find((f) => f.id === e.target.value);
                if (found) setCurrentFacility(found);
              }}
              className="pl-8 pr-7 py-1.5 text-xs font-medium bg-[#F8FAFC] border border-[#E6ECF2] rounded-md text-[#25364A] hover:border-slate-300 focus:outline-none cursor-pointer appearance-none max-w-[180px] truncate"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7B8F] absolute right-2 pointer-events-none" />
          </div>

          {/* Role Switcher (Section 21) */}
          <div className="relative flex items-center">
            <label htmlFor="role-select" className="sr-only">Select Role</label>
            <User className="w-3.5 h-3.5 text-[#2563EB] absolute left-2.5 pointer-events-none" />
            <select
              id="role-select"
              value={currentUser.role}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="pl-7 pr-7 py-1.5 text-xs font-semibold bg-[#E8F0FF] border border-blue-200 rounded-md text-[#164FD6] hover:bg-blue-100 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="DOCTOR">Doctor (Medical Officer)</option>
              <option value="NURSE">Staff Nurse</option>
              <option value="HEALTH_WORKER">Health Worker (CHO)</option>
              <option value="PATIENT">Patient View</option>
              <option value="ADMIN">Facility Admin</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#164FD6] absolute right-2 pointer-events-none" />
          </div>

          {/* Backend Connection Status Badge */}
          <div
            title={
              isBackendOnline
                ? 'Connected to Spring Boot backend (port 9090)'
                : 'Local prototype mode (backend offline)'
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border ${
              isBackendOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px]">
              {isBackendOnline ? 'Backend: 9090' : 'Demo Mode'}
            </span>
          </div>

          {/* Offline Mode Toggle Button */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            title={isOffline ? 'Offline Mode Active' : 'Online Mode Active'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isOffline
                ? 'bg-[#FFF6DD] border-[#FDE68A] text-[#996500]'
                : 'bg-[#F8FAFC] border-[#E6ECF2] text-[#526276] hover:bg-slate-100'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-[#D99A18]" />
                <span className="hidden md:inline">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Online</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
