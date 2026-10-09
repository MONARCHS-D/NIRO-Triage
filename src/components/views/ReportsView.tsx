'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ReportExtractStudio } from '../intake/ReportExtractStudio';
import { evidenceApi } from '../../lib/api/evidence';
import { ConfidenceLevel, ExtractedFact, ReportDocument } from '../../types/triage';
import { Upload, Plus, Info, X } from 'lucide-react';
import { Button } from '../common/Button';

export const ReportsView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<ReportDocument | undefined>(undefined);
  const [uploadNotice, setUploadNotice] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const res = await evidenceApi.extractDocumentOcr(file);
        const mappedFacts: ExtractedFact[] = (res.extracted_facts || []).map((f) => ({
          id: f.id,
          category: (['LAB_CBC', 'LAB_BIOCHEM', 'VITALS', 'HISTORY', 'EXAM'].includes(f.category)
            ? f.category
            : 'LAB_BIOCHEM') as ExtractedFact['category'],
          name: f.name,
          value: f.value,
          unit: f.unit,
          referenceRange: f.referenceRange || undefined,
          sourceDocument: f.sourceDocument || file.name,
          sourcePage: f.sourcePage || 1,
          sourceLocation: f.sourceLocation,
          confidence: (f.confidence === 'HIGH' ? 'HIGH' : f.confidence === 'LOW' ? 'LOW' : 'MEDIUM') as ConfidenceLevel,
          confidenceScore: f.confidenceScore,
          boundingBox: f.boundingBox || undefined,
        }));
        const newDoc: ReportDocument = {
          id: `doc-${Date.now()}`,
          name: file.name,
          patientId: 'P-1042',
          type: file.type.includes('pdf') ? 'CBC' : 'BIOCHEMISTRY',
          pagesCount: res.page_count || 1,
          uploadDate: 'Today · Just now',
          fileSizeBytes: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          facts: mappedFacts,
        };
        setSelectedDoc(newDoc);
        setUploadNotice(true);
      } catch (err) {
        console.warn('Failed OCR extraction from header upload:', err);
        setUploadNotice(true);
      }
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
              OCR requires patient or guardian consent first. Start a new intake to capture consent and attach the report to its case: {' '}
              <Link href="/intake" className="font-semibold underline">
                New Intake
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
