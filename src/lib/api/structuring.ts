/**
 * CareIntel Structuring Engine API Client
 */

import { apiFetch } from './client';
import {
  ClarificationQuestionItem,
  ConflictItem,
  EvaluateRequest,
  EvaluateResponse,
  MissingInfoItem,
  StructuringSummaryResponse,
  TimelineEventItem,
} from './types';

export const structuringApi = {
  /**
   * Trigger the synchronous structuring evaluation pipeline for a case.
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
  async getTimeline(caseId: string): Promise<TimelineEventItem[]> {
    return apiFetch<TimelineEventItem[]>(`/cases/${caseId}/timeline`, {
      method: 'GET',
    });
  },

  /**
   * Get detected clinical conflict and contradiction records.
   */
  async getConflicts(caseId: string): Promise<ConflictItem[]> {
    return apiFetch<ConflictItem[]>(`/cases/${caseId}/conflicts`, {
      method: 'GET',
    });
  },

  /**
   * Get missing clinical information items against active checklists.
   */
  async getMissingInfo(caseId: string): Promise<MissingInfoItem[]> {
    return apiFetch<MissingInfoItem[]>(`/cases/${caseId}/missing-info`, {
      method: 'GET',
    });
  },

  /**
   * Get generated clarification follow-up questions.
   */
  async getQuestions(caseId: string): Promise<ClarificationQuestionItem[]> {
    return apiFetch<ClarificationQuestionItem[]>(`/cases/${caseId}/questions`, {
      method: 'GET',
    });
  },

  /**
   * Get overall structuring counts and summary status.
   */
  async getStructuringSummary(caseId: string): Promise<StructuringSummaryResponse> {
    return apiFetch<StructuringSummaryResponse>(`/cases/${caseId}/summary`, {
      method: 'GET',
    });
  },
};
