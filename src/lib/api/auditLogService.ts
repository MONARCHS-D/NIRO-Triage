/**
 * Audit Log API Service
 * Handles immutable clinical audit logging matching Spring Boot audit_logs schema
 * and ABDM (Ayushman Bharat Digital Mission) compliance requirements.
 */

import { apiRequest } from './client';
import { AuditLogEntry } from './types';

const AUDIT_STORAGE_KEY = 'niro_audit_logs_v1';

/**
 * Record a clinical action event in the immutable audit log
 * Endpoint: POST /api/v1/triagemitra/audit (Requires JWT)
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  const completeEntry: AuditLogEntry = {
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  try {
    await apiRequest('/audit', {
      method: 'POST',
      body: JSON.stringify(completeEntry),
      requiresAuth: true,
      timeoutMs: 3000,
    });
  } catch {
    // If backend is offline or endpoint not yet routed, save locally
    saveLocalAuditLog(completeEntry);
  }
}

/**
 * Fetch all audit log entries for a specific case or patient
 * Endpoint: GET /api/v1/triagemitra/cases/{casePublicId}/audit
 */
export async function getCaseAuditLogs(casePublicId: string): Promise<AuditLogEntry[]> {
  try {
    const res = await apiRequest<AuditLogEntry[]>(`/cases/${casePublicId}/audit`, {
      method: 'GET',
      requiresAuth: true,
      timeoutMs: 3000,
    });
    return res;
  } catch {
    // Return local logs filtered by resourceId
    return getLocalAuditLogs().filter((l) => l.resourceId === casePublicId);
  }
}

/**
 * Export patient audit trail in ABDM-compliant JSON or CSV format
 */
export function exportAuditTrail(
  patientId: string,
  logs: { id: string; timestamp: string; actor: string; actorRole: string; action: string; objectAffected: string; details: string }[],
  format: 'json' | 'csv'
): void {
  if (typeof window === 'undefined') return;

  const filename = `audit_trail_${patientId}_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'json') {
    const exportData = {
      standard: 'ABDM_AUDIT_LOG_SPEC_V1',
      patientReference: patientId,
      exportedAt: new Date().toISOString(),
      entryCount: logs.length,
      auditTrail: logs.map((log) => ({
        logId: log.id,
        timestamp: log.timestamp,
        actor: {
          name: log.actor,
          role: log.actorRole,
        },
        action: log.action,
        resource: log.objectAffected,
        rationale: log.details,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename);
  } else {
    // CSV format
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action Event', 'Resource Affected', 'Details/Rationale'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.actorRole.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.objectAffected.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLog(entry: AuditLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalAuditLogs();
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([entry, ...list]));
  } catch {
    // ignore
  }
}
