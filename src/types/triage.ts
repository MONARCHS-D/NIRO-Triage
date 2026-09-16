export type CaseStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'AI_DRAFT'
  | 'PENDING_REVIEW'
  | 'NEEDS_MORE_INFO'
  | 'REVIEWED'
  | 'ESCALATED'
  | 'APPROVED';

export type Priority = 'GREEN' | 'YELLOW' | 'RED' | 'GREY';

export type FactSource = 'VOICE' | 'REPORT' | 'REVIEWER' | 'AI_DRAFT' | 'PHOTO' | 'MANUAL';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedFact {
  id: string;
  category: 'VITALS' | 'LAB_CBC' | 'LAB_BIOCHEM' | 'HISTORY' | 'EXAM';
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  sourceDocument: string;
  sourcePage: number;
  sourceLocation: string; // e.g., 'Table row 3'
  confidence: ConfidenceLevel;
  confidenceScore?: number; // e.g. 0.96
  boundingBox?: { x: number; y: number; width: number; height: number }; // Percentage coords for document preview highlight
  isEdited?: boolean;
  originalValue?: string;
  editedBy?: string;
  editedAt?: string;
}

export interface Symptom {
  id: string;
  name: string;
  duration: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  onset?: string;
  notes?: string;
  source: FactSource;
  confidence: number;
}

export interface RiskFlag {
  id: string;
  type: 'RESPIRATORY_CONCERN' | 'SEVERITY_SIGNS' | 'UNUSUAL_VITALS' | 'HIGH_FEVER_PROLONGED' | 'CHEST_DISCOMFORT';
  severity: 'POTENTIAL_URGENCY' | 'PROMPT_REVIEW' | 'ROUTINE';
  label: string;
  description: string;
  evidenceFactIds: string[];
  missingFactNames: string[];
  humanActionRequired: boolean;
}

export interface MissingInformationItem {
  id: string;
  field: string;
  label: string;
  category: 'VITALS' | 'HISTORY' | 'SYMPTOM_DETAIL' | 'INVESTIGATION' | 'EXAM';
  status: 'NOT_PROVIDED' | 'PARTIALLY_KNOWN' | 'OBTAINED';
  reason: string;
  askPrompt: string;
  quickOptions?: string[];
  resolvedValue?: string;
}

export interface AiQuestion {
  id: string;
  missingInfoId: string;
  questionText: string;
  questionTextIndic?: { [lang: string]: string };
  options: string[];
  answeredOption?: string;
  answeredAt?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  source: FactSource | 'SYSTEM';
  actor: string;
  details?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  objectAffected: string;
  details: string;
  source?: string;
}

export interface Patient {
  id: string; // Synthetic ID e.g. P-1042
  syntheticCode: string; // e.g. SYN-2026-001
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  primaryLanguage: string; // e.g. 'Odia (ଓଡ଼ିଆ)', 'Hindi (हिन्दी)'
  translatedToEnglish: boolean;
  contactMasked: string; // e.g. '+91 98*** **412'
  visitId: string;
  arrivalTime: string;
  chiefComplaint: string;
  symptoms: Symptom[];
  relevantHistory: string[];
  vitals: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    spO2?: string;
    respiratoryRate?: string;
  };
  facts: ExtractedFact[];
  missingInfo: MissingInformationItem[];
  riskFlags: RiskFlag[];
  aiQuestions: AiQuestion[];
  timeline: TimelineEvent[];
  auditLog: AuditEvent[];
  status: CaseStatus;
  priority: Priority;
  assignedReviewer?: string;
  reviewNotes?: string;
  escalationReason?: string;
  facilityId: string;
}
