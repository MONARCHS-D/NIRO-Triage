# Suite 03: Clinician Staff Account Activation Procedures

**Target Route**: `/auth/activate` (or `/auth/activate?token=<token>&email=<email>`)  
**Backend Endpoint**: `POST /api/v1/triagemitra/staff/activate`  
**Authorization**: Public / Invite Token Verification

---

## Procedure TC-ACT-001: Happy Path Staff Activation via Link

### Objective
Verify that an invited clinician can activate their clinical account using their invitation link, OTP, and set a new password.

### Preconditions
- An invitation has been dispatched in Suite 02, yielding `activationUrl` with token (e.g. `?token=inv_abc123&email=dr.ananya.ray%40health.gov.in`).

### Steps to Perform
1. Navigate browser to the captured `${activationUrl}`.
2. Verify page displays:
   - Header: "Staff Account Activation".
   - Badge: "Clinician Invitation".
   - Heading: "Activate Staff Account".
   - Subtitle: "Verify your invitation code and set your clinical account password".
3. Check the "Invitation Token" input:
   - Value should be pre-filled with the query parameter token.
4. Locate "One-Time Password (OTP)" input:
   - Enter `123456` (or the OTP issued by the backend).
5. Enter "Create Password":
   - Enter `DoctorPass@2026`
6. Enter "Confirm Password":
   - Enter `DoctorPass@2026`
7. Click button: `button[type="submit"]` (Text: "Activate Account & Proceed").

### Expected Results
- Button displays loading state: "Verifying and Activating Account…".
- Network request is sent to `POST /api/v1/triagemitra/staff/activate`:
  ```json
  {
    "inviteToken": "inv_abc123",
    "otp": "123456",
    "password": "DoctorPass@2026"
  }
  ```
- Backend returns `accessToken` and `refreshToken`.
- Form is replaced by success screen:
  - Green checkmark icon.
  - Heading: "Account Activated!".
  - Message: "Your clinical credentials have been established. Launching your workstation…".
  - Loading spinner.
- Browser automatically redirects to `${BASE_URL}/dashboard` within 2 seconds.
- In `localStorage`, verify `niro_jwt_access_token` is stored and not null.

---

## Procedure TC-ACT-002: Manual Token Entry (No URL Parameters)

### Objective
Verify that staff members navigating directly to `/auth/activate` can manually paste their token and complete activation.

### Steps to Perform
1. Navigate directly to `${BASE_URL}/auth/activate` (without query parameters).
2. Verify "Invitation Token" field is empty.
3. Type/paste a valid token: `inv_manual_token_999`.
4. Enter OTP: `654321`.
5. Enter Password: `ClinicianPass@2026`.
6. Enter Confirm Password: `ClinicianPass@2026`.
7. Click "Activate Account & Proceed".

### Expected Results
- Request is dispatched with the manually entered token.
- Successful activation occurs.

---

## Procedure TC-ACT-003: Validation - Empty or Short OTP

### Objective
Verify that submitting an incomplete OTP triggers validation feedback.

### Steps to Perform
1. On `/auth/activate`, enter token `inv_test_123`.
2. Leave OTP empty or enter `12` (2 digits).
3. Enter matching passwords (`ValidPass@123`).
4. Click "Activate Account & Proceed".

### Expected Results
- Submission blocked.
- Alert displays: "Please enter the one-time verification code (OTP)."

---

## Procedure TC-ACT-004: Validation - Password Mismatch

### Objective
Verify that mismatched passwords are rejected before network submission.

### Steps to Perform
1. Fill Token and OTP.
2. Enter Create Password: `FirstPassword@123`.
3. Enter Confirm Password: `DifferentPassword@123`.
4. Click "Activate Account & Proceed".

### Expected Results
- Alert displays: "Passwords do not match. Please re-enter."
- No HTTP request is sent.

---

## Procedure TC-ACT-005: Validation - Minimum Password Length

### Objective
Verify the 8-character minimum password constraint on staff activation.

### Steps to Perform
1. Fill Token and OTP.
2. Enter Create Password: `short` (5 chars).
3. Enter Confirm Password: `short`.
4. Click "Activate Account & Proceed".

### Expected Results
- Alert displays: "Password must be at least 8 characters long."

---

## Procedure TC-ACT-006: Password Mask Toggle

### Objective
Verify password masking toggle on both Create Password and Confirm Password inputs.

### Steps to Perform
1. Type `Pass@Secret1` in Create Password.
2. Click the eye toggle icon button.
3. Verify password becomes visible as plaintext.
4. Click again -> password is masked.

---

## Procedure TC-ACT-007: Return to Sign In Navigation

### Objective
Verify navigation link returning to the login screen.

### Steps to Perform
1. Click link: `a:has-text("Back to Sign In")`.

### Expected Results
- Browser URL changes to `${BASE_URL}/auth/login`.
