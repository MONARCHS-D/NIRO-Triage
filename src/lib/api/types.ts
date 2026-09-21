/**
 * API Type Definitions for NIRO Triage / TriageMitra Backend Integration
 * Matches Spring Boot 3.3 DTOs and Response Envelopes
 */

export type FacilityType = 'PHC' | 'CHC' | 'CAMP' | 'CLINIC' | 'DISTRICT_HOSPITAL';

export type BackendUserRole = 'DOCTOR' | 'NURSE' | 'HEALTH_WORKER' | 'ADMIN';

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
