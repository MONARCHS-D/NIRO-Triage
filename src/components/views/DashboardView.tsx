'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { KpiCard } from '../common/KpiCard';
import { SkeletonKpiCard, SkeletonTable } from '../common/SkeletonGrid';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Eye,
  AlertCircle,
  Clock,
  User,
  SlidersHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Building2,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { Priority } from '../../types/triage';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import { DataFlowMotif } from '../motifs/DataFlowMotif';
import { EmptyStateIllustration } from '../illustrations/EmptyStateIllustration';

interface DashboardViewProps {
  onOpenPatient: (patientId: string) => void;
  onNewIntake: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenPatient,
  onNewIntake,
}) => {
  const {
    patients,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
    syncStatus,
    lastSyncedAt,
    refreshQueue,
  } = useTriage();
  const { currentUser, currentFacility, isOffline } = useRole();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshQueue();
    setTimeout(() => setIsManualRefreshing(false), 500);
  };

  // Compute stats
  const totalPatients = patients.length + 45; // 48 total today
  const awaitingReviewCount = patients.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'NEEDS_MORE_INFO').length;
  const highPriorityCount = patients.filter((p) => p.priority === 'RED').length;

  // Filter patients by priority tab and search query
  const filteredPatients = patients.filter((p) => {
    if (priorityFilter === 'RED' && p.priority !== 'RED') return false;
    if (priorityFilter === 'YELLOW' && p.priority !== 'YELLOW') return false;
    if (priorityFilter === 'GREEN' && p.priority !== 'GREEN') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchComplaint = p.chiefComplaint.toLowerCase().includes(q);
      return matchName || matchId || matchComplaint;
    }
    return true;
  });

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Section 5.1 & 19: Subtle technical coordinate grid */}
      <AppAmbientGrid opacity={0.05} position="top-right" />
      {/* Header section (Section 6) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#102033] tracking-tight">
              Good morning, {currentUser.name}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {currentFacility.code}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Active workstation at <span className="font-semibold text-[#25364A]">{currentFacility.name}</span> ({currentFacility.type} · {currentFacility.district})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Sync Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-2xs ${
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
                <span>Offline Draft Queue</span>
              </>
            ) : syncStatus === 'SYNCING' || isManualRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Syncing Live Queue…</span>
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
            title="Refresh patient queue from backend"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowSkeleton(!showSkeleton)}
            className="text-xs hidden md:inline-flex"
          >
            {showSkeleton ? 'Hide Skeleton' : 'Skeleton'}
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onNewIntake}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            Start New Intake
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards (Section 6: Four only) */}
      {showSkeleton ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonKpiCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Patients Today"
            value="48"
            delta="+12%"
            deltaType="increase"
            helperText="48 registered across OPD & camps"
          />
          <KpiCard
            label="Awaiting Review"
            value={awaitingReviewCount > 0 ? awaitingReviewCount : '12'}
            delta="Urgent"
            deltaType="neutral"
            helperText="Cases needing MO triage assessment"
            active={priorityFilter === 'ALL'}
            onClick={() => setPriorityFilter('ALL')}
          />
          <KpiCard
            label="High Priority"
            value={highPriorityCount}
            delta="+1"
            deltaType="decrease"
            alert={highPriorityCount > 0}
            helperText="Potential urgency signals active"
            active={priorityFilter === 'RED'}
            onClick={() => setPriorityFilter('RED')}
          />
          <KpiCard
            label="Avg. Review Time"
            value="4.5 min"
            delta="-0.8 min"
            deltaType="decrease"
            helperText="Speed accelerated with structured OCR"
          />
        </div>
      )}

      {/* Queue Section (Section 6) */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
        {/* Queue Header & Tabs */}
        <div className="p-4 sm:px-6 border-b border-[#E6ECF2] flex flex-wrap items-center justify-between gap-4">
          {/* Priority Tabs */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E6ECF2]">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                priorityFilter === 'ALL'
                  ? 'bg-white text-[#102033] shadow-xs'
                  : 'text-[#526276] hover:text-[#102033]'
              }`}
            >
              All Cases ({patients.length})
            </button>
            <button
              onClick={() => setPriorityFilter('RED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'RED'
                  ? 'bg-white text-[#B3261E] shadow-xs'
                  : 'text-[#526276] hover:text-[#B3261E]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-600" />
              High ({patients.filter((p) => p.priority === 'RED').length})
            </button>
            <button
              onClick={() => setPriorityFilter('YELLOW')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'YELLOW'
                  ? 'bg-white text-[#996500] shadow-xs'
                  : 'text-[#526276] hover:text-[#996500]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium ({patients.filter((p) => p.priority === 'YELLOW').length})
            </button>
            <button
              onClick={() => setPriorityFilter('GREEN')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                priorityFilter === 'GREEN'
                  ? 'bg-white text-[#087443] shadow-xs'
                  : 'text-[#526276] hover:text-[#087443]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Low ({patients.filter((p) => p.priority === 'GREEN').length})
            </button>
          </div>

          {/* Quick Search & Count info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7B8F]">
              Showing <strong className="text-[#102033]">{filteredPatients.length}</strong> patients in active queue
            </span>
          </div>
        </div>

        {/* Patient Table (Section 6 Columns: # | Patient | Age/Sex | Chief Complaint | Priority | Status | Time | Action) */}
        {showSkeleton ? (
          <SkeletonTable rows={4} />
        ) : filteredPatients.length === 0 ? (
          /* Empty State (Section 6 & 15.1) */
          <EmptyStateIllustration
            title="No patients in this queue"
            description="All active cases in this filter have been reviewed. New intake cases will appear here automatically."
            action={
              <Button variant="primary" size="md" onClick={onNewIntake} icon={<PlusCircle className="w-4 h-4" />}>
                Start New Intake
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                  <th className="py-3 px-4"># ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Sex</th>
                  <th className="py-3 px-4">Chief Complaint</th>
                  <th className="py-3 px-4">Triage Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Arrival</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECF2]">
                {filteredPatients.map((patient) => {
                  return (
                    <tr
                      key={patient.id}
                      onClick={() => onOpenPatient(patient.id)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                    >
                      {/* # ID */}
                      <td className="py-3.5 px-4 font-bold text-[#102033] tabular-nums whitespace-nowrap">
                        <span className="group-hover:text-[#2563EB] group-hover:underline">
                          {patient.id}
                        </span>
                      </td>

                      {/* Patient Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#102033] block">
                          {patient.name}
                        </span>
                        <span className="text-[10px] text-[#6B7B8F] font-mono">
                          {patient.syntheticCode}
                        </span>
                      </td>

                      {/* Age / Sex */}
                      <td className="py-3.5 px-4 text-[#25364A] whitespace-nowrap tabular-nums">
                        {patient.age}y / {patient.gender[0]}
                      </td>

                      {/* Chief Complaint */}
                      <td className="py-3.5 px-4 text-[#25364A] max-w-xs truncate">
                        {patient.chiefComplaint}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={patient.priority} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={patient.status} />
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-[#6B7B8F] whitespace-nowrap tabular-nums">
                        {patient.arrivalTime}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPatient(patient.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#164FD6] bg-[#E8F0FF] hover:bg-blue-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5.2: "Care reaches further" data curve motif */}
      <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-[#6B7B8F]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Workstation connected · Live sync active across CHC network</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">CONTINUITY OF CARE</span>
          <DataFlowMotif width={220} height={48} opacity={0.35} />
        </div>
      </div>
    </div>
  );
};
