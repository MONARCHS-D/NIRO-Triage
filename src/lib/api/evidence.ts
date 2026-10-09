/**
 * CareIntel Evidence API Client
 */

import { apiFetch } from './client';
import { EvidenceModality, EvidenceResponse, RegisterTextRequest, SecureDownloadResponse } from './types';

export const evidenceApi = {
  /**
   * Register direct text-based evidence for a case.
   */
  async registerTextEvidence(payload: RegisterTextRequest): Promise<EvidenceResponse> {
    return apiFetch<EvidenceResponse>('/evidence/text', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Upload file evidence (PDF, image, audio) via multipart FormData.
   */
  async uploadFileEvidence(params: {
    caseId: string;
    consentId: string;
    modality: EvidenceModality;
    file: File | Blob;
    fileName?: string;
    encounterId?: string;
  }): Promise<EvidenceResponse> {
    const formData = new FormData();
    formData.append('case_id', params.caseId);
    formData.append('consent_id', params.consentId);
    formData.append('modality', params.modality.toLowerCase());
    
    if (params.encounterId) {
      formData.append('encounter_id', params.encounterId);
    }

    if (params.fileName && params.file instanceof Blob && !(params.file instanceof File)) {
      formData.append('file', params.file, params.fileName);
    } else {
      formData.append('file', params.file);
    }

    return apiFetch<EvidenceResponse>('/evidence/files', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Get metadata for an evidence item.
   */
  async getEvidence(evidenceId: string): Promise<EvidenceResponse> {
    return apiFetch<EvidenceResponse>(`/evidence/${evidenceId}`, {
      method: 'GET',
    });
  },

  /**
   * Generate short-lived secure download SAS URL for an evidence file.
   */
  async getDownloadUrl(evidenceId: string): Promise<SecureDownloadResponse> {
    return apiFetch<SecureDownloadResponse>(`/evidence/${evidenceId}/download`, {
      method: 'GET',
    });
  },

  /**
   * Run interactive Azure Document Intelligence OCR and extract clinical facts from a PDF or image.
   */
  async extractDocumentOcr(
    file: File | Blob,
    consentContext?: { subjectId: string; consentId: string; aiConsentId: string },
    fileName?: string
  ): Promise<OcrExtractionResult> {
    if (!consentContext) {
      throw new Error('Record patient or guardian data-processing and AI analysis consent in New Intake before using OCR.');
    }
    const formData = new FormData();
    if (consentContext) {
      formData.append('synthetic_subject_id', consentContext.subjectId);
      formData.append('consent_id', consentContext.consentId);
      formData.append('ai_consent_id', consentContext.aiConsentId);
    }
    if (fileName && file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, fileName);
    } else {
      formData.append('file', file);
    }
    return apiFetch<OcrExtractionResult>('/evidence/ocr-extract', {
      method: 'POST',
      body: formData,
      timeoutMs: 180000,
    });
  },
};

export interface OcrExtractionResult {
  document_name: string;
  page_count: number;
  file_size_bytes: number;
  provider: string;
  pages: {
    page_number: number;
    width: number;
    height: number;
    unit: string;
  }[];
  page_images?: string[];
  regions: {
    page_number: number;
    text: string;
    reading_order: number;
    bounding_box?: number[] | null;
  }[];
  tables: {
    page_number: number;
    row_count: number;
    column_count: number;
    markdown: string;
  }[];
  extracted_facts: {
    id: string;
    category: string;
    name: string;
    value: string;
    unit: string;
    referenceRange?: string | null;
    sourceDocument: string;
    sourcePage: number;
    sourceLocation: string;
    confidence: 'HIGH' | 'MODERATE' | 'LOW' | string;
    confidenceScore: number;
    interpretation?: string | null;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
  }[];
}

