/**
 * CareIntel API TypeScript Type Definitions
 * Maps to backend domain models, schemas, and enums in CareIntel/src/careintel/
 */

// ── Global Error Envelope ───────────────────────────────────────────────────
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    correlation_id?: string;
  };
}

// ── Auth & User ─────────────────────────────────────────────────────────────
export type UserRole =
  | 'patient'
  | 'health_worker'
  | 'nurse'
  | 'doctor'
  | 'medical_officer'
  | 'reviewer'
  | 'admin';

export type UserPermission =
  | 'manage:users'
  | 'manage:system'
  | 'consent:read'
  | 'consent:write'
  | 'case:read'
  | 'case:write'
  | 'evidence:read'
  | 'evidence:write'
  | 'processing:read'
  | 'processing:write'
  | 'structuring:read'
  | 'structuring:write'
  | 'knowledge:read'
  | 'knowledge:write'
  | 'ai:read'
  | 'ai:write'
  | 'review:read'
  | 'review:write'
  | 'review:assign'
  | 'escalation:read'
  | 'escalation:write'
  | 'referral:read'
  | 'referral:write'
  | 'handoff:read'
  | 'handoff:write'
  | 'recipient:manage';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfileResponse {
  id: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
}

// ── Consent ─────────────────────────────────────────────────────────────────
export type ConsentPurpose =
  | 'data_processing'
  | 'ai_analysis'
  | 'export'
  | 'referral';

export type ConsentState = 'REQUESTED' | 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED';

export interface ConsentRequest {
  subject_id: string;
  purpose: ConsentPurpose | string;
  notice_version: string;
}

export interface ConsentResponse {
  id: string;
  subject_id: string;
  purpose: string;
  notice_version: string;
  state: ConsentState;
}

// ── Cases ───────────────────────────────────────────────────────────────────
export type CaseState =
  | 'CREATED'
  | 'CONSENTED'
  | 'INPUT_RECEIVED'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'NORMALIZING'
  | 'RETRIEVING'
  | 'AI_ANALYSIS'
  | 'SAFETY_CHECK'
  | 'TRIAGE_DRAFT_READY'
  | 'REVIEW_PENDING'
  | 'REVIEWED'
  | 'ESCALATED'
  | 'REFERRED'
  | 'COMPLETED'
  | 'FAILED';

export interface CreateCaseRequest {
  synthetic_subject_id: string;
  facility_id?: string | null;
  consent_id: string;
}

export interface CaseResponse {
  case_id: string;
  synthetic_subject_id: string;
  facility_id: string | null;
  state: CaseState;
  version: number;
  opened_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitionRequest {
  to_state: CaseState;
  expected_version: number;
  reason?: string | null;
}

export interface CaseStateHistoryEntry {
  from_state: string;
  to_state: string;
  actor_id: string;
  aggregate_version: number;
  transitioned_at: string;
  reason?: string | null;
}

export interface CaseHistoryResponse {
  case_id: string;
  history: CaseStateHistoryEntry[];
}

// ── Evidence & Files ────────────────────────────────────────────────────────
export type EvidenceModality = 'TEXT' | 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'text' | 'document' | 'image' | 'audio';

export type EvidenceState =
  | 'PENDING_UPLOAD'
  | 'STORED'
  | 'QUARANTINED'
  | 'READY'
  | 'DELETE_PENDING'
  | 'DELETED'
  | 'DELETE_FAILED'
  | 'FAILED';

export interface RegisterTextRequest {
  case_id: string;
  text_content: string;
  consent_id: string;
  encounter_id?: string | null;
  source_language?: string | null;
}

export interface EvidenceResponse {
  evidence_id: string;
  case_id: string;
  encounter_id?: string | null;
  modality: EvidenceModality;
  state: EvidenceState;
  content_type: string;
  size_bytes: number;
  original_filename?: string | null;
  source_language?: string | null;
  created_by: string;
  created_at: string;
  provenance: Record<string, any>;
}

export interface SecureDownloadResponse {
  download_url: string;
  expires_at: string;
}

// ── Processing & Async Tasks ────────────────────────────────────────────────
export type ProcessorType =
  | 'document_ocr'
  | 'speech_transcription'
  | 'language_normalization'
  | 'candidate_extraction';

export interface TriggerProcessingRequest {
  evidence_id: string;
  processor_type: ProcessorType | string;
  parameters?: Record<string, any>;
}

export interface TriggerProcessingResponse {
  run_id: string;
  message?: string;
}

export type AsyncTaskStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface AsyncTaskResponse {
  id: string;
  task_type: string;
  status: AsyncTaskStatus;
  case_id: string;
  entity_type: string;
  entity_id: string;
  correlation_id: string;
  error_category?: string | null;
  failure_reason?: string | null;
  created_at: string;
  queued_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

// ── Structuring Engine ──────────────────────────────────────────────────────
export interface EvaluateRequest {
  extraction_run_id: string;
}

export interface EvaluateResponse {
  run_id: string;
}

export interface TimelineEventItem {
  id: string;
  event_type: string;
  source_statement: string;
  raw_temporal_expression?: string;
  temporal_precision?: string;
  resolution_state?: string;
  normalized_start?: string;
  normalized_end?: string;
  status: string;
  created_at: string;
}

export interface ConflictItem {
  id: string;
  field_type: string;
  status: string;
  description?: string;
  candidates?: Array<{ id: string; value: string; source: string }>;
}

export interface MissingInfoItem {
  id: string;
  field: string;
  label: string;
  category: string;
  status: 'NOT_PROVIDED' | 'OBTAINED' | 'UNAVAILABLE';
  reason?: string;
  askPrompt?: string;
  quickOptions?: string[];
}

export interface ClarificationQuestionItem {
  id: string;
  missingInfoId?: string;
  questionText: string;
  options?: string[];
  answeredOption?: string;
}

// ── Review & Decision ───────────────────────────────────────────────────────
export type ReviewDecisionType =
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_CLARIFICATION'
  | 'ESCALATE'
  | 'REFER';

export interface ReviewDecisionRequest {
  decision_type: ReviewDecisionType;
  rationale?: string | null;
  expected_version: number;
}

export interface DraftActionRequest {
  rationale?: string;
  edited_content?: Record<string, any>;
}

// ── Audio & Speech ──────────────────────────────────────────────────────────
export interface TextToSpeechRequest {
  text: string;
  voice?: string | null;
}
