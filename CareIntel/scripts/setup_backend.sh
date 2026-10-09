#!/usr/bin/env bash
# Run from any directory; keep Python, uv, and caches inside this checkout.
set -euo pipefail
backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project_dir="$(dirname -- "$backend_dir")"
cd "$backend_dir"
export UV_CACHE_DIR="$project_dir/.tools/cache"
export UV_PYTHON_INSTALL_DIR="$project_dir/.tools/python"

if [[ -x "$project_dir/.tools/uv/bin/uv" ]]; then
    uv_bin="$project_dir/.tools/uv/bin/uv"
elif command -v uv >/dev/null 2>&1; then
    uv_bin="$(command -v uv)"
else
    python3 -m pip install --target "$project_dir/.tools/uv" uv
    uv_bin="$project_dir/.tools/uv/bin/uv"
fi
"$uv_bin" sync --all-extras --frozen

if [[ ! -f .env ]]; then
    .venv/bin/python - <<'PY'
import os
import secrets
from pathlib import Path

template = Path('.env.example').read_text()
for key in ('SECRET_KEY', 'JWT_SECRET_KEY'):
    template = template.replace(f'{key}=generate-with-setup-script', f'{key}={secrets.token_urlsafe(48)}')
with open('.env', 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as output:
    output.write(template)
print('Created .env. Set DATABASE_URL and your service credentials before starting.')
PY
fi
.venv/bin/python scripts/check_setup.py
printf '\nDependencies installed. Check database migrations with:\n  cd %s\n  .venv/bin/alembic current\n' "$backend_dir"
printf 'Start all backend processes with:\n  bash scripts/run_backend.sh\n'
