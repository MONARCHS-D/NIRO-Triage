# Suite 08: Patient Referral & Case Escalation Procedures

**Target Route**: `/patients/[id]`  
**Backend Endpoint**: `POST /referrals`  
**Authorization**: `DOCTOR` or `ADMIN` JWT Bearer Token

---

## Procedure TC-REF-001: Open Inter-Facility Referral Modal

### Objective
Verify that authorized clinical staff can initiate a referral to a secondary or tertiary healthcare facility.

### Steps to Perform
1. Open an active patient case on `/patients/P-1042`.
2. On the action panel, locate button:
   `button:has-text("Refer to Higher Facility")` or `button:has-text("Escalate / Refer")`
3. Click the button.

### Expected Results
- Inter-facility referral modal overlays the screen.
- Displays fields:
  - Target Facility Name
  - Referral Urgency Tier (`IMMEDIATE`, `PRIORITY`, `ROUTINE`)
  - Clinical Rationale & Transfer Notes

---

## Procedure TC-REF-002: Dispatch Immediate Emergency Referral

### Objective
Verify complete referral dispatch with high urgency tier.

### Steps to Perform
1. In referral modal, fill:
   - Target Facility: `District Headquarters Hospital (DHH) Baripada`
   - Urgency Level: Select `IMMEDIATE`
   - Clinical Rationale: `Acute severe respiratory distress unresponsive to nebulization; SpO2 dropping to 88%. Requires urgent ICU bed and CT Thorax.`
2. Click button: `button:has-text("Confirm & Dispatch Referral")`.

### Expected Results
- Loading spinner displays on button.
- Network request is dispatched to `POST /referrals` with payload matching `CreateReferralRequest`.
- Modal closes with success notification: "Referral Dispatched to DHH Baripada".
- Patient status tag updates to `REFERRED` or `ESCALATED`.

---

## Procedure TC-REF-003: Validation - Missing Clinical Reason

### Objective
Verify that referral submission requires comprehensive clinical rationale.

### Steps to Perform
1. Open referral modal.
2. Select Target Facility.
3. Leave Clinical Rationale empty.
4. Click "Confirm & Dispatch Referral".

### Expected Results
- Submission blocked.
- Alert indicates: "Clinical rationale is mandatory for patient transfers."

---

## Procedure TC-REF-004: Audit Trail Referral Verification

### Objective
Verify that referral dispatch is permanently recorded in the immutable audit trail.

### Steps to Perform
1. Following TC-REF-002, inspect the "Audit Trail & Integrity Log" panel on `/patients/[id]`.

### Expected Results
- Entry appears at the top of the audit log:
  - Action: `CREATE_REFERRAL`
  - Details: `Dispatched to District Headquarters Hospital (DHH) Baripada [IMMEDIATE]`
  - Actor: Active Medical Officer name.
  - Timestamp: Current system time.
