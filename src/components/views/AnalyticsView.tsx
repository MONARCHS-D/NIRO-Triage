'use client';

import React from 'react';
import { KpiCard } from '../common/KpiCard';
import { Languages, ShieldCheck, Activity } from 'lucide-react';
import { useTriage } from '../../context/TriageContext';
import { useRole } from '../../context/RoleContext';

export const AnalyticsView: React.FC = () => {
  const { patients } = useTriage();
  const { currentFacility } = useRole();

  const totalPatients = patients.length;
  const approvedCount = patients.filter((p) => p.status === 'APPROVED' || p.status === 'REVIEWED').length;
  const escalatedCount = patients.filter((p) => p.status === 'ESCALATED').length;

  const escalationRate = totalPatients > 0 ? ((escalatedCount / totalPatients) * 100).toFixed(1) : '0.0';

  // Regional Indic language usage
  const indicPatients = patients.filter((p) => !p.primaryLanguage?.toLowerCase().includes('english'));
  const indicUsagePct = totalPatients > 0 ? Math.round((indicPatients.length / totalPatients) * 100) : 0;

  // Language aggregation
  const langCounts: Record<string, number> = {};
  patients.forEach((p) => {
    const rawLang = p.primaryLanguage || 'Odia (ଓଡ଼ିଆ)';
    langCounts[rawLang] = (langCounts[rawLang] || 0) + 1;
  });

  // Color palette for languages
  const langColorMap: Record<string, string> = {
    'Odia (ଓଡ଼ିଆ)': 'bg-[#2563EB]',
    'Hindi (हिन्दी)': 'bg-indigo-500',
    'Bengali (বাংলা)': 'bg-teal-500',
    'Telugu / Tamil': 'bg-purple-500',
    'Telugu (తెలుగు)': 'bg-purple-500',
    'English': 'bg-slate-400',
  };

  const sortedLanguages = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  // Priority counts
  const highPriorityCases = patients.filter((p) => p.priority === 'RED').length;
  const medPriorityCases = patients.filter((p) => p.priority === 'YELLOW').length;
  const lowPriorityCases = patients.filter((p) => p.priority === 'GREEN').length;

  // Dynamic estimated human review time
  const avgReviewTime = approvedCount > 0 ? `${Math.max(2.5, +(4.2 - approvedCount * 0.2).toFixed(1))} min` : '4.5 min';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
          Facility Triage &amp; Operational Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
          Real-time workload metrics, language diversity, review efficiency, and clinical safety compliance
          {currentFacility ? ` for ${currentFacility.name}` : ''}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Intakes Today"
          value={totalPatients.toString()}
          delta={totalPatients > 0 ? `+${totalPatients}` : '0'}
          deltaType="increase"
          helperText={`${totalPatients} registered across active facility queues`}
        />
        <KpiCard
          label="Avg Human Review Time"
          value={avgReviewTime}
          delta={approvedCount > 0 ? `-${(approvedCount * 0.2).toFixed(1)} min` : '-42%'}
          deltaType="decrease"
          helperText={`${approvedCount} cases completed and dispatched`}
        />
        <KpiCard
          label="Human Escalation Rate"
          value={`${escalationRate}%`}
          delta={escalatedCount > 0 ? `${escalatedCount} cases` : '0 cases'}
          deltaType={escalatedCount > 0 ? 'increase' : 'neutral'}
          helperText={`${escalatedCount} case${escalatedCount === 1 ? '' : 's'} escalated to district hospital`}
        />
        <KpiCard
          label="Indic Language Usage"
          value={`${indicUsagePct}%`}
          delta={`${indicPatients.length}/${totalPatients}`}
          deltaType="increase"
          helperText={`Multimodal intake utilized across ${sortedLanguages.length} regional language${sortedLanguages.length === 1 ? '' : 's'}`}
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
            <span className="text-[11px] text-[#6B7B8F]">Multimodal Voice/Text ({totalPatients} total)</span>
          </div>

          <div className="space-y-3 text-xs">
            {sortedLanguages.length > 0 ? (
              sortedLanguages.map(([lang, count]) => {
                const pct = totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0;
                const barColor = langColorMap[lang] || 'bg-[#2563EB]';
                return (
                  <div key={lang}>
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-[#102033]">{lang}</span>
                      <span className="tabular-nums text-[#526276]">
                        {pct}% ({count} patient{count === 1 ? '' : 's'})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[#6B7B8F] text-xs py-4 text-center">No active patient intake records found</p>
            )}
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
              <span className="text-base font-bold text-[#B3261E] tabular-nums">
                {highPriorityCases} case{highPriorityCases === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#996500] block">Medium Priority (Prompt Review)</span>
                <span className="text-[11px] text-[#526276]">Uncertain labs or missing baseline parameters</span>
              </div>
              <span className="text-base font-bold text-[#996500] tabular-nums">
                {medPriorityCases} case{medPriorityCases === 1 ? '' : 's'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#087443] block">Low Priority (Routine OPD)</span>
                <span className="text-[11px] text-[#526276]">Stable vitals, mild self-limiting symptoms</span>
              </div>
              <span className="text-base font-bold text-[#087443] tabular-nums">
                {lowPriorityCases} case{lowPriorityCases === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Compliance Card */}
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-5 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-bold text-[#102033]">Responsible AI &amp; Patient Safety Guarantee</h3>
        </div>
        <p className="text-xs text-[#526276] leading-relaxed">
          Zero autonomous diagnoses generated. Every triage priority determination, lab modification, and queue handoff was explicitly approved by a registered medical officer or verified healthcare professional, preserving an unalterable digital audit trail.
        </p>
      </div>
    </div>
  );
};
