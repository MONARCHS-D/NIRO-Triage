/**
 * CareIntel Knowledge Retrieval API Client
 * Hybrid vector search (pgvector 1536-dim cosine) + PostgreSQL FTS + RRF
 */

import { apiFetch } from './client';
import { RetrievalRequest, RetrievalResponse } from './types';

export const retrievalApi = {
  /**
   * Run knowledge retrieval across medical guidance and facility protocols for a case.
   */
  async retrieveKnowledge(caseId: string, payload: RetrievalRequest): Promise<RetrievalResponse> {
    return apiFetch<RetrievalResponse>(`/cases/${caseId}/retrieval`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieve a past retrieval run result by run ID.
   */
  async getRetrievalResult(caseId: string, runId: string): Promise<RetrievalResponse> {
    return apiFetch<RetrievalResponse>(`/cases/${caseId}/retrieval/${runId}`, {
      method: 'GET',
    });
  },
};
