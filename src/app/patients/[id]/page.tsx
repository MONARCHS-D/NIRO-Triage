'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { PatientWorkspaceView } from '../../../components/views/PatientWorkspaceView';
import { useTriage } from '../../../context/TriageContext';

export default function PatientWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { patients, setSelectedPatientId } = useTriage();

  const patientId = params?.id as string;

  useEffect(() => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, [patientId, setSelectedPatientId]);

  return (
    <ShellLayout>
      <PatientWorkspaceView onBackToQueue={() => router.push('/queue')} />
    </ShellLayout>
  );
}
