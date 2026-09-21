'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { UserRole } from '../../types/roles';
import { Button } from '../common/Button';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import { API_BASE_URL } from '../../lib/api/client';
import { inviteStaff, getInvitedStaffMembers } from '../../lib/api/onboardingService';
import { BackendUserRole, InvitedStaffMember } from '../../lib/api/types';
import {
  Hospital,
  User,
  Database,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
  Server,
  UserPlus,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
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
    isBackendOnline,
    backendLatency,
    refreshBackendHealth,
  } = useRole();
  const { resetToDefaults } = useTriage();

  // Staff invitation state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('+91');
  const [inviteRole, setInviteRole] = useState<BackendUserRole>('DOCTOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');
  const [lastActivationUrl, setLastActivationUrl] = useState<string | null>(null);
  const [invitedList, setInvitedList] = useState<InvitedStaffMember[]>([]);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    setInvitedList(getInvitedStaffMembers());
  }, []);

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    await refreshBackendHealth();
    setIsCheckingHealth(false);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccessMsg('');
    setLastActivationUrl(null);

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please provide both staff member name and official email address.');
      return;
    }

    setIsInviting(true);

    try {
      const res = await inviteStaff({
        fullName: inviteName.trim(),
        email: inviteEmail.trim(),
        phoneNumber: invitePhone.trim(),
        role: inviteRole,
      });

      setInviteSuccessMsg(res.message);
      if (res.activationUrl) {
        setLastActivationUrl(res.activationUrl);
      }
      setInvitedList(getInvitedStaffMembers());

      // Reset form
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('+91');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setInviteError(error.message || 'Failed to dispatch staff invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Ambient subtle technical grid */}
      <AppAmbientGrid opacity={0.03} position="top-right" />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
          Facility &amp; System Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
          Configure facility context, role permissions, staff invitations, and backend API integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Settings Forms */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Facility Configuration */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div className="flex items-center gap-2">
                <Hospital className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Primary Health Facility Context</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Select which health post or hospital unit this workstation is assigned to
                  </p>
                </div>
              </div>
              <Link
                href="/auth/register-facility"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Onboard Facility</span>
              </Link>
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

          {/* Backend API Integration & Connectivity */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Backend API Connectivity</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Spring Boot 3.3 / TriageMitra microservice connection status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleHealthCheck}
                disabled={isCheckingHealth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                title="Ping backend service"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin text-blue-600' : ''}`} />
                <span className="text-[11px] font-medium">Ping</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] space-y-1">
                <span className="text-slate-500 font-medium block">API Target Endpoint:</span>
                <span className="font-mono text-[11px] text-[#102033] font-semibold break-all">
                  {API_BASE_URL}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium block">Live Service Status:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-bold text-[#102033]">
                      {isBackendOnline ? 'Live Connected' : 'Local Prototype Mode'}
                    </span>
                  </div>
                </div>
                {backendLatency !== null && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {backendLatency}ms
                  </span>
                )}
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

          {/* Staff Invitation & Team Management */}
          <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
              <UserPlus className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-sm font-bold text-[#102033]">Clinician &amp; Staff Invitations</h3>
                <p className="text-xs text-[#6B7B8F]">
                  Invite doctors, triage nurses, and health workers to this facility via API
                </p>
              </div>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{inviteSuccessMsg}</span>
                </div>
                {lastActivationUrl && (
                  <div className="pt-1 text-[11px] bg-white p-2.5 rounded border border-emerald-200">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Direct Activation Link (Local Testing):
                    </span>
                    <Link
                      href={lastActivationUrl}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-mono break-all"
                    >
                      <span>{lastActivationUrl}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {inviteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Dr. Ananya Ray"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ananya@health.gov.in"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number (E.164) *</label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="+919876543210"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Assignment *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as BackendUserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-600 text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="DOCTOR">Doctor (Medical Officer)</option>
                    <option value="NURSE">Staff Nurse (Triage Officer)</option>
                    <option value="HEALTH_WORKER">Community Health Officer (CHO)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isInviting ? 'Inviting Staff…' : 'Send Invitation via API'}</span>
                </button>
              </div>
            </form>

            {/* Invited Staff Queue */}
            {invitedList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Pending &amp; Invited Staff ({invitedList.length})
                </span>
                <div className="space-y-1.5">
                  {invitedList.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#102033] block">{member.fullName}</span>
                        <span className="text-[11px] text-slate-500">
                          {member.email} · {member.role}
                        </span>
                      </div>
                      {member.activationUrl && (
                        <Link
                          href={member.activationUrl}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition-colors"
                        >
                          Activate →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
