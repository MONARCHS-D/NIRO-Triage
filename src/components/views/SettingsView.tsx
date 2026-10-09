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
} from 'lucide-react';

type SettingsTab =
  | 'facility'
  | 'language'
  | 'notifications'
  | 'accessibility'
  | 'privacy'
  | 'diagnostics';

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

  const [activeTab, setActiveTab] = useState<SettingsTab>('facility');
  const [selectedLanguage, setSelectedLanguage] = useState('odia');
  const [arrivalSoundEnabled, setArrivalSoundEnabled] = useState(true);
  const [urgentVisualAlerts, setUrgentVisualAlerts] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [fontSize, setFontSize] = useState<'standard' | 'large'>('standard');

  const tabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'facility', label: 'Profile & Facility', icon: Hospital },
    { id: 'language', label: 'Language & Speech', icon: Languages },
    { id: 'notifications', label: 'Triage Alerts', icon: Bell },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'privacy', label: 'Privacy & Retention', icon: Lock },
    { id: 'diagnostics', label: 'System Diagnostics', icon: Wrench },
  ];

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
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7-8 cols): Main Settings Form */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
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

              {/* Role & Permissions (RBAC) */}
              <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E6ECF2]">
                  <User className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#102033]">Clinical Role &amp; Access Control</h3>
                    <p className="text-xs text-[#6B7B8F]">
                      Permissions for case approval, referral dispatch, and diagnostic sign-off
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
                    <label className="block font-semibold text-[#25364A] mb-1">Switch Clinical Role:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { role: 'DOCTOR', label: 'Doctor / MO' },
                          { role: 'NURSE', label: 'Triage Nurse' },
                          { role: 'ADMIN', label: 'Admin' },
                          { role: 'HEALTH_WORKER', label: 'CHO / Worker' },
                        ] as const satisfies { role: UserRole; label: string }[]
                      ).map(({ role, label }) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setUserRole(role)}
                          className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
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
            </div>
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
          )}
        </div>

        {/* Right Column (4 cols): Facility Context Illustration */}
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
      </div>
    </div>
  );
};
