/**
 * CareIntel Multimodal Processing API Client
 */

import { apiFetch } from './client';
import {
  ProcessingRunResponse,
  TriggerProcessingRequest,
  TriggerProcessingResponse,
} from './types';

export const processingApi = {
  /**
   * Execute a processing step synchronously and return its terminal state.
   */
  async executeProcessing(payload: TriggerProcessingRequest): Promise<ProcessingRunResponse> {
    return apiFetch<ProcessingRunResponse>('/processing/execute', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Trigger an async processing pipeline (OCR, STT, translation, extraction) for an evidence record.
   */
  async triggerProcessing(payload: TriggerProcessingRequest): Promise<TriggerProcessingResponse> {
    return apiFetch<TriggerProcessingResponse>('/processing/trigger', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Retrieve a specific persisted processing run by ID.
   */
  async getRun(runId: string): Promise<ProcessingRunResponse> {
    return apiFetch<ProcessingRunResponse>(`/processing/runs/${runId}`, {
      method: 'GET',
    });
  },
};
