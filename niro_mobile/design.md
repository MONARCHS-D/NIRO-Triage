# NIRO Triage — Developer-Ready UI/UX Specification

> **Fast information. Clear evidence. Human judgment.**
>
> Human-in-the-loop multimodal healthcare triage-support platform for government and institutional health facilities in India (PHCs, CHCs, public health camps, company clinics, and district hospitals).

---

## 0. Product Boundary

The product organizes patient-provided symptoms, uploaded medical reports, basic visual inputs, timelines, and follow-up information into a structured triage-support note for qualified medical review. It is explicitly **non-diagnostic**: it must not prescribe treatment, present a diagnosis as fact, or replace qualified medical staff.

### Mobile Citizen / Patient MVP Priorities
1. **Multimodal Intake**: Voice (regional Indic languages), Guided Text, Lab Report OCR upload, Photo capture.
2. **Real-time Regional Transcription & Translation**: First-class Indic speech support (Odia, Hindi, Bengali, Tamil, Telugu, Marathi, English).
3. **Evidence & Provenance Mapping**: Clear tracking of what the patient said, what reports contained, and what doctor notes exist.
4. **Strict Non-Diagnostic Boundaries**: Explicit citizen confirmation that no diagnosis has been made and qualified human staff will review their case.
5. **Calm, Trustworthy Clinical Operational UX**: High contrast, accessible 44px+ touch targets, clean borders over heavy drop shadows.
6. **Low-Bandwidth & Offline Resilience**: Local state preservation so citizen entries are never lost due to flaky network connections.

---

## 1. UX North Star & Mental Model

```text
PATIENT INPUT
      ↓
AI ORGANIZES INFORMATION
      ↓
EVIDENCE + UNCERTAINTY
      ↓
SAFETY / ESCALATION SIGNALS
      ↓
QUALIFIED HUMAN REVIEW
      ↓
FINAL ACTION
```

### Absolute Rule
Never visually imply:
```text
PATIENT → AI → DIAGNOSIS
```

### Core Design Principles
- **Human before AI:** Every AI output is an advisory draft requiring clinical verification.
- **Evidence before inference:** Extracted values must show their source provenance.
- **Calm clinical UI:** Modern enterprise software (Square UI / Linear density), not a futuristic glowing AI demo.
- **Graceful uncertainty:** "Insufficient information" is a valid and safe triage state.
- **Language is foundational:** Regional Indic speech and script are treated as first-class citizens.

---

## 2. Visual Direction & Design Tokens

### 2.1 Color Palette
```css
--ink-950: #102033; /* Headings, primary text */
--ink-800: #25364A; /* Subheadings, body strong */
--ink-600: #526276; /* Secondary body, form labels */
--ink-500: #6B7B8F; /* Metadata, helper text */
--ink-300: #B8C2CF; /* Dividers, disabled elements */

--surface-0: #FFFFFF;   /* Primary card and modal background */
--surface-50: #F8FAFC;  /* Canvas background */
--surface-100: #F1F5F9; /* Input fill, subtle hover */
--surface-200: #E6ECF2; /* Precision 1px borders */

--primary-700: #164FD6; /* Active pressed state */
--primary-600: #2563EB; /* Primary brand blue & interactive buttons */
--primary-500: #3B82F6; /* Focus rings, highlights */
--primary-100: #E8F0FF; /* Soft primary chips and selection tint */

--success-700: #087443; /* Routine / Verified / Green priority */
--success-100: #EAF8F1;

--warning-700: #996500; /* Incomplete / Needs Attention / Amber priority */
--warning-100: #FFF6DD;

--danger-700: #B3261E;  /* Urgent Escalation / Red priority (Never decorative) */
--danger-100: #FDECEC;

--info-700: #1769AA;    /* Information notices / Blue priority */
--info-100: #E9F4FF;
```

### 2.2 Typography
- **Primary Family:** Inter with fallbacks to `Noto Sans Devanagari`, `Noto Sans Oriya`, `Noto Sans Bengali`.
- **Tabular Numerals:** Always use tabular numerals for IDs, timestamps, vital signs, and lab values.

### 2.3 Spacing & Radii
- **Base Grid:** 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px).
- **Corner Radii:** 8px (inputs, compact cards), 12px (standard cards), 16px (major feature surfaces).
- **Elevation:** Subtle borders (`1px solid #E6ECF2`) preferred over heavy drop shadows.

---

## 3. Mobile Layout & Touch Target Rules

- **Viewport:** Designed for smartphones (360px–480px width) with responsive auto-fit up to tablets/desktop via centered constraints (`maxWidth: 600`).
- **Touch Targets:** Minimum **44px × 44px** on every interactive element.
- **Form Layout:** Single-column, clear vertical flow without horizontal card scrolling.
- **Fixed Navigation:** Bottom navigation bar (`Home`, `My Visits`, `Messages`, `Profile`).

---

## 4. Patient Mobile Intake Flows (Section 15)

### 4.1 Home Screen
- Warm, accessible greeting: *"How are you feeling today?"* with Indic translations.
- Native script language switcher (`ଓଡ଼ିଆ Odia`, `हिन्दी Hindi`, `বাংলা Bengali`, `தமிழ் Tamil`, `English`).
- Four primary multimodal intake cards:
  1. 🎙 **Speak in your language**: Regional voice recording with waveform visualization.
  2. ⌨ **Type symptoms**: Guided structured text entry.
  3. ↑ **Upload report**: Lab document / prescription photo capture with OCR extraction.
  4. 📷 **Take photo**: Visual symptom capture (rash, swelling, eye).

### 4.2 Voice Intake Studio
- Animated waveform visualizer.
- Recording states: `Idle` → `Listening` → `Paused` → `Processing` → `Success`.
- Live transcription in native script + real-time English translation.
- Extracted symptom chips with confidence metrics.

### 4.3 Report Upload & OCR Studio
- Preview uploaded lab document (e.g. CBC, blood glucose).
- Extracted metrics table: Hemoglobin, WBC, Platelets, Fasting Sugar.
- Direct source provenance (`Page 1 · Table row 1 · Confidence: High`).

### 4.4 Non-Diagnostic Confirmation Screen
Post-intake screen explicitly stating:
- *"Your information has been recorded."*
- *"A healthcare professional will review it."*
- Mandatory safety callouts:
  - **✓ No diagnosis has been made.**
  - **✓ This is a triage-support tool.**

---

## 5. Clinical State Machine & Priority Model

```text
CREATED → PROCESSING → AI_DRAFT → PENDING_REVIEW → NEEDS_MORE_INFO / REVIEWED → ESCALATED / APPROVED
```

### Triage Priority States
- **GREEN (Routine):** Routine review in OPD queue.
- **YELLOW (Prompt):** Needs attention, incomplete information, or elevated vitals.
- **RED (Urgent):** Potential urgency flagged (respiratory distress, severe trauma). Requires prompt human medical officer escalation.
- **GREY (Insufficient Info):** Critical data missing before safe triage can occur.
