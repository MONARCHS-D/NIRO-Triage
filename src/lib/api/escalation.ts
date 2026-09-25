/**
 * CareIntel Escalation API Client
 */

import { apiFetch } from './client';

export const escalationApi = {
  /**
   * Create an urgent clinical escalation for a case.
   */
  async createEscalation(caseId: string, reason: string, expectedVersion: number): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/cases/${caseId}/escalation`, {
      method: 'POST',
      body: {
        reason,
        expected_version: expectedVersion,
      },
    });
  },

  /**
   * Resolve a clinical escalation.
   */
  async resolveEscalation(
    escalationId: string,
    resolutionNotes: string,
    expectedCaseVersion: number
  ): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/escalations/${escalationId}/resolve`, {
      method: 'POST',
      body: {
        resolution_notes: resolutionNotes,
        expected_case_version: expectedCaseVersion,
      },
    });
  },
};
