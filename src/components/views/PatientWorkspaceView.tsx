'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { PatientHeader } from '../workspace/PatientHeader';
import { SummaryTab } from '../workspace/SummaryTab';
import { TimelineTab } from '../workspace/TimelineTab';
import { ExtractedDataTab } from '../workspace/ExtractedDataTab';
import { MissingInfoTab } from '../workspace/MissingInfoTab';
import { AiQuestionsTab } from '../workspace/AiQuestionsTab';
import { AuditLogTab } from '../workspace/AuditLogTab';
import { EditPatientModal } from '../workspace/EditPatientModal';
import {
  FileText,
  Clock,
  Database,
  AlertCircle,
  HelpCircle,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface PatientWorkspaceViewProps {
  onBackToQueue?: () => void;
}

export type WorkspaceTabKey =
  | 'summary'
  | 'timeline'
  | 'extracted'
  | 'missing'
  | 'questions'
  | 'audit';

export const PatientWorkspaceView: React.FC<PatientWorkspaceViewProps> = ({
  onBackToQueue,
}) => {
  const { selectedPatient } = useTriage();
  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!selectedPatient) {
    return (
      <div className="bg-white rounded-xl border border-[#E6ECF2] p-12 text-center">
        <h3 className="text-base font-bold text-[#102033]">No patient selected</h3>
        <p className="text-xs text-[#6B7B8F] mt-1">Please select a patient from the queue.</p>
      </div>
    );
  }

  const missingCount = selectedPatient.missingInfo.filter((m) => m.status !== 'OBTAINED').length;
  const unansweredQuestions = selectedPatient.aiQuestions.filter((q) => !q.answeredOption).length;

  const tabs: { id: WorkspaceTabKey; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; alert?: boolean }[] = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'extracted', label: 'Extracted Data', icon: Database },
    {
      id: 'missing',
      label: 'Missing Information',
      icon: AlertCircle,
      badge: missingCount,
      alert: missingCount > 0,
    },
    {
      id: 'questions',
      label: 'AI Questions',
      icon: Sparkles,
      badge: unansweredQuestions,
    },
    { id: 'audit', label: 'Audit Log', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Patient Hero Header */}
      <PatientHeader
        patient={selectedPatient}
        onBack={onBackToQueue}
        onOpenEditModal={() => setIsEditModalOpen(true)}
      />

      {/* Hero Workspace Tabs Bar (Section 10) */}
      <div className="border-b border-[#E6ECF2] bg-white rounded-t-xl px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-[#164FD6]'
                    : 'border-transparent text-[#526276] hover:text-[#102033] hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#2563EB]' : 'text-[#6B7B8F]'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                      tab.alert
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="transition-all duration-150">
        {activeTab === 'summary' && (
          <SummaryTab
            patient={selectedPatient}
            onNavigateToTab={(key) => setActiveTab(key as WorkspaceTabKey)}
          />
        )}
        {activeTab === 'timeline' && <TimelineTab patient={selectedPatient} />}
        {activeTab === 'extracted' && <ExtractedDataTab patient={selectedPatient} />}
        {activeTab === 'missing' && (
          <MissingInfoTab
            patient={selectedPatient}
            onNavigateToAiQuestions={() => setActiveTab('questions')}
          />
        )}
        {activeTab === 'questions' && <AiQuestionsTab patient={selectedPatient} />}
        {activeTab === 'audit' && <AuditLogTab patient={selectedPatient} />}
      </div>

      {/* Edit Details Modal */}
      <EditPatientModal
        patient={selectedPatient}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
