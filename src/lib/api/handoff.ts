/**
 * CareIntel Referral & Handoff API Client
 */

import { apiFetch } from './client';

export const handoffApi = {
  /**
   * Prepare a referral package bundling structured evidence.
   */
  async prepareReferralPackage(caseId: string, evidenceIds: string[]): Promise<{ status: string; package_id?: string }> {
    return apiFetch<{ status: string; package_id?: string }>(`/cases/${caseId}/referral`, {
      method: 'POST',
      body: { evidence_ids: evidenceIds },
    });
  },

  /**
   * Finalize a prepared referral package.
   */
  async finalizePackage(packageId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/referrals/${packageId}/finalize`, {
      method: 'POST',
    });
  },

  /**
   * Initiate an external handoff to a recipient facility or provider.
   */
  async initiateHandoff(packageId: string, recipientId: string): Promise<{ status: string; handoff_id?: string }> {
    return apiFetch<{ status: string; handoff_id?: string }>(`/referrals/${packageId}/handoff`, {
      method: 'POST',
      body: { recipient_id: recipientId },
    });
  },

  /**
   * Transmit/send handoff payload.
   */
  async sendHandoff(handoffId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/handoffs/${handoffId}/send`, {
      method: 'POST',
    });
  },

  /**
   * Record recipient acknowledgement and tracking reference.
   */
  async recordAcknowledgement(handoffId: string, reference: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/handoffs/${handoffId}/acknowledge`, {
      method: 'POST',
      body: { reference },
    });
  },

  /**
   * Mark handoff as complete.
   */
  async completeHandoff(handoffId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/handoffs/${handoffId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * List active recipient institutions and facilities.
   */
  async listActiveRecipients(): Promise<{ recipients: any[] }> {
    return apiFetch<{ recipients: any[] }>('/recipients', {
      method: 'GET',
    });
  },
};
