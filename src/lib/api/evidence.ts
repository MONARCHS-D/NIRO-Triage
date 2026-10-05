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
    formData.append('modality', params.modality.toUpperCase());
    
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
};
