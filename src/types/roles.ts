export type UserRole = 'DOCTOR' | 'NURSE' | 'HEALTH_WORKER' | 'PATIENT' | 'ADMIN';

export type PermissionCode =
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

export interface RoleCapabilities {
  canApproveCase: boolean;
  canReferHandoff: boolean;
  canEscalateCase: boolean;
  canOverridePriority: boolean;
  canRunAi: boolean;
  canAcceptDraft: boolean;
  canManageSettings: boolean;
  canAccessDiagnostics: boolean;
  canPerformIntake: boolean;
  canViewReports: boolean;
  canAssignReview: boolean;
  isSuspended: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  facility: string;
  email?: string;
  avatarUrl?: string;
  department?: string;
  registrationNumber?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  joinedDate?: string;
  permissions?: PermissionCode[];
}

export interface GrantAccessInput {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  registrationNumber?: string;
  facility: string;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  type: 'CHC' | 'PHC' | 'DISTRICT_HOSPITAL' | 'CAMP' | 'INDUSTRIAL_HEALTH_UNIT';
  district: string;
  state: string;
  activePatients: number;
}

