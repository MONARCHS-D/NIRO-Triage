/**
 * CareIntel Advisory AI API Client
 * Post advisory AI requests with strict provenance checking
 */

import { apiFetch } from './client';
import { AIDraftResponse, ExecuteAdvisoryRequest } from './types';

export const aiApi = {
  /**
   * Execute an advisory AI workflow to generate a policy-checked clinical draft note.
   */
  async executeAdvisory(caseId: string, payload: ExecuteAdvisoryRequest): Promise<AIDraftResponse> {
    return apiFetch<AIDraftResponse>(`/cases/${caseId}/ai/drafts`, {
      method: 'POST',
      body: payload,
    });
  },
};
