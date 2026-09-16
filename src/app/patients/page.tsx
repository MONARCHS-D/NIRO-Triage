'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { useTriage } from '../../context/TriageContext';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Search, PlusCircle, ArrowRight, Filter } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const { patients, setSelectedPatientId } = useTriage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = patients.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
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

  const handleOpenPatient = (id: string) => {
    setSelectedPatientId(id);
    router.push(`/patients/${id}`);
  };

  return (
    <ShellLayout>
      <div className="space-y-6">
        {/* Header Section (Section 36) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">Patients</h1>
            <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
              Search and reopen existing patient records across the facility
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/intake')}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            New Intake
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#6B7B8F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient ID / name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-[#E6ECF2] bg-[#F8FAFC] focus:bg-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#526276]">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-md border border-[#E6ECF2] bg-white text-[#25364A] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="NEEDS_MORE_INFO">Needs More Info</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ESCALATED">Escalated</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
        </div>

        {/* Table matching Section 36 Columns: Patient | Age/Sex | Last visit | Status | Action */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Age / Sex</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECF2]">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => handleOpenPatient(p.id)}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#102033] block group-hover:text-[#2563EB] group-hover:underline">
                      {p.id} · {p.name}
                    </span>
                    <span className="text-[11px] text-[#6B7B8F] truncate max-w-xs block">
                      {p.chiefComplaint}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#25364A] whitespace-nowrap tabular-nums">
                    {p.age} / {p.gender[0]}
                  </td>
                  <td className="py-3.5 px-4 text-[#526276] whitespace-nowrap">
                    {p.arrivalTime}
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
                        handleOpenPatient(p.id);
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
      </div>
    </ShellLayout>
  );
}
