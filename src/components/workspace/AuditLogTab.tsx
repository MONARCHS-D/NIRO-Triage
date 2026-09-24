'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { Shield, Clock, FileBadge, Lock, CheckCircle2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportAuditTrail } from '../../lib/api/auditLogService';

interface AuditLogTabProps {
  patient: Patient;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ patient }) => {
  const [filterRole, setFilterRole] = useState<'ALL' | 'AI' | 'HUMAN'>('ALL');

  const filteredLogs = patient.auditLog.filter((log) => {
    const isAi = log.actor.includes('AI') || log.actor.includes('NIRO') || log.actorRole.includes('AI');
    if (filterRole === 'AI') return isAi;
    if (filterRole === 'HUMAN') return !isAi;
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E6ECF2] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-[#102033]">Immutable Clinical Audit Trail</h3>
          </div>
          <p className="text-xs text-[#6B7B8F] mt-0.5">
            Section 14: Verifiable chronological log of all AI extractions, speech transcriptions, and human corrections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* ABDM Badge */}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#087443] border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> ABDM-Ready Spec
          </span>

          {/* Export JSON */}
          <button
            type="button"
            onClick={() => exportAuditTrail(patient.id, patient.auditLog, 'json')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            title="Download ABDM Audit Trail in JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-600" />
            <span>Export JSON</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={() => exportAuditTrail(patient.id, patient.auditLog, 'csv')}
            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            title="Download Audit Trail in CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Selector */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">Filter Actor:</span>
          <button
            type="button"
            onClick={() => setFilterRole('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterRole === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Events ({patient.auditLog.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('AI')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterRole === 'AI' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            AI Extractions Only
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('HUMAN')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              filterRole === 'HUMAN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Clinician / Staff Actions
          </button>
        </div>
        <span className="text-[11px] font-mono text-slate-400">ABDM Milestones: Section 14 & 18</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E6ECF2] text-[#6B7B8F] uppercase tracking-wider font-semibold text-[11px] bg-[#F8FAFC]">
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Actor & Role</th>
              <th className="py-2.5 px-3">Action Event</th>
              <th className="py-2.5 px-3">Object Affected</th>
              <th className="py-2.5 px-3">Details / Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF2] text-xs">
            {filteredLogs.map((log) => {
              const isAi = log.actor.includes('AI') || log.actor.includes('NIRO') || log.actorRole.includes('AI');
              const isDoctor = log.actorRole.includes('Doctor') || log.actorRole.includes('Officer');

              return (
                <tr key={log.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                  <td className="py-3 px-3 font-mono text-[#526276] tabular-nums whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#102033] block">{log.actor}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium inline-block mt-0.5 ${
                        isAi
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : isDoctor
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#25364A]">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[#102033]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#25364A] max-w-[160px] truncate">
                    {log.objectAffected}
                  </td>
                  <td className="py-3 px-3 text-[#526276] max-w-[240px]">
                    {log.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
