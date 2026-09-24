# Suite 04: Authentication & Login Procedures

**Target Route**: `/auth/login`  
**Related Routes**: `/auth/register-facility`, `/auth/activate`, `/auth/forgot-password`, `/dashboard`

---

## Procedure TC-LOG-001: Form Sign In with Staff Credentials

### Objective
Verify that clinical staff can sign in using their registered email/staff ID and password.

### Steps to Perform
1. Navigate browser to `${BASE_URL}/auth/login`.
2. Verify page layout:
   - Header with NIRO logo and "Ayushman Bharat / ABDM-Compatible Prototype" pill.
   - Editorial headline: "Better Healthcare for Every Patient".
   - "Welcome back" card with Email and Password inputs.
3. Enter Email address: `dr.sharma@health.gov.in`.
4. Enter Password: `DoctorPassword@123`.
5. Ensure "Remember me" checkbox is checked.
6. Click button: `button:has-text("Sign in")`.

### Expected Results
- Button displays "Signing in…".
- User is authenticated and navigated to `${BASE_URL}/dashboard`.
- Topbar displays Doctor profile.

---

## Procedure TC-LOG-002: Quick Demo Provider Sign In

### Objective
Verify that the quick demo buttons allow instantaneous role-based sign in without typing.

### Steps to Perform
1. Navigate to `/auth/login`.
2. Locate the two quick provider buttons:
   - Button A: "Sign in as Dr. Sharma (Medical Officer)"
   - Button B: "Sign in as Sunita B. (Triage Nurse)"
3. Click Button B ("Sign in as Sunita B.").

### Expected Results
- Instant redirect to `/dashboard`.
- Active user role in Topbar is set to `NURSE` ("Staff Nurse").

---

## Procedure TC-LOG-003: Validation - Empty Credentials

### Objective
Verify error messaging when submitting empty credentials.

### Steps to Perform
1. On `/auth/login`, leave Email and Password completely blank.
2. Click "Sign in".

### Expected Results
- Red error alert displays: "We couldn't sign you in. Check your staff ID and password and try again."
- Browser remains on `/auth/login`.

---

## Procedure TC-LOG-004: Password Mask Toggle

### Objective
Verify toggle between password mask and cleartext.

### Steps to Perform
1. Type `Hospital2026!` in the Password input.
2. Click the eye button inside the password container.
3. Verify password input type switches to `type="text"`.
4. Click again -> reverts to `type="password"`.

---

## Procedure TC-LOG-005: Background Theme Scene Switcher

### Objective
Verify the hero scene toggle between Community Clinic and Network Hospital.

### Steps to Perform
1. In the login header, locate the image toggle button:
   `button[title*="Toggle between Community Clinic and Network Facility"]`
2. Note the label: "CHC Riverside".
3. Click the button.

### Expected Results
- Label changes to "Network Hospital".
- The background hero image smoothly transitions to `/illustrations/auth/healthcare_facility.png`.
4. Click again -> switches back to "CHC Riverside" (`clinic_community_hero.jpg`).

---

## Procedure TC-LOG-006: Navigation to Facility Registration

### Objective
Verify the new "Register Facility" link on the login card.

### Steps to Perform
1. In the login card footer, locate: "Setting up a new hospital or clinic? Register Facility".
2. Click link: `a:has-text("Register Facility")`.

### Expected Results
- Browser URL changes to `${BASE_URL}/auth/register-facility`.
- Facility registration form is loaded.

---

## Procedure TC-LOG-007: Navigation to Staff Activation

### Objective
Verify the "Activate Staff Account" link on the login card.

### Steps to Perform
1. On `/auth/login`, locate link: "Have an invite token? Activate Staff Account →".
2. Click the link.

### Expected Results
- Browser URL changes to `${BASE_URL}/auth/activate`.

---

## Procedure TC-LOG-008: Navigation to Forgot Password

### Objective
Verify the password recovery flow link.

### Steps to Perform
1. Click link: `a:has-text("Forgot password?")`.

### Expected Results
- Browser URL changes to `${BASE_URL}/auth/forgot-password`.
- Entering an email and submitting displays "Recovery link dispatched".
