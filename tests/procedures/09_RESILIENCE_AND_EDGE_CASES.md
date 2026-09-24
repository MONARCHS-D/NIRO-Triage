# Suite 09: Resilience, Boundary Values & Edge Case Procedures

**Target Areas**: Global App Shell, Network Adapters, Viewport Boundaries, Error Boundaries

---

## Procedure TC-EDG-001: Offline Mode Simulation

### Objective
Verify that toggling Offline Mode allows remote clinics with intermittent internet to continue clinical triage uninterrupted.

### Steps to Perform
1. On any page, locate the Offline toggle button in the Topbar:
   `button[title*="Mode Active"]`
2. Click the button to toggle to "Offline".

### Expected Results
- Topbar button updates to display an amber badge: `.bg-[#FFF6DD]` with icon `.lucide-wifi-off` and text "Offline".
- An amber system notification banner appears: "Offline Mode Active - All clinical data stored locally".
- Network requests are paused; the application functions 100% from local browser storage.

---

## Procedure TC-EDG-002: Offline Case Ingestion & Queue Insertion

### Objective
Verify that creating a new patient intake while offline stores the record in local storage without crashing.

### Steps to Perform
1. Ensure Offline Mode is active (TC-EDG-001).
2. Navigate to `${BASE_URL}/intake`.
3. Complete an intake for a patient: `Rani Jena`, Age `32`, Complaint `Severe headache and blurred vision`.
4. Submit the case to the queue.

### Expected Results
- No uncaught fetch error or browser crash occurs.
- The case is stored in browser storage (`localStorage`).
- User is navigated to `/queue`, where `Rani Jena` is listed in the local queue.

---

## Procedure TC-EDG-003: Reconnection to Online Mode

### Objective
Verify smooth restoration of network capabilities when connectivity returns.

### Steps to Perform
1. Click the Offline toggle button in Topbar to switch back to "Online".

### Expected Results
- Button reverts to green `.lucide-wifi` "Online" state.
- Topbar backend indicator resumes pinging the backend API (`Backend: 9090`).

---

## Procedure TC-EDG-004: Prototype Benchmark Data Reset

### Objective
Verify that clicking "Reset Demo" restores synthetic patient records to original benchmark baseline.

### Steps to Perform
1. In the top operational banner (`bg-[#102033]`), locate button:
   `button:has-text("Reset Demo")`
2. Click the button.

### Expected Results
- All modified facts, priority changes, and newly created cases are reset to the 7 canonical benchmark cases (`P-1042`, `P-1043`, etc.).
- Queue table re-renders instantly with the baseline data.

---

## Procedure TC-EDG-005: Rapid Double-Click Submission Protection

### Objective
Verify that clicking submit buttons multiple times in rapid succession does not duplicate API requests or patient records.

### Steps to Perform
1. On `/auth/register-facility`, fill in valid form fields.
2. Rapidly double-click or triple-click the submit button: `button[type="submit"]`.

### Expected Results
- Button enters `disabled` state on the first click.
- Exactly one network request is sent to `POST /api/v1/triagemitra/onboarding/facility-admin`.
- No duplicate database record error occurs.

---

## Procedure TC-EDG-006: Unicode & Indic Script Character Support

### Objective
Verify that patient names and symptoms entered in Indic scripts (Odia, Hindi, Bengali) are preserved without encoding corruption.

### Steps to Perform
1. On `/intake`, enter:
   - Patient Name: `ବିମଳା ନାୟକ` (Bimala Naik in Odia)
   - Chief Complaint: `୪ ଦିନ ହେଲା ତୀବ୍ର ଜ୍ୱର ଏବଂ ଛାତି ଯନ୍ତ୍ରଣା`
2. Submit the case.
3. Inspect `/queue` and `/patients/[id]`.

### Expected Results
- Name and complaint render in authentic Odia script characters without mojibake (e.g. `???` or `&#x...`).

---

## Procedure TC-EDG-007: Long Text & Layout Stress

### Objective
Verify that extremely long clinical descriptions do not break container boundaries or cause unwanted horizontal page scrolling.

### Steps to Perform
1. On `/intake`, paste a 500-word clinical history into the Chief Complaint textarea.
2. Submit and view the case on `/patients/[id]`.

### Expected Results
- Text wraps cleanly with CSS `break-words`.
- No horizontal scrollbar appears on the main document body (`overflow-x: hidden`).

---

## Procedure TC-EDG-008: Responsive Viewport Adaptation

### Objective
Verify layout fidelity across Mobile (375x812), Tablet (768x1024), and Desktop (1440x900) viewports.

### Steps to Perform
1. Set browser viewport to Mobile: `375px × 812px`.
   - Verify sidebar collapses into off-canvas drawer or bottom navigation.
   - Verify topbar controls remain accessible.
2. Set viewport to Tablet: `768px × 1024px`.
   - Verify two-column grids gracefully stack or resize.
3. Set viewport to Desktop: `1440px × 900px`.
   - Verify multi-column workstation layouts display fully.

---

## Procedure TC-EDG-009: Non-Existent Patient ID URL

### Objective
Verify handling when directly requesting an invalid patient route.

### Steps to Perform
1. Navigate directly to `${BASE_URL}/patients/NON-EXISTENT-CASE-999`.

### Expected Results
- Application does not crash with an uncaught runtime error.
- Displays an empty state or gracefully falls back to the default available patient case.

---

## Procedure TC-EDG-010: Session Logout & Token Clearance

### Objective
Verify that logging out purges authentication tokens and restricts access.

### Steps to Perform
1. From any authenticated view, execute logout (via Topbar profile dropdown or calling `logout()`).
2. Verify `niro_jwt_access_token` is removed from `localStorage`.
3. Verify browser is redirected to `${BASE_URL}/auth/login`.
