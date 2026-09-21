'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { useTriage } from '../../context/TriageContext';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ArrowRight, PlusCircle, Filter } from 'lucide-react';
import { AppAmbientGrid } from '../../components/motifs/AppAmbientGrid';
import { EmptyStateIllustration } from '../../components/illustrations/EmptyStateIllustration';

export default function QueuePage() {
  const router = useRouter();
  const { patients, priorityFilter, setPriorityFilter, searchQuery, setSelectedPatientId } = useTriage();

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

  const handleOpenPatient = (id: string) => {
    setSelectedPatientId(id);
    router.push(`/patients/${id}`);
  };

  return (
    <ShellLayout>
      <div className="space-y-6 relative overflow-hidden">
        {/* Section 10: Faint peripheral grid */}
        <AppAmbientGrid opacity={0.03} position="top-right" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">Operational Triage Queue</h1>
            <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
              Live facility cases categorized by clinical review priority
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => router.push('/intake')} icon={<PlusCircle className="w-4 h-4" />}>
            Start New Intake
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
          {/* Priority Tabs */}
          <div className="p-4 sm:px-6 border-b border-[#E6ECF2] flex flex-wrap items-center justify-between gap-4">
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
                High Priority ({patients.filter((p) => p.priority === 'RED').length})
              </button>
              <button
                onClick={() => setPriorityFilter('YELLOW')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  priorityFilter === 'YELLOW' ? 'bg-white text-[#996500] shadow-xs' : 'text-[#526276]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Medium ({patients.filter((p) => p.priority === 'YELLOW').length})
              </button>
              <button
                onClick={() => setPriorityFilter('GREEN')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                  priorityFilter === 'GREEN' ? 'bg-white text-[#087443] shadow-xs' : 'text-[#526276]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Low ({patients.filter((p) => p.priority === 'GREEN').length})
              </button>
            </div>
            <div className="text-xs text-[#6B7B8F]">
              Showing <strong className="text-[#102033]">{filteredPatients.length}</strong> cases
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            /* Section 15.1 Empty queue illustration state */
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                    <th className="py-3 px-4"># ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Age / Sex</th>
                    <th className="py-3 px-4">Chief Complaint</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Arrival</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6ECF2]">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => handleOpenPatient(patient.id)}
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
                      <td className="py-3.5 px-4">
                        <StatusBadge status={patient.status} />
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7B8F] whitespace-nowrap tabular-nums">
                        {patient.arrivalTime}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPatient(patient.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#164FD6] bg-[#E8F0FF] hover:bg-blue-100 px-3 py-1.5 rounded transition-colors cursor-pointer"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 10: Tiny bottom-right line motif */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#6B7B8F]">
          <span>Operational queue · Sorted by clinical risk severity</span>
          <div className="flex items-center gap-2 text-slate-400">
            <svg width="64" height="8" viewBox="0 0 64 8" fill="none" className="opacity-40">
              <path d="M0 4 H48 L56 1 L64 4" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="text-[10px] font-mono">STATION-1</span>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
