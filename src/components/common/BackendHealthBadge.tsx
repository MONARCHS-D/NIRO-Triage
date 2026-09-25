'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import { healthApi, HealthResponse } from '../../lib/api/health';
import { API_BASE_URL } from '../../lib/api/config';
import { useRole } from '../../context/RoleContext';

type BackendStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export const BackendHealthBadge: React.FC = () => {
  const { isOffline } = useRole();
  const [status, setStatus] = useState<BackendStatus>('CHECKING');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkHealth = useCallback(async () => {
    if (isOffline) {
      setStatus('OFFLINE');
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await healthApi.checkReadiness();
      setHealthData(res);
      if (res.status === 'ready') {
        setStatus('ONLINE');
      } else {
        setStatus('DEGRADED');
      }
    } catch {
      setStatus('OFFLINE');
      setHealthData(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [isOffline]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 25000); // Poll every 25 seconds
    return () => clearInterval(interval);
  }, [checkHealth]);

  if (isOffline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="hidden sm:inline">Offline Mode</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
          status === 'ONLINE'
            ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70'
            : status === 'CHECKING'
            ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
            : status === 'DEGRADED'
            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
        }`}
        title="Click to view CareIntel API health & database status"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status === 'ONLINE'
              ? 'bg-emerald-500 shadow-xs shadow-emerald-400'
              : status === 'CHECKING'
              ? 'bg-blue-500'
              : status === 'DEGRADED'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />
        <Database className="w-3 h-3 opacity-70 hidden sm:inline" />
        <span className="font-semibold hidden sm:inline">
          {status === 'ONLINE'
            ? 'API: Prisma DB'
            : status === 'CHECKING'
            ? 'Connecting...'
            : status === 'DEGRADED'
            ? 'API: Degraded'
            : 'API: Local Cache'}
        </span>
        <span className="sm:hidden font-semibold">
          {status === 'ONLINE' ? 'Live' : status === 'CHECKING' ? '...' : 'Offline'}
        </span>

        {healthData?.latency_ms && status === 'ONLINE' && (
          <span className="text-[10px] text-emerald-700/80 hidden lg:inline tabular-nums">
            {Math.round(healthData.latency_ms)}ms
          </span>
        )}
      </button>

      {/* Health Details Dropdown Modal */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-[#E6ECF2] shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 text-xs text-[#25364A]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E6ECF2] mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-[#102033]">CareIntel Backend Status</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  checkHealth();
                }}
                disabled={isRefreshing}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer disabled:opacity-50"
                title="Refresh health check"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Target Endpoint:</span>
                <span className="font-mono text-slate-800 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={API_BASE_URL}>
                  {API_BASE_URL}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Service Health:</span>
                <span className={`font-semibold flex items-center gap-1 ${status === 'ONLINE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {status === 'ONLINE' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> Offline / Standalone
                    </>
                  )}
                </span>
              </div>

              {healthData?.checks && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Infrastructure Checks
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Prisma Postgres DB:</span>
                    <span className="font-semibold text-emerald-600 uppercase text-[10px]">
                      {healthData.checks.database || 'Connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Task Broker (Redis):</span>
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">
                      {healthData.checks.redis || 'Ready'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Evidence Blob Store:</span>
                    <span className="font-semibold text-slate-700 uppercase text-[10px]">
                      {healthData.checks.blob_storage || 'Ready'}
                    </span>
                  </div>
                </div>
              )}

              {status !== 'ONLINE' && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 mt-2">
                  <span>Backend unreachable at <code>{API_BASE_URL}</code>. The app is seamlessly using resilient offline synthetic storage.</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#E6ECF2] flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="text-[11px] text-[#2563EB] font-semibold hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
