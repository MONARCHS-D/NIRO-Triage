# Suite 07: Clinical Case Review & Triage Note Finalization Procedures

**Target Route**: `/patients/[id]` (e.g. `/patients/P-1042`)  
**Backend Endpoints**: `GET /cases/{id}/notes`, `POST /cases/{id}/notes`, `POST /cases/{id}/finalize`

---

## Procedure TC-REV-001: Open Patient Case from Queue

### Objective
Verify seamless navigation from queue into the patient clinical review workspace.

### Steps to Perform
1. On `/queue`, locate the first patient row (e.g. `P-1042`).
2. Click button: `a:has-text("Review Case →")` or click the patient row.

### Expected Results
- URL changes to `${BASE_URL}/patients/P-1042`.
- Workspace mounts with the patient's full case history, extracted facts, and triage controls.

---

## Procedure TC-REV-002: Patient Header & Vitals Verification

### Objective
Verify the persistent patient header displays vital statistics and risk tags accurately.

### Steps to Perform
1. Inspect top summary banner:
   - Patient Name and Age / Gender.
   - Token number and Arrival Timestamp.
   - Vitals bar: Blood Pressure, Pulse Rate, Temperature, SpO2, Respiratory Rate.
   - Primary Risk Badges.

---

## Procedure TC-REV-003: Clinical Fact Editing & Audit Logging

### Objective
Verify that a clinician can correct an extracted fact value and that an audit trail record is generated.

### Steps to Perform
1. Under "Extracted Clinical Facts", locate fact row for `Hemoglobin`.
2. Click the edit icon (`.lucide-edit` or button "Edit").
3. In the edit dialog, change value from `11.2` to `11.8`.
4. Enter reason: `Confirmed with repeat automated hematology run`.
5. Click "Save Correction".

### Expected Results
- Table updates immediately to display `11.8 g/dL`.
- Fact displays an "Edited" badge with tooltip indicating the clinician name and timestamp.
- On the right column, under "Audit Trail & Integrity Log", a new audit entry appears:
  - Action: `EDIT_FACT`
  - Affected: `Hemoglobin [11.2 → 11.8]`
  - Actor: Active clinician name.

---

## Procedure TC-REV-004: Answering AI Clarification Questions

### Objective
Verify clinical interaction with AI-suggested protocol questions.

### Steps to Perform
1. Under "AI Protocol Questions", locate question:
   "Does the patient have a history of pre-existing bronchial asthma or COPD?"
2. Click one of the interactive option pills: `No Prior Asthma`.

### Expected Results
- Option pill changes to selected/confirmed state (blue background).
- Question is marked as answered with a checkmark and timestamp.

---

## Procedure TC-REV-005: Resolving Missing Clinical Information

### Objective
Verify that missing intake fields can be resolved by the clinical team.

### Steps to Perform
1. Under "Missing Information Checklist", locate item: "Last meal / fluid intake time".
2. Click "Resolve" or click the input field.
3. Type: `Patient had clear fluids 2 hours ago`.
4. Click checkmark button / save.

### Expected Results
- Checklist item status updates from `NOT_PROVIDED` to `OBTAINED`.
- Item displays green checkmark.

---

## Procedure TC-REV-006: Physician Priority Override

### Objective
Verify that a Medical Officer can reclassify a patient's triage priority with mandatory clinical reasoning.

### Steps to Perform
1. On the right-hand panel, locate the "Priority Category" selector.
2. Change priority from `YELLOW` to `RED`.
3. In the rationale prompt, enter: `Acute desaturation observed during clinical examination`.
4. Click "Update Priority".

### Expected Results
- Patient priority tag immediately switches to `RED`.
- Topbar disclaimer remains consistent.
- Audit trail logs: `SET_PRIORITY_RED` with clinician name and reason.

---

## Procedure TC-REV-007: Physician Sign-off & Finalization

### Objective
Verify the final approval of the triage note locking the case for outpatient consultation or transfer.

### Steps to Perform
1. At the bottom of the clinical workspace, locate button:
   `button:has-text("Approve & Finalize Triage Note")`
2. Click the button.
3. In the confirmation dialog, review the summary and click "Confirm Physician Sign-Off".

### Expected Results
- Success confirmation banner displays: "Triage Note Finalized & Signed".
- Case status updates to `APPROVED` / `REVIEWED`.
- Note displays cryptographic verification timestamp and doctor's registration ID.
- Action button transitions to disabled state: "Triage Note Signed & Finalized".
