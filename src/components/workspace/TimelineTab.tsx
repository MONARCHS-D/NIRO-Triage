'use client';

import React from 'react';
import { Patient } from '../../types/triage';
import { SourceBadge } from '../common/Badge';
import { Clock, User, Mic, FileText, Bot, UserCheck } from 'lucide-react';

interface TimelineTabProps {
  patient: Patient;
  workspaceData?: Record<string, any> | null;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ patient, workspaceData }) => {
  const backendTimeline: Array<{
    id: string;
    source_statement: string;
    temporal_expression?: string;
    resolution_state?: string;
    evidence_id?: string;
  }> = workspaceData?.derived_information?.timeline || [];

  const totalEvents = patient.timeline.length + backendTimeline.length;

  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#E6ECF2]">
        <div>
          <h3 className="text-base font-bold text-[#102033]">Patient Clinical & Intake Timeline</h3>
          <p className="text-xs text-[#6B7B8F]">
            Chronological provenance tracking of patient statements, lab uploads, reviewer inputs, and advisory flags
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E6ECF2] text-[#25364A] tabular-nums">
          {totalEvents} Events Logged
        </span>
      </div>

      {backendTimeline.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#164FD6] mb-3 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" /> CareIntel Structuring Temporal Extractions
          </h4>
          <div className="space-y-2">
            {backendTimeline.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#102033]">&ldquo;{item.source_statement}&rdquo;</p>
                  {item.temporal_expression && (
                    <span className="text-[11px] text-[#6B7B8F]">
                      Extracted timeframe: <strong className="text-[#25364A]">{item.temporal_expression}</strong>
                    </span>
                  )}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-[#164FD6]">
                  {item.resolution_state || 'STRUCTURED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6ECF2]">
        {patient.timeline.map((event) => {
          return (
            <div key={event.id} className="relative group">
              {/* Event node icon */}
              <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center text-[#2563EB] shadow-xs">
                {event.source === 'VOICE' && <Mic className="w-3 h-3 text-[#2563EB]" />}
                {event.source === 'REPORT' && <FileText className="w-3 h-3 text-purple-600" />}
                {event.source === 'REVIEWER' && <UserCheck className="w-3 h-3 text-emerald-600" />}
                {(event.source === 'AI_DRAFT' || event.source === 'SYSTEM') && <Bot className="w-3 h-3 text-indigo-600" />}
              </div>

              {/* Event Content Card */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] hover:border-slate-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#102033]">{event.title}</span>
                    <SourceBadge source={event.source} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F] tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.timestamp}</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-[#25364A] leading-relaxed">
                  {event.description}
                </p>

                {/* Actor & Details line */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-[#6B7B8F]">
                  <span className="flex items-center gap-1 font-medium text-[#25364A]">
                    <User className="w-3 h-3 text-[#526276]" />
                    Actor: {event.actor}
                  </span>
                  {event.details && (
                    <span className="italic text-[#526276]">{event.details}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
