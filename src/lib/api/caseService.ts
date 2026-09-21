/**
 * Case & Session API Service Adapter
 * Provides a unified async interface for Triage Cases.
 * Ready to consume backend REST endpoints when deployed,
 * with full fallback to local synthetic repository.
 */

import { apiRequest } from './client';

export interface BackendCaseDto {
  casePublicId: string;
  facilityPublicId: string;
  patientReference: string;
  tokenNumber: number;
  status: 'CREATED' | 'PROCESSING' | 'TRIAGE_READY' | 'IN_REVIEW' | 'REVIEWED' | 'ESCALATED' | 'REFERRED' | 'FAILED';
  riskLevel: 'RED' | 'YELLOW' | 'GREEN' | 'UNASSIGNED';
  riskReason?: string;
  symptomText?: string;
  createdAt: string;
}

/**
 * Check if backend case endpoints are active, otherwise return null
 */
export async function fetchBackendCases(facilityPublicId: string): Promise<BackendCaseDto[] | null> {
  try {
    const cases = await apiRequest<BackendCaseDto[]>(`/facilities/${facilityPublicId}/cases`, {
      method: 'GET',
      requiresAuth: true,
      timeoutMs: 3000,
    });
    return cases;
  } catch {
    // Endpoints not yet deployed in backend; return null to signal fallback to local store
    return null;
  }
}
