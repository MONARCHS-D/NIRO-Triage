'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { DashboardView } from '../../components/views/DashboardView';
import { useTriage } from '../../context/TriageContext';

export default function DashboardPage() {
  const router = useRouter();
  const { setSelectedPatientId } = useTriage();

  return (
    <ShellLayout>
      <DashboardView
        onOpenPatient={(patientId) => {
          setSelectedPatientId(patientId);
          router.push(`/patients/${patientId}`);
        }}
        onNewIntake={() => router.push('/intake')}
      />
    </ShellLayout>
  );
}

