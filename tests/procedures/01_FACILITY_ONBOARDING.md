# Suite 01: Facility & Administrator Onboarding Procedures

**Target Route**: `/auth/register-facility`  
**Backend Endpoint**: `POST /api/v1/triagemitra/onboarding/facility-admin`  
**Authentication Required**: None (Public Registration)

---

## Procedure TC-ONB-001: Happy Path Facility & Admin Registration

### Objective
Verify that a health official can successfully register a new facility and create the institutional administrator account with live backend persistence.

### Preconditions
- Application running on `BASE_URL`.
- Backend reachable on configured `NEXT_PUBLIC_API_BASE_URL`.

### Steps to Perform
1. Navigate browser to `${BASE_URL}/auth/register-facility`.
2. Verify page header displays "Register Healthcare Facility" and the badge "Facility Onboarding · Step 1 of 1".
3. Locate form inputs and enter:
   - `input[name="facilityName"]`: `CHC Baripada Regional Hub`
   - `select[name="facilityType"]`: Select `CHC` (Community Health Centre)
   - `input[name="district"]`: `Mayurbhanj`
   - `input[name="state"]`: `Odisha`
   - `input[name="adminFullName"]`: `Dr. Pradeep Mohanty`
   - `input[name="adminPhoneNumber"]`: `+919876543210`
   - `input[name="adminEmail"]`: `admin.baripada@health.gov.in`
   - `input[name="adminPassword"]`: `AdminPass@2026`
4. Click submit button: `button[type="submit"]` (Text: "Complete Facility Registration").
5. Wait for network response from `POST /api/v1/triagemitra/onboarding/facility-admin`.

### Expected Results
- Button displays loading state ("Registering with Health Network…") with disabled state.
- Upon response (HTTP 201), the registration form is replaced by the success card.
- Success card displays:
  - Green checkmark icon.
  - Heading: "Facility Registered Successfully!".
  - Facility Name: "CHC Baripada Regional Hub".
  - Facility Registry Code: Matching format `FAC-CHC-XXXX`.
  - Admin Name: "Dr. Pradeep Mohanty".
  - Action button: "Launch Facility Workstation".
6. Browser agent captures and logs `facilityCode` and `facilityPublicId`.

---

## Procedure TC-ONB-002: Validation - Missing Required Fields

### Objective
Ensure the form blocks submission and displays specific validation alerts when mandatory fields are omitted.

### Steps to Perform
1. Navigate to `${BASE_URL}/auth/register-facility`.
2. Leave `input[name="facilityName"]` blank.
3. Fill remaining fields with valid data:
   - `input[name="district"]`: `Cuttack`
   - `input[name="state"]`: `Odisha`
   - `input[name="adminFullName"]`: `Dr. K. Das`
   - `input[name="adminPhoneNumber"]`: `+919876543211`
   - `input[name="adminPassword"]`: `ValidPass@2026`
4. Click `button[type="submit"]`.

### Expected Results
- Form submission is aborted before network dispatch.
- An alert container appears (`.bg-red-50`) containing: "Facility Name is required."
- No HTTP request is sent to the backend.

---

## Procedure TC-ONB-003: Validation - Phone Number Format (E.164)

### Objective
Verify that phone numbers not conforming to the standard E.164 format (`^\+?[1-9]\d{9,14}$`) are rejected.

### Steps to Perform
1. Enter `input[name="facilityName"]`: `PHC Balasore North`.
2. Enter invalid phone formats sequentially:
   - Case A: `98765` (too short)
   - Case B: `+91-98765-43210` (contains invalid hyphens)
   - Case C: `abcdefghijk` (alphabetic)
3. For each case, attempt submission.

### Expected Results
- Alert displays: "Valid phone number required in E.164 format (e.g. +919876543210)."
- Submission is prevented.
4. Correct the value to `+919876543212` -> error disappears upon valid submission.

---

## Procedure TC-ONB-004: Validation - Minimum Password Length

### Objective
Verify that the system enforces the minimum 8-character password constraint.

### Steps to Perform
1. Fill all fields with valid data.
2. Enter `input[name="adminPassword"]`: `pass123` (7 characters).
3. Click `button[type="submit"]`.

### Expected Results
- Error banner displays: "Admin password must be at least 8 characters long."
- Submission blocked.
4. Change password to `pass1234` (8 characters) -> form passes validation.

---

## Procedure TC-ONB-005: Facility Type Selection Coverage

### Objective
Verify that all 5 institutional facility types can be selected and accurately serialized in the request payload.

### Steps to Perform
For each facility type:
- `PHC` -> Primary Health Centre
- `CHC` -> Community Health Centre
- `CLINIC` -> Urban Health Post / Clinic
- `CAMP` -> Outreach Camp Unit
- `DISTRICT_HOSPITAL` -> District Referral Hospital

1. Select option from `select[name="facilityType"]`.
2. Submit valid registration.
3. Inspect network payload: verify `facilityType` string exactly matches the enum key.

---

## Procedure TC-ONB-006: Password Mask Toggle

### Objective
Verify that the password toggle button correctly switches between masked (`password`) and plaintext (`text`) states.

### Steps to Perform
1. Type `SecretPassword123` into `input[name="adminPassword"]`.
2. Verify input attribute `type="password"`.
3. Click the toggle button inside the password container: `button[aria-label="Show password"]`.
4. Verify input attribute changes to `type="text"` and the password value is visible.
5. Click again (`button[aria-label="Hide password"]`).
6. Verify input attribute reverts to `type="password"`.

---

## Procedure TC-ONB-007: Back to Sign In Navigation

### Objective
Verify the navigation link returning to the sign-in page works without state leak.

### Steps to Perform
1. Click the back arrow link in the header: `a[title="Back to Sign In"]`.
2. Alternatively, click the footer link: "Already onboarded? Sign in to existing facility".

### Expected Results
- Browser URL changes to `${BASE_URL}/auth/login`.
- Login form renders cleanly with empty credentials.

---

## Procedure TC-ONB-008: Immediate Workstation Launch from Success State

### Objective
Verify that clicking "Launch Facility Workstation" on the success card stores the session and redirects directly into the dashboard as the new administrator.

### Steps to Perform
1. Complete TC-ONB-001 to reach the success card.
2. Click the primary button: `button:has-text("Launch Facility Workstation")`.

### Expected Results
- Browser navigates to `${BASE_URL}/dashboard`.
- Topbar facility selector displays the newly registered facility name.
- Role selector displays "Facility Admin" (`ADMIN`).
- No redirection to login occurs (active session established).
