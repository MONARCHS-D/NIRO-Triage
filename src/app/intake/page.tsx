'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { NewIntakeView } from '../../components/views/NewIntakeView';
import { useTriage } from '../../context/TriageContext';

export default function IntakePage() {
  const router = useRouter();
  const { setSelectedPatientId } = useTriage();

  return (
    <ShellLayout>
      <NewIntakeView
        onIntakeCompleted={(patientId) => {
          setSelectedPatientId(patientId);
          router.push(`/patients/${patientId}`);
        }}
        onCancel={() => router.push('/dashboard')}
      />
    </ShellLayout>
  );
}
