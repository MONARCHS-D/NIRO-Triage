/**
 * CareIntel Review & Decision API Client
 */

import { apiFetch } from './client';
import { DraftActionRequest, ReviewDecisionRequest } from './types';

export const reviewApi = {
  /**
   * List review queue items with optional status / assignee filters.
   */
  async listQueue(filters?: { status?: string; assigned_to?: string }): Promise<{ items: any[] }> {
    return apiFetch<{ items: any[] }>('/queue', {
      method: 'GET',
      params: filters,
    });
  },

  /**
   * Assign a reviewer to a case in the queue.
   */
  async assignReviewer(caseId: string, reviewerId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/queue/${caseId}/assign`, {
      method: 'POST',
      body: { reviewer_id: reviewerId },
    });
  },

  /**
   * Reassign a reviewer.
   */
  async reassignReviewer(caseId: string, newReviewerId: string, reason: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/queue/${caseId}/reassign`, {
      method: 'POST',
      body: { new_reviewer_id: newReviewerId, reason },
    });
  },

  /**
   * Mark a review as started.
   */
  async startReview(caseId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/cases/${caseId}/review/start`, {
      method: 'POST',
    });
  },

  /**
   * Get all workspace clinical and draft data for a reviewer.
   */
  async getWorkspace(caseId: string): Promise<{ case: any }> {
    return apiFetch<{ case: any }>(`/cases/${caseId}/review/workspace`, {
      method: 'GET',
    });
  },

  /**
   * Submit human review decision with optimistic concurrency expected_version.
   */
  async submitDecision(caseId: string, payload: ReviewDecisionRequest): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/cases/${caseId}/review/decision`, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Accept an AI generated draft.
   */
  async acceptDraft(draftId: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/drafts/${draftId}/accept`, {
      method: 'POST',
    });
  },

  /**
   * Reject an AI generated draft with rationale.
   */
  async rejectDraft(draftId: string, rationale: string): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/drafts/${draftId}/reject`, {
      method: 'POST',
      body: { rationale },
    });
  },

  /**
   * Edit an AI draft before approval.
   */
  async editDraft(draftId: string, payload: DraftActionRequest): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/drafts/${draftId}/edit`, {
      method: 'POST',
      body: payload,
    });
  },
};
