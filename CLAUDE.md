@AGENTS.md

# NIRO-Triage & CareIntel — Developer & AI Assistant Guide

This document contains key guidelines, architecture notes, and standard commands for pair programming and developing on **NIRO-Triage** and its Python backend **CareIntel**.

---

## 🏗 High-Level Repository Architecture

- **`src/`** (Root): Next.js 16 (React 19, Tailwind CSS v4) clinical triage workstation.
  - **`app/`**: Next.js App Router pages (`dashboard`, `queue`, `patients`, `intake`, `reports`, `analytics`, `auth`).
  - **`components/`**: Modular clinical UI widgets (`workspace/` for AI draft diff modals, referral handoffs, patient editing; `common/` for `BackendHealthBadge`).
  - **`lib/api/`**: Strongly typed REST API client interacting with CareIntel on `http://localhost:8000/api/v1`, featuring transparent fallback to local resilient synthetic storage when offline.
- **`CareIntel/`**: Python 3.12 FastAPI modular backend.
  - **`src/careintel/`**: Layered domain, application, infrastructure, persistence (SQLAlchemy asyncpg), API routes (`/api/v1`), and Celery workers.
  - **`migrations/`**: Alembic schema revisions (`0001` to `0015 (head)`).
  - **`scripts/`**: Operational verification (`verify_infra.py`, `verify_auth_live.py`) and seeding (`seed_demo_accounts.py`).

---

## ⚡ Standard Terminal Commands

### Frontend (`NIRO-Triage`)
Run commands from the repository root:
```powershell
# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Build production bundle
npm run build

# Start production server (Port 3000)
npm start

# Linting
npm run lint
```

### Backend (`CareIntel`)
Run commands from `C:\Users\Monarch\NIRO-Triage\CareIntel`:
```powershell
# Sync Python dependencies into .venv
uv sync

# Run Alembic migrations
.\.venv\Scripts\python.exe -m alembic upgrade head

# Seed standard demo clinician accounts (doctor, nurse, cho, admin / demo123)
.\.venv\Scripts\python.exe scripts/seed_demo_accounts.py

# Verify infrastructure (Supabase, Redis, Celery, Azure Blob)
.\.venv\Scripts\python.exe scripts/verify_infra.py

# Start FastAPI server (Port 8000)
.\.venv\Scripts\python.exe -m uvicorn careintel.main:app --host 127.0.0.1 --port 8000

# Start Celery async worker (Windows requires '-P solo')
.\.venv\Scripts\python.exe -m celery -A careintel.workers.celery_app:celery_app worker -P solo --loglevel=INFO -Q careintel_default,careintel_processing,careintel_retrieval,careintel_ai,careintel_workflow

# Start Transactional Outbox Dispatcher
.\.venv\Scripts\python.exe -m careintel.workers.outbox_runner --interval 2
```

---

## 🔒 Crucial Rules & Constraints

1. **Next.js 16 Breaking Conventions:**  
   Review `node_modules/next/dist/docs/` for breaking changes in Next.js 16. Do not modify or delete the `<!-- BEGIN:nextjs-agent-rules -->` block in `AGENTS.md`.
2. **Clinical Non-Diagnostic Safety Guardrails:**  
   CareIntel is non-diagnostic. AI model outputs are advisory drafts. Human clinicians must always retain authoritative control over approvals, escalations, medications, and referrals.
3. **Supabase IPv4 Pooler:**  
   Always use the AWS regional pooler host (`aws-0-<region>.pooler.supabase.com:5432`) rather than direct Supabase hostnames, which are IPv6-only on many Windows/corporate networks.
4. **Resilient Offline Fallback:**  
   The frontend must never crash when the backend is unreachable. `BackendHealthBadge` must communicate connectivity state, and client-side mutations must cleanly fall back to local synthetic cache.
