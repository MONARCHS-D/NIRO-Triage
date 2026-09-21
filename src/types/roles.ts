export type UserRole = 'DOCTOR' | 'NURSE' | 'HEALTH_WORKER' | 'PATIENT' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  facility: string;
  avatarUrl?: string;
  department?: string;
  registrationNumber?: string;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  type: 'CHC' | 'PHC' | 'DISTRICT_HOSPITAL' | 'CAMP' | 'CLINIC' | 'INDUSTRIAL_HEALTH_UNIT';
  district: string;
  state: string;
  activePatients: number;
}
