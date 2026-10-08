'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  X,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useTriage } from '../../context/TriageContext';
import { ArrivalToast } from '../../types/notifications';

const ToastItem: React.FC<{ toast: ArrivalToast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const router = useRouter();
  const { setSelectedPatientId } = useTriage();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const duration = toast.duration || (toast.priority === 'RED' ? 12000 : 8000);

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isPaused, onDismiss, toast.id]);

  const handleReview = () => {
    onDismiss(toast.id);
    setSelectedPatientId(toast.patientId);
    router.push(`/patients/${toast.patientId}`);
  };

  const isRed = toast.priority === 'RED';
  const isYellow = toast.priority === 'YELLOW';

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full max-w-sm sm:max-w-md rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 transform translate-x-0 opacity-100 bg-white animate-in slide-in-from-right-16 fade-in duration-300 ease-out ${
        isRed
          ? 'border-red-500 shadow-red-500/20 ring-4 ring-red-500/10'
          : isYellow
          ? 'border-amber-500 shadow-amber-500/15 ring-2 ring-amber-500/10'
          : 'border-emerald-500 shadow-emerald-500/15'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Top Banner */}
      <div
        className={`px-3.5 py-2 flex items-center justify-between text-xs font-bold border-b ${
          isRed
            ? 'bg-red-50 text-red-900 border-red-200'
            : isYellow
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {isRed ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
          ) : isYellow ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="tracking-wide uppercase text-[11px] font-bold">
            {isRed ? 'CRITICAL ARRIVAL · RED PRIORITY' : isYellow ? 'NEW PATIENT ARRIVAL · YELLOW' : 'ROUTINE INTAKE · GREEN'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium opacity-75">
            {toast.timestamp}
          </span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 rounded hover:bg-black/10 transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#102033]">{toast.patientName}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-[#25364A] border border-slate-200">
                {toast.patientId}
              </span>
              {toast.patientAge && toast.patientGender && (
                <span className="text-xs text-[#6B7B8F]">
                  ({toast.patientAge}y/{toast.patientGender[0]})
                </span>
              )}
            </div>
            {toast.facilityName && (
              <p className="text-[11px] text-[#6B7B8F] mt-0.5">{toast.facilityName}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-[#25364A] leading-relaxed font-medium line-clamp-2">
          {toast.chiefComplaint}
        </p>

        {/* Evidence Chips */}
        {toast.vitalsEvidence && toast.vitalsEvidence.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {toast.vitalsEvidence.map((v, i) => (
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
        ) : toast.vitalsSnippet ? (
          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 ${
              isRed
                ? 'bg-red-50 text-red-800 border border-red-200 font-bold'
                : 'bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{toast.vitalsSnippet}</span>
          </div>
        ) : null}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <span className="text-[10px] text-[#6B7B8F]">
            {isPaused ? 'Auto-dismiss paused' : 'Auto-dismissing'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDismiss(toast.id)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={handleReview}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer text-white shadow-xs ${
                isRed
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  : isYellow
                  ? 'bg-[#164FD6] hover:bg-[#123FA8]'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>Review Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full transition-all linear ${
            isRed ? 'bg-red-500' : isYellow ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ArrivalToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-16 sm:top-20 right-4 sm:right-6 z-[99999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body
  );
};
