/**
 * CareIntel Structuring Engine API Client
 */

import { apiFetch } from './client';
import { EvaluateRequest, EvaluateResponse } from './types';

export const structuringApi = {
  /**
   * Trigger the synchronous structuring pipeline for a case.
   */
  async evaluateCase(caseId: string, extractionRunId: string): Promise<EvaluateResponse> {
    const payload: EvaluateRequest = { extraction_run_id: extractionRunId };
    return apiFetch<EvaluateResponse>(`/cases/${caseId}/evaluate`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Get chronological timeline events for a structured case.
   */
  async getTimeline(caseId: string): Promise<{ data: any[] }> {
    return apiFetch<{ data: any[] }>(`/cases/${caseId}/timeline`, {
      method: 'GET',
    });
  },

  /**
   * Get detected clinical conflict and contradiction records.
   */
  async getConflicts(caseId: string): Promise<{ data: any[] }> {
    return apiFetch<{ data: any[] }>(`/cases/${caseId}/conflicts`, {
      method: 'GET',
    });
  },

  /**
   * Get missing clinical information items against active checklists.
   */
  async getMissingInfo(caseId: string): Promise<{ data: any[] }> {
    return apiFetch<{ data: any[] }>(`/cases/${caseId}/missing-info`, {
      method: 'GET',
    });
  },

  /**
   * Get generated clarification follow-up questions.
   */
  async getQuestions(caseId: string): Promise<{ data: any[] }> {
    return apiFetch<{ data: any[] }>(`/cases/${caseId}/questions`, {
      method: 'GET',
    });
  },

  /**
   * Get structured case summary.
   */
  async getSummary(caseId: string): Promise<{ data: any }> {
    return apiFetch<{ data: any }>(`/cases/${caseId}/summary`, {
      method: 'GET',
    });
  },
};
