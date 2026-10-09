'use client';

import React from 'react';
import { ReportExtractStudio } from '../intake/ReportExtractStudio';

export const ReportsView: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-xl font-bold">Clinical documents & OCR archive</h1>
    <ReportExtractStudio />
  </div>
);
