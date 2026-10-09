# Changelog

All notable changes to the **CareIntel** Clinical Triage Workstation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **Calm Clinical Access-Control & Shared Restriction System (`src/components/common/rbac/`)**:
  - Replaced alarming red warning screens with a calm, professional clinical governance experience.
  - **`SuspensionBanner`**: Compact muted rose status banner (`bg-rose-50 border-rose-200`) across all authenticated workstation pages with a static `Read-only` pill, clear restriction notice, and `"View access details →"` link.
  - **`AccountStatusBadge`**: Static status badge (`variant="topbar" | "sidebar" | "credentials" | "inline"`) with lock and shield icons, completely eliminating pulsing animations.
  - **`RestrictedAction`**: Reusable accessible wrapper providing informative tooltips (`Disabled · AI processing restricted`, `Disabled · Clinical authority suspended`, `Disabled · Handoff permission required`, `Disabled · Approval permission required`) and keyboard accessibility.
  - **`AccessDeniedPanel`**: Structured state panel for prohibited destinations (`/intake`, `/intake/voice`) providing context on *"What you can do"*, data retention preservation, and a smooth *"Return to Dashboard"* path.
  - **Patient Safety Preservation**: Guaranteed that safety-critical evidence (hypoxia SpO2 < 92%, acute distress flags) and historical triage cases remain fully visible for clinical auditing while write mutations are disabled.
  - **Structured Login Blocking (`/auth/login`)**: Dedicated *"Account Access Restricted"* card with clear next steps (*"Contact Facility Administrator"*) and a clean *"Try another account"* reset action.
  - **Mid-Session Capture Protection**: Added automatic halt for live audio recordings in `VoiceIntakeStudio` when practitioner suspension takes effect, avoiding silent data loss.
- **Staff Directory & Access Management Console (`src/components/views/SettingsView.tsx`)**:
  - Centralized administrative console for Facility System Administrators (`ADMIN` role with `capabilities.canManageSettings` / `manage:users`).
  - Real-time practitioner directory displaying professional registrations, departments, role assignments, and active/suspended access statuses.
  - Live metric summary KPIs tracking Total Staff, Medical Officers, Triage Nurses, and Frontline CHOs.
  - Full-text search by name, email, registration number, or department, combined with quick role filter pills.
  - In-place clinical role reassignment with immediate permission synchronization.
  - Practitioner status toggle (Active / Suspended) and credential revocation with strict self-lockout guards for the active session administrator.
  - Dynamic local persistence via `careintel_staff_directory_v1` in `RoleContext.tsx`.
- **Practitioner Provisioning Modal (`src/components/views/GrantAccessModal.tsx`)**:
  - Modal form allowing facility administrators to provision and grant clinical authority to new Doctors, Nurses, CHOs, and Administrators.
  - Input validation for legal name, official healthcare email, clinical department, statutory Medical Council Registration (MCI/State Council), and facility affiliation.
- **Suspended Practitioner Clinical Lockdown & Login Guard (`src/context/RoleContext.tsx` & layout components)**:
  - **Full Capability Lockdown**: When a practitioner is marked `status: 'SUSPENDED'`, all operational and clinical capabilities evaluate to `false` (`canApproveCase`, `canReferHandoff`, `canEscalateCase`, `canOverridePriority`, `canRunAi`, `canAcceptDraft`, `canManageSettings`, `canAccessDiagnostics`, `canPerformIntake`, `canViewReports`, `canAssignReview`).
  - **Authentication / Login Blocker**: Suspended practitioners attempting to log in on `/auth/login` are strictly rejected with an explicit error: *"Account Suspended: Clinical credentials for {name} ({regNo}) have been deactivated by Facility Administration. Contact your Clinical Director."*
  - **Global Workstation Banner**: Persistent top red warning banner rendered in `ShellLayout.tsx` alerting that the account is frozen in restricted read-only mode.
  - **Dashboard Lockdown**: Prominently renders the red "Clinical Authority Suspended [LOCKED OUT]" alert card and disables "Start New Intake".
  - **Intake Flow Locks**: Full-page lockdown screens in `NewIntakeView.tsx` and `VoiceIntakeStudio` completely blocking new case registrations or audio triage.
  - **Patient Decision Gating**: All clinical mutation triggers ("Approve Note", "Escalate", "Run Advisory AI", "Accept draft ▾", "Refer / Handoff", "Edit") disabled across `SummaryTab.tsx` and `PatientHeader.tsx`.
  - **Visual Indicator Synchronization**: Real-time status tags (`SUSPENDED` badge in Topbar, `Suspended · Access Revoked` in Sidebar profile card, and suspended credential banner in Settings).
- **Authenticated Practitioner Credentials Security Card (`src/components/views/SettingsView.tsx`)**:
  - Replaced prototype role-switcher buttons with a read-only, cryptographically verified credentials card under National Health Service / ABDM Clinical Governance.
  - Displays authenticated practitioner name, official email, assigned clinical role badge, verified Medical Council Registration, department, facility posting, and active session indicator.
  - Enforces institutional clinical governance prohibiting clinician self-assignment of privileges.
- **Role-Based Access Control (RBAC) Engine (`src/types/roles.ts` & `src/context/RoleContext.tsx`)**:
  - Full domain alignment with Alembic migration `0015_seed_role_permissions.py`.
  - Type-safe `PermissionCode` union covering clinical use cases: `case:*`, `evidence:*`, `ai:*`, `review:*`, `escalation:*`, `referral:*`, `handoff:*`, `manage:*`.
  - Reactive `RoleCapabilities` interface (`canApproveCase`, `canReferHandoff`, `canEscalateCase`, `canOverridePriority`, `canRunAi`, `canAcceptDraft`, `canManageSettings`, `canAccessDiagnostics`, `canPerformIntake`, `canViewReports`).
  - Granular `hasPermission(perm)` method on `useRole()`.
- **Clinical Decision Control Gating (`src/components/workspace/SummaryTab.tsx`)**:
  - Gated "Run Advisory AI" (`capabilities.canRunAi`) with informational tooltips.
  - Gated "Accept draft ▾" and "Edit" (`capabilities.canAcceptDraft`) for non-physicians.
  - Gated priority overrides: "Mark as Low", "Mark as Medium", and "Escalate" (`capabilities.canOverridePriority` / `canEscalateCase`).
  - Gated "Approve Note" and "Refer / Handoff" quick actions (`capabilities.canApproveCase` / `canReferHandoff`).
- **Patient Workspace Header Gating (`src/components/workspace/PatientHeader.tsx`)**:
  - "Refer / Handoff" and "Mark as reviewed" buttons protected with capability checks and hover notices.
- **Read-Only Audit Mode in AI Draft Review Modal (`src/components/workspace/AiDraftReviewModal.tsx`)**:
  - Ambient amber notice banner displayed for non-physician reviewers (Staff Nurses and CHOs).
  - "Accept Draft", "Edit Text", and "Confirm Rejection" disabled for non-physician staff.
- **Settings Administrative Protection (`src/components/views/SettingsView.tsx`)**:
  - Admin badge on "System Diagnostics" tab.
  - Dedicated "Administrator Authorization Required" gate screen for clinical staff accessing telemetry and simulation controls.
- **Role Indicators & Navigation Polish (`src/components/layout/Sidebar.tsx` & `Topbar.tsx`)**:
  - Role capability pills in sidebar profile card (`Doctor · Full Signoff`, `Nurse · Intake & Vitals`, `CHO · Frontline`, `Facility Admin`).
  - Descriptive authority tiers in topbar role selector.
- **Universal Desktop Monitor Compatibility**:
  - Full viewport responsiveness across standard 1080p, 1440p 2K, 4K UHD, and compact 1366x768 triage terminals.
- **E2E Browser Test Verification Suite**:
  - Verified role switching across Doctor, Nurse, CHO, Admin, and Patient Mobile personas with full video recording.

### Fixed
- **Privilege Escalation Bug in `ShellLayout.tsx`**:
  - Returning from Patient Mobile View previously executed a hardcoded `setUserRole('DOCTOR')`.
  - Replaced with `exitPatientMobile()` in `RoleContext.tsx` to restore the user's authentic staff role (`NURSE`, `HEALTH_WORKER`, `ADMIN`, or `DOCTOR`).
- **Auth Re-Initialization Effect Loop in `RoleContext.tsx`**:
  - Decoupled `viewMode` from `setUserRole`'s callback dependencies using functional state updates.
  - Added a mount guard (`hasInitializedAuthRef`) to ensure session token validation runs strictly once on boot, preventing cascading role resets when toggling mobile views.
- **Product Rebranding Consistency**:
  - Rebranded all user-facing, layout, and metadata instances from "NIRO Triage" to "CareIntel".
  - Retained backward-compatible fallback for legacy `niro_auth_state_v1` and `niro_sidebar_collapsed` localStorage keys.

### Changed
- Refined triage notification drawer hierarchy: replaced loud colored badges with clinically focused urgency signals and abnormal vitals indicators.
- Simplified patient workspace header telemetry: hid low-level database version stamps behind a discreet "Record Details" popover menu.

---

## [0.1.0] - 2026-10-08

### Added
- Initial release of the CareIntel Clinical Triage Workstation.
- Next.js 16 App Router frontend with Tailwind CSS v4 and Lucide React icons.
- Python 3.12 FastAPI backend with Supabase PostgreSQL pgvector, Redis, and Celery.
- Multimodal patient intake with voice recording and OCR report viewer.
- Live clinical triage queue and patient workspace with AI draft assistance.
- Resilient offline storage fallback with transactional outbox synchronization.
