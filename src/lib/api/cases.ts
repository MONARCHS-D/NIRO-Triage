/**
 * CareIntel Case Management API Client
 */

import { apiFetch } from './client';
import {
  CaseHistoryResponse,
  CaseResponse,
  CreateCaseRequest,
  CreateEncounterRequest,
  EncounterListResponse,
  EncounterResponse,
  TransitionRequest,
} from './types';

export const caseApi = {
  /** List recent cases visible to the signed-in reviewer. */
  async listCases(filters?: { limit?: number; offset?: number }): Promise<CaseResponse[]> {
    return apiFetch<CaseResponse[]>('/cases', {
      method: 'GET',
      params: filters,
    });
  },

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

  /**
   * Create an encounter record for a case.
   */
  async createEncounter(caseId: string, payload: CreateEncounterRequest): Promise<EncounterResponse> {
    return apiFetch<EncounterResponse>(`/cases/${caseId}/encounters`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * List all encounters recorded for a case.
   */
  async listEncounters(caseId: string): Promise<EncounterListResponse> {
    return apiFetch<EncounterListResponse>(`/cases/${caseId}/encounters`, {
      method: 'GET',
    });
  },
};
