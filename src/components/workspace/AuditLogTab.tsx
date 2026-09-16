'use client';

import React from 'react';
import { Patient } from '../../types/triage';
import { Shield, Clock, FileBadge, Lock, CheckCircle2 } from 'lucide-react';

interface AuditLogTabProps {
  patient: Patient;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ patient }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E6ECF2] gap-3">
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
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#087443] border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> AB-DM Ready Audit Schema
          </span>
        </div>
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
            {patient.auditLog.map((log) => {
              const isAi = log.actor.includes('AI') || log.actor.includes('SwasthyaSetu') || log.actorRole.includes('AI');
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
