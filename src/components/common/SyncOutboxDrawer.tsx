'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  FileText,
  Mic,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Button } from './Button';

export interface OutboxItem {
  id: string;
  patientId: string;
  patientName: string;
  type: 'voice' | 'ocr' | 'text';
  summary: string;
  capturedAt: string;
  status: 'queued' | 'syncing' | 'retry_required' | 'waiting' | 'synced';
  errorDetails?: string;
}

interface SyncOutboxDrawerProps {
  open: boolean;
  onClose: () => void;
}

const INITIAL_OUTBOX: OutboxItem[] = [
  {
    id: 'out-1',
    patientId: 'P-1041',
    patientName: 'Ramesh Panda',
    type: 'voice',
    summary: 'Voice intake (01:24 audio recording)',
    capturedAt: 'Today 14:15',
    status: 'queued',
  },
  {
    id: 'out-2',
    patientId: 'P-1043',
    patientName: 'Sunita Behera',
    type: 'ocr',
    summary: 'Reports + OCR (Chest X-Ray & CBC report)',
    capturedAt: 'Today 14:22',
    status: 'retry_required',
    errorDetails: 'Upload timeout on lab report — intermittent connectivity',
  },
  {
    id: 'out-3',
    patientId: 'P-1044',
    patientName: 'Bikram Nayak',
    type: 'text',
    summary: 'Text intake & vitals form',
    capturedAt: 'Today 14:30',
    status: 'waiting',
  },
];

export const SyncOutboxDrawer: React.FC<SyncOutboxDrawerProps> = ({ open, onClose }) => {
  const [items, setItems] = useState<OutboxItem[]>(INITIAL_OUTBOX);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!open) return null;

  const pendingCount = items.filter((i) => i.status !== 'synced').length;

  const handleSyncItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'syncing' } : item))
    );

    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'synced', errorDetails: undefined } : item))
      );
    }, 1200);
  };

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setSyncMessage('Synchronizing offline outbox queue with CareIntel Cloud DB...');
    setItems((prev) =>
      prev.map((item) => (item.status !== 'synced' ? { ...item, status: 'syncing' } : item))
    );

    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => ({ ...item, status: 'synced', errorDetails: undefined }))
      );
      setIsSyncingAll(false);
      setSyncMessage('All offline cases successfully synchronized.');
      setTimeout(() => setSyncMessage(null), 3000);
    }, 2000);
  };

  const drawerElement = (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E6ECF2] animate-in fade-in duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6ECF2] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#102033] uppercase tracking-wider">
                  Sync Outbox
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-[#996500] font-semibold">
                  {pendingCount} waiting
                </span>
              </div>
              <p className="text-[11px] text-[#6B7B8F]">
                Local-first queue for intermittent clinic connectivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#526276] hover:bg-slate-200/60 hover:text-[#102033] transition-colors"
            title="Close outbox drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        {syncMessage && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-[#164FD6] flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Outbox Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7B8F]">
            Pending Synchronization ({pendingCount})
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all ${
                item.status === 'retry_required'
                  ? 'border-red-200 bg-red-50/40'
                  : item.status === 'synced'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-[#E6ECF2] bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#526276]">
                    {item.type === 'voice' && <Mic className="w-3.5 h-3.5 text-blue-600" />}
                    {item.type === 'ocr' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
                    {item.type === 'text' && <Database className="w-3.5 h-3.5 text-slate-600" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#102033]">{item.patientId}</span>
                      <span className="text-xs text-[#25364A] font-medium">· {item.patientName}</span>
                    </div>
                    <div className="text-[11px] text-[#526276] mt-0.5">{item.summary}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6B7B8F] mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Captured {item.capturedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  {item.status === 'queued' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Queued
                    </span>
                  )}
                  {item.status === 'syncing' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
                    </span>
                  )}
                  {item.status === 'retry_required' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Retry required
                    </span>
                  )}
                  {item.status === 'waiting' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Waiting
                    </span>
                  )}
                  {item.status === 'synced' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                    </span>
                  )}
                </div>
              </div>

              {/* Error Details if retry required */}
              {item.errorDetails && (
                <div className="mt-2.5 pt-2 border-t border-red-200/80 text-[11px] text-[#B3261E] flex items-center justify-between">
                  <span>{item.errorDetails}</span>
                  <button
                    onClick={() => handleSyncItem(item.id)}
                    className="ml-2 font-bold text-xs underline hover:text-red-900 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Sync Legend & Rules */}
          <div className="mt-6 p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] text-[11px] text-[#526276] space-y-1.5">
            <span className="font-bold text-[#25364A] block">Offline Guarantee</span>
            <p>
              Cases captured offline remain preserved locally in IndexedDB/SQLite cache and will never be overwritten. Once connection is re-established, records sync sequentially with cryptographic audit hashes.
            </p>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E6ECF2] bg-white flex items-center justify-between gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={isSyncingAll || pendingCount === 0}
            onClick={handleSyncAll}
            icon={isSyncingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          >
            {isSyncingAll ? 'Synchronizing...' : `Sync all (${pendingCount})`}
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawerElement, document.body);
};
