/**
 * CareIntel Case Management API Client
 */

import { apiFetch } from './client';
import { CaseHistoryResponse, CaseResponse, CreateCaseRequest, TransitionRequest } from './types';

export const caseApi = {
  /**
   * Create a new case. Requires an active consent ID.
   */
  async createCase(payload: CreateCaseRequest): Promise<CaseResponse> {
    return apiFetch<CaseResponse>('/cases', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Fetch a case by ID.
   */
  async getCase(caseId: string): Promise<CaseResponse> {
    return apiFetch<CaseResponse>(`/cases/${caseId}`, {
      method: 'GET',
    });
  },

  /**
   * Transition case state with optimistic concurrency check (expected_version).
   */
  async transitionCase(caseId: string, payload: TransitionRequest): Promise<CaseResponse> {
    return apiFetch<CaseResponse>(`/cases/${caseId}/transitions`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieve state transition history for a case.
   */
  async getCaseHistory(caseId: string): Promise<CaseHistoryResponse> {
    return apiFetch<CaseHistoryResponse>(`/cases/${caseId}/history`, {
      method: 'GET',
    });
  },
};
