'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { PatientsListView } from '../../components/views/PatientsListView';
import { useTriage } from '../../context/TriageContext';

export default function PatientsPage() {
  const router = useRouter();
  const { setSelectedPatientId } = useTriage();

  return (
    <ShellLayout>
      <PatientsListView
        onOpenPatient={(patientId) => {
          setSelectedPatientId(patientId);
          router.push(`/patients/${patientId}`);
        }}
        onNewIntake={() => router.push('/intake')}
      />
    </ShellLayout>
  );
}

