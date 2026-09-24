'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Patient, Priority, CaseStatus, ExtractedFact, AuditEvent, TimelineEvent } from '../types/triage';
import { INITIAL_PATIENTS } from '../lib/syntheticData';
import { useRole } from './RoleContext';
import { createSession } from '../lib/api/patientSessionService';
import { createCase, updateCaseRisk, updateCaseStatus, getFacilityCases } from '../lib/api/caseService';
import { saveTriageNote, finalizeTriageNote } from '../lib/api/triageNoteService';
import { createReferral } from '../lib/api/referralService';
import { BackendCaseStatus, BackendRiskLevel } from '../lib/api/types';

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'OFFLINE_QUEUED';

interface TriageContextType {
  patients: Patient[];
  selectedPatientId: string;
  selectedPatient: Patient | null;
  priorityFilter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN';
  searchQuery: string;
  syncStatus: SyncStatus;
  lastSyncedAt: string;
  isAutoPolling: boolean;
  setSelectedPatientId: (id: string) => void;
  setPriorityFilter: (filter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN') => void;
  setSearchQuery: (query: string) => void;
  setIsAutoPolling: (enabled: boolean) => void;
  refreshQueue: () => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addPatient: (patient: Patient) => void;
  setPatientPriority: (id: string, priority: Priority, reason?: string) => void;
  setPatientStatus: (id: string, status: CaseStatus, reason?: string) => void;
  editFactValue: (patientId: string, factId: string, newValue: string) => void;
  answerQuestion: (patientId: string, questionId: string, selectedOption: string) => void;
  resolveMissingInfo: (patientId: string, missingInfoId: string, value: string) => void;
  approvePatientNote: (patientId: string, notes?: string) => void;
  escalatePatientCase: (patientId: string, reason: string) => void;
  resetToDefaults: () => void;
}

const TriageContext = createContext<TriageContextType | undefined>(undefined);

const STORAGE_KEY = 'niro_triage_patients_v1';

export function TriageProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentFacility, isOffline, isBackendOnline } = useRole();
  const [patients, setPatients] = useState<Patient[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isOffline ? 'OFFLINE_QUEUED' : 'SYNCED');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(true);
  const wasOfflineRef = useRef<boolean>(isOffline);

  const refreshQueue = useCallback(async () => {
    if (isOffline) {
      setSyncStatus('OFFLINE_QUEUED');
      return;
    }
    setSyncStatus('SYNCING');
    try {
      await getFacilityCases(currentFacility.id);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSyncStatus('SYNCED');
    } catch {
      setSyncStatus(isOffline ? 'OFFLINE_QUEUED' : 'SYNCED');
    }
  }, [currentFacility.id, isOffline]);

  // Live background polling (every 15s)
  useEffect(() => {
    if (!isAutoPolling || isOffline || !isBackendOnline) return;

    const interval = setInterval(() => {
      refreshQueue();
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoPolling, isOffline, isBackendOnline, refreshQueue]);

  // Network recovery & offline queue replay
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      console.log('[NIRO] Connectivity restored. Synchronizing queue.');
      refreshQueue();
    }
    wasOfflineRef.current = isOffline;
    setSyncStatus(isOffline ? 'OFFLINE_QUEUED' : 'SYNCED');
  }, [isOffline, refreshQueue]);

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
    // 1. Instant optimistic update
    setPatients((prev) => [patient, ...prev]);
    setSelectedPatientId(patient.id);

    // 2. Asynchronous backend session & case dispatch
    createSession(currentFacility.id, {
      facilityPublicId: currentFacility.id,
      patientReference: patient.id,
      age: patient.age,
      consentObtained: true,
      consentTimestamp: new Date().toISOString(),
    })
      .then((session) => {
        return createCase(session.publicId, {
          facilityPublicId: currentFacility.id,
          patientSessionPublicId: session.publicId,
          symptomText: patient.chiefComplaint,
          riskLevel: patient.priority === 'GREY' ? 'UNASSIGNED' : (patient.priority as BackendRiskLevel),
        });
      })
      .then((caseRes) => {
        if (caseRes?.publicId) {
          saveTriageNote(caseRes.publicId, {
            casePublicId: caseRes.publicId,
            version: 1,
            extractedFacts: patient.facts,
            missingInfo: patient.missingInfo,
            suggestedQuestions: patient.aiQuestions,
            summaryText: patient.chiefComplaint,
            isFinalized: false,
          });
        }
      })
      .catch((err) => {
        console.warn('[NIRO] API synchronization deferred or running in local mode:', err);
      });
  };

  const setPatientPriority = (id: string, priority: Priority, reason?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Sync to backend risk endpoint
    updateCaseRisk(
      id,
      priority === 'GREY' ? 'UNASSIGNED' : (priority as BackendRiskLevel),
      reason
    ).catch(() => {});
  };

  const setPatientStatus = (id: string, status: CaseStatus, reason?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Sync to backend status endpoint
    const backendStatusMap: Record<CaseStatus, BackendCaseStatus> = {
      CREATED: 'CREATED',
      PROCESSING: 'PROCESSING',
      AI_DRAFT: 'PROCESSING',
      PENDING_REVIEW: 'TRIAGE_READY',
      NEEDS_MORE_INFO: 'IN_REVIEW',
      REVIEWED: 'REVIEWED',
      ESCALATED: 'ESCALATED',
      APPROVED: 'REVIEWED',
    };
    updateCaseStatus(id, backendStatusMap[status] || 'IN_REVIEW', reason).catch(() => {});
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

    // Sync edited fact to backend triage note
    saveTriageNote(patientId, {
      extractedFacts:
        patients.find((p) => p.id === patientId)?.facts.map((f) =>
          f.id === factId ? { ...f, value: newValue } : f
        ) || [],
    }).catch(() => {});
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

  const approvePatientNote = (patientId: string, notes?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Finalize note via API
    finalizeTriageNote(patientId, currentUser.id).catch(() => {});
  };

  const escalatePatientCase = (patientId: string, reason: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            timeline: [newTimeline, ...patient.timeline],
            auditLog: [newAudit, ...patient.auditLog],
          };
        }
        return patient;
      })
    );

    // Dispatch referral via API
    createReferral(patientId, {
      casePublicId: patientId,
      targetFacilityName: 'District Headquarters Hospital (DHH)',
      urgencyLevel: 'IMMEDIATE',
      clinicalReason: reason,
    }).catch(() => {});
  };

  const resetToDefaults = () => {
    setPatients(INITIAL_PATIENTS);
    setSelectedPatientId('P-1042');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
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
        syncStatus,
        lastSyncedAt,
        isAutoPolling,
        setSelectedPatientId,
        setPriorityFilter,
        setSearchQuery,
        setIsAutoPolling,
        refreshQueue,
        updatePatient,
        addPatient,
        setPatientPriority,
        setPatientStatus,
        editFactValue,
        answerQuestion,
        resolveMissingInfo,
        approvePatientNote,
        escalatePatientCase,
        resetToDefaults,
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
