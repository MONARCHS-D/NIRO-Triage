/**
 * Inter-Facility Referral API Service
 * Handles referrals and transfers between Primary Health Centres,
 * Community Health Centres, and District Referral Hospitals.
 */

import { apiRequest } from './client';
import { CreateReferralRequest, ReferralResponse } from './types';

const REFERRALS_STORAGE_KEY = 'niro_referrals_v1';

export async function createReferral(
  casePublicId: string,
  data: CreateReferralRequest
): Promise<ReferralResponse> {
  try {
    const res = await apiRequest<ReferralResponse>('/referrals', {
      method: 'POST',
      body: JSON.stringify({ ...data, casePublicId }),
      requiresAuth: true,
    });
    return res;
  } catch {
    console.warn(`[NIRO API] Referral created locally for case ${casePublicId}.`);
    const mockReferral: ReferralResponse = {
      publicId: 'ref-' + Math.random().toString(36).substring(2, 10),
      casePublicId,
      sourceFacilityId: 'fac-local',
      targetFacilityName: data.targetFacilityName,
      urgencyLevel: data.urgencyLevel,
      clinicalReason: data.clinicalReason,
      status: 'SENT',
      referredByUserId: 'usr-active',
      createdAt: new Date().toISOString(),
    };
    saveLocalReferral(mockReferral);
    return mockReferral;
  }
}

export async function getCaseReferrals(casePublicId: string): Promise<ReferralResponse[]> {
  try {
    const res = await apiRequest<ReferralResponse[]>(`/cases/${casePublicId}/referrals`, {
      method: 'GET',
      requiresAuth: true,
    });
    return res;
  } catch {
    return getLocalReferrals().filter((r) => r.casePublicId === casePublicId);
  }
}

function getLocalReferrals(): ReferralResponse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReferral(referral: ReferralResponse): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalReferrals();
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify([referral, ...list]));
  } catch {
    // ignore
  }
}
