'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { OfflineBanner } from '../common/OfflineBanner';
import { useRole } from '../../context/RoleContext';
import { useTriage } from '../../context/TriageContext';
import { DashboardView } from '../views/DashboardView';
import { PatientWorkspaceView } from '../views/PatientWorkspaceView';
import { NewIntakeView } from '../views/NewIntakeView';
import { PatientsListView } from '../views/PatientsListView';
import { ReportsView } from '../views/ReportsView';
import { AnalyticsView } from '../views/AnalyticsView';
import { SettingsView } from '../views/SettingsView';
import { PatientMobileExperience } from '../mobile/PatientMobileExperience';

export const AppShell: React.FC = () => {
  const { viewMode } = useRole();
  const { setSelectedPatientId } = useTriage();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // If in Patient Mobile Experience mode, render the mobile view
  if (viewMode === 'PATIENT_MOBILE') {
    return (
      <div className="min-h-screen bg-slate-100 py-4 px-2 sm:px-4 flex flex-col items-center justify-center">
        {/* Device frame bar for testing on desktop */}
        <div className="w-full max-w-md mb-2 flex items-center justify-between text-xs text-slate-500 px-2">
          <span>Patient Mobile Triage View</span>
          <span className="font-mono text-[11px]">390 × 844 viewport</span>
        </div>
        <PatientMobileExperience />
      </div>
    );
  }

  const handleOpenPatientWorkspace = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentTab('workspace');
  };

  const handleNewIntake = () => {
    setCurrentTab('intake');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar (224-248px per Section 4) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Reviewer Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <OfflineBanner />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenPatient={handleOpenPatientWorkspace}
              onNewIntake={handleNewIntake}
            />
          )}

          {currentTab === 'queue' && (
            <DashboardView
              onOpenPatient={handleOpenPatientWorkspace}
              onNewIntake={handleNewIntake}
            />
          )}

          {currentTab === 'workspace' && (
            <PatientWorkspaceView
              onBackToQueue={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'patients' && (
            <PatientsListView
              onOpenPatient={handleOpenPatientWorkspace}
              onNewIntake={handleNewIntake}
            />
          )}

          {currentTab === 'intake' && (
            <NewIntakeView
              onIntakeCompleted={(patientId) => {
                setSelectedPatientId(patientId);
                setCurrentTab('workspace');
              }}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};
