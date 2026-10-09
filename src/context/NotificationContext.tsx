'use client';

import { DEMO_MODE } from '../lib/api/config';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Priority } from '../types/triage';
import {
  TriageNotification,
  ArrivalToast,
  NotificationType,
  VitalEvidenceItem,
} from '../types/notifications';

interface NotifyArrivalParams {
  patientId: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  department?: string;
  priority: Priority;
  chiefComplaint: string;
  vitalsSnippet?: string;
  vitalsEvidence?: VitalEvidenceItem[];
  facilityName?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: TriageNotification[];
  toasts: ArrivalToast[];
  unreadCount: number;
  urgentUnreadCount: number;
  soundEnabled: boolean;
  addNotification: (item: Omit<TriageNotification, 'id' | 'createdAt' | 'isRead'>) => TriageNotification;
  notifyArrival: (params: NotifyArrivalParams) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toggleSound: () => void;
  simulateIncomingArrival: (presetPriority?: Priority, simulatedType?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'niro_triage_notifications_v2';
const SOUND_STORAGE_KEY = 'niro_triage_sound_enabled_v1';

export function parseVitalsToEvidence(vitalsSnippet?: string): VitalEvidenceItem[] {
  if (!vitalsSnippet) return [];
  const parts = vitalsSnippet.split(/·|,|;/).map((s) => s.trim()).filter(Boolean);
  return parts.map((part) => {
    let label = 'Vital';
    let val = part;
    const colonIdx = part.indexOf(':');
    if (colonIdx !== -1) {
      label = part.substring(0, colonIdx).trim();
      val = part.substring(colonIdx + 1).trim();
    } else {
      const match = part.match(/^([A-Za-z₂]+)\s+(.+)$/);
      if (match) {
        label = match[1];
        val = match[2];
      }
    }

    const normLabel = label.replace(/2/g, '₂').trim();
    const numMatch = val.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0]) : null;

    const isSpo2 = normLabel.toLowerCase().includes('spo');
    const isBp = normLabel.toLowerCase().includes('bp');
    const isPulse = normLabel.toLowerCase().includes('pulse') || normLabel.toLowerCase().includes('hr');

    let isAbnormal = false;
    let isCritical = false;

    if (isSpo2 && num !== null) {
      if (num < 90) {
        isCritical = true;
        isAbnormal = true;
      } else if (num < 95) {
        isAbnormal = true;
      }
    } else if (isBp) {
      const systolic = num;
      if (systolic && (systolic > 140 || systolic < 90)) {
        isAbnormal = true;
      }
    } else if (isPulse && num !== null) {
      if (num > 105 || num < 50) {
        isAbnormal = true;
      }
    }

    return {
      label: normLabel,
      value: val,
      isAbnormal,
      isCritical,
    };
  });
}

const INITIAL_NOTIFICATIONS: TriageNotification[] = [
  {
    id: 'notif-init-1',
    type: 'URGENT_TRIAGE_ALERT',
    title: 'Potential urgency signal',
    message: 'Hypoxemia alert: SpO₂ 88% on room air with severe chest indrawing detected.',
    timestamp: '12m ago',
    createdAt: Date.now() - 12 * 60 * 1000,
    isRead: false,
    patientId: 'P-1042',
    patientName: 'Rashmita Nayak',
    patientAge: 34,
    patientGender: 'Female',
    department: 'Emergency Triage',
    priority: 'RED',
    vitalsEvidence: [
      { label: 'SpO₂', value: '88%', isAbnormal: true, isCritical: true },
      { label: 'BP', value: '85/55', isAbnormal: true },
      { label: 'Pulse', value: '118 bpm', isAbnormal: true },
    ],
    facilityName: 'Nuapada District Hospital',
    actionUrl: '/patients/P-1042',
  },
  {
    id: 'notif-init-2',
    type: 'PATIENT_ARRIVAL',
    title: 'New patient intake',
    message: 'Multimodal Odia voice intake completed at Outpatient Desk.',
    timestamp: '28m ago',
    createdAt: Date.now() - 28 * 60 * 1000,
    isRead: false,
    patientId: 'P-1035',
    patientName: 'Sunita Behera',
    patientAge: 46,
    patientGender: 'Female',
    department: 'OPD Desk 2',
    priority: 'YELLOW',
    vitalsEvidence: [
      { label: 'BP', value: '130/85' },
      { label: 'Temp', value: '99.2 °F' },
      { label: 'SpO₂', value: '97%' },
    ],
    facilityName: 'Komna Community Health Center',
    actionUrl: '/patients/P-1035',
  },
  {
    id: 'notif-init-3',
    type: 'AI_EVALUATION_READY',
    title: 'AI structuring completed',
    message: 'Report extraction verified with 95% field extraction confidence and mapped to ICD-10.',
    timestamp: '1h ago',
    createdAt: Date.now() - 60 * 60 * 1000,
    isRead: true,
    patientId: 'P-1038',
    patientName: 'Bikram Nayak',
    patientAge: 52,
    patientGender: 'Male',
    department: 'Diagnostic Lab',
    priority: 'GREEN',
    confidenceSnippet: '95% field extraction confidence',
    facilityName: 'Nuapada District Hospital',
    actionUrl: '/patients/P-1038',
  },
  {
    id: 'notif-init-4',
    type: 'PRIORITY_ESCALATION',
    title: 'Priority escalation verified',
    message: 'Re-triaged from Routine to Urgent Review due to progressive dyspnea and tachycardia.',
    timestamp: '2h ago',
    createdAt: Date.now() - 120 * 60 * 1000,
    isRead: true,
    patientId: 'P-1042',
    patientName: 'Rashmita Nayak',
    patientAge: 34,
    patientGender: 'Female',
    department: 'Emergency Triage',
    priority: 'RED',
    actionUrl: '/patients/P-1042',
  },
];

// Hospital medical monitor alert chime synthesizer (Web Audio API)
function playTriageChime(isUrgent: boolean = false) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'sine';
    const baseFreq = isUrgent ? 880 : 587.33;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    if (isUrgent) {
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    }
  } catch (err) {
    console.debug('Clinical audio chime blocked or uninitialized:', err);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<TriageNotification[]>(() => {
    if (DEMO_MODE && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    }
    return DEMO_MODE ? INITIAL_NOTIFICATIONS : [];
  });

  const [toasts, setToasts] = useState<ArrivalToast[]>([]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SOUND_STORAGE_KEY);
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load sound setting:', e);
      }
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (DEMO_MODE) localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      } catch (e) {
        console.error('Failed to persist notifications:', e);
      }
    }
  }, [notifications]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled));
      } catch (e) {
        console.error('Failed to persist sound setting:', e);
      }
    }
  }, [soundEnabled]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const urgentUnreadCount = useMemo(() => {
    return notifications.filter(
      (n) => !n.isRead && (n.priority === 'RED' || n.type === 'URGENT_TRIAGE_ALERT')
    ).length;
  }, [notifications]);

  const addNotification = useCallback(
    (item: Omit<TriageNotification, 'id' | 'createdAt' | 'isRead'>): TriageNotification => {
      const newNotif: TriageNotification = {
        ...item,
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: Date.now(),
        isRead: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      return newNotif;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notifyArrival = useCallback(
    (params: NotifyArrivalParams) => {
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const toastId = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const nowStr = 'Just now';

      const isUrgent = params.priority === 'RED';
      const evidence = params.vitalsEvidence || parseVitalsToEvidence(params.vitalsSnippet);

      const newNotif: TriageNotification = {
        id: notifId,
        type: isUrgent ? 'URGENT_TRIAGE_ALERT' : 'PATIENT_ARRIVAL',
        title: isUrgent ? 'Potential urgency signal' : 'New patient intake',
        message: params.chiefComplaint,
        timestamp: nowStr,
        createdAt: Date.now(),
        isRead: false,
        patientId: params.patientId,
        patientName: params.patientName,
        patientAge: params.patientAge,
        patientGender: params.patientGender,
        department: params.department || 'Outpatient Receiving',
        priority: params.priority,
        vitalsSnippet: params.vitalsSnippet,
        vitalsEvidence: evidence,
        facilityName: params.facilityName || 'Nuapada District Hospital',
        actionUrl: `/patients/${params.patientId}`,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      const newToast: ArrivalToast = {
        id: toastId,
        notificationId: notifId,
        patientId: params.patientId,
        patientName: params.patientName,
        patientAge: params.patientAge,
        patientGender: params.patientGender,
        priority: params.priority,
        chiefComplaint: params.chiefComplaint,
        vitalsSnippet: params.vitalsSnippet,
        vitalsEvidence: evidence,
        timestamp: nowStr,
        facilityName: params.facilityName || 'Emergency Triage Desk',
        duration: params.duration || (isUrgent ? 12000 : 8000),
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

      if (soundEnabled) {
        playTriageChime(isUrgent);
      }
    },
    [soundEnabled]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        playTriageChime(false);
      }
      return next;
    });
  }, []);

  const simulateIncomingArrival = useCallback(
    (presetPriority?: Priority, simulatedType?: NotificationType) => {
      if (!DEMO_MODE) return;
      if (simulatedType === 'AI_EVALUATION_READY') {
        const id = `P-${Math.floor(1040 + Math.random() * 40)}`;
        addNotification({
          type: 'AI_EVALUATION_READY',
          title: 'AI structuring completed',
          message: 'Report extraction verified with 96% field extraction confidence and mapped to ICD-10.',
          timestamp: 'Just now',
          patientId: id,
          patientName: 'Kailash Sahu',
          patientAge: 49,
          patientGender: 'Male',
          department: 'Diagnostic Lab',
          priority: 'GREEN',
          confidenceSnippet: '96% field extraction confidence',
          facilityName: 'Nuapada District Hospital',
          actionUrl: `/patients/${id}`,
        });
        if (soundEnabled) playTriageChime(false);
        return;
      }

      const mockArrivals = [
        {
          name: 'Meera Jena',
          age: 28,
          gender: 'Female',
          priority: 'RED' as Priority,
          complaint: 'Severe dyspnea and wheezing with acute respiratory exhaustion for 3 hours.',
          vitalsEvidence: [
            { label: 'SpO₂', value: '88%', isAbnormal: true, isCritical: true },
            { label: 'BP', value: '85/55', isAbnormal: true },
            { label: 'Pulse', value: '118 bpm', isAbnormal: true },
          ],
          facility: 'Emergency Receiving',
        },
        {
          name: 'Puspanjali Majhi',
          age: 29,
          gender: 'Female',
          priority: 'YELLOW' as Priority,
          complaint: 'High-grade fever (103.4 °F) with rigors and severe headache for 3 days.',
          vitalsEvidence: [
            { label: 'BP', value: '110/72' },
            { label: 'Temp', value: '103.4 °F', isAbnormal: true },
            { label: 'SpO₂', value: '96%' },
          ],
          facility: 'Sinapali CHC Outpatient Desk',
        },
        {
          name: 'Debendra Bag',
          age: 58,
          gender: 'Male',
          priority: 'GREEN' as Priority,
          complaint: 'Chronic low back pain aggravated by agricultural work, requesting routine analgesic refill.',
          vitalsEvidence: [
            { label: 'BP', value: '126/82' },
            { label: 'Temp', value: '98.4 °F' },
            { label: 'SpO₂', value: '98%' },
          ],
          facility: 'Boden PHC Sub-Center',
        },
      ];

      const chosen = presetPriority
        ? mockArrivals.find((a) => a.priority === presetPriority) || mockArrivals[0]
        : mockArrivals[Math.floor(Math.random() * mockArrivals.length)];

      const randomNum = Math.floor(1045 + Math.random() * 50);
      const simulatedId = `P-${randomNum}`;

      notifyArrival({
        patientId: simulatedId,
        patientName: chosen.name,
        patientAge: chosen.age,
        patientGender: chosen.gender,
        priority: chosen.priority,
        chiefComplaint: chosen.complaint,
        vitalsEvidence: chosen.vitalsEvidence,
        facilityName: chosen.facility,
      });
    },
    [addNotification, notifyArrival, soundEnabled]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        urgentUnreadCount,
        soundEnabled,
        addNotification,
        notifyArrival,
        dismissToast,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        toggleSound,
        simulateIncomingArrival,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
