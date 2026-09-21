# NIRO Triage

> **People First. Care Faster.**  
> *A high-fidelity clinical triage workstation designed for primary health centres, community clinics, and referral facilities.*

---

## ⚠️ Clinical Boundary & Disclaimer

**Educational prototype — triage-support only. Not a medical diagnosis or treatment system.**  
NIRO Triage is built to assist frontline healthcare workers (Staff Nurses, Community Health Officers, and Outreach Workers) in capturing multilingual intake data, digitizing diagnostic lab reports, and prioritizing review queues. **Registered physicians make all final clinical triage, escalation, and disposition decisions.**

All patient records (e.g., `P-1042`, `SYN-2026-001`), diagnostic numbers, and clinical narratives are synthetic benchmark data with session-scoped retention.

---

## 🌟 Key Capabilities & Modules

### 1. Operational Clinical Workstation
- **Clinical Dashboard (`/dashboard`)**: Instant visibility into today's patient volume, urgent review counts, red/yellow/green case distributions, and an active triage list. Includes an interactive compact blue-dotted grid skeleton loader.
- **Triage Queue (`/queue`)**: Filter by urgency (`RED` Emergency, `YELLOW` Urgent, `GREEN` Routine) with status indicators (`PENDING_REVIEW`, `NEEDS_MORE_INFO`, `TRIAGED`, `ESCALATED`).
- **Patient Workspace (`/patients/[id]`)**: Deep clinical case overview featuring timeline history, vital signs with reference ranges, extracted symptoms with AI confidence metrics, and doctor review actions.
- **Patient Directory (`/patients`)**: Searchable index of all registered community cases across sub-centres and district hospitals.

### 2. Frontline Multilingual Digital Intake
- **Guided Intake (`/intake`)**: 3-step structured patient registration with demographic capture, masked contact numbers, and synthetic ID generation.
- **Voice Intake Studio (`/intake/voice`)**: Voice-assisted intake supporting major Indian languages (Hindi, Odia, Bengali, Telugu, Tamil, Marathi, and English) with real-time transcription, translation, and structured symptom extraction.
- **Report OCR Studio (`/intake/report`)**: Simulated high-fidelity optical scanner for lab reports (e.g. Complete Blood Count / CBC) with interactive confidence indicators and physician verification.

### 3. Healthcare Infrastructure Resilience
- **Low-Bandwidth & Offline-First Mode**: Seamless simulation of intermittent connectivity; queues all intakes in client storage until connectivity resumes.
- **Role-Based Access Control (RBAC)**: Role switcher with distinct permissions for:
  - **Doctor / Medical Officer**: Full clinical authority to edit values, override priorities, escalate, and approve triage notes.
  - **Staff Nurse & CHO**: Digital intake, voice recording, OCR capture, and triage responses.
  - **Facility Administrator**: Operational settings and facility code assignments.
- **Context-Aware Design System**: Square UI × clinical workstation × subtle Indian regional health context (PHC, CHC, District Hospital).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconography**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Finding-new-code/NIRO-Triage.git
   cd NIRO-Triage
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Verification

To verify TypeScript types and generate the optimized production build:

```bash
# Type check without emitting files
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```

---

## 📁 Repository Structure

```
niro_2/
├── public/
│   ├── illustrations/      # Authentic SVG/PNG healthcare illustrations
│   │   ├── auth/           # Facility & community hero scenes
│   │   ├── intake/         # Multilingual voice intake illustrations
│   │   ├── empty/          # Queue and directory empty states
│   │   ├── states/         # Success, OCR error, and audio error states
│   │   └── settings/       # Healthcare ecosystem context scenes
│   ├── motifs/             # Technical ambient coordinate grids & data curves
│   └── documents/          # Synthetic sample lab reports (CBC, etc.)
├── src/
│   ├── app/                # Next.js App Router pages & layouts
│   │   ├── auth/           # Login & credential screens
│   │   ├── dashboard/      # Clinical workstation dashboard
│   │   ├── intake/         # New intake, voice, and report OCR studios
│   │   ├── patients/       # Patient directory and detail views
│   │   ├── queue/          # Operational triage queue
│   │   └── settings/       # Facility context and low-bandwidth settings
│   ├── components/
│   │   ├── common/         # Reusable UI (Buttons, Badges, SkeletonGrid)
│   │   ├── illustrations/  # Responsive illustration components
│   │   ├── intake/         # VoiceIntakeStudio, ReportExtractStudio
│   │   ├── layout/         # Topbar, Sidebar, ShellLayout
│   │   ├── motifs/         # AppAmbientGrid, DataFlowMotif
│   │   └── views/          # Core view containers (DashboardView, etc.)
│   ├── context/            # TriageContext, RoleContext (state & RBAC)
│   ├── lib/                # Synthetic patient data, audio simulator
│   └── types/              # Domain types (Patient, UserRole, Facility)
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project manifest
```

---

## 🔒 Privacy & Responsible AI Principles

1. **Human-in-the-Loop Protocol**: AI transcription and report extractions provide non-alarmist recommendations; human medical officers retain sole authority over final diagnoses and interventions.
2. **Synthetic Data Tokens**: All patient identifiers adhere to tokenized masking (e.g. `P-1042` / `+91 94*** **902`).
3. **Session-Scoped Retention**: Local IndexedDB prototype cache can be reset to factory benchmark state at any moment via **Reset Demo** in the top operational bar.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
