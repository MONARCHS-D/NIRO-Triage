/**
 * Case API Service Adapter
 * Provides a unified async interface for Triage Cases.
 * Ready to consume backend REST endpoints when deployed,
 * with full fallback to local synthetic repository.
 */

import { apiRequest } from './client';
import {
  BackendCaseStatus,
  BackendRiskLevel,
  CaseDetailResponse,
  CreateCaseRequest,
} from './types';

const CASES_STORAGE_KEY = 'niro_api_cases_v1';

/**
 * Create a new Triage Case linked to a Patient Session
 * Endpoint: POST /api/v1/triagemitra/cases
 */
export async function createCase(
  sessionPublicId: string,
  payload: CreateCaseRequest
): Promise<CaseDetailResponse> {
  try {
    const res = await apiRequest<CaseDetailResponse>('/cases', {
      method: 'POST',
      body: JSON.stringify({ ...payload, patientSessionPublicId: sessionPublicId }),
      requiresAuth: true,
    });
    return res;
  } catch (err) {
    console.warn('[NIRO API] Backend case creation call failed or offline. Generating local case record.', err);
    const mockCase: CaseDetailResponse = {
      publicId: 'case-' + Math.random().toString(36).substring(2, 10),
      facilityPublicId: payload.facilityPublicId,
      patientSessionPublicId: sessionPublicId,
      tokenNumber: 1,
      patientReference: 'P-' + Math.floor(1000 + Math.random() * 9000),
      status: 'TRIAGE_READY',
      riskLevel: payload.riskLevel || 'UNASSIGNED',
      riskReason: payload.riskReason || '',
      symptomText: payload.symptomText || '',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalCase(mockCase);
    return mockCase;
  }
}

/**
 * Fetch all Cases for a facility
 * Endpoint: GET /api/v1/triagemitra/facilities/{facilityPublicId}/cases
 */
export async function getFacilityCases(
  facilityPublicId: string,
  filter?: { status?: BackendCaseStatus; riskLevel?: BackendRiskLevel }
): Promise<CaseDetailResponse[]> {
  try {
    let query = '';
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.riskLevel) params.append('riskLevel', filter.riskLevel);
    const qStr = params.toString();
    if (qStr) query = `?${qStr}`;

    const res = await apiRequest<CaseDetailResponse[]>(
      `/facilities/${facilityPublicId}/cases${query}`,
      {
        method: 'GET',
        requiresAuth: true,
        timeoutMs: 4000,
      }
    );
    return res;
  } catch {
    // Return local cases if backend is offline or endpoint not yet routed
    return getLocalCases().filter((c) => c.facilityPublicId === facilityPublicId);
  }
}

/**
 * Fetch a single case by UUID
 * Endpoint: GET /api/v1/triagemitra/cases/{casePublicId}
 */
export async function getCaseById(casePublicId: string): Promise<CaseDetailResponse | null> {
  try {
    const res = await apiRequest<CaseDetailResponse>(`/cases/${casePublicId}`, {
      method: 'GET',
      requiresAuth: true,
    });
    return res;
  } catch {
    return getLocalCases().find((c) => c.publicId === casePublicId) || null;
  }
}

/**
 * Update Case Risk Level (Physician / Nurse Triage action)
 * Endpoint: PATCH /api/v1/triagemitra/cases/{casePublicId}/risk
 */
export async function updateCaseRisk(
  casePublicId: string,
  riskLevel: BackendRiskLevel,
  reason?: string
): Promise<void> {
  try {
    await apiRequest(`/cases/${casePublicId}/risk`, {
      method: 'PATCH',
      body: JSON.stringify({ riskLevel, riskReason: reason }),
      requiresAuth: true,
    });
  } catch {
    updateLocalCase(casePublicId, { riskLevel, riskReason: reason });
  }
}

/**
 * Update Case Status (CREATION -> PROCESSING -> IN_REVIEW -> REVIEWED -> ESCALATED)
 * Endpoint: PATCH /api/v1/triagemitra/cases/{casePublicId}/status
 */
export async function updateCaseStatus(
  casePublicId: string,
  status: BackendCaseStatus,
  reason?: string
): Promise<void> {
  try {
    await apiRequest(`/cases/${casePublicId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
      requiresAuth: true,
    });
  } catch {
    updateLocalCase(casePublicId, { status });
  }
}

function getLocalCases(): CaseDetailResponse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CASES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCase(caseItem: CaseDetailResponse): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalCases();
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify([caseItem, ...list]));
  } catch {
    // ignore
  }
}

function updateLocalCase(casePublicId: string, updates: Partial<CaseDetailResponse>): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalCases();
    const updated = list.map((c) =>
      c.publicId === casePublicId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
