/**
 * CareIntel Multimodal Processing API Client
 */

import { apiFetch } from './client';
import { TriggerProcessingRequest, TriggerProcessingResponse } from './types';

export const processingApi = {
  /**
   * Trigger an async processing pipeline (OCR, STT, translation, extraction) for an evidence record.
   */
  async triggerProcessing(payload: TriggerProcessingRequest): Promise<TriggerProcessingResponse> {
    return apiFetch<TriggerProcessingResponse>('/processing/trigger', {
      method: 'POST',
      body: payload,
    });
  },
};
