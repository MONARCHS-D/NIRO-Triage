/**
 * Triage Note API Service
 * Handles clinical fact JSONB updates, AI clarification questions,
 * summary notes, and physician digital sign-off.
 */

import { apiRequest } from './client';
import { FinalizeNoteResponse, TriageNoteDto } from './types';

const NOTES_STORAGE_KEY = 'niro_triage_notes_v1';

export async function getTriageNote(casePublicId: string): Promise<TriageNoteDto | null> {
  try {
    const res = await apiRequest<TriageNoteDto>(`/cases/${casePublicId}/notes`, {
      method: 'GET',
      requiresAuth: true,
    });
    return res;
  } catch {
    const local = getLocalNotes();
    return local.find((n) => n.casePublicId === casePublicId) || null;
  }
}

export async function saveTriageNote(
  casePublicId: string,
  note: Partial<TriageNoteDto>
): Promise<TriageNoteDto> {
  try {
    const res = await apiRequest<TriageNoteDto>(`/cases/${casePublicId}/notes`, {
      method: 'PUT',
      body: JSON.stringify(note),
      requiresAuth: true,
    });
    return res;
  } catch {
    console.warn(`[NIRO API] Triage note updated locally for case ${casePublicId}.`);
    const existing = (await getTriageNote(casePublicId)) || {
      casePublicId,
      version: 1,
      extractedFacts: [],
      missingInfo: [],
      suggestedQuestions: [],
      summaryText: '',
      isFinalized: false,
    };
    const updated: TriageNoteDto = {
      ...existing,
      ...note,
      version: (existing.version || 1) + 1,
    };
    saveLocalNote(updated);
    return updated;
  }
}

export async function finalizeTriageNote(
  casePublicId: string,
  doctorId: string
): Promise<FinalizeNoteResponse> {
  try {
    const res = await apiRequest<FinalizeNoteResponse>(
      `/cases/${casePublicId}/finalize`,
      {
        method: 'POST',
        body: JSON.stringify({ doctorId, finalizedAt: new Date().toISOString() }),
        requiresAuth: true,
      }
    );
    return res;
  } catch {
    console.warn(`[NIRO API] Case ${casePublicId} finalized locally by ${doctorId}.`);
    const finalizedResponse: FinalizeNoteResponse = {
      casePublicId,
      isFinalized: true,
      finalizedBy: doctorId,
      finalizedAt: new Date().toISOString(),
      message: 'Triage note signed and finalized successfully (Prototype Mode).',
    };
    await saveTriageNote(casePublicId, {
      isFinalized: true,
      finalizedBy: doctorId,
      finalizedAt: finalizedResponse.finalizedAt,
    });
    return finalizedResponse;
  }
}

function getLocalNotes(): TriageNoteDto[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNote(note: TriageNoteDto): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalNotes().filter((n) => n.casePublicId !== note.casePublicId);
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify([note, ...list]));
  } catch {
    // ignore
  }
}
