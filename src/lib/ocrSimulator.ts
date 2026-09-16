import { ExtractedFact } from '../types/triage';

export interface ReportDocument {
  id: string;
  name: string;
  patientId: string;
  type: 'CBC' | 'BIOCHEMISTRY' | 'DISCHARGE_SUMMARY' | 'PRESCRIPTION';
  pagesCount: number;
  uploadDate: string;
  fileSizeBytes: string;
  facts: ExtractedFact[];
}

export const SAMPLE_REPORTS: ReportDocument[] = [
  {
    id: 'doc-cbc-1042',
    name: 'CBC_Report_P1042.pdf',
    patientId: 'P-1042',
    type: 'CBC',
    pagesCount: 2,
    uploadDate: '13 Aug 2026 · 10:20',
    fileSizeBytes: '1.4 MB',
    facts: [
      {
        id: 'fact-1',
        category: 'LAB_CBC',
        name: 'Hemoglobin (Hb)',
        value: '11.2',
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5 g/dL',
        sourceDocument: 'CBC_Report_P1042.pdf',
        sourcePage: 1,
        sourceLocation: 'Table row 1 (Erythrocytes)',
        confidence: 'HIGH',
        confidenceScore: 0.98,
        boundingBox: { x: 10, y: 34, width: 80, height: 6 },
      },
      {
        id: 'fact-2',
        category: 'LAB_CBC',
        name: 'Total Leukocyte Count (WBC)',
        value: '13,800',
        unit: '/µL',
        referenceRange: '4,000 - 10,000 /µL',
        sourceDocument: 'CBC_Report_P1042.pdf',
        sourcePage: 1,
        sourceLocation: 'Table row 2 (Leukocytes)',
        confidence: 'HIGH',
        confidenceScore: 0.97,
        boundingBox: { x: 10, y: 41, width: 80, height: 6 },
      },
      {
        id: 'fact-3',
        category: 'LAB_CBC',
        name: 'Platelet Count',
        value: '2.1',
        unit: 'lakh/µL',
        referenceRange: '1.5 - 4.5 lakh/µL',
        sourceDocument: 'CBC_Report_P1042.pdf',
        sourcePage: 1,
        sourceLocation: 'Table row 3 (Thrombocytes)',
        confidence: 'HIGH',
        confidenceScore: 0.99,
        boundingBox: { x: 10, y: 48, width: 80, height: 6 },
      },
      {
        id: 'fact-4',
        category: 'LAB_CBC',
        name: 'Blood Sugar (Random)',
        value: '112',
        unit: 'mg/dL',
        referenceRange: '70 - 140 mg/dL',
        sourceDocument: 'CBC_Report_P1042.pdf',
        sourcePage: 2,
        sourceLocation: 'Table row 1 (Metabolic)',
        confidence: 'HIGH',
        confidenceScore: 0.95,
        boundingBox: { x: 10, y: 30, width: 80, height: 6 },
      },
    ],
  },
  {
    id: 'doc-bio-1035',
    name: 'Biochem_Report_P1035.pdf',
    patientId: 'P-1035',
    type: 'BIOCHEMISTRY',
    pagesCount: 1,
    uploadDate: '14 Aug 2026 · 10:47',
    fileSizeBytes: '980 KB',
    facts: [
      {
        id: 'fact-201',
        category: 'LAB_BIOCHEM',
        name: 'Blood Sugar (Fasting)',
        value: '98',
        unit: 'mg/dL',
        referenceRange: '70 - 100 mg/dL',
        sourceDocument: 'Biochem_Report_P1035.pdf',
        sourcePage: 1,
        sourceLocation: 'Table row 2',
        confidence: 'HIGH',
        confidenceScore: 0.97,
        boundingBox: { x: 10, y: 38, width: 80, height: 6 },
      },
      {
        id: 'fact-202',
        category: 'LAB_BIOCHEM',
        name: 'Serum Amylase',
        value: '64',
        unit: 'U/L',
        referenceRange: '28 - 100 U/L',
        sourceDocument: 'Biochem_Report_P1035.pdf',
        sourcePage: 1,
        sourceLocation: 'Table row 5',
        confidence: 'MEDIUM',
        confidenceScore: 0.88,
        boundingBox: { x: 10, y: 52, width: 80, height: 6 },
      },
    ],
  },
];
