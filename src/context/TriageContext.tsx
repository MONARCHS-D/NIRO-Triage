'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, Priority, CaseStatus, ExtractedFact, AuditEvent, TimelineEvent } from '../types/triage';
import { INITIAL_PATIENTS } from '../lib/syntheticData';
import { useRole } from './RoleContext';

interface TriageContextType {
  patients: Patient[];
  selectedPatientId: string;
  selectedPatient: Patient | null;
  priorityFilter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN';
  searchQuery: string;
  setSelectedPatientId: (id: string) => void;
  setPriorityFilter: (filter: 'ALL' | 'RED' | 'YELLOW' | 'GREEN') => void;
  setSearchQuery: (query: string) => void;
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

const STORAGE_KEY = 'swasthya_setu_patients_v1';

export function TriageProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useRole();
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
    setPatients((prev) => [patient, ...prev]);
    setSelectedPatientId(patient.id);
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
