/**
 * CareIntel Escalation API Client
 */

import { apiFetch } from './client';
import { CreateEscalationRequest, EscalationResponse, ResolveEscalationRequest } from './types';

export const escalationApi = {
  /**
   * Create an urgent clinical escalation for a case.
   */
  async createEscalation(
    caseId: string,
    payload: CreateEscalationRequest | { reason: string; expected_case_version: number; expected_queue_version?: number }
  ): Promise<EscalationResponse> {
    const body: CreateEscalationRequest = {
      reason: payload.reason,
      expected_case_version: payload.expected_case_version,
      expected_queue_version: payload.expected_queue_version ?? payload.expected_case_version,
    };
    return apiFetch<EscalationResponse>(`/cases/${caseId}/escalation`, {
      method: 'POST',
      body,
    });
  },

  /**
   * Resolve a clinical escalation.
   */
  async resolveEscalation(
    escalationId: string,
    payload: ResolveEscalationRequest | { resolution_notes: string; expected_case_version: number; expected_queue_version?: number }
  ): Promise<EscalationResponse> {
    const body: ResolveEscalationRequest = {
      resolution_notes: payload.resolution_notes,
      expected_case_version: payload.expected_case_version,
      expected_queue_version: payload.expected_queue_version ?? payload.expected_case_version,
    };
    return apiFetch<EscalationResponse>(`/escalations/${escalationId}/resolve`, {
      method: 'POST',
      body,
    });
  },
};
