'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { useTriage } from '../../context/TriageContext';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ArrowRight, PlusCircle, RefreshCw, Clock, ArrowUpDown, Eye } from 'lucide-react';
import { AppAmbientGrid } from '../../components/motifs/AppAmbientGrid';
import { EmptyStateIllustration } from '../../components/illustrations/EmptyStateIllustration';
import { QuickInspectDrawer } from '../../components/common/QuickInspectDrawer';
import { Patient } from '../../types/triage';

type SortMode = 'PRIORITY' | 'WAIT_TIME' | 'ARRIVAL';

export default function QueuePage() {
  const router = useRouter();
  const {
    patients,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSelectedPatientId,
    refreshCases,
    isSyncing,
  } = useTriage();

  const [sortMode, setSortMode] = useState<SortMode>('PRIORITY');
  const [inspectPatient, setInspectPatient] = useState<Patient | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  React.useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  const getPatientWaitMinutes = (p: Patient): number => {
    if (p.priority === 'RED') return 12;
    if (p.priority === 'YELLOW') return 28;
    return 52;
  };

  const getWaitLabel = (p: Patient): string => {
    const mins = getPatientWaitMinutes(p);
    return `${mins}m`;
  };

  const filteredPatients = patients.filter((p) => {
    if (priorityFilter === 'RED' && p.priority !== 'RED') return false;
    if (priorityFilter === 'YELLOW' && p.priority !== 'YELLOW') return false;
    if (priorityFilter === 'GREEN' && p.priority !== 'GREEN') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.chiefComplaint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortMode === 'PRIORITY') {
      const pOrder: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2, GREY: 3 };
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
    }
    if (sortMode === 'WAIT_TIME') {
      return getPatientWaitMinutes(b) - getPatientWaitMinutes(a);
    }
    if (sortMode === 'ARRIVAL') {
      return b.arrivalTime.localeCompare(a.arrivalTime);
    }
    return 0;
  });

  const handleOpenPatient = (id: string) => {
    setSelectedPatientId(id);
    router.push(`/patients/${id}`);
  };

  const handleInspectRow = (patient: Patient) => {
    setInspectPatient(patient);
    setIsInspectOpen(true);
  };

  return (
    <ShellLayout>
      <div className="space-y-6 relative overflow-hidden">
        <AppAmbientGrid opacity={0.03} position="top-right" />

        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">Operational Triage Queue</h1>
            <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
              Live facility cases categorized by clinical review priority
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => refreshCases()}
              disabled={isSyncing}
              icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="primary" size="md" onClick={() => router.push('/intake')} icon={<PlusCircle className="w-4 h-4" />}>
              Start New Intake
            </Button>
          </div>
        </div>

        {/* Main Queue Card */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
          {/* Priority Tabs and Sorting Controls Bar */}
          <div className="p-4 sm:px-6 border-b border-[#E6ECF2] flex flex-wrap items-center justify-between gap-4">
            {/* Priority Tabs */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E6ECF2]">
              <button
                onClick={() => setPriorityFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  priorityFilter === 'ALL' ? 'bg-white text-[#102033] shadow-xs' : 'text-[#526276]'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setPriorityFilter('RED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  priorityFilter === 'RED' ? 'bg-white text-[#B3261E] shadow-xs' : 'text-[#526276]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600" />
                Urgent ({patients.filter((p) => p.priority === 'RED').length})
              </button>
              <button
                onClick={() => setPriorityFilter('YELLOW')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  priorityFilter === 'YELLOW' ? 'bg-white text-[#996500] shadow-xs' : 'text-[#526276]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Prompt ({patients.filter((p) => p.priority === 'YELLOW').length})
              </button>
              <button
                onClick={() => setPriorityFilter('GREEN')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  priorityFilter === 'GREEN' ? 'bg-white text-[#087443] shadow-xs' : 'text-[#526276]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Routine ({patients.filter((p) => p.priority === 'GREEN').length})
              </button>
            </div>

            {/* Sorting Controls & Case Count */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#526276]">
                <span className="font-semibold text-[#102033]">Sort:</span>
                <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded-md border border-[#E6ECF2]">
                  <button
                    onClick={() => setSortMode('PRIORITY')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      sortMode === 'PRIORITY' ? 'bg-white text-[#102033] shadow-2xs' : 'text-[#6B7B8F]'
                    }`}
                  >
                    Priority
                  </button>
                  <button
                    onClick={() => setSortMode('WAIT_TIME')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      sortMode === 'WAIT_TIME' ? 'bg-white text-[#102033] shadow-2xs' : 'text-[#6B7B8F]'
                    }`}
                  >
                    Wait Time
                  </button>
                  <button
                    onClick={() => setSortMode('ARRIVAL')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      sortMode === 'ARRIVAL' ? 'bg-white text-[#102033] shadow-2xs' : 'text-[#6B7B8F]'
                    }`}
                  >
                    Arrival
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#6B7B8F]">
                Showing <strong className="text-[#102033]">{sortedPatients.length}</strong> cases · Sorted by{' '}
                <span className="font-medium text-[#25364A]">
                  {sortMode === 'PRIORITY' ? 'clinical priority' : sortMode === 'WAIT_TIME' ? 'wait duration' : 'arrival sequence'}
                </span>
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {sortedPatients.length === 0 ? (
            <EmptyStateIllustration
              title="Triage Queue All Clear"
              description="There are currently no patients waiting for clinical review under this priority."
              action={
                <Button variant="primary" size="md" onClick={() => router.push('/intake')} icon={<PlusCircle className="w-4 h-4" />}>
                  Start New Intake
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                    <th className="py-3 px-4"># ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Age / Sex</th>
                    <th className="py-3 px-4">Chief Complaint</th>
                    <th className="py-3 px-4">Triage Status</th>
                    <th className="py-3 px-4">Wait Time</th>
                    <th className="py-3 px-4">Arrival</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6ECF2]">
                  {sortedPatients.map((patient) => {
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
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#102033] block">{patient.name}</span>
                          <span className="text-[10px] text-[#6B7B8F] font-mono">{patient.syntheticCode}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#25364A] whitespace-nowrap tabular-nums">
                          {patient.age}y / {patient.gender[0]}
                        </td>
                        <td className="py-3.5 px-4 text-[#25364A] max-w-xs truncate">
                          {patient.chiefComplaint}
                        </td>
                        <td className="py-3.5 px-4">
                          <PriorityBadge priority={patient.priority} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap tabular-nums font-semibold">
                          <span
                            className={
                              waitMins >= 30
                                ? 'text-amber-700'
                                : waitMins >= 10 && patient.priority === 'RED'
                                ? 'text-red-700 font-bold'
                                : 'text-slate-700'
                            }
                          >
                            {getWaitLabel(patient)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B7B8F] whitespace-nowrap tabular-nums">
                          {patient.arrivalTime}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleInspectRow(patient)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Quick inspect patient"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => handleOpenPatient(patient.id)}
                              className="px-2.5 py-1 text-xs font-bold text-[#164FD6] hover:text-[#123FA8] hover:bg-blue-50 rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Open full workspace"
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
          )}
        </div>
      </div>

      {/* Quick Inspect Drawer */}
      <QuickInspectDrawer
        patient={inspectPatient}
        open={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
      />
    </ShellLayout>
  );
}
