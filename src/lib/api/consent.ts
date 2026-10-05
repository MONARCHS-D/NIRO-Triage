/**
 * CareIntel Consent API Client
 */

import { apiFetch } from './client';
import { ConsentRequest, ConsentResponse } from './types';

export const consentApi = {
  /**
   * Request consent for a given patient subject and purpose.
   */
  async requestConsent(payload: ConsentRequest): Promise<ConsentResponse> {
    return apiFetch<ConsentResponse>('/consent/request', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Capture and activate a requested consent record.
   */
  async captureConsent(consentId: string): Promise<ConsentResponse> {
    return apiFetch<ConsentResponse>(`/consent/${consentId}/capture`, {
      method: 'POST',
    });
  },

  /**
   * Withdraw an active consent record.
   */
  async withdrawConsent(consentId: string): Promise<ConsentResponse> {
    return apiFetch<ConsentResponse>(`/consent/${consentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Helper: Request and immediately capture consent (for standard user agreement).
   */
  async requestAndCapture(subjectId: string, purpose = 'data_processing', noticeVersion = '1.0'): Promise<ConsentResponse> {
    const requested = await this.requestConsent({
      subject_id: subjectId,
      purpose,
      notice_version: noticeVersion,
    });
    return this.captureConsent(requested.id);
  },
};
