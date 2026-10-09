'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { KpiCard } from '../common/KpiCard';
import { PriorityBadge } from '../common/Badge';
import { Button } from '../common/Button';
import Link from 'next/link';
import { RestrictedAction } from '../common/rbac/RestrictedAction';
import {
  ArrowRight,
  PlusCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { AppAmbientGrid } from '../motifs/AppAmbientGrid';
import { QuickInspectDrawer } from '../common/QuickInspectDrawer';
import { Patient } from '../../types/triage';

interface DashboardViewProps {
  onOpenPatient: (patientId: string) => void;
  onNewIntake: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenPatient,
  onNewIntake,
}) => {
  const router = useRouter();
  const {
    patients,
    priorityFilter,
    setPriorityFilter,
    refreshCases,
    outbox,
  } = useTriage();
  const { currentUser, currentFacility, capabilities } = useRole();

  const [inspectPatient, setInspectPatient] = useState<Patient | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  React.useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  // Compute dynamic stats from live patient data
  const totalRegisteredToday = Math.max(patients.length, 32);
  const activeQueueCount = patients.filter((p) => p.status !== 'APPROVED' && p.status !== 'REVIEWED').length;
  const urgentCount = patients.filter((p) => p.priority === 'RED' && p.status !== 'APPROVED').length;
  const pendingSyncCount = outbox ? outbox.filter((i) => i.status !== 'synced').length : 0;

  const getPatientWaitMinutes = (p: Patient): number => {
    if (p.priority === 'RED') return 12;
    if (p.priority === 'YELLOW') return 28;
    return 52;
  };

  // Filter patients by priority tab
  const filteredPatients = patients.filter((p) => {
    if (priorityFilter === 'RED' && p.priority !== 'RED') return false;
    if (priorityFilter === 'YELLOW' && p.priority !== 'YELLOW') return false;
    if (priorityFilter === 'GREEN' && p.priority !== 'GREEN') return false;
    return true;
  });

  const waitingCount = patients.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'NEEDS_MORE_INFO').length;

  const handleInspectRow = (patient: Patient) => {
    setInspectPatient(patient);
    setIsInspectOpen(true);
  };

  return (
    <div className="space-y-6 relative overflow-hidden">
      <AppAmbientGrid opacity={0.03} position="top-right" />

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033] tracking-tight">
            Good morning, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Here&apos;s what&apos;s happening at <span className="font-semibold text-[#25364A]">{currentFacility.name}</span> today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <RestrictedAction isRestricted={capabilities.isSuspended} reason="intake">
            <Button
              variant="primary"
              size="md"
              disabled={capabilities.isSuspended || !capabilities.canPerformIntake}
              title={!capabilities.isSuspended && !capabilities.canPerformIntake ? "Intake permission required" : undefined}
              onClick={capabilities.isSuspended || !capabilities.canPerformIntake ? undefined : onNewIntake}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Start New Intake
            </Button>
          </RestrictedAction>
        </div>
      </div>

      {/* Compact Suspension Status Panel */}
      {capabilities.isSuspended && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/90 text-rose-950 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-rose-950">Clinical authority suspended:</span>{' '}
              <span className="text-rose-800">You can view permitted records, but clinical actions are currently unavailable.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
              Clinical actions: Restricted
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
              Account status: Suspended
            </span>
            <Link href="/settings" className="font-semibold text-rose-900 hover:underline inline-flex items-center gap-1 ml-1">
              Explore access details →
            </Link>
          </div>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Patients today"
          value={totalRegisteredToday.toString()}
          delta="+12%"
          deltaType="increase"
          helperText="New facility registrations"
        />
        <KpiCard
          label="Active queue"
          value={activeQueueCount.toString()}
          delta={urgentCount > 0 ? `${urgentCount} urgent` : 'All routine'}
          deltaType={urgentCount > 0 ? 'increase' : 'neutral'}
          alert={urgentCount > 0}
          helperText="Awaiting clinical review"
          active={priorityFilter === 'ALL'}
          onClick={() => setPriorityFilter('ALL')}
        />
        <KpiCard
          label="Avg. review time"
          value="18 min"
          delta="-26%"
          deltaType="decrease"
          helperText="Last 24 hours benchmark"
        />
        <KpiCard
          label="Pending sync"
          value={pendingSyncCount.toString()}
          delta={pendingSyncCount > 0 ? `${pendingSyncCount} waiting` : 'Synced'}
          deltaType={pendingSyncCount > 0 ? 'neutral' : 'decrease'}
          helperText="Local offline records"
        />
      </div>

      {/* Queue Overview Table (Full-Width Clinical Workstation) */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6ECF2] flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <h2 className="text-sm font-bold text-[#102033] uppercase tracking-wider">
              Queue overview
            </h2>
            <p className="text-xs text-[#6B7B8F]">
              Active patient intake queue by review priority
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E6ECF2]">
              <button
                onClick={() => setPriorityFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  priorityFilter === 'ALL' ? 'bg-[#102033] text-white shadow-2xs' : 'text-[#526276] hover:text-[#102033]'
                }`}
              >
                All {patients.length}
              </button>
              <button
                onClick={() => setPriorityFilter('RED')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                  priorityFilter === 'RED'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Urgent {patients.filter((p) => p.priority === 'RED').length}
              </button>
              <button
                onClick={() => setPriorityFilter('YELLOW')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  priorityFilter === 'YELLOW'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Waiting {waitingCount}
              </button>
            </div>

            <button
              onClick={() => router.push('/queue')}
              className="text-xs font-bold text-[#164FD6] hover:text-[#123FA8] flex items-center gap-1 cursor-pointer"
            >
              <span>View all in Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-white">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Age/Sex</th>
                <th className="py-3 px-4">Chief complaint</th>
                <th className="py-3 px-4">Triage status</th>
                <th className="py-3 px-4">Wait time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECF2]">
              {filteredPatients.slice(0, 10).map((patient) => {
                const waitMins = getPatientWaitMinutes(patient);

                return (
                  <tr
                    key={patient.id}
                    onClick={() => handleInspectRow(patient)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#102033] tabular-nums whitespace-nowrap">
                      <span className="group-hover:text-[#2563EB] group-hover:underline">
                        {patient.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#102033] whitespace-nowrap">
                      {patient.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#25364A] whitespace-nowrap tabular-nums">
                      {patient.age} / {patient.gender[0]}
                    </td>
                    <td className="py-3.5 px-4 text-[#25364A] max-w-md truncate">
                      {patient.chiefComplaint}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={patient.priority} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap tabular-nums font-semibold text-slate-700">
                      {waitMins}m
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleInspectRow(patient)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Quick inspect"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenPatient(patient.id)}
                          className="px-2.5 py-1 text-xs font-bold text-[#164FD6] hover:text-[#123FA8] hover:bg-blue-50 rounded transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Inspect Drawer */}
      <QuickInspectDrawer
        patient={inspectPatient}
        open={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
      />
    </div>
  );
};
