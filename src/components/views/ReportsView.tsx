'use client';

import React, { useState } from 'react';
import { ReportExtractStudio } from '../intake/ReportExtractStudio';
import { SAMPLE_REPORTS, ReportDocument } from '../../lib/ocrSimulator';
import { FileText, Upload, Plus, CheckCircle2, Search } from 'lucide-react';
import { Button } from '../common/Button';

export const ReportsView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<ReportDocument>(SAMPLE_REPORTS[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102033]">
            Clinical Documents & OCR Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#526276] mt-0.5">
            Cross-verify OCR bounding box regions, extracted lab values, and source documents
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => alert('File upload: In this prototype, select from the sample library or attach new PDF.')}
        >
          Upload New Document
        </Button>
      </div>

      {/* Embedded OCR Studio with 50/50 Split View */}
      <ReportExtractStudio initialReport={selectedDoc} />
    </div>
  );
};
