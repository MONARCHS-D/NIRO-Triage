'use client';

import React, { useState } from 'react';
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
  Cloud,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { DEMO_MODE } from '../../lib/api/config';
import { useTriage } from '../../context/TriageContext';
import { UserRole } from '../../types/roles';
import { BackendHealthBadge } from '../common/BackendHealthBadge';
import { SyncOutboxDrawer } from '../common/SyncOutboxDrawer';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from '../../context/NotificationContext';

export const Topbar: React.FC = () => {
  const {
    currentUser,
    currentFacility,
    facilities,
    setCurrentFacility,
    setUserRole,
    isOffline,
    setIsOffline,
  } = useRole();
  const { searchQuery, setSearchQuery, resetToDefaults, outbox } = useTriage();
  const { simulateIncomingArrival } = useNotifications();
  const [showOutbox, setShowOutbox] = useState(false);
  const pendingSyncCount = outbox ? outbox.filter((i) => i.status !== 'synced').length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E6ECF2] shadow-xs">
      {/* Top operational disclaimer banner */}
      <div className="bg-[#102033] text-white text-[11px] px-4 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Educational prototype — triage-support only. Not a medical diagnosis or treatment system.</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          {DEMO_MODE && <button
            onClick={() => simulateIncomingArrival('RED')}
            title="Trigger a real-time emergency arrival popup on the right side"
            className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors cursor-pointer text-[11px] font-semibold"
          >
            <Bell className="w-3 h-3 text-amber-400" />
            <span>Simulate Arrival</span>
          </button>}
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden sm:inline">{DEMO_MODE ? 'Synthetic demo data' : 'Authorized document evidence'}</span>
          {DEMO_MODE && <button
            onClick={resetToDefaults}
            title="Reset synthetic data to default state"
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Demo
          </button>}
        </div>
      </div>

      {/* Main Topbar Row */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7B8F]" />
          <input
            id="global-patient-search"
            name="global-patient-search"
            type="text"
            aria-label="Search patient name, ID, or chief complaint"
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
              disabled={!DEMO_MODE}
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
 
          {/* Triage Notifications & Emergency Arrival Bell */}
          <NotificationBell />

          {/* Live Backend Health & Database Connectivity Badge */}
          <BackendHealthBadge />

          {/* Offline Outbox Sync Pill */}
          <button
            onClick={() => setShowOutbox(true)}
            title="Open Offline Sync Outbox"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              pendingSyncCount > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-[#996500] border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            <Cloud className={`w-3.5 h-3.5 ${pendingSyncCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">
              {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'Synced'}
            </span>
          </button>

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

      {/* Sync Outbox Sliding Drawer */}
      <SyncOutboxDrawer open={showOutbox} onClose={() => setShowOutbox(false)} />
    </header>
  );
};
