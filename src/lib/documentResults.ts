import type { DocumentResultsResponse } from './api/types';

export function documentStatusLabel(result: DocumentResultsResponse): string {
  switch (result.status) {
    case 'AWAITING_SCAN': return 'Uploaded — awaiting content scan; OCR has not started';
    case 'QUARANTINED': return 'Document quarantined — processing is blocked';
    case 'PENDING': case 'RUNNING': return 'Processing';
    case 'PARTIAL': return 'Completed with partial extraction — needs human verification';
    case 'COMPLETED': return 'Completed with extracted evidence — needs human verification';
    case 'OCR_COMPLETED': return 'OCR completed — structured extraction pending';
    case 'NO_SUPPORTED_FIELDS': return 'No supported lab fields extracted — review source evidence';
    case 'NO_EXTRACTABLE_CONTENT': return 'No extractable content';
    case 'FAILED': return 'Processing failed — retry available';
    case 'DEMO_UNVERIFIED': return 'Demo output — upload requires a real OCR provider';
    default: return 'Not processed';
  }
}

// Refuse mismatched responses rather than showing another document's evidence.
export function assertDocumentIdentity(result: DocumentResultsResponse, caseId: string, evidenceId: string): void {
  if (result.case_id !== caseId || result.evidence_id !== evidenceId ||
      (result.ocr_run && result.ocr_run.evidence_id !== evidenceId) ||
      (result.extraction_run && result.extraction_run.evidence_id !== evidenceId) ||
      result.candidates.some(c => c.provenance.some(p => p.evidence_id !== evidenceId))) {
    throw new Error('Document result identity mismatch. Reload the selected document.');
  }
}
