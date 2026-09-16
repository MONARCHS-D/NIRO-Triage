import React from 'react';
import { Priority, CaseStatus, FactSource, ConfidenceLevel } from '../../types/triage';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle, Mic, FileText, UserCheck, Bot, Camera, Edit3 } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  switch (priority) {
    case 'RED':
      return (
        <span className={`inline-flex items-center rounded border border-red-200 bg-[#FDECEC] text-[#B3261E] ${sizeClasses}`}>
          {showIcon && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#B3261E]" />}
          <span>Potential Urgency</span>
        </span>
      );
    case 'YELLOW':
      return (
        <span className={`inline-flex items-center rounded border border-amber-200 bg-[#FFF6DD] text-[#996500] ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-[#996500]" />}
          <span>Prompt Review</span>
        </span>
      );
    case 'GREEN':
      return (
        <span className={`inline-flex items-center rounded border border-emerald-200 bg-[#EAF8F1] text-[#087443] ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#087443]" />}
          <span>Routine Review</span>
        </span>
      );
    case 'GREY':
    default:
      return (
        <span className={`inline-flex items-center rounded border border-slate-200 bg-[#F1F5F9] text-[#526276] ${sizeClasses}`}>
          {showIcon && <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#526276]" />}
          <span>Insufficient Info</span>
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: CaseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<CaseStatus, { label: string; bg: string; text: string; border: string }> = {
    CREATED: { label: 'Created', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    PROCESSING: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    AI_DRAFT: { label: 'AI Draft Ready', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    NEEDS_MORE_INFO: { label: 'Needs Info', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    REVIEWED: { label: 'Reviewed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    ESCALATED: { label: 'Escalated', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const item = map[status] || map.PENDING_REVIEW;

  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded font-medium border ${item.bg} ${item.text} ${item.border}`}>
      {item.label}
    </span>
  );
};

interface SourceBadgeProps {
  source: FactSource | 'SYSTEM';
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  switch (source) {
    case 'VOICE':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          <Mic className="w-3 h-3" /> Voice
        </span>
      );
    case 'REPORT':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
          <FileText className="w-3 h-3" /> Report OCR
        </span>
      );
    case 'REVIEWER':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          <UserCheck className="w-3 h-3" /> Reviewer
        </span>
      );
    case 'AI_DRAFT':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bot className="w-3 h-3" /> AI Draft
        </span>
      );
    case 'PHOTO':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Camera className="w-3 h-3" /> Visual Photo
        </span>
      );
    case 'MANUAL':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          <Edit3 className="w-3 h-3" /> Manual Input
        </span>
      );
  }
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  switch (confidence) {
    case 'HIGH':
      return (
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          High Conf
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
          Medium Conf
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          Needs Review
        </span>
      );
  }
};
