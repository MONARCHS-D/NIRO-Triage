'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';
import { KpiCard } from '../../components/common/KpiCard';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  PlusCircle,
  ArrowRight,
  Filter,
  Activity,
  Languages,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { patients, priorityFilter, setPriorityFilter, searchQuery, setSearchQuery, setSelectedPatientId } = useTriage();
  const { currentUser, currentFacility } = useRole();
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Compute stats
  const awaitingReviewCount = patients.filter((p) => p.status === 'PENDING_REVIEW' || p.status === 'NEEDS_MORE_INFO').length;
  const highPriorityCount = patients.filter((p) => p.priority === 'RED').length;

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

  const handleOpenPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    router.push(`/patients/${patientId}`);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header section (Section 6) */}
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
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowSkeleton(!showSkeleton)}
              className="text-xs"
            >
              {showSkeleton ? 'Hide Skeleton' : 'Toggle Skeleton'}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/intake')}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Start New Intake
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards (Section 6) */}
        {showSkeleton ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200/70 rounded-lg animate-pulse" />
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

            <div className="text-xs text-[#6B7B8F]">
              Showing <strong className="text-[#102033]">{filteredPatients.length}</strong> patients in active queue
            </div>
          </div>

          {/* Table */}
          {showSkeleton ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-md animate-pulse" />
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#102033]">No patients in this queue.</h3>
              <p className="text-xs text-[#6B7B8F] mt-1 mb-4">New intake cases will appear here.</p>
              <Button variant="primary" size="md" onClick={() => router.push('/intake')}>
                Start New Intake
              </Button>
            </div>
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

        {/* Section 33: Lightweight Analytics Card on Dashboard */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#E6ECF2] gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#102033]">
                Facility Intake & Language Distribution (Today)
              </h3>
            </div>
            <span className="text-[11px] text-[#087443] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              100% Human Signed-Off
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <div className="flex items-center justify-between text-[#6B7B8F] mb-1">
                <span>Indic Voice Intake</span>
                <Languages className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
              <div className="text-lg font-bold text-[#102033]">78%</div>
              <p className="text-[11px] text-[#526276] mt-0.5">Odia (42%) · Hindi (28%) · Bengali (8%)</p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <div className="flex items-center justify-between text-[#6B7B8F] mb-1">
                <span>Triage Escalations</span>
                <Clock className="w-3.5 h-3.5 text-[#B3261E]" />
              </div>
              <div className="text-lg font-bold text-[#B3261E]">6.2%</div>
              <p className="text-[11px] text-[#526276] mt-0.5">3 cases escalated to district hospital</p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2]">
              <div className="flex items-center justify-between text-[#6B7B8F] mb-1">
                <span>Responsible AI Policy</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-700">0 Diagnostic</div>
              <p className="text-[11px] text-[#526276] mt-0.5">Zero unverified autonomous outputs</p>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
