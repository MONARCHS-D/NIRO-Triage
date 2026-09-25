/**
 * CareIntel Async Tasks & Polling API Client
 */

import { apiFetch } from './client';
import { DEFAULT_POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from './config';
import { ApiError } from './errors';
import { AsyncTaskResponse } from './types';

export const tasksApi = {
  /**
   * Retrieve status and metadata of a specific async task.
   */
  async getTask(taskId: string): Promise<AsyncTaskResponse> {
    return apiFetch<AsyncTaskResponse>(`/tasks/${taskId}`, {
      method: 'GET',
    });
  },

  /**
   * Retrieve all async tasks associated with a case.
   */
  async listCaseTasks(caseId: string): Promise<AsyncTaskResponse[]> {
    return apiFetch<AsyncTaskResponse[]>(`/cases/${caseId}/tasks`, {
      method: 'GET',
    });
  },

  /**
   * Poll an async task until completion (SUCCEEDED or FAILED) or max attempts.
   */
  async pollUntilComplete(
    taskId: string,
    options?: {
      intervalMs?: number;
      maxAttempts?: number;
      onProgress?: (task: AsyncTaskResponse) => void;
    }
  ): Promise<AsyncTaskResponse> {
    const interval = options?.intervalMs || DEFAULT_POLL_INTERVAL_MS;
    const maxAttempts = options?.maxAttempts || MAX_POLL_ATTEMPTS;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const task = await this.getTask(taskId);
      if (options?.onProgress) {
        options.onProgress(task);
      }

      if (task.status === 'SUCCEEDED') {
        return task;
      }

      if (task.status === 'FAILED' || task.status === 'CANCELLED') {
        throw new ApiError(
          task.failure_reason || `Async task ended with status ${task.status}`,
          task.error_category || 'TASK_FAILED',
          500,
          task.correlation_id
        );
      }

      // Wait for next interval
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new ApiError('Async task polling timed out.', 'TASK_TIMEOUT', 408);
  },
};
