'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { UserRole } from '../../types/roles';
import { Button } from '../common/Button';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import { BackendHealthBadge } from '../common/BackendHealthBadge';
import {
  ShieldCheck,
  Hospital,
  User,
  Database,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
  Languages,
  Bell,
  Eye,
  Lock,
  Wrench,
  Sliders,
  CheckCircle2,
  Volume2,
  Users,
  UserPlus,
  ShieldAlert,
  Trash2,
  UserCheck,
  Shield,
  Search,
  Building2,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { GrantAccessModal } from './GrantAccessModal';
import { AccountStatusBadge } from '../common/rbac/AccountStatusBadge';

type SettingsTab =
  | 'facility'
  | 'users'
  | 'language'
  | 'notifications'
  | 'accessibility'
  | 'privacy'
  | 'diagnostics';

interface RoleMatrixItem {
  role: UserRole;
  title: string;
  scope: string;
  authority: string;
  decisionRights: string[];
  badgeColor: string;
  dotColor: string;
  permissionCount: number;
  keyPermissions: string[];
  description: string;
}

const ROLE_MATRIX_DEFINITIONS: RoleMatrixItem[] = [
  {
    role: 'ADMIN',
    title: 'Facility Administrator (System)',
    scope: 'System & Institutional Operations',
    authority: 'Full Administrative & Clinical Emergency Oversight',
    decisionRights: ['System Administration', 'Audit Forensics', 'Staff Provisioning', 'Emergency Override'],
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500',
    permissionCount: 26,
    keyPermissions: ['manage:users', 'manage:system', 'recipient:manage', 'case:*', 'evidence:*', 'ai:*', 'review:*'],
    description: 'Statutory authority to provision clinical credentials, configure diagnostic routing, and govern facility access.',
  },
  {
    role: 'DOCTOR',
    title: 'Medical Officer / Attending Physician',
    scope: 'Primary Health Center (PHC/CHC)',
    authority: 'Authoritative Clinical Sign-off & AI Advisory Acceptance',
    decisionRights: ['Run Advisory AI', 'Accept AI Drafts', 'Priority Override', 'Final Note Sign-off', 'Referral Dispatch'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
    permissionCount: 23,
    keyPermissions: ['ai:write', 'review:write', 'escalation:write', 'referral:write', 'handoff:write', 'case:write'],
    description: 'Senior medical practitioner legally authorized to finalize case decisions, accept AI differential drafts, and dispatch patient referrals.',
  },
  {
    role: 'NURSE',
    title: 'Staff Nurse Grade-I',
    scope: 'Outpatient & Acute Triage Desk',
    authority: 'Bedside Intake, Vital Sign Monitoring & Observations',
    decisionRights: ['Patient Intake', 'Vital Capture', 'Audit Notes', 'Observation Logging'],
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    dotColor: 'bg-teal-500',
    permissionCount: 11,
    keyPermissions: ['case:read', 'case:write', 'evidence:read', 'evidence:write', 'review:read', 'review:write'],
    description: 'Performs patient triage, enters vital telemetry, extracts diagnostic lab reports, and appends nursing assessment notes.',
  },
  {
    role: 'HEALTH_WORKER',
    title: 'Community Health Officer (CHO)',
    scope: 'Sub-Centre & Rural Camp Outreach',
    authority: 'Frontline Screening & Multimodal Voice Intake',
    decisionRights: ['Multimodal Intake', 'Voice/Speech Capture', 'Demographics', 'Consent Capture'],
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dotColor: 'bg-indigo-500',
    permissionCount: 9,
    keyPermissions: ['case:read', 'case:write', 'consent:read', 'consent:write', 'evidence:read', 'evidence:write'],
    description: 'Collects vernacular patient speech recordings, registers primary symptoms, and routes preliminary observations to attending physicians.',
  },
  {
    role: 'PATIENT',
    title: 'Citizen Portal / Mobile View',
    scope: 'Patient Self-Service',
    authority: 'Self-reported Symptoms & Informed Consent',
    decisionRights: ['Self-Report Intake', 'Consent Verification', 'Queue Tracking'],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    permissionCount: 0,
    keyPermissions: ['consent:read', 'consent:write', 'case:read'],
    description: 'Allows patients to verify digital consent, self-report non-urgent symptoms, and monitor their active triage queue position.',
  },
];

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    currentFacility,
    facilities,
    users,
    setCurrentFacility,
    setUserRole,
    updateStaffRole,
    toggleStaffStatus,
    deleteStaffMember,
    isOffline,
    setIsOffline,
    capabilities,
  } = useRole();
  const { resetToDefaults } = useTriage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('facility');
  const [selectedLanguage, setSelectedLanguage] = useState('odia');
  const [arrivalSoundEnabled, setArrivalSoundEnabled] = useState(true);
  const [urgentVisualAlerts, setUrgentVisualAlerts] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [fontSize, setFontSize] = useState<'standard' | 'large'>('standard');

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }[] = [
    { id: 'facility', label: 'Profile & Facility', icon: Hospital },
    { id: 'users', label: 'Staff & Access', icon: Users, adminOnly: true },
    { id: 'language', label: 'Language & Speech', icon: Languages },
    { id: 'notifications', label: 'Triage Alerts', icon: Bell },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'privacy', label: 'Privacy & Retention', icon: Lock },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Wrench, adminOnly: true },
  ];

  const filteredStaff = users.filter((u) => {
    const matchesRole = staffRoleFilter === 'ALL' || u.role === staffRoleFilter;
    const q = staffSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.registrationNumber && u.registrationNumber.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-6 relative overflow-hidden">
      <AppAmbientGrid opacity={0.03} position="top-right" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
            Workstation Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Configure clinical workstation preferences, facility routing, and system diagnostics
          </p>
        </div>
        <BackendHealthBadge />
      </div>

      {/* Settings Navigation Tabs */}
      <div className="border-b border-[#E6ECF2] bg-white rounded-t-xl px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-[#164FD6]'
                    : 'border-transparent text-[#526276] hover:text-[#102033] hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#6B7B8F]'}`}
                />
                <span>{tab.label}</span>
                {tab.adminOnly && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      capabilities.canManageSettings
                        ? 'bg-blue-100 text-[#164FD6]'
                        : 'bg-slate-100 text-[#6B7B8F]'
                    }`}
                  >
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Settings Form Column */}
        <div className={activeTab === 'users' ? 'lg:col-span-12 space-y-6' : 'lg:col-span-7 xl:col-span-8 space-y-6'}>
          {/* TAB 1: FACILITY & PROFILE */}
          {activeTab === 'facility' && (
            <div className="space-y-6">
              {/* Primary Facility Selection */}
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                  <Hospital className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">Primary Health Facility Context</h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Active facility context for intake routing, triage registry, and inter-facility handoffs
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

              {/* Role & Practitioner Credentials (RBAC Read-Only) */}
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6ECF2]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#102033]">Authenticated Practitioner Credentials</h3>
                      <p className="text-xs text-[#6B7B8F]">
                        Cryptographically verified session credentials under National Health Service / ABDM Clinical Governance
                      </p>
                    </div>
                  </div>
                  <AccountStatusBadge status={currentUser.status || 'ACTIVE'} variant="credentials" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Practitioner Name</span>
                    <span className="font-semibold text-[#102033] text-sm block mt-0.5">{currentUser.name}</span>
                    <span className="text-[11px] text-[#526276]">{currentUser.email || `${currentUser.id.toLowerCase()}@careintel.local`}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Assigned Clinical Role</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-[#164FD6]">
                        <Shield className="w-3 h-3" />
                        {currentUser.role === 'DOCTOR'
                          ? 'Medical Officer / Attending Physician'
                          : currentUser.role === 'NURSE'
                          ? 'Triage Nurse Grade-I'
                          : currentUser.role === 'ADMIN'
                          ? 'Facility System Administrator'
                          : currentUser.role === 'HEALTH_WORKER'
                          ? 'Community Health Officer (CHO)'
                          : 'Patient Portal'}
                      </span>
                      {currentUser.status === 'SUSPENDED' && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          Suspended
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B7B8F] block mt-1">System Identifier: <code className="font-mono text-[#2563EB]">{currentUser.id}</code></span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Medical Council Registration</span>
                    <span className="font-mono font-semibold text-[#102033] block mt-0.5">
                      {currentUser.registrationNumber || 'MCI/DMC-74921-A'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Verified against ABDM HPR Registry</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Department &amp; Facility Posting</span>
                    <span className="font-semibold text-[#102033] block mt-0.5">
                      {currentUser.department || 'Emergency Medicine & Triage'}
                    </span>
                    <span className="text-[10px] text-[#6B7B8F] truncate block">
                      {currentFacility.name}
                    </span>
                  </div>
                </div>

                {currentUser.status === 'SUSPENDED' ? (
                  <div className="p-3.5 rounded-lg bg-rose-50/80 border border-rose-200 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-rose-950 block">Practitioner Account Suspended</span>
                      <p className="text-rose-800 text-[11px] leading-relaxed">
                        Clinical write actions are restricted for this practitioner profile. You may continue to view permitted historical patient records, evidence reports, and queue benchmarks. Contact your facility administrator to restore clinical authority.
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-2 text-[10px] font-medium text-rose-900">
                        <span className="px-2 py-0.5 rounded bg-rose-100/90 border border-rose-200">
                          Clinical access: Suspended
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-100/90 border border-rose-200">
                          Clinical permissions: Restricted (Read-only)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-100/90 border border-rose-200">
                          Reactivation: Facility Administrator required
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <BadgeCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#102033] block">Clinical Governance &amp; Privilege Enforcement</span>
                        <p className="text-[#526276] text-[11px] leading-relaxed">
                          Practitioner clinical roles are centrally provisioned by facility administration. Self-reassignment of clinical credentials is prohibited under institutional medical safety protocols.
                        </p>
                      </div>
                    </div>
                    {capabilities.canManageSettings && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold text-xs hover:bg-[#164FD6] transition-colors cursor-pointer"
                      >
                        Manage Staff Directory →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: STAFF & ACCESS MANAGEMENT (ADMIN RBAC) */}
          {activeTab === 'users' && (
            !capabilities.canManageSettings ? (
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#102033]">Administrator Authorization Required</h3>
                <p className="text-xs text-[#526276] max-w-md mx-auto leading-relaxed">
                  Practitioner access provisioning, clinical credentialing, and role-based access control are restricted to Facility System Administrators (RBAC <code className="bg-slate-100 px-1 py-0.5 rounded text-[#25364A] font-mono">manage:users</code>).
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-[#6B7B8F]">
                    Your active session role is <strong className="text-[#102033]">{currentUser.title || currentUser.role}</strong>. Please consult the Facility Medical Director to request administrative elevation.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6ECF2] shadow-xs">
                    <span className="text-[11px] font-bold text-[#6B7B8F] uppercase block">Total Staff</span>
                    <span className="text-xl font-bold text-[#102033] block mt-0.5">{users.length}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Provisioned in Registry</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6ECF2] shadow-xs">
                    <span className="text-[11px] font-bold text-[#6B7B8F] uppercase block">System Admins</span>
                    <span className="text-xl font-bold text-purple-600 block mt-0.5">
                      {users.filter((u) => u.role === 'ADMIN' && u.status !== 'SUSPENDED').length}
                    </span>
                    <span className="text-[10px] text-[#526276]">Security &amp; IT Governance</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6ECF2] shadow-xs">
                    <span className="text-[11px] font-bold text-[#6B7B8F] uppercase block">Medical Officers</span>
                    <span className="text-xl font-bold text-[#2563EB] block mt-0.5">
                      {users.filter((u) => u.role === 'DOCTOR' && u.status !== 'SUSPENDED').length}
                    </span>
                    <span className="text-[10px] text-[#526276]">Advisory &amp; Sign-off</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6ECF2] shadow-xs">
                    <span className="text-[11px] font-bold text-[#6B7B8F] uppercase block">Triage Nurses</span>
                    <span className="text-xl font-bold text-teal-600 block mt-0.5">
                      {users.filter((u) => u.role === 'NURSE' && u.status !== 'SUSPENDED').length}
                    </span>
                    <span className="text-[10px] text-[#526276]">Vitals &amp; Intake</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6ECF2] shadow-xs">
                    <span className="text-[11px] font-bold text-[#6B7B8F] uppercase block">CHOs &amp; Frontline</span>
                    <span className="text-xl font-bold text-indigo-600 block mt-0.5">
                      {users.filter((u) => u.role === 'HEALTH_WORKER' && u.status !== 'SUSPENDED').length}
                    </span>
                    <span className="text-[10px] text-[#526276]">Community Screening</span>
                  </div>
                </div>

                {/* Staff Directory Main Card */}
                <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
                  {/* Top Bar */}
                  <div className="p-5 border-b border-[#E6ECF2] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#2563EB]" />
                        <h3 className="text-sm font-bold text-[#102033]">
                          Practitioner Staff Directory &amp; RBAC Control
                        </h3>
                      </div>
                      <p className="text-xs text-[#6B7B8F] mt-0.5">
                        Provision credentials, assign clinical roles, and govern access across {currentFacility.name}
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowGrantModal(true)}
                      icon={<UserPlus className="w-4 h-4" />}
                      className="shrink-0"
                    >
                      Grant Access / Add Staff
                    </Button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="p-4 bg-[#F8FAFC] border-b border-[#E6ECF2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7B8F]" />
                      <input
                        type="text"
                        placeholder="Search by name, email, reg number, department..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-[#102033] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          { key: 'ALL', label: 'All Roles' },
                          { key: 'DOCTOR', label: 'Doctors' },
                          { key: 'NURSE', label: 'Nurses' },
                          { key: 'HEALTH_WORKER', label: 'CHOs' },
                          { key: 'ADMIN', label: 'Admins' },
                        ] as const
                      ).map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setStaffRoleFilter(filter.key)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            staffRoleFilter === filter.key
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white border border-slate-200 text-[#526276] hover:bg-slate-50'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Staff Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F1F5F9] text-[#526276] font-semibold border-b border-[#E6ECF2]">
                        <tr>
                          <th className="py-3 px-4">Practitioner Details</th>
                          <th className="py-3 px-4">Medical Reg No. &amp; Dept</th>
                          <th className="py-3 px-4">Clinical Role (RBAC)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6ECF2]">
                        {filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-[#6B7B8F]">
                              No practitioners found matching &quot;{staffSearchQuery}&quot;
                            </td>
                          </tr>
                        ) : (
                          filteredStaff.map((u) => {
                            const isCurrentUser = u.id === currentUser.id;
                            const isSuspended = u.status === 'SUSPENDED';

                            return (
                              <tr
                                key={u.id}
                                className={`hover:bg-[#F8FAFC] transition-colors ${
                                  isSuspended ? 'opacity-60 bg-slate-50/50' : ''
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#164FD6] font-bold flex items-center justify-center shrink-0 text-xs">
                                      {u.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-[#102033] flex items-center gap-1.5">
                                        <span>{u.name}</span>
                                        {isCurrentUser && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-[#164FD6]">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-[#6B7B8F] block">
                                        {u.email || `${u.id.toLowerCase()}@careintel.local`}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <span className="font-mono text-[#102033] font-medium block">
                                    {u.registrationNumber || 'N/A'}
                                  </span>
                                  <span className="text-[11px] text-[#6B7B8F] block">
                                    {u.department || 'General Clinical'}
                                  </span>
                                </td>

                                <td className="py-3 px-4">
                                  <select
                                    value={u.role}
                                    disabled={isCurrentUser}
                                    onChange={(e) => updateStaffRole(u.id, e.target.value as UserRole)}
                                    title={isCurrentUser ? 'You cannot alter your own administrative role' : 'Reassign clinical role'}
                                    className={`py-1 px-2 rounded-lg border text-xs font-medium cursor-pointer ${
                                      isCurrentUser
                                        ? 'bg-slate-100 text-[#6B7B8F] border-slate-200 cursor-not-allowed'
                                        : 'bg-white text-[#102033] border-slate-300 hover:border-[#2563EB]'
                                    }`}
                                  >
                                    <option value="DOCTOR">Doctor (Full Sign-off)</option>
                                    <option value="NURSE">Staff Nurse (Intake &amp; Vitals)</option>
                                    <option value="ADMIN">Facility Admin (System)</option>
                                    <option value="HEALTH_WORKER">CHO (Frontline Intake)</option>
                                    <option value="PATIENT">Patient (Portal)</option>
                                  </select>
                                </td>

                                <td className="py-3 px-4">
                                  {isSuspended ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Suspended
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Active
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isCurrentUser}
                                      onClick={() => toggleStaffStatus(u.id)}
                                      title={
                                        isCurrentUser
                                          ? 'Cannot suspend active session user'
                                          : isSuspended
                                          ? 'Reactivate practitioner access'
                                          : 'Suspend practitioner access'
                                      }
                                      className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                                        isCurrentUser
                                          ? 'opacity-40 cursor-not-allowed border-slate-200 text-[#94A3B8]'
                                          : isSuspended
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                      }`}
                                    >
                                      {isSuspended ? (
                                        <UserCheck className="w-3.5 h-3.5" />
                                      ) : (
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isCurrentUser}
                                      onClick={() => {
                                        if (confirm(`Revoke credentials and remove ${u.name} from facility directory?`)) {
                                          deleteStaffMember(u.id);
                                        }
                                      }}
                                      title={isCurrentUser ? 'Cannot delete active session user' : 'Revoke credentials'}
                                      className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                                        isCurrentUser
                                          ? 'opacity-40 cursor-not-allowed border-slate-200 text-[#94A3B8]'
                                          : 'border-slate-200 text-[#6B7B8F] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                      }`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ABDM Compliance Footer */}
                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E6ECF2] flex items-center gap-2 text-[11px] text-[#6B7B8F]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Access audit logs are cryptographically sealed. Practitioner role adjustments take effect across active triage stations immediately.
                    </span>
                  </div>
                </div>

                {/* Statutory Role-Based Access Control (RBAC) Permissions Matrix Table */}
                <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-[#E6ECF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#2563EB]" />
                        <h3 className="text-sm font-bold text-[#102033]">
                          Statutory Role Permissions Matrix (RBAC Contract)
                        </h3>
                      </div>
                      <p className="text-xs text-[#6B7B8F] mt-0.5">
                        Authoritative clinical decision entitlements, AI execution rights, and backend migration 0015 permission mappings
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      PostgreSQL Engine · Enforced
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F1F5F9] text-[#526276] font-semibold border-b border-[#E6ECF2]">
                        <tr>
                          <th className="py-3 px-4">Role Persona &amp; Governance Scope</th>
                          <th className="py-3 px-4">Clinical Decision Rights</th>
                          <th className="py-3 px-4">Key RBAC Entitlements</th>
                          <th className="py-3 px-4 text-center">Perm Count</th>
                          <th className="py-3 px-4 text-right">Statutory Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6ECF2]">
                        {ROLE_MATRIX_DEFINITIONS.map((def) => {
                          const isAdmin = def.role === 'ADMIN';
                          return (
                            <tr
                              key={def.role}
                              className={`hover:bg-[#F8FAFC] transition-colors ${
                                isAdmin ? 'bg-purple-50/40' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${def.badgeColor}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${def.dotColor}`} />
                                      {def.title}
                                    </span>
                                    {isAdmin && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">
                                        Primary Row
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#526276] leading-relaxed max-w-xs">
                                    {def.description}
                                  </p>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {def.decisionRights.map((right) => (
                                    <span
                                      key={right}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-[#25364A]"
                                    >
                                      {right}
                                    </span>
                                  ))}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                  {def.keyPermissions.map((perm) => (
                                    <code
                                      key={perm}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[#164FD6] border border-blue-100"
                                    >
                                      {perm}
                                    </code>
                                  ))}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-[#102033]">
                                  {def.permissionCount}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <span className="text-[11px] font-semibold text-[#526276] block">
                                  {def.scope}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E6ECF2] flex items-center justify-between text-[11px] text-[#6B7B8F]">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Role permissions are enforced server-side on every API request. Zero-trust boundary applied.</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#526276]">CareIntel RBAC 0015 Standard</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: LANGUAGE & SPEECH */}
          {activeTab === 'language' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                <Languages className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Regional Language &amp; Speech Model</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Configure regional speech recognition engines and vernacular intake translation
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#25364A] mb-1.5">
                    Primary Regional Intake Language:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'odia', name: 'Odia (ଓଡ଼ିଆ)', note: 'Primary Odisha PHC default' },
                      { id: 'hindi', name: 'Hindi (हिन्दी)', note: 'National fallback' },
                      { id: 'english', name: 'English', note: 'Standard clinical record' },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.id)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedLanguage === lang.id
                            ? 'border-[#2563EB] bg-blue-50/60 shadow-xs'
                            : 'border-[#E6ECF2] bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-[#102033] block">{lang.name}</span>
                        <span className="text-[11px] text-[#6B7B8F] mt-0.5 block">{lang.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-xs space-y-1">
                  <span className="font-semibold text-[#102033]">AI Translation &amp; Entity Extraction:</span>
                  <p className="text-[#526276]">
                    Regional speech inputs are transcribed in native script and automatically synthesized into structured English clinical notes for attending physicians.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRIAGE ALERTS & NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                <Bell className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Clinical Urgency Alerts &amp; Toasts</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Manage real-time notifications for incoming urgent arrivals and critical risk signals
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                  <div>
                    <span className="font-bold text-[#102033] block">Arrival Audio Chime</span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      Play subtle audible alert when a new Priority 1 (Red) patient arrives at intake
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={arrivalSoundEnabled}
                    onChange={(e) => setArrivalSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                  <div>
                    <span className="font-bold text-[#102033] block">Arrival Toast Notifications</span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      Display non-intrusive arrival banner in the top-right corner with direct case link
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={urgentVisualAlerts}
                    onChange={(e) => setUrgentVisualAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Workstation Display &amp; Legibility</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Optimize visual contrast and typography density for diverse clinic lighting conditions
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                  <div>
                    <span className="font-bold text-[#102033] block">High Contrast Mode</span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      Increases border contrast and status chip saturation for outdoor or glare environments
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrastMode}
                    onChange={(e) => setHighContrastMode(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#25364A] mb-1.5">Workstation Typography Density:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFontSize('standard')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        fontSize === 'standard'
                          ? 'border-[#2563EB] bg-blue-50/60'
                          : 'border-[#E6ECF2] bg-white'
                      }`}
                    >
                      <span className="font-bold text-[#102033] block">Compact Clinical (Default)</span>
                      <span className="text-[11px] text-[#6B7B8F]">High density for triage desks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('large')}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        fontSize === 'large'
                          ? 'border-[#2563EB] bg-blue-50/60'
                          : 'border-[#E6ECF2] bg-white'
                      }`}
                    >
                      <span className="font-bold text-[#102033] block">Expanded Legibility</span>
                      <span className="text-[11px] text-[#6B7B8F]">Larger text for tablet inspection</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & RETENTION */}
          {activeTab === 'privacy' && (
            <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                <Lock className="w-5 h-5 text-[#2563EB]" />
                <div>
                  <h3 className="text-sm font-bold text-[#102033]">Data Protection &amp; Patient Consent</h3>
                  <p className="text-xs text-[#6B7B8F]">
                    Local retention periods, FHIR record security, and consent verification policies
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] space-y-1">
                  <span className="font-bold text-[#102033] block">Informed Consent Protocol</span>
                  <p className="text-[#526276]">
                    Frontline health workers must verbally confirm patient/guardian consent prior to voice recording and optical document intake.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] space-y-1">
                  <span className="font-bold text-[#102033] block">Local Cache Data Purging</span>
                  <p className="text-[#526276]">
                    Audio recordings cached in offline browser IndexedDB are securely purged 24 hours after verified cloud synchronization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN SYSTEM DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            !capabilities.canAccessDiagnostics ? (
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#102033]">Administrator Authorization Required</h3>
                <p className="text-xs text-[#526276] max-w-md mx-auto leading-relaxed">
                  System telemetry, engine diagnostics, and infrastructure configuration are restricted to Facility Administrators. Your active role ({currentUser.title || currentUser.role}) has clinical workstation access.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Technical Infrastructure Card */}
                <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#2563EB]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#102033]">CareIntel Cloud &amp; Engine Telemetry</h3>
                      <p className="text-xs text-[#6B7B8F]">
                        Direct technical parameters for clinical IT administrators
                      </p>
                    </div>
                  </div>
                  <BackendHealthBadge />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">Database</span>
                    <span className="font-semibold text-[#102033] block mt-0.5">Supabase PostgreSQL</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Encrypted SSL Connection</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">API Engine</span>
                    <span className="font-semibold text-[#102033] block mt-0.5">FastAPI Core v1</span>
                    <span className="text-[10px] text-blue-600 font-medium">REST + Celery Worker</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
                    <span className="text-[10px] font-bold text-[#6B7B8F] uppercase block">AI &amp; Speech</span>
                    <span className="font-semibold text-[#102033] block mt-0.5">Multimodal Pipeline</span>
                    <span className="text-[10px] text-purple-600 font-medium">Whisper + Triage Structuring</span>
                  </div>
                </div>
              </div>

              {/* Low-Bandwidth & Offline Resilience */}
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                  <WifiOff className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">Resilient Offline Queue Simulation</h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Simulates complete network isolation for field testing and remote clinic validation
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-[#102033] block">Simulate Offline Mode</span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      Forces local triage memory and caches all outbound updates in local outbox
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
                    <span className="text-xs font-semibold text-[#102033] block">Reset Prototype Benchmark Cases</span>
                    <span className="text-[11px] text-[#6B7B8F]">
                      Restore original clinic benchmark patients if demo modifications need resetting
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetToDefaults}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Reset Benchmark Cases
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
        </div>

        {/* Right Column (4 cols): Facility Context Illustration */}
        {activeTab !== 'users' && (
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
        )}
      </div>

      <GrantAccessModal
        open={showGrantModal}
        onClose={() => setShowGrantModal(false)}
      />
    </div>
  );
};
