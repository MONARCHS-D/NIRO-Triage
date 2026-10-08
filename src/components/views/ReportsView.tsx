'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ReportExtractStudio } from '../intake/ReportExtractStudio';
import { SAMPLE_REPORTS, ReportDocument } from '../../lib/ocrSimulator';
import { FileText, Upload, Plus, CheckCircle2, Search, Info, X } from 'lucide-react';
import { Button } from '../common/Button';

export const ReportsView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<ReportDocument>(SAMPLE_REPORTS[0]);
  const [uploadNotice, setUploadNotice] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadNotice(true);
    }
  };

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

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
          <Link href="/intake/report">
            <Button
              variant="secondary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              Intake OCR Studio
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {uploadNotice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              Document selected! For interactive OCR field extraction and binding to a patient record, you can also launch the{' '}
              <Link href="/intake/report" className="font-semibold underline">
                Report Intake Studio
              </Link>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUploadNotice(false)}
            className="text-blue-600 hover:text-blue-900 cursor-pointer ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Embedded OCR Studio with 50/50 Split View */}
      <ReportExtractStudio initialReport={selectedDoc} />
    </div>
  );
};
