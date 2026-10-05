'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { OfflineBanner } from '../common/OfflineBanner';
import { useRole } from '../../context/RoleContext';
import { PatientMobileExperience } from '../mobile/PatientMobileExperience';
import { Button } from '../common/Button';
import { Lock, AlertCircle } from 'lucide-react';

interface ShellLayoutProps {
  children: React.ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { viewMode, setViewMode, setUserRole, isAuthenticated, isSessionExpired, setIsSessionExpired } = useRole();

  // Route guard per Section 40
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // If in Patient Mobile Experience mode, render mobile viewport
  if (viewMode === 'PATIENT_MOBILE') {
    return (
      <div className="min-h-screen bg-slate-100 py-4 px-2 sm:px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mb-2 flex items-center justify-between text-xs text-slate-500 px-2">
          <span>Patient Mobile Triage View</span>
          <button
            type="button"
            onClick={() => {
              setViewMode('REVIEWER_DESKTOP');
              setUserRole('DOCTOR');
            }}
            className="text-xs text-[#2563EB] hover:underline font-semibold cursor-pointer"
          >
            ← Return to Workstation
          </button>
        </div>
        <PatientMobileExperience />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar (Section 5) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <OfflineBanner />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Section 40: Non-destructive Session Expired Modal */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-[#996500] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102033]">Your session has expired.</h3>
              <p className="text-xs text-[#526276] mt-1">
                Unsaved intake drafts remain safely cached locally. Sign in again to continue.
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => {
                setIsSessionExpired(false);
                router.push('/auth/login');
              }}
            >
              Sign in
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
