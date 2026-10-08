'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { PatientWorkspaceView } from '../../../components/views/PatientWorkspaceView';
import { useTriage } from '../../../context/TriageContext';

import { Button } from '../../../components/common/Button';
import { AlertCircle } from 'lucide-react';

export default function PatientWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { patients, setSelectedPatientId } = useTriage();

  const patientId = params?.id as string;
  const patient = patients.find((p) => p.id === patientId);

  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId, setSelectedPatientId]);

  if (patients.length > 0 && !patient) {
    return (
      <ShellLayout>
        <div className="bg-white rounded-xl border border-[#E6ECF2] p-8 text-center max-w-lg mx-auto my-12 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#102033]">Patient Record Not Found</h2>
          <p className="text-xs text-[#526276]">
            No active patient record found matching identifier <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{patientId}</code> in the facility triage registry.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={() => router.push('/queue')}>
              ← Return to Triage Queue
            </Button>
          </div>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <PatientWorkspaceView onBackToQueue={() => router.push('/queue')} />
    </ShellLayout>
  );
}
