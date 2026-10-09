'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  AlertTriangle,
  UserPlus,
  Sparkles,
  ArrowRight,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useTriage } from '../../context/TriageContext';
import { TriageNotification, VitalEvidenceItem } from '../../types/notifications';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    urgentUnreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    toggleSound,
    simulateIncomingArrival,
  } = useNotifications();

  const { setSelectedPatientId } = useTriage();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'ARRIVALS' | 'AI'>('ALL');
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDemoMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowDemoMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'URGENT') return notif.priority === 'RED' || notif.type === 'URGENT_TRIAGE_ALERT';
    if (filter === 'ARRIVALS')
      return notif.type === 'PATIENT_ARRIVAL' || notif.title.toLowerCase().includes('arrival') || notif.title.toLowerCase().includes('intake');
    if (filter === 'AI') return notif.type === 'AI_EVALUATION_READY';
    return true;
  });

  // Separate into Urgent vs Recent groups for clean clinical hierarchy
  const urgentGroup = filteredNotifications.filter(
    (n) => n.priority === 'RED' || n.type === 'URGENT_TRIAGE_ALERT'
  );
  const recentGroup = filteredNotifications.filter(
    (n) => n.priority !== 'RED' && n.type !== 'URGENT_TRIAGE_ALERT'
  );

  const urgentTotal = notifications.filter((n) => n.priority === 'RED' || n.type === 'URGENT_TRIAGE_ALERT').length;
  const arrivalsTotal = notifications.filter((n) => n.type === 'PATIENT_ARRIVAL' || n.title.toLowerCase().includes('intake')).length;
  const aiTotal = notifications.filter((n) => n.type === 'AI_EVALUATION_READY').length;

  const handleOpenCase = (notif: TriageNotification) => {
    markAsRead(notif.id);
    if (notif.patientId) {
      setSelectedPatientId(notif.patientId);
      router.push(`/patients/${notif.patientId}`);
    }
    setIsOpen(false);
  };

  const renderEvidenceChips = (vitals?: VitalEvidenceItem[], snippet?: string) => {
    if (vitals && vitals.length > 0) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {vitals.map((v, i) => (
            <span
              key={i}
              className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                v.isCritical
                  ? 'bg-red-50 text-red-700 border-red-300 font-bold ring-1 ring-red-400/20'
                  : v.isAbnormal
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span className="opacity-75">{v.label}</span>{' '}
              <span className="font-semibold">{v.value}</span>
            </span>
          ))}
        </div>
      );
    }
    if (snippet) {
      return (
        <div className="mt-2 text-[11px] font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded inline-block">
          {snippet}
        </div>
      );
    }
    return null;
  };

  const renderNotificationCard = (notif: TriageNotification, isUrgentCard: boolean) => {
    const isUnread = !notif.isRead;

    return (
      <div
        key={notif.id}
        onClick={() => handleOpenCase(notif)}
        className={`group p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative ${
          isUrgentCard
            ? 'border-red-200 bg-gradient-to-br from-red-50/30 via-white to-white hover:border-red-300 hover:shadow-md'
            : isUnread
            ? 'border-blue-200 bg-blue-50/20 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-xs'
            : 'border-[#E6ECF2] bg-white hover:border-slate-300 hover:shadow-xs'
        }`}
      >
        {/* Top Meta Line: Status Indicator + Category + Timestamp */}
        <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
          <div className="flex items-center gap-2">
            {/* Tiny unread indicator dot (calm, non-flashing) */}
            {isUnread ? (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isUrgentCard ? 'bg-red-500' : 'bg-[#164FD6]'
                }`}
                title="Unread notification"
              />
            ) : (
              <span className="w-2 h-2 rounded-full shrink-0 bg-transparent" />
            )}

            {/* Category / Event Type Badge */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isUrgentCard
                  ? 'bg-red-100 text-red-800'
                  : notif.type === 'PATIENT_ARRIVAL'
                  ? 'bg-amber-100 text-amber-900'
                  : notif.type === 'AI_EVALUATION_READY'
                  ? 'bg-purple-100 text-purple-900'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {isUrgentCard
                ? 'URGENT'
                : notif.type === 'PATIENT_ARRIVAL'
                ? 'NEW INTAKE'
                : notif.type === 'AI_EVALUATION_READY'
                ? 'AI EVALUATION'
                : 'CLINICAL EVENT'}
            </span>
          </div>

          {/* Quiet, clean timestamp + per-card mark as read */}
          <div className="flex items-center gap-2">
            {isUnread && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notif.id);
                }}
                className="text-[10px] font-medium text-slate-500 hover:text-slate-800 hover:underline px-1 py-0.5 rounded cursor-pointer"
                title="Mark this notification as read"
              >
                Mark read
              </button>
            )}
            <span className="text-[11px] text-[#6B7B8F] font-medium shrink-0">
              {notif.timestamp}
            </span>
          </div>
        </div>

        {/* Title row with clinical icon */}
        <div className="flex items-start gap-2.5 mt-1">
          <div className="mt-0.5 shrink-0">
            {isUrgentCard ? (
              <div className="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
            ) : notif.type === 'PATIENT_ARRIVAL' ? (
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
            ) : notif.type === 'AI_EVALUATION_READY' ? (
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-[#102033] leading-snug">
              {notif.title}
            </h4>

            {/* Content summary: dark legible clinical text */}
            <p className="text-xs text-[#334155] leading-relaxed mt-1 font-normal">
              {notif.message}
            </p>

            {/* Confidence metric if present */}
            {notif.confidenceSnippet && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-purple-700 font-medium">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{notif.confidenceSnippet}</span>
              </div>
            )}

            {/* Evidence Chips */}
            {renderEvidenceChips(notif.vitalsEvidence, notif.vitalsSnippet)}

            {/* Patient Context & Open Action Row */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 truncate text-[#102033]">
                {notif.patientName ? (
                  <>
                    <span className="font-semibold truncate">{notif.patientName}</span>
                    <span className="text-[#6B7B8F] font-mono text-[11px]">· {notif.patientId}</span>
                    {notif.patientAge && notif.patientGender && (
                      <span className="hidden sm:inline text-[#6B7B8F] text-[11px]">
                        ({notif.patientAge}y/{notif.patientGender[0]})
                      </span>
                    )}
                  </>
                ) : notif.patientId ? (
                  <span className="font-mono font-semibold text-[#102033]">{notif.patientId}</span>
                ) : (
                  <span className="text-[11px] text-[#6B7B8F]">{notif.facilityName || 'Facility update'}</span>
                )}
              </div>

              {/* Dedicated Open Button */}
              {notif.patientId && (
                <span className="text-xs font-bold text-[#164FD6] group-hover:text-[#123FA8] flex items-center gap-1 shrink-0">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        title="Triage Notifications & Emergency Arrivals"
        className={`relative p-2 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
          urgentUnreadCount > 0
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : unreadCount > 0
            ? 'bg-blue-50 border-blue-200 text-[#164FD6] hover:bg-blue-100'
            : 'bg-[#F8FAFC] border-[#E6ECF2] text-[#526276] hover:bg-slate-100 hover:text-[#102033]'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Urgent Badge or Normal Badge */}
        {mounted && urgentUnreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full h-4 w-4 bg-red-600 text-[9px] font-bold text-white shadow-xs">
            {urgentUnreadCount}
          </span>
        ) : mounted && unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full h-4 w-4 bg-[#164FD6] text-[9px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Flyout Drawer / Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[440px] md:w-[460px] bg-white rounded-xl shadow-2xl border border-[#E6ECF2] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[82vh]">
          {/* Section 2: Clinical Header */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E6ECF2] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#164FD6] flex items-center justify-center shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#102033]">
                  Triage notifications
                </h3>
                <p className="text-xs text-[#6B7B8F]">
                  {unreadCount > 0 ? `${unreadCount} unread · Updated just now` : 'All caught up · Updated just now'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Audio Alert Chime Toggle */}
              <button
                onClick={toggleSound}
                aria-label="Toggle clinical audio chime"
                title={soundEnabled ? 'Audio alert chime: ON (click to mute)' : 'Audio alert chime: MUTED (click to enable)'}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-50 border-blue-200 text-[#164FD6] hover:bg-blue-100'
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all notifications as read"
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#25364A] hover:text-[#102033] hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer border border-[#E6ECF2]"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Professional Filter Chips (No Emojis) */}
          <div className="px-4 py-2.5 bg-white border-b border-[#E6ECF2] flex items-center gap-2 overflow-x-auto text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
                filter === 'ALL'
                  ? 'bg-[#102033] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              All <span className="opacity-80 ml-1">{notifications.length}</span>
            </button>

            <button
              onClick={() => setFilter('URGENT')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filter === 'URGENT'
                  ? 'bg-[#102033] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filter === 'URGENT' ? 'text-red-400' : 'text-red-600'}`} />
              <span>Urgent</span>
              <span className="opacity-80 ml-0.5">{urgentTotal}</span>
            </button>

            <button
              onClick={() => setFilter('ARRIVALS')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filter === 'ARRIVALS'
                  ? 'bg-[#102033] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <UserPlus className={`w-3.5 h-3.5 ${filter === 'ARRIVALS' ? 'text-blue-300' : 'text-blue-600'}`} />
              <span>Arrivals</span>
              <span className="opacity-80 ml-0.5">{arrivalsTotal}</span>
            </button>

            <button
              onClick={() => setFilter('AI')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                filter === 'AI'
                  ? 'bg-[#102033] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${filter === 'AI' ? 'text-purple-300' : 'text-purple-600'}`} />
              <span>AI</span>
              <span className="opacity-80 ml-0.5">{aiTotal}</span>
            </button>
          </div>

          {/* Section 1 & 13: Grouped Notifications Scroll List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-[#102033]">All caught up</h4>
                <p className="text-xs text-[#6B7B8F] max-w-xs mx-auto leading-relaxed">
                  No pending triage notifications in this view. New patient arrivals and urgency signals will stream here automatically.
                </p>
              </div>
            ) : filter === 'ALL' ? (
              <>
                {/* URGENT GROUP */}
                {urgentGroup.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-800 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>URGENT</span>
                      </span>
                      <span>{urgentGroup.length}</span>
                    </div>

                    <div className="space-y-2.5">
                      {urgentGroup.map((notif) => renderNotificationCard(notif, true))}
                    </div>
                  </div>
                )}

                {/* RECENT GROUP */}
                {recentGroup.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7B8F] uppercase tracking-wider px-1">
                      <span>RECENT</span>
                      <span>{recentGroup.length}</span>
                    </div>

                    <div className="space-y-2.5">
                      {recentGroup.map((notif) => renderNotificationCard(notif, false))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Specific Filter View */
              <div className="space-y-2.5">
                {filteredNotifications.map((notif) =>
                  renderNotificationCard(
                    notif,
                    notif.priority === 'RED' || notif.type === 'URGENT_TRIAGE_ALERT'
                  )
                )}
              </div>
            )}
          </div>

          {/* Section 11: Production-grade Bottom Action Bar */}
          <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E6ECF2] flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#526276]">
                {unreadCount > 0 ? `${unreadCount} unread` : 'Queue synchronized'}
              </span>

              {/* Demo Controls Popover Trigger (Clean production separation) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  title="Open Simulation & Testing Controls"
                  className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>⋯ Demo</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Collapsed Simulation Dropdown */}
                {showDemoMenu && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-white rounded-lg shadow-xl border border-[#E6ECF2] py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F]">
                      Simulate Arrivals
                    </div>
                    <button
                      onClick={() => {
                        simulateIncomingArrival('RED');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Simulate Urgent (Red)</span>
                    </button>
                    <button
                      onClick={() => {
                        simulateIncomingArrival('YELLOW');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-amber-800 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Simulate Intake (Yellow)</span>
                    </button>
                    <button
                      onClick={() => {
                        simulateIncomingArrival(undefined, 'AI_EVALUATION_READY');
                        setShowDemoMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-purple-700 hover:bg-purple-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Simulate AI Structuring</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  title="Clear all notification history"
                  className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1 text-xs font-bold text-white bg-[#102033] hover:bg-[#1A2E44] rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
