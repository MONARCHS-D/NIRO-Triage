'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '../../../components/layout/ShellLayout';
import { ReportExtractStudio } from '../../../components/intake/ReportExtractStudio';
import { useTriage } from '../../../context/TriageContext';

export default function ReportUploadPage() {
  const router = useRouter();
  const { selectedPatient } = useTriage();

  return (
    <ShellLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
            Report Upload & OCR Extraction Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            50/50 Split review: Interactive bounding boxes and structured fact extraction with confidence scoring
          </p>
        </div>

        <ReportExtractStudio
          onFactsExtracted={() => {
            if (selectedPatient) {
              router.push(`/patients/${selectedPatient.id}`);
            } else {
              router.push('/dashboard');
            }
          }}
        />
      </div>
    </ShellLayout>
  );
}
