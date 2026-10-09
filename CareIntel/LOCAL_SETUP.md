# Backend setup on this machine

The backend is installed in `CareIntel/.venv` with Python 3.12.15 and all 98 packages
from the committed `uv.lock`, including the development tools. Project-local uv,
Python, and download caches are under `../.tools/`. The system's Python 3.14 is
not used by the backend. The required system libmagic library is available.

`CareIntel/.env` contains the existing PostgreSQL, Redis, and Azure configuration.
Its permissions are restricted to the owner. The placeholder `SECRET_KEY` was
replaced with a random secret. The frontend's root `.env.local` points to
`http://127.0.0.1:8000/api/v1`.

## Start the backend

From the application root:

```bash
cd CareIntel
bash scripts/run_backend.sh
```

This starts the API, a Celery worker with two processes, and the transactional
outbox dispatcher. Keep the terminal open. Press Ctrl-C to stop them together.
A lock prevents running a second complete stack from the same checkout.

- API: http://127.0.0.1:8000
- Swagger documentation: http://127.0.0.1:8000/api/docs
- Liveness: http://127.0.0.1:8000/api/v1/health/live
- Readiness: http://127.0.0.1:8000/api/v1/health/ready

Logs are written to `.run/api.log`, `.run/worker.log`, and `.run/outbox.log`:

```bash
tail -f .run/api.log .run/worker.log .run/outbox.log
```

For separate terminals, use `bash scripts/run_backend.sh api`,
`bash scripts/run_backend.sh worker`, and `bash scripts/run_backend.sh outbox`.

## Reinstall or verify

```bash
bash scripts/setup_backend.sh
.venv/bin/python scripts/check_setup.py
.venv/bin/python scripts/verify_infra.py
.venv/bin/alembic current
```

The setup script preserves an existing `.env`. On a fresh checkout it creates
one from `.env.example` with random signing secrets; configure the actual
database and service credentials in that file before starting the backend.

During setup, the configured database was already at migration `0015` (head).
PostgreSQL, pgvector `vector(1536)`, its HNSW cosine index, Redis, the Celery
broker, and Azure Blob upload/download/cleanup all passed verification. Live
liveness and readiness endpoints returned HTTP 200, and the local worker
responded to Celery `inspect ping`.

For a future schema update, inspect the pending migrations before running
`.venv/bin/alembic upgrade head`. Use the production admin onboarding instructions
in [STARTUP.md](STARTUP.md) if new administrator access is needed.

Azure AI credentials and production provider selectors are validated at startup.
AI generation, speech, and OCR outputs are separate provider smoke checks in
`scripts/verify_providers.py`; those checks call the billable Azure APIs.

To start the frontend, run `npm run dev` from the application root in another
terminal. If it was already running, restart it to load `.env.local`.
