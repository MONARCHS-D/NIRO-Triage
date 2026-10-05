/**
 * CareIntel Review & Decision API Client
 */

import { apiFetch } from './client';
import {
  AssignReviewerRequest,
  DraftActionRequest,
  DraftActionResponse,
  EditDraftRequest,
  EnterQueueRequest,
  QueueItemResponse,
  ReassignReviewerRequest,
  RejectDraftRequest,
  ReviewDecisionRequest,
  ReviewDecisionResponse,
  VersionRequest,
} from './types';

export const reviewApi = {
  /**
   * List review queue items with optional status / assignee filters.
   */
  async listQueue(filters?: { status?: string; assigned_to?: string }): Promise<QueueItemResponse[]> {
    return apiFetch<QueueItemResponse[]>('/queue', {
      method: 'GET',
      params: filters,
    });
  },

  /**
   * Enter a case into the review queue.
   */
  async enterQueue(caseId: string, payload?: EnterQueueRequest): Promise<QueueItemResponse> {
    return apiFetch<QueueItemResponse>(`/cases/${caseId}/review/queue`, {
      method: 'POST',
      body: payload || {},
    });
  },

  /**
   * Assign a reviewer to a case in the queue.
   */
  async assignReviewer(caseId: string, payload: AssignReviewerRequest): Promise<QueueItemResponse> {
    return apiFetch<QueueItemResponse>(`/queue/${caseId}/assign`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Reassign a reviewer.
   */
  async reassignReviewer(caseId: string, payload: ReassignReviewerRequest): Promise<QueueItemResponse> {
    return apiFetch<QueueItemResponse>(`/queue/${caseId}/reassign`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Mark a review as started.
   */
  async startReview(caseId: string, payload: VersionRequest): Promise<QueueItemResponse> {
    return apiFetch<QueueItemResponse>(`/cases/${caseId}/review/start`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Get all workspace clinical and draft data for a reviewer.
   */
  async getWorkspace(caseId: string): Promise<Record<string, any>> {
    return apiFetch<Record<string, any>>(`/cases/${caseId}/review/workspace`, {
      method: 'GET',
    });
  },

  /**
   * Submit human review decision with multi-version optimistic concurrency.
   */
  async submitDecision(caseId: string, payload: ReviewDecisionRequest): Promise<ReviewDecisionResponse> {
    return apiFetch<ReviewDecisionResponse>(`/cases/${caseId}/review/decision`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Accept an AI generated draft.
   */
  async acceptDraft(draftId: string, payload: DraftActionRequest): Promise<DraftActionResponse> {
    return apiFetch<DraftActionResponse>(`/drafts/${draftId}/accept`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Reject an AI generated draft with rationale.
   */
  async rejectDraft(draftId: string, payload: RejectDraftRequest): Promise<DraftActionResponse> {
    return apiFetch<DraftActionResponse>(`/drafts/${draftId}/reject`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Edit an AI draft before approval.
   */
  async editDraft(draftId: string, payload: EditDraftRequest): Promise<DraftActionResponse> {
    return apiFetch<DraftActionResponse>(`/drafts/${draftId}/edit`, {
      method: 'POST',
      body: payload,
    });
  },
};
