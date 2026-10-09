# CareIntel — Clinical Triage Workflows & Operational Guide

## 1. Non-Diagnostic Clinical Safety Principle

CareIntel is designed and operated strictly under the **Human-in-the-Loop Triage Advisory Standard**:
- **Non-Diagnostic:** CareIntel does **not** provide definitive medical diagnoses or automated treatment plans.
- **Advisory Only:** All AI-synthesized summaries, OCR readings, and speech-to-text transcriptions are preliminary, draft recommendations.
- **Physician Authority:** Final triage categorization, acuity overrides, emergency escalation, and hospital referrals remain solely with registered clinicians.

---

## 2. Core Operational Workflows

### 2.1 Multimodal Patient Intake (`/intake` & `/intake/voice`)
1. **Demographics & Consent:** Frontline worker (CHO or Nurse) captures patient identification, language preference, and digital consent.
2. **Clinical Vitals:** Recording of physiological markers:
   - SpO₂ (Oxygen Saturation)
   - Blood Pressure (Systolic / Diastolic)
   - Pulse / Heart Rate
   - Respiratory Rate & Body Temperature
3. **Voice Dictation Studio:** Real-time multi-lingual recording (Odia, Hindi, English) with live speech waveform, diarized speech segments, and automated field extraction.
4. **Document & Lab Uploads:** OCR-assisted extraction of prior discharge notes and laboratory reports with bounding box previews.
5. **Submission:** Case is persisted to Supabase PostgreSQL (or local offline outbox) and placed in the triage queue.

### 2.2 Live Queue & Rapid Triage (`/queue`)
- Real-time priority sorting based on clinical urgency, wait duration, and vital risk indicators.
- Quick-inspect drawer allows examining presenting complaints and evidence sources without losing queue position.

### 2.3 Clinical Workspace & AI Draft Review (`/patients/[id]`)
- **Review Readiness:** Overview of verified evidence sources, missing vital indicators, and protocol compliance (IMNCI / ETAT standards).
- **AI Draft Diff Modal:** Side-by-side comparison of baseline intake notes against AI-synthesized clinical summaries.
- **Decision Bar:** Registered Medical Officers can accept or edit drafts, adjust priority levels (Low, Medium, Escalate), and sign off on case approval.

### 2.4 Inter-Facility Referral & Handoff (`ReferralHandoffModal`)
- Doctors generate structured handoff packets for tertiary/district hospitals.
- Includes vital trends, oxygenation history, presenting complaints, and urgency routing rationale.

---

## 3. Dual-Mode Offline-First Resilience

CareIntel is engineered for uninterrupted operation during field outages and network drops:
1. **Online Mode (Live):** Directly queries Supabase PostgreSQL and dispatches tasks to the FastAPI and Celery engines.
2. **Offline Mode (Simulated / Field Outage):**
   - Automatically detected or toggled manually via the Topbar / Settings.
   - All case mutations, notes, and intakes are queued in the client's local outbox.
   - The **Sync Outbox Drawer** provides visibility into pending mutations and synchronizes them automatically upon reconnection.
