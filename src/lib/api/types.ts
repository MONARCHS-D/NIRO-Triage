/**
 * API Type Definitions for NIRO Triage / TriageMitra Backend Integration
 * Matches Spring Boot 3.3 DTOs, PostgreSQL 16 Schemas, and Response Envelopes
 */

export type FacilityType = 'PHC' | 'CHC' | 'CAMP' | 'CLINIC' | 'DISTRICT_HOSPITAL';

export type BackendUserRole = 'DOCTOR' | 'NURSE' | 'HEALTH_WORKER' | 'ADMIN';

export type BackendCaseStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'TRIAGE_READY'
  | 'IN_REVIEW'
  | 'REVIEWED'
  | 'ESCALATED'
  | 'REFERRED'
  | 'FAILED';

export type BackendRiskLevel = 'RED' | 'YELLOW' | 'GREEN' | 'UNASSIGNED';

export type BackendFileType = 'AUDIO_VOICE' | 'LAB_REPORT_PDF' | 'CLINICAL_IMAGE';

export type BackendUploadStatus = 'PENDING' | 'READY' | 'FAILED';

export type BackendReferralUrgency = 'IMMEDIATE' | 'PRIORITY' | 'ROUTINE';

export type BackendReferralStatus = 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'REJECTED';

/**
 * Standard backend response envelope matching Spring Boot ApiResponse<T>
 */
export interface ApiResponse<T> {
  serviceName: string;
  success: boolean;
  type: string;
  statusCode: number;
  payload: T;
  timeStamp: string;
}

/**
 * Request payload for POST /api/v1/triagemitra/onboarding/facility-admin
 */
export interface OnboardFacilityRequest {
  facilityName: string;
  facilityType: FacilityType;
  district: string;
  state: string;
  adminFullName: string;
  adminPhoneNumber: string;
  adminEmail?: string;
  adminPassword: string;
}

/**
 * Response payload for POST /api/v1/triagemitra/onboarding/facility-admin
 */
export interface OnboardFacilityResponse {
  facilityPublicId: string;
  facilityCode: string;
  facilityName: string;
  adminUserPublicId: string;
  adminFullName: string;
  message: string;
}

/**
 * Request payload for POST /api/v1/triagemitra/staff/invite
 */
export interface InviteStaffRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: BackendUserRole;
}

/**
 * Request payload for POST /api/v1/triagemitra/staff/activate
 */
export interface ActivateStaffRequest {
  inviteToken: string;
  otp: string;
  password: string;
}

/**
 * Response payload for POST /api/v1/triagemitra/staff/activate
 */
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Request payload for POST /api/v2/triagemitra/auth/login
 */
export interface LoginRequest {
  identifier: string; // Email or Phone Number
  password: string;
}

/**
 * Response payload for POST /api/v2/triagemitra/auth/login
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userPublicId: string;
  facilityPublicId: string;
  fullName: string;
  role: BackendUserRole;
}

/**
 * Client-facing API Error structure
 */
export interface ApiError {
  statusCode: number;
  message: string;
  serviceName?: string;
  timestamp?: string;
  details?: unknown;
}

/**
 * Staff invitation record stored for demo/dashboard tracking
 */
export interface InvitedStaffMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: BackendUserRole;
  invitedAt: string;
  status: 'PENDING' | 'ACTIVATED';
  activationUrl?: string;
}

/* =========================================================================
 * Phase 2: Patient Sessions, Cases, Files, Triage Notes & Referrals Contracts
 * ========================================================================= */

/**
 * Patient Session Contracts (Table: patient_sessions)
 */
export interface CreatePatientSessionRequest {
  facilityPublicId: string;
  patientReference: string;
  tokenNumber?: number;
  age?: number;
  consentObtained: boolean;
  consentTimestamp?: string;
}

export interface PatientSessionResponse {
  publicId: string;
  facilityPublicId: string;
  patientReference: string;
  tokenNumber: number;
  sessionDate: string;
  age?: number;
  consentObtained: boolean;
  consentTimestamp?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
}

/**
 * Clinical Case Contracts (Table: cases)
 */
export interface CreateCaseRequest {
  patientSessionPublicId: string;
  facilityPublicId: string;
  symptomText?: string;
  riskLevel?: BackendRiskLevel;
  riskReason?: string;
}

export interface CaseDetailResponse {
  publicId: string;
  facilityPublicId: string;
  patientSessionPublicId: string;
  tokenNumber: number;
  patientReference: string;
  status: BackendCaseStatus;
  riskLevel: BackendRiskLevel;
  riskReason?: string;
  symptomText?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Case Files Contracts (Table: case_files)
 */
export interface CaseFileDto {
  publicId: string;
  casePublicId: string;
  fileType: BackendFileType;
  blobStorageKey?: string;
  originalFilename: string;
  fileSizeBytes: number;
  sha256Hash: string;
  uploadStatus: BackendUploadStatus;
  extractedText?: string;
  createdAt: string;
}

/**
 * Triage Notes Contracts (Table: triage_notes)
 */
export interface TriageNoteDto {
  publicId?: string;
  casePublicId: string;
  version: number;
  extractedFacts: unknown[];
  missingInfo: unknown[];
  suggestedQuestions: unknown[];
  aiRiskScorePercent?: number;
  summaryText: string;
  isFinalized: boolean;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt?: string;
}

export interface FinalizeNoteResponse {
  casePublicId: string;
  isFinalized: boolean;
  finalizedBy: string;
  finalizedAt: string;
  message: string;
}

/**
 * Referrals Contracts (Table: referrals)
 */
export interface CreateReferralRequest {
  casePublicId: string;
  targetFacilityName: string;
  urgencyLevel: BackendReferralUrgency;
  clinicalReason: string;
}

export interface ReferralResponse {
  publicId: string;
  casePublicId: string;
  sourceFacilityId: string;
  targetFacilityName: string;
  urgencyLevel: BackendReferralUrgency;
  clinicalReason: string;
  status: BackendReferralStatus;
  referredByUserId: string;
  createdAt: string;
}

/**
 * Audit Log Contracts (Table: audit_logs)
 */
export interface AuditLogEntry {
  actorUserId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  facilityId?: string;
  clientIp?: string;
  details?: Record<string, unknown>;
  createdAt?: string;
}
