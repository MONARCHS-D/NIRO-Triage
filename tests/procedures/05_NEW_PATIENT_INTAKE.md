# Suite 05: New Patient Intake & Multimodal Ingestion Procedures

**Target Routes**: `/intake`, `/intake/voice`, `/intake/report`  
**Backend Endpoints**: `POST /facilities/{id}/sessions`, `POST /cases`, `POST /cases/{id}/files`

---

## Procedure TC-INT-001: Step 1 - Demographics & Patient Consent

### Objective
Verify data entry of patient demographics and mandatory clinical consent.

### Steps to Perform
1. Log in and navigate to `${BASE_URL}/intake`.
2. Verify Step 1 is active ("Patient Demographics & Clinical Consent").
3. Fill inputs:
   - Patient Full Name: `Bimala Naik`
   - Age: `48`
   - Gender: Select `Female`
   - Primary Language: Select `Odia (ଓଡ଼ିଆ)`
   - Contact Number: `+91 98765 43210`
   - Chief Complaint: `Fever for 4 days with persistent dry cough and chest tightness`
4. Click the consent checkbox:
   `input[type="checkbox"]` ("I confirm that the patient/guardian has provided informed oral or digital consent...")
5. Click button: `button:has-text("Continue to Ingestion Studio")`.

### Expected Results
- Form transitions smoothly to Step 2 ("Multimodal Clinical Ingestion").
- Step 2 header displays: "Choose Intake Source: Voice Recording or Lab Report Extraction".

---

## Procedure TC-INT-002: Informed Consent Modal Inspection

### Objective
Verify that the full consent dialog can be opened, reviewed, and accepted.

### Steps to Perform
1. On Step 1 of `/intake`, locate link: "Review Consent Terms & ABDM Privacy Safeguards".
2. Click the link.

### Expected Results
- Consent modal overlays the screen (`ConsentModal`).
- Displays Ayushman Bharat Digital Mission (ABDM) compliance notices:
  - Session-scoped retention.
  - Non-diagnostic triage assistance clause.
  - Patient data protection rights.
3. Click "I Agree & Provide Consent" inside the modal.
4. Modal closes and the consent checkbox on the main form is automatically checked.

---

## Procedure TC-INT-003: Validation - Missing Consent Block

### Objective
Ensure patient intake cannot proceed without verified patient consent.

### Steps to Perform
1. Fill demographics (Name, Age, Chief Complaint).
2. Ensure consent checkbox is **unchecked**.
3. Attempt to click "Continue to Ingestion Studio".

### Expected Results
- Button is disabled or an alert appears: "Informed consent is mandatory before proceeding with digital intake."
- Workflow remains on Step 1.

---

## Procedure TC-INT-004: Step 2A - Voice Intake Studio

### Objective
Verify the audio intake studio records or loads spoken clinical notes and displays live waveform and multilingual transcription.

### Steps to Perform
1. On Step 2 of `/intake`, select "Voice Intake Studio (Odia / Hindi / English)".
2. Click the microphone / record button (`button[title*="Record"]` or `.lucide-mic`).
3. Allow recording simulation to run for 3–5 seconds.
4. Click the stop button.

### Expected Results
- Audio waveform animates during recording.
- Real-time transcription is rendered in the speech text area:
  - Displays original language transcript (Odia/Hindi).
  - Displays English translation toggle.
- Extracted symptom chips appear: "Fever (4 days)", "Dry Cough", "Chest Tightness".
5. Click "Save & Proceed to Vitals".

---

## Procedure TC-INT-005: Step 2B - Lab Report OCR Extraction

### Objective
Verify document intake extracts lab parameters (CBC report) with confidence metrics and bounding boxes.

### Steps to Perform
1. On Step 2, select "Lab Report OCR Extraction Studio".
2. Click button: "Load Benchmark CBC Report".
3. Wait for OCR simulator to parse tables.

### Expected Results
- Document preview displays the synthetic CBC report (`sample_report.svg`).
- Extracted values table populates:
  - Hemoglobin: `11.2 g/dL` (Normal)
  - Total Leukocyte Count (WBC): `14,200 /µL` (Elevated - Highlighted amber/red)
  - Platelet Count: `1.85 Lakhs /µL` (Normal)
- Each fact displays its extraction confidence score (e.g. `96% Confidence`).
4. Click "Accept Extracted Facts & Proceed".

---

## Procedure TC-INT-006: Step 3 - Vitals Measurement Entry

### Objective
Verify manual entry and validation of physiological vital signs.

### Steps to Perform
1. Transition to Step 3 ("Physiological Vitals & Risk Screening").
2. Enter values:
   - Blood Pressure Systolic: `135`
   - Blood Pressure Diastolic: `88`
   - Pulse Rate: `92` bpm
   - Body Temperature: `100.8` °F
   - SpO2 (Oxygen Saturation): `96` %
   - Respiratory Rate: `20` /min
3. Click "Generate AI Triage Summary".

### Expected Results
- Vitals are validated as physiologically viable.
- System transitions to Step 4.

---

## Procedure TC-INT-007: Vitals Boundary Alerts

### Objective
Verify clinical alerts when entering critical or out-of-range vitals.

### Steps to Perform
1. On Step 3, enter:
   - SpO2: `88` % (Critical hypoxia < 90%)
   - Temperature: `104.2` °F (High fever)
2. Observe the real-time feedback banner.

### Expected Results
- Amber/Red warning banner appears: "Critical Vitals Detected: SpO2 < 90% indicates severe respiratory concern. Flagged for Immediate Medical Officer Review."

---

## Procedure TC-INT-008: Step 4 - AI Triage Synthesis & Protocol Cues

### Objective
Verify that the AI triage synthesis aggregates voice, OCR, and vitals into a structured draft note.

### Steps to Perform
1. On Step 4, inspect the generated triage summary card:
   - Chief complaint summary.
   - Recommended triage priority category (`RED` or `YELLOW`).
   - Protocol cues and missing information recommendations.
2. Verify presence of the human-in-the-loop reminder: "Educational prototype — triage-support only. Registered physician must sign off."

---

## Procedure TC-INT-009: Case Submission to Live Queue

### Objective
Verify that final submission registers the patient session, case record, and redirects to the clinical queue.

### Steps to Perform
1. On Step 4, click button: "Submit to Clinical Review Queue".
2. Wait for completion.

### Expected Results
- Patient session token is incremented.
- Case is appended to the facility queue.
- Browser navigates to `${BASE_URL}/queue` or `${BASE_URL}/dashboard`.
- The new patient name (`Bimala Naik`) appears at the top of the queue table.

---

## Procedure TC-INT-010: Direct Navigation to Studio Sub-routes

### Objective
Verify standalone access to `/intake/voice` and `/intake/report`.

### Steps to Perform
1. Navigate directly to `${BASE_URL}/intake/voice`.
2. Confirm VoiceIntakeStudio mounts cleanly without crashing.
3. Navigate directly to `${BASE_URL}/intake/report`.
4. Confirm ReportExtractStudio mounts cleanly with document uploader.
