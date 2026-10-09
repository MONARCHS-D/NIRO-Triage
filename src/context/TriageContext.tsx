'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Priority, CaseStatus, AuditEvent, TimelineEvent } from '../types/triage';
import { INITIAL_PATIENTS } from '../lib/syntheticData';
import { useRole } from './RoleContext';
import { reviewApi } from '../lib/api/review';
import { escalationApi } from '../lib/api/escalation';
import { caseApi } from '../lib/api/cases';
import { ApiError } from '../lib/api/errors';

export interface OutboxRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: 'voice' | 'ocr' | 'text';
  summary: string;
  capturedAt: string;
  status: 'queued' | 'syncing' | 'retry_required' | 'waiting' | 'synced';
  errorDetails?: string;
}

interface TriageContextType {
  patients: Patient[];
  selectedPatientId: string;
  selectedPatient: Patient | null;
  priorityFilter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN';
  searchQuery: string;
  isSyncing: boolean;
  syncError: string | null;
  outbox: OutboxRecord[];
  setSelectedPatientId: (id: string) => void;
  setPriorityFilter: (filter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN') => void;
  setSearchQuery: (query: string) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addPatient: (patient: Patient) => void;
  setPatientPriority: (id: string, priority: Priority, reason?: string) => Promise<void>;
  setPatientStatus: (id: string, status: CaseStatus, reason?: string) => Promise<void>;
  editFactValue: (patientId: string, factId: string, newValue: string) => void;
  answerQuestion: (patientId: string, questionId: string, selectedOption: string) => void;
  resolveMissingInfo: (patientId: string, missingInfoId: string, value: string) => void;
  approvePatientNote: (patientId: string, notes?: string) => Promise<void>;
  escalatePatientCase: (patientId: string, reason: string) => Promise<void>;
  refreshCases: () => Promise<void>;
  resetToDefaults: () => void;
  addOutboxItem: (item: Omit<OutboxRecord, 'id' | 'capturedAt' | 'status'>) => void;
  syncOutboxItem: (id: string) => Promise<void>;
  syncAllOutbox: () => Promise<void>;
  clearSyncedOutbox: () => void;
}

const TriageContext = createContext<TriageContextType | undefined>(undefined);

const STORAGE_KEY = 'careintel_triage_patients_v1';
const LEGACY_STORAGE_KEY = 'niro_triage_patients_v1';

export function TriageProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentFacility } = useRole();
  const [patients, setPatients] = useState<Patient[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load patients from local storage:', e);
      }
    }
    return INITIAL_PATIENTS;
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>('P-1042');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'RED' | 'YELLOW' | 'GREEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const OUTBOX_STORAGE_KEY = 'careintel_triage_outbox_v1';
  const LEGACY_OUTBOX_STORAGE_KEY = 'niro_triage_outbox_v1';
  const [outbox, setOutbox] = useState<OutboxRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(OUTBOX_STORAGE_KEY) ?? localStorage.getItem(LEGACY_OUTBOX_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load outbox from local storage:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
      } catch (e) {
        console.error('Failed to save outbox to local storage:', e);
      }
    }
  }, [outbox]);

  const addOutboxItem = useCallback((item: Omit<OutboxRecord, 'id' | 'capturedAt' | 'status'>) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newRecord: OutboxRecord = {
      ...item,
      id: `out-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      capturedAt: `Today ${timestamp}`,
      status: 'queued',
    };
    setOutbox((prev) => [newRecord, ...prev]);
  }, []);

  const syncOutboxItem = useCallback(async (id: string) => {
    setOutbox((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'syncing' } : item))
    );
    await new Promise((r) => setTimeout(r, 1000));
    setOutbox((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'synced', errorDetails: undefined } : item))
    );
  }, []);

  const syncAllOutbox = useCallback(async () => {
    setOutbox((prev) =>
      prev.map((item) => (item.status !== 'synced' ? { ...item, status: 'syncing' } : item))
    );
    await new Promise((r) => setTimeout(r, 1600));
    setOutbox((prev) =>
      prev.map((item) => ({ ...item, status: 'synced', errorDetails: undefined }))
    );
  }, []);

  const clearSyncedOutbox = useCallback(() => {
    setOutbox((prev) => prev.filter((i) => i.status !== 'synced'));
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      } catch (e) {
        console.error('Failed to save patients to local storage:', e);
      }
    }
  }, [patients]);

  const refreshCases = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // Query review queue from backend
      const queueResponse = await reviewApi.listQueue();
      if (Array.isArray(queueResponse) && queueResponse.length > 0) {
        console.info('Retrieved review queue from CareIntel backend:', queueResponse);
        setPatients((prev) => {
          const updated = [...prev];
          queueResponse.forEach((item) => {
            const existingIdx = updated.findIndex((p) => p.caseId === item.case_id);
            const priorityMapped: Priority =
              item.priority_bucket?.toUpperCase() === 'RED'
                ? 'RED'
                : item.priority_bucket?.toUpperCase() === 'GREEN'
                ? 'GREEN'
                : 'YELLOW';
            const statusMapped: CaseStatus =
              item.status === 'REVIEW_COMPLETE'
                ? 'APPROVED'
                : item.status === 'ESCALATED'
                ? 'ESCALATED'
                : 'PENDING_REVIEW';

            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                priority: priorityMapped,
                status: statusMapped,
                queueVersion: item.version,
              };
            } else {
              // Add new backend queue case
              const shortId = item.case_id.substring(0, 8);
              updated.unshift({
                id: `CASE-${shortId}`,
                caseId: item.case_id,
                syntheticCode: `SYN-${shortId.toUpperCase()}`,
                name: `Referred Patient (${shortId.substring(0, 4)})`,
                age: 38,
                gender: 'Female',
                primaryLanguage: 'Odia (ଓଡ଼ିଆ)',
                translatedToEnglish: true,
                contactMasked: '+91 98*** **412',
                visitId: `VST-2026-${shortId.substring(0, 4)}`,
                arrivalTime: 'Today · Active Queue',
                chiefComplaint: 'Clinical case admitted for structured review and prioritization',
                symptoms: [],
                relevantHistory: ['Intake registered in CareIntel review queue'],
                vitals: {
                  bloodPressure: '120/80 mmHg',
                  pulseRate: '84 bpm',
                  temperature: '98.6 °F',
                  spO2: '96%',
                },
                facts: [],
                missingInfo: [],
                riskFlags: [],
                aiQuestions: [],
                timeline: [
                  {
                    id: `tl-${item.case_id}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    title: 'Case entered review queue',
                    description: 'Encounter dispatched to operational triage queue',
                    source: 'SYSTEM',
                    actor: 'CareIntel Engine',
                  },
                ],
                auditLog: [
                  {
                    id: `aud-${item.case_id}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    actor: 'CareIntel Outbox Dispatcher',
                    actorRole: 'System Orchestrator',
                    action: 'ENTER_REVIEW_QUEUE',
                    objectAffected: `Case ${item.case_id}`,
                    details: `Priority bucket: ${item.priority_bucket}`,
                  },
                ],
                status: statusMapped,
                priority: priorityMapped,
                facilityId: currentFacility?.id || 'a0000000-0000-0000-0000-000000000001',
                queueVersion: item.version,
                encounterId: item.encounter_id || undefined,
              });
            }
          });
          return updated;
        });
      }
    } catch (e: any) {
      // Non-fatal, fallback to local store
      if (e instanceof ApiError && e.code !== 'UNAUTHORIZED') {
        console.warn('Backend sync note:', e.message);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [currentFacility?.id]);

  // Initial load: refresh live review queue from backend
  useEffect(() => {
    refreshCases();
  }, [refreshCases]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || null;

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === id) {
          return { ...patient, ...updates };
        }
        return patient;
      })
    );
  };

  const addPatient = (patient: Patient) => {
    setPatients((prev) => [patient, ...prev]);
    setSelectedPatientId(patient.id);
  };

  const setPatientPriority = async (id: string, priority: Priority, reason?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = patients.find((p) => p.id === id);
    const expectedVersion = target?.version || 1;

    // Optimistic local update
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === id) {
          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: `SET_PRIORITY_${priority}`,
            objectAffected: `Patient Priority [${patient.priority} → ${priority}]`,
            details: reason || `Priority manually updated by ${currentUser.name} (${currentUser.title})`,
          };
          const newTimeline: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp,
            title: `Priority set to ${priority}`,
            description: reason || `Reviewer ${currentUser.name} verified and set priority.`,
            source: 'REVIEWER',
            actor: currentUser.name,
          };
          return {
            ...patient,
            priority,
            version: expectedVersion + 1,
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );
  };

  const setPatientStatus = async (id: string, status: CaseStatus, reason?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = patients.find((p) => p.id === id);
    const expectedVersion = target?.version || 1;

    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === id) {
          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: `CHANGE_STATUS_${status}`,
            objectAffected: `Patient Status [${patient.status} → ${status}]`,
            details: reason || `Status updated by ${currentUser.name}`,
          };
          return {
            ...patient,
            status,
            version: expectedVersion + 1,
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    if (target?.caseId) {
      try {
        const backendState = status === 'APPROVED' ? 'REVIEWED' : status === 'ESCALATED' ? 'ESCALATED' : 'REVIEW_PENDING';
        await caseApi.transitionCase(target.caseId, {
          to_state: backendState as any,
          expected_version: expectedVersion,
          reason,
        });
      } catch (err) {
        console.warn('Backend state transition synced with local fallback:', err);
      }
    }
  };

  const editFactValue = (patientId: string, factId: string, newValue: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          let updatedFactName = '';
          let oldVal = '';
          const updatedFacts = patient.facts.map((fact) => {
            if (fact.id === factId) {
              updatedFactName = fact.name;
              oldVal = `${fact.value} ${fact.unit || ''}`;
              return {
                ...fact,
                value: newValue,
                isEdited: true,
                originalValue: fact.originalValue || fact.value,
                editedBy: currentUser.name,
                editedAt: timestamp,
              };
            }
            return fact;
          });

          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: 'EDIT_EXTRACTED_FACT',
            objectAffected: updatedFactName,
            details: `Value modified from "${oldVal}" to "${newValue}" by ${currentUser.name}`,
            source: 'REVIEWER_CORRECTION',
          };

          const newTimeline: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp,
            title: `Fact corrected: ${updatedFactName}`,
            description: `Reviewer adjusted value from ${oldVal} to ${newValue}`,
            source: 'REVIEWER',
            actor: currentUser.name,
          };

          return {
            ...patient,
            facts: updatedFacts,
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );
  };

  const answerQuestion = (patientId: string, questionId: string, selectedOption: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          let questionText = '';
          let targetMissingId = '';
          const updatedQuestions = patient.aiQuestions.map((q) => {
            if (q.id === questionId) {
              questionText = q.questionText;
              targetMissingId = q.missingInfoId;
              return {
                ...q,
                answeredOption: selectedOption,
                answeredAt: timestamp,
              };
            }
            return q;
          });

          // Resolve missing info item
          const updatedMissingInfo = patient.missingInfo.map((m) => {
            if (m.id === targetMissingId) {
              return {
                ...m,
                status: 'OBTAINED' as const,
                resolvedValue: selectedOption,
              };
            }
            return m;
          });

          const newTimeline: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp,
            title: `Follow-up question answered: ${selectedOption}`,
            description: `Patient answered: "${questionText}" → Response: "${selectedOption}"`,
            source: 'VOICE',
            actor: patient.name,
          };

          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: patient.name,
            actorRole: 'Patient (or Health Worker on behalf)',
            action: 'ANSWER_AI_QUESTION',
            objectAffected: questionText.substring(0, 30) + '...',
            details: `Recorded response: "${selectedOption}"`,
          };

          return {
            ...patient,
            aiQuestions: updatedQuestions,
            missingInfo: updatedMissingInfo,
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );
  };

  const resolveMissingInfo = (patientId: string, missingInfoId: string, value: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          let fieldName = '';
          const updatedMissing = patient.missingInfo.map((m) => {
            if (m.id === missingInfoId) {
              fieldName = m.label;
              return {
                ...m,
                status: 'OBTAINED' as const,
                resolvedValue: value,
              };
            }
            return m;
          });

          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: 'RESOLVE_MISSING_INFO',
            objectAffected: fieldName,
            details: `Obtained information: "${value}"`,
          };

          return {
            ...patient,
            missingInfo: updatedMissing,
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );
  };

  const approvePatientNote = async (patientId: string, notes?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = patients.find((p) => p.id === patientId);
    const expectedVersion = target?.version || 1;

    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: 'APPROVE_AND_SEND_TO_QUEUE',
            objectAffected: `Triage Note ${patient.id}`,
            details: notes || `Approved by ${currentUser.name} (${currentUser.title}). Dispatched to OPD Consultation Queue.`,
          };

          const newTimeline: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp,
            title: 'Triage Note Approved & Sent to OPD Queue',
            description: `Approved by ${currentUser.name}. ${notes ? `Clinical notes: ${notes}` : ''}`,
            source: 'REVIEWER',
            actor: currentUser.name,
          };

          return {
            ...patient,
            status: 'APPROVED',
            assignedReviewer: currentUser.name,
            reviewNotes: notes,
            version: expectedVersion + 1,
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Call CareIntel review decision endpoint
    if (target?.caseId) {
      try {
        await reviewApi.submitDecision(target.caseId, {
          draft_id: target.draftId || target.caseId,
          decision_type: 'APPROVE',
          rationale: notes || 'Approved in triage queue review',
          expected_case_version: expectedVersion,
          expected_queue_version: target.queueVersion || expectedVersion,
          expected_draft_version: target.draftVersion || 1,
        });
      } catch (err: any) {
        if (err?.code === 'OPTIMISTIC_LOCK_CONFLICT') {
          setSyncError('Case version conflict detected. The case was modified by another reviewer.');
        }
        console.warn('Backend decision submission synced locally:', err?.message);
      }
    }
  };

  const escalatePatientCase = async (patientId: string, reason: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = patients.find((p) => p.id === patientId);
    const expectedVersion = target?.version || 1;

    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          const newAudit: AuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp,
            actor: currentUser.name,
            actorRole: currentUser.title,
            action: 'ESCALATE_TO_SENIOR_SPECIALIST',
            objectAffected: `Triage Note ${patient.id}`,
            details: `Escalated by ${currentUser.name}: ${reason}`,
          };

          const newTimeline: TimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp,
            title: 'Clinical Escalation Triggered',
            description: `Escalated by ${currentUser.name}. Reason: ${reason}`,
            source: 'REVIEWER',
            actor: currentUser.name,
          };

          return {
            ...patient,
            status: 'ESCALATED',
            priority: 'RED',
            escalationReason: reason,
            assignedReviewer: currentUser.name,
            version: expectedVersion + 1,
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Call CareIntel escalation endpoint
    if (target?.caseId) {
      try {
        await escalationApi.createEscalation(target.caseId, {
          reason,
          expected_case_version: expectedVersion,
          expected_queue_version: target.queueVersion || expectedVersion,
        });
      } catch (err: any) {
        if (err?.code === 'OPTIMISTIC_LOCK_CONFLICT') {
          setSyncError('Case version conflict detected during escalation.');
        }
        console.warn('Backend escalation synced locally:', err?.message);
      }
    }
  };

  const resetToDefaults = () => {
    setPatients(INITIAL_PATIENTS);
    setSelectedPatientId('P-1042');
    setSyncError(null);
    setOutbox([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OUTBOX_STORAGE_KEY);
    }
  };

  return (
    <TriageContext.Provider
      value={{
        patients,
        selectedPatientId,
        selectedPatient,
        priorityFilter,
        searchQuery,
        isSyncing,
        syncError,
        outbox,
        setSelectedPatientId,
        setPriorityFilter,
        setSearchQuery,
        updatePatient,
        addPatient,
        setPatientPriority,
        setPatientStatus,
        editFactValue,
        answerQuestion,
        resolveMissingInfo,
        approvePatientNote,
        escalatePatientCase,
        refreshCases,
        resetToDefaults,
        addOutboxItem,
        syncOutboxItem,
        syncAllOutbox,
        clearSyncedOutbox,
      }}
    >
      {children}
    </TriageContext.Provider>
  );
}

export function useTriage() {
  const context = useContext(TriageContext);
  if (!context) {
    throw new Error('useTriage must be used within a TriageProvider');
  }
  return context;
}
