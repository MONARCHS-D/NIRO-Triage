# Suite 02: Clinician & Staff Invitation Procedures

**Target Route**: `/settings`  
**Backend Endpoint**: `POST /api/v1/triagemitra/staff/invite`  
**Authorization**: `ADMIN` JWT Bearer Token

---

## Procedure TC-INV-001: Invite Doctor (Medical Officer)

### Objective
Verify that an authenticated Facility Administrator can invite a licensed Medical Officer via the API.

### Preconditions
- User is logged in as an Administrator (e.g., via TC-ONB-008 or selecting "Admin" role in Topbar).
- Browser is on `${BASE_URL}/settings`.

### Steps to Perform
1. Scroll to the "Clinician & Staff Invitations" card.
2. Locate the invitation form inputs and enter:
   - Full Name: `Dr. Ananya Ray`
   - Official Email: `dr.ananya.ray@health.gov.in`
   - Phone Number (E.164): `+919876543220`
   - Role Assignment: Select `DOCTOR` ("Doctor (Medical Officer)")
3. Click button: `button:has-text("Send Invitation via API")`.
4. Inspect the outgoing HTTP request:
   - Method: `POST`
   - Endpoint: `/api/v1/triagemitra/staff/invite`
   - Headers: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "fullName": "Dr. Ananya Ray",
       "email": "dr.ananya.ray@health.gov.in",
       "phoneNumber": "+919876543220",
       "role": "DOCTOR"
     }
     ```

### Expected Results
- Submit button shows loading spinner with text "Inviting Staff…".
- Success alert banner (`.bg-emerald-50`) appears containing:
  - "Staff invitation queued for Dr. Ananya Ray (DOCTOR)" or backend confirmation.
  - Box labeled "Direct Activation Link (Local Testing):" with a clickable URL formatted as:
    `${BASE_URL}/auth/activate?token=inv_...&email=dr.ananya.ray%40health.gov.in`
- Under "Pending & Invited Staff", a new card is added displaying:
  - Name: `Dr. Ananya Ray`
  - Details: `dr.ananya.ray@health.gov.in · DOCTOR`
  - Action link: `Activate →`
5. Browser agent captures the `activationUrl` and `token` query parameter for Suite 03.

---

## Procedure TC-INV-002: Invite Triage Nurse

### Objective
Verify invitation of nursing personnel assigned to the triage station.

### Steps to Perform
1. On `/settings`, fill in:
   - Full Name: `Sunita Barik`
   - Official Email: `sunita.nurse@health.gov.in`
   - Phone Number: `+919876543221`
   - Role Assignment: Select `NURSE` ("Staff Nurse (Triage Officer)")
2. Click "Send Invitation via API".

### Expected Results
- Success confirmation displays.
- Card appears in pending list with role `NURSE`.
- Distinct activation link generated.

---

## Procedure TC-INV-003: Invite Community Health Officer (CHO)

### Objective
Verify invitation of frontline community health worker.

### Steps to Perform
1. Fill in:
   - Full Name: `Ramesh Chandra Patra`
   - Official Email: `ramesh.cho@health.gov.in`
   - Phone Number: `+919876543222`
   - Role Assignment: Select `HEALTH_WORKER` ("Community Health Officer (CHO)")
2. Click "Send Invitation via API".

### Expected Results
- Record added with role `HEALTH_WORKER`.

---

## Procedure TC-INV-004: Validation - Empty Name or Email

### Objective
Verify client-side validation prevents dispatching incomplete invitations.

### Steps to Perform
1. Leave Full Name blank.
2. Enter Email: `invalid@test.com`.
3. Click "Send Invitation via API".

### Expected Results
- Error alert (`.bg-red-50`) appears: "Please provide both staff member name and official email address."
- No HTTP request is dispatched.

---

## Procedure TC-INV-005: Pending Staff List Persistence

### Objective
Verify that invited staff records persist across page reloads in the browser.

### Steps to Perform
1. Ensure at least one staff member was invited in TC-INV-001.
2. Reload page (`location.reload()`).
3. Scroll to "Clinician & Staff Invitations".

### Expected Results
- Heading shows: "Pending & Invited Staff (N)".
- Previously invited members are rendered with their respective `Activate →` buttons.

---

## Procedure TC-INV-006: RBAC Demo Role Switcher

### Objective
Verify that clicking role buttons updates active user permissions and topbar indicator immediately.

### Steps to Perform
1. In the "Role-Based Access Control (RBAC)" card, locate the 4 role buttons:
   - `Doctor`
   - `Nurse`
   - `Admin`
   - `CHO / Worker`
2. Click `Nurse`.
3. Check Topbar role indicator dropdown -> value updates to `NURSE`.
4. Click `Doctor`.
5. Check Topbar role indicator dropdown -> value updates to `DOCTOR`.

---

## Procedure TC-INV-007: Backend API Connectivity Ping

### Objective
Verify the manual API health probe in Settings.

### Steps to Perform
1. In the "Backend API Connectivity" card, locate the "Ping" button:
   `button:has-text("Ping")`
2. Click the button.

### Expected Results
- The refresh icon (`.lucide-refresh-cw`) spins with `.animate-spin`.
- Live Service Status updates:
  - If backend is running: Green dot with "Live Connected" and latency badge (e.g. `24ms`).
  - If backend is stopped: Amber dot with "Local Prototype Mode".
