'use client';

import React from 'react';
import { KpiCard } from '../common/KpiCard';
import { BarChart3, Clock, Languages, ShieldCheck, Activity, Users, AlertOctagon } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
          Facility Triage & Operational Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
          Real-time workload metrics, language diversity, review efficiency, and clinical safety compliance
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Intakes Today"
          value="48"
          delta="+14%"
          deltaType="increase"
          helperText="Covering 3 CHC wards & 2 outreach camps"
        />
        <KpiCard
          label="Avg Human Review Time"
          value="4.5 min"
          delta="-42%"
          deltaType="decrease"
          helperText="Accelerated from 7.8 min baseline"
        />
        <KpiCard
          label="Human Escalation Rate"
          value="6.2%"
          delta="Stable"
          deltaType="neutral"
          helperText="3 cases escalated to district hospital"
        />
        <KpiCard
          label="Indic Language Usage"
          value="78%"
          delta="+8%"
          deltaType="increase"
          helperText="Voice intake utilized across 4 languages"
        />
      </div>

      {/* Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Breakdown */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E6ECF2]">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#102033]">Regional Language Distribution</h3>
            </div>
            <span className="text-[11px] text-[#6B7B8F]">Multimodal Voice/Text</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#102033]">Odia (ଓଡ଼ିଆ)</span>
                <span className="tabular-nums text-[#526276]">42% (20 patients)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#102033]">Hindi (हिन्दी)</span>
                <span className="tabular-nums text-[#526276]">28% (13 patients)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#102033]">Bengali (বাংলা)</span>
                <span className="tabular-nums text-[#526276]">16% (8 patients)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '16%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#102033]">Telugu / Tamil</span>
                <span className="tabular-nums text-[#526276]">8% (4 patients)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-[#102033]">English</span>
                <span className="tabular-nums text-[#526276]">6% (3 patients)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '6%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Priority & Handoff Pipeline */}
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E6ECF2]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#102033]">Triage Priority Resolution</h3>
            </div>
            <span className="text-[11px] text-[#6B7B8F]">100% Human Signed-Off</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-red-50/50 border border-red-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#B3261E] block">High Priority (Urgent Escalation)</span>
                <span className="text-[11px] text-[#526276]">Cases with respiratory or cardiovascular alarms</span>
              </div>
              <span className="text-base font-bold text-[#B3261E] tabular-nums">3 cases</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#996500] block">Medium Priority (Prompt Review)</span>
                <span className="text-[11px] text-[#526276]">Uncertain labs or missing baseline parameters</span>
              </div>
              <span className="text-base font-bold text-[#996500] tabular-nums">17 cases</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#087443] block">Low Priority (Routine OPD)</span>
                <span className="text-[11px] text-[#526276]">Stable vitals, mild self-limiting symptoms</span>
              </div>
              <span className="text-base font-bold text-[#087443] tabular-nums">28 cases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Compliance Card */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-bold text-[#102033]">Responsible AI & Patient Safety Guarantee</h3>
        </div>
        <p className="text-xs text-[#526276] leading-relaxed">
          Zero autonomous diagnoses generated. Every triage priority determination, lab modification, and queue handoff was explicitly approved by a registered medical officer or verified healthcare professional, preserving an unalterable digital audit trail.
        </p>
      </div>
    </div>
  );
};
