# Browser Agent Playbook & Standard Operating Procedure (SOP)

This document is the execution manual for browser agents running E2E testing on **NIRO Triage** against a live or hosted backend.

---

## 1. Pre-Flight Checklist for Browser Agents

Before executing tests:
1. **Verify Web Server**: Check that the frontend application is running on `BASE_URL` (typically `http://localhost:3000` or a deployed staging URL).
2. **Verify Backend Connection**:
   - Navigate to `${BASE_URL}/settings`.
   - In the "Backend API Connectivity" card, verify the live service status indicator:
     - 🟢 **Live Connected**: Spring Boot microservice is up on port 9090 or the hosted domain.
     - 🟡 **Local Prototype Mode**: Live backend is offline; tests will exercise client-side resilience.
3. **Clean Storage**:
   - Clear `localStorage` keys if starting a clean test run:
     - `niro_jwt_access_token`
     - `niro_jwt_refresh_token`
     - `niro_active_facility_v1`
     - `niro_active_user_v1`
     - `niro_invited_staff_v1`
     - `niro_triage_patients_v1`

---

## 2. Key UI Selectors & DOM Cheatsheet

| Target Element | Recommended CSS / Selector | Notes |
| :--- | :--- | :--- |
| **Topbar Role Dropdown** | `#role-select` | Values: `DOCTOR`, `NURSE`, `ADMIN`, `HEALTH_WORKER`, `PATIENT` |
| **Topbar Facility Dropdown** | `#facility-select` | Populated with onboarded facilities |
| **Topbar Offline Toggle** | `button[title*="Mode Active"]` | Switches between Online and Offline |
| **Topbar Backend Chip** | `.hidden.sm\\:flex.items-center.gap-1\\.5` | Displays `Backend: 9090` or `Demo Mode` |
| **Search Bar** | `input[placeholder*="Search patient name, ID"]` | Global queue filter |
| **Onboarding Form** | `form` on `/auth/register-facility` | Inputs with `name="facilityName"`, `name="adminPhoneNumber"`, etc. |
| **Activation Form** | `form` on `/auth/activate` | Inputs for token, OTP, password |
| **Staff Invite Submit** | `button:has-text("Send Invitation via API")` | On `/settings` |
| **Queue Filter Pills** | `button:has-text("Red")`, `button:has-text("Yellow")` | On `/queue` |
| **Review Case Action** | `a:has-text("Review Case →")` | Links to `/patients/[id]` |
| **Finalize Note Button** | `button:has-text("Approve & Finalize Triage Note")` | On `/patients/[id]` |
| **Referral Modal Button** | `button:has-text("Refer to Higher Facility")` | Opens inter-facility transfer dialog |

---

## 3. Recommended Sequential Test Run Order

For optimal efficiency and zero manual setup:

1. **Step 1: Run Suite 01 (`01_FACILITY_ONBOARDING.md`)**
   - Onboards a real facility (`CHC Baripada Regional Hub`).
   - Generates and captures `facilityCode` (e.g. `FAC-CHC-XXXX`) and `facilityPublicId`.
   - Establishes initial Admin credentials.
2. **Step 2: Run Suite 02 (`02_STAFF_INVITATION_AND_RBAC.md`)**
   - As Admin on `/settings`, invites a Doctor (`Dr. Ananya Ray`).
   - Captures the generated `activationUrl` and token from the UI.
3. **Step 3: Run Suite 03 (`03_STAFF_ACTIVATION.md`)**
   - Navigates to the captured `activationUrl`.
   - Enters OTP and sets password (`DoctorPass@2026`).
   - Receives JWT access tokens and logs into `/dashboard`.
4. **Step 4: Run Suite 04 (`04_AUTHENTICATION_AND_LOGIN.md`)**
   - Tests logouts, relogins, validation checks, and demo accounts.
5. **Step 5: Run Suite 05 (`05_NEW_PATIENT_INTAKE.md`)**
   - Creates a new patient session and case via Voice / OCR / Vitals.
   - Submits case to the live queue.
6. **Step 6: Run Suite 06 (`06_CLINICAL_QUEUE_AND_FILTERS.md`)**
   - Verifies the newly created case appears in the queue.
   - Tests priority filters (RED, YELLOW, GREEN) and search.
7. **Step 7: Run Suite 07 (`07_PATIENT_REVIEW_AND_FINALIZATION.md`)**
   - Opens the case, edits a fact, answers an AI question, overrides priority.
   - Clinician finalizes and signs the triage note.
8. **Step 8: Run Suite 08 (`08_REFERRAL_DISPOSITION.md`)**
   - Initiates and dispatches an inter-facility emergency referral.
9. **Step 9: Run Suite 09 (`09_RESILIENCE_AND_EDGE_CASES.md`)**
   - Tests boundary values, offline mode simulation, Indic unicode script, and responsive viewports.

---

## 4. Failure Categorization Guide

When logging an issue, classify it into one of these 4 categories:

- **CRITICAL_BACKEND_FAILURE**: HTTP 5xx error from hosted backend, database connection drop, or CORS rejection.
- **AUTH_TOKEN_FAILURE**: 401 Unauthorized or 403 Forbidden due to invalid JWT token or expired session.
- **UI_VALIDATION_BUG**: Form accepts invalid inputs (e.g. malformed phone or short password) or rejects valid data.
- **DOM_SYNCHRONIZATION_LAG**: UI does not re-render immediately after state mutation without manual reload.
