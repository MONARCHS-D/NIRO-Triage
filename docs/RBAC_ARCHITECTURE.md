# CareIntel — Role-Based Access Control (RBAC) Architecture

## 1. Overview & Principles

CareIntel enforces a **Human-in-the-Loop, Zero-Trust Clinical Authorization** model. Clinical decision-making—including AI draft acceptance, emergency prioritization overrides, inter-facility handoffs, and final case approvals—is strictly bound to verified clinician authority levels.

All user permissions map directly between the frontend workstation ([`src/types/roles.ts`](file:///c:/Users/Monarch/NIRO-Triage/src/types/roles.ts)) and the authoritative backend migration contracts ([`CareIntel/migrations/versions/0015_seed_role_permissions.py`](file:///c:/Users/Monarch/NIRO-Triage/CareIntel/migrations/versions/0015_seed_role_permissions.py)).

---

## 2. Role Personas & Permission Matrix

| Role Code | Clinical Title & Scope | Authoritative Backend Permissions | Frontend Capabilities |
| :--- | :--- | :--- | :--- |
| **`DOCTOR`** | **Medical Officer / Attending Physician**<br>Senior clinical authority at Primary Health Centers (PHC) and Community Health Centers (CHC). | `case:*`, `evidence:*`, `ai:*`, `review:*`, `escalation:*`, `referral:*`, `handoff:*`, `knowledge:*`, `consent:*` | • Run Advisory AI<br>• Edit & Accept AI Drafts<br>• Override Priorities (Low, Medium, Escalate)<br>• Final Note Sign-off & Queue Dispatch<br>• Inter-facility Referral Handoff |
| **`NURSE`** | **Staff Nurse (Grade-I / Outpatient)**<br>Vital monitoring, bedside intake verification, and acute triage reception. | `case:read`, `case:write`, `evidence:read`, `evidence:write`, `processing:read`, `structuring:read`, `review:read`, `review:write`, `knowledge:read`, `consent:read`, `consent:write` | • Record Vitals & Symptoms<br>• Perform Patient Intake<br>• View Case Details & Audit Drafts<br>• Add Nurse Triage Notes<br>❌ *No AI synthesis execution*<br>❌ *No draft acceptance*<br>❌ *No priority overrides*<br>❌ *No referral dispatch* |
| **`HEALTH_WORKER`** | **Community Health Officer (CHO)**<br>Frontline sub-centre and rural camp intake. | `case:read`, `case:write`, `evidence:read`, `evidence:write`, `processing:read`, `structuring:read`, `review:write`, `consent:read`, `consent:write` | • Multimodal Intake (Form & Voice)<br>• Patient Demographics & Consent<br>• Preliminary Symptom Logging<br>❌ *No physician sign-off*<br>❌ *No priority overrides*<br>❌ *No referral dispatch* |
| **`ADMIN`** | **Facility Administrator / Clinical IT**<br>System configuration, facility routing, user management, and diagnostics. | `ALL_PERMISSIONS`<br>(includes `manage:users`, `manage:system`, `recipient:manage`) | • Full Administrative Access<br>• System Diagnostics Telemetry<br>• Offline Outbox Simulation Controls<br>• Facility Configuration |
| **`PATIENT`** | **Citizen Self-Service View**<br>Patient intake self-reporting and queue tracking. | `consent:read`, `consent:write`, `case:read` | • Mobile Citizen Experience<br>• Self-service symptom reporting<br>• Triage queue status tracking |

---

## 3. Frontend Architecture

### 3.1 Type Definitions (`src/types/roles.ts`)

```typescript
export type PermissionCode =
  | 'manage:users' | 'manage:system'
  | 'consent:read' | 'consent:write'
  | 'case:read'    | 'case:write'
  | 'evidence:read'| 'evidence:write'
  | 'processing:read' | 'processing:write'
  | 'structuring:read'| 'structuring:write'
  | 'knowledge:read'  | 'knowledge:write'
  | 'ai:read'      | 'ai:write'
  | 'review:read'  | 'review:write' | 'review:assign'
  | 'escalation:read' | 'escalation:write'
  | 'referral:read'   | 'referral:write'
  | 'handoff:read'    | 'handoff:write'
  | 'recipient:manage';

export interface RoleCapabilities {
  canApproveCase: boolean;
  canReferHandoff: boolean;
  canEscalateCase: boolean;
  canOverridePriority: boolean;
  canRunAi: boolean;
  canAcceptDraft: boolean;
  canManageSettings: boolean;
  canAccessDiagnostics: boolean;
  canPerformIntake: boolean;
  canViewReports: boolean;
  canAssignReview: boolean;
}
```

### 3.2 Reactive Capabilities Hook (`useRole()`)

Any component can inspect granular capabilities directly:

```tsx
import { useRole } from '@/context/RoleContext';

export const ActionComponent = () => {
  const { capabilities, currentUser, hasPermission } = useRole();

  return (
    <div title={!capabilities.canApproveCase ? "Requires Medical Officer authorization" : undefined}>
      <Button
        disabled={!capabilities.canApproveCase}
        onClick={handleApprove}
      >
        Approve Note
      </Button>
    </div>
  );
};
```

---

## 4. Key Security & Safety Guardrails

1. **Privilege Escalation Prevention:**
   When entering the Patient Mobile experience (`PATIENT_MOBILE`), the user's authentic staff role is saved. Exiting via `exitPatientMobile()` strictly restores their prior role (`NURSE`, `HEALTH_WORKER`, `ADMIN`, or `DOCTOR`) rather than arbitrarily escalating them to Doctor.
2. **Mount Guard on Session Initialization:**
   `initAuth` runs strictly once on initial boot via `hasInitializedAuthRef`, preventing UI state updates from re-triggering network profile overwrites.
3. **Discreet Disabled Tooltips:**
   Gated buttons render within native tooltip wrappers, explaining the required clinical role (e.g., *"Draft acceptance requires Medical Officer sign-off"*).
4. **Read-Only Audit Banners:**
   When non-physician staff inspect AI draft diffs, an ambient amber banner reinforces that they are in audit mode and cannot commit unilateral changes.
