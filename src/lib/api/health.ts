/**
 * CareIntel Health & Readiness API Client
 */

import { apiFetch } from './client';

export interface HealthResponse {
  status: 'ok' | 'ready' | 'not_ready';
  checks?: {
    database?: string;
    redis?: string;
    blob_storage?: string;
    [key: string]: string | undefined;
  };
  latency_ms?: number;
}

export const healthApi = {
  /**
   * Check backend liveness probe
   */
  async checkLiveness(): Promise<{ status: string }> {
    return apiFetch<{ status: string }>('/health/live', {
      timeoutMs: 5000,
    });
  },

  /**
   * Check backend readiness (database + services)
   */
  async checkReadiness(): Promise<HealthResponse> {
    return apiFetch<HealthResponse>('/health/ready', {
      timeoutMs: 5000,
    });
  },
};
