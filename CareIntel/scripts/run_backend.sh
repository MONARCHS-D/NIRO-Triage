#!/usr/bin/env bash
# Foreground supervisor: Ctrl-C stops the API, worker, and outbox together.
set -euo pipefail
backend_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$backend_dir"
if [[ ! -x .venv/bin/python || ! -f .env ]]; then
    printf 'Run bash scripts/setup_backend.sh first.\n' >&2
    exit 1
fi
.venv/bin/python scripts/check_setup.py
mode="${1:-all}"
api() {
    exec .venv/bin/python - <<'PY'
import uvicorn
from careintel.core.config import get_settings

settings = get_settings()
uvicorn.run('careintel.main:app', host=settings.app_host, port=settings.app_port,
            log_level=settings.app_log_level.value.lower())
PY
}
worker() {
    local default_queue
    default_queue="$(.venv/bin/python -c 'from careintel.core.config import get_settings; print(get_settings().celery_task_default_queue)')"
    exec .venv/bin/celery -A careintel.workers.celery_app:celery_app worker \
        --loglevel=INFO --concurrency=2 \
        -Q "$default_queue,careintel_processing,careintel_retrieval,careintel_ai,careintel_workflow"
}
outbox() {
    exec .venv/bin/python -m careintel.workers.outbox_runner --interval 2
}
case "$mode" in
    api) api; exit $? ;;
    worker) worker; exit $? ;;
    outbox) outbox; exit $? ;;
    all) ;;
    *) printf 'Usage: bash scripts/run_backend.sh [all|api|worker|outbox]\n' >&2; exit 2 ;;
esac

# A lock prevents accidentally starting a second complete backend stack.
mkdir -p .run
exec 9>.run/backend.lock
if ! flock -n 9; then
    printf 'A backend stack is already running. Logs: %s/.run\n' "$backend_dir" >&2
    exit 1
fi
pids=()
cleanup() {
    trap - INT TERM EXIT
    for pid in "${pids[@]}"; do
        kill -TERM "$pid" 2>/dev/null || true
    done
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
    done
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Each shell replaces itself, so cleanup signals reach the actual processes.
bash "$backend_dir/scripts/run_backend.sh" api >.run/api.log 2>&1 & pids+=("$!")
bash "$backend_dir/scripts/run_backend.sh" worker >.run/worker.log 2>&1 & pids+=("$!")
bash "$backend_dir/scripts/run_backend.sh" outbox >.run/outbox.log 2>&1 & pids+=("$!")
printf 'Backend processes started. Logs: %s/.run/{api,worker,outbox}.log\n' "$backend_dir"
printf 'Press Ctrl-C to stop all processes.\n'
set +e
wait -n "${pids[@]}"
exit_code=$?
set -e
printf 'A backend process exited (%s). Stopping the stack; check .run logs.\n' "$exit_code" >&2
if [[ "$exit_code" -eq 0 ]]; then exit_code=1; fi
exit "$exit_code"
