'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Users,
  RefreshCw,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { Priority } from '../../types/triage';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import { EmptyStateIllustration } from '../illustrations/EmptyStateIllustration';

interface PatientsListViewProps {
  onOpenPatient: (patientId: string) => void;
  onNewIntake: () => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({
  onOpenPatient,
  onNewIntake,
}) => {
  const {
    patients,
    syncStatus,
    lastSyncedAt,
    refreshQueue,
    isAutoPolling,
    setIsAutoPolling,
  } = useTriage();
  const { isOffline, currentFacility } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshQueue();
    setTimeout(() => setIsManualRefreshing(false), 500);
  };

  const filtered = patients.filter((p) => {
    if (selectedPriority !== 'ALL' && p.priority !== selectedPriority) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 relative overflow-hidden">
      <AppAmbientGrid opacity={0.03} position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">Patient Directory &amp; Triage Queue</h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Active registered cases for <span className="font-semibold text-slate-800">{currentFacility.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sync status indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              syncStatus === 'OFFLINE_QUEUED' || isOffline
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : syncStatus === 'SYNCING' || isManualRefreshing
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {syncStatus === 'OFFLINE_QUEUED' || isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline Queue</span>
              </>
            ) : syncStatus === 'SYNCING' || isManualRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Refreshing…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synced ({lastSyncedAt})</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            title="Refresh patient queue"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Button variant="primary" size="md" onClick={onNewIntake} icon={<PlusCircle className="w-4 h-4" />}>
            Start New Intake
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#6B7B8F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, or symptoms..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#E6ECF2] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#526276]">Filter Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-md border border-[#E6ECF2] bg-white text-[#25364A] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="RED">High Priority (Red)</option>
            <option value="YELLOW">Prompt Review (Yellow)</option>
            <option value="GREEN">Routine Review (Green)</option>
          </select>
        </div>
      </div>

      {/* Patient Cards/Table */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyStateIllustration
            title="No Matching Patients"
            description="No records match your current filter and search criteria."
            action={
              <Button variant="primary" size="md" onClick={onNewIntake} icon={<PlusCircle className="w-4 h-4" />}>
                Start New Intake
              </Button>
            }
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Name & Demographics</th>
                <th className="py-3 px-4">Primary Language</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECF2]">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenPatient(p.id)}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-bold text-[#102033] tabular-nums">
                    {p.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#102033]">{p.name}</div>
                    <div className="text-[11px] text-[#6B7B8F]">
                      {p.age} yrs · {p.gender} · {p.contactMasked}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#25364A]">
                    <span className="font-medium">{p.primaryLanguage}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#25364A] max-w-xs truncate">
                    {p.chiefComplaint}
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={p.priority} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPatient(p.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#164FD6] bg-[#E8F0FF] hover:bg-blue-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      <span>View Note</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
