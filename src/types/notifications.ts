import { Priority } from './triage';

export type NotificationType =
  | 'PATIENT_ARRIVAL'
  | 'URGENT_TRIAGE_ALERT'
  | 'PRIORITY_ESCALATION'
  | 'AI_EVALUATION_READY'
  | 'OUTBOX_SYNC_COMPLETE'
  | 'CLINICAL_HANDOFF';

export interface VitalEvidenceItem {
  label: string;
  value: string;
  isAbnormal?: boolean;
  isCritical?: boolean;
}

export interface TriageNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  patientId?: string;
  patientName?: string;
  patientAge?: number | string;
  patientGender?: string;
  department?: string;
  priority?: Priority;
  vitalsSnippet?: string;
  vitalsEvidence?: VitalEvidenceItem[];
  confidenceSnippet?: string;
  facilityName?: string;
  actionUrl?: string;
}

export interface ArrivalToast {
  id: string;
  notificationId: string;
  patientId: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  priority: Priority;
  chiefComplaint: string;
  vitalsSnippet?: string;
  vitalsEvidence?: VitalEvidenceItem[];
  timestamp: string;
  facilityName?: string;
  duration?: number;
}
