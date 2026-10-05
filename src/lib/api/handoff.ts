/**
 * CareIntel Referral & Handoff API Client
 */

import { apiFetch } from './client';
import {
  AcknowledgeHandoffRequest,
  CompleteHandoffRequest,
  HandoffResponse,
  InitiateHandoffRequest,
  PrepareReferralRequest,
  RecipientResponse,
  ReferralPackageResponse,
  SendHandoffRequest,
} from './types';

export const handoffApi = {
  /**
   * Prepare a referral package bundling structured evidence.
   */
  async prepareReferralPackage(caseId: string, payload: PrepareReferralRequest | string[]): Promise<ReferralPackageResponse> {
    const body = Array.isArray(payload) ? { evidence_ids: payload } : payload;
    return apiFetch<ReferralPackageResponse>(`/cases/${caseId}/referral`, {
      method: 'POST',
      body,
    });
  },

  /**
   * Finalize a prepared referral package.
   */
  async finalizePackage(packageId: string): Promise<ReferralPackageResponse> {
    return apiFetch<ReferralPackageResponse>(`/referrals/${packageId}/finalize`, {
      method: 'POST',
    });
  },

  /**
   * Initiate an external handoff to a recipient facility or provider.
   */
  async initiateHandoff(packageId: string, payload: InitiateHandoffRequest | string): Promise<HandoffResponse> {
    const body = typeof payload === 'string' ? { recipient_id: payload } : payload;
    return apiFetch<HandoffResponse>(`/referrals/${packageId}/handoff`, {
      method: 'POST',
      body,
    });
  },

  /**
   * Transmit/send handoff payload.
   */
  async sendHandoff(handoffId: string, payload: SendHandoffRequest | number): Promise<HandoffResponse> {
    const body = typeof payload === 'number' ? { expected_version: payload } : payload;
    return apiFetch<HandoffResponse>(`/handoffs/${handoffId}/send`, {
      method: 'POST',
      body,
    });
  },

  /**
   * Record recipient acknowledgement and tracking reference.
   */
  async recordAcknowledgement(
    handoffId: string,
    payload: AcknowledgeHandoffRequest | { reference: string; expected_version: number }
  ): Promise<HandoffResponse> {
    return apiFetch<HandoffResponse>(`/handoffs/${handoffId}/acknowledge`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Mark handoff as complete with multi-version optimistic locking.
   */
  async completeHandoff(
    handoffId: string,
    payload: CompleteHandoffRequest | { expected_handoff_version: number; expected_case_version: number }
  ): Promise<HandoffResponse> {
    return apiFetch<HandoffResponse>(`/handoffs/${handoffId}/complete`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * List active recipient institutions and facilities.
   */
  async listActiveRecipients(): Promise<RecipientResponse[]> {
    return apiFetch<RecipientResponse[]>('/recipients', {
      method: 'GET',
    });
  },
};
