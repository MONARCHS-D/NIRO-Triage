#!/usr/bin/env bash
# ==============================================================================
# NIRO-Triage & CareIntel — Unified Full-Stack Runner
#
# Runs both the Next.js Frontend and FastAPI Backend concurrently in development.
# Handles graceful shutdown of all child processes on SIGINT (Ctrl+C) / SIGTERM.
# ==============================================================================

# Determine repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Configuration & Defaults
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
RELOAD_FLAG="--reload"
START_WORKER=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# ANSI color codes (disabled if not terminal)
if [ -t 1 ]; then
    COLOR_BLUE="\033[1;34m"
    COLOR_GREEN="\033[1;32m"
    COLOR_CYAN="\033[1;36m"
    COLOR_YELLOW="\033[1;33m"
    COLOR_RED="\033[1;31m"
    COLOR_BOLD="\033[1m"
    COLOR_RESET="\033[0m"
else
    COLOR_BLUE=""
    COLOR_GREEN=""
    COLOR_CYAN=""
    COLOR_YELLOW=""
    COLOR_RED=""
    COLOR_BOLD=""
    COLOR_RESET=""
fi

# Help / Usage message
show_help() {
    cat << EOF
Usage: ./run.sh [OPTIONS]

Options:
  -h, --help                 Display this help message and exit
  --worker                   Also launch the Celery async worker in the background
  --no-reload                Disable Uvicorn auto-reload for backend
  --backend-only             Start only the FastAPI backend (CareIntel)
  --frontend-only            Start only the Next.js frontend (NIRO-Triage)
  --host <ip>                Set backend host (default: 127.0.0.1)
  --port <port>              Set backend port (default: 8000)
  --frontend-port <port>     Set frontend port (default: 3000)

Examples:
  ./run.sh                   # Run both frontend & backend concurrently
  ./run.sh --worker          # Run frontend, backend, and Celery worker
  ./run.sh --backend-only    # Run only backend on port 8000
EOF
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        --worker)
            START_WORKER=true
            shift
            ;;
        --no-reload)
            RELOAD_FLAG=""
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --host)
            BACKEND_HOST="$2"
            shift 2
            ;;
        --port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        *)
            echo -e "${COLOR_RED}Unknown option: $1${COLOR_RESET}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${COLOR_CYAN}============================================================${COLOR_RESET}"
echo -e "${COLOR_BOLD}  NIRO-Triage & CareIntel Development Environment${COLOR_RESET}"
echo -e "${COLOR_CYAN}============================================================${COLOR_RESET}"

# PIDs for tracking
BACKEND_PID=""
FRONTEND_PID=""
WORKER_PID=""
SHUTTING_DOWN=false

# Cleanup handler for graceful shutdown
cleanup() {
    if [ "$SHUTTING_DOWN" = true ]; then
        return
    fi
    SHUTTING_DOWN=true

    echo ""
    echo -e "${COLOR_YELLOW}[Shutdown] Stopping all services...${COLOR_RESET}"

    # Terminate recorded PIDs
    for pid in "$BACKEND_PID" "$FRONTEND_PID" "$WORKER_PID"; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # Allow brief window for graceful termination
    sleep 1

    # Force kill any lingering processes
    for pid in "$BACKEND_PID" "$FRONTEND_PID" "$WORKER_PID"; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    # Clean up any child background jobs
    kill $(jobs -p) 2>/dev/null || true
    wait $(jobs -p) 2>/dev/null || true

    echo -e "${COLOR_GREEN}[Shutdown] All services stopped successfully.${COLOR_RESET}"
    exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM EXIT

# ------------------------------------------------------------------------------
# 1. Environment & Dependency Checks
# ------------------------------------------------------------------------------

# Frontend checks (if frontend is enabled)
if [ "$BACKEND_ONLY" = false ]; then
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${COLOR_RED}[Error] 'npm' was not found in PATH. Please install Node.js.${COLOR_RESET}"
        exit 1
    fi

    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        echo -e "${COLOR_YELLOW}[Frontend] 'node_modules' not found. Installing dependencies...${COLOR_RESET}"
        npm install || { echo -e "${COLOR_RED}[Error] npm install failed.${COLOR_RESET}"; exit 1; }
    fi
fi

# Backend checks (if backend is enabled)
PYTHON_BIN=""
if [ "$FRONTEND_ONLY" = false ]; then
    if [ ! -d "$SCRIPT_DIR/CareIntel" ]; then
        echo -e "${COLOR_RED}[Error] CareIntel directory not found at $SCRIPT_DIR/CareIntel${COLOR_RESET}"
        exit 1
    fi

    # Locate Python in virtual environment or PATH
    if [ -f "$SCRIPT_DIR/CareIntel/.venv/Scripts/python.exe" ]; then
        PYTHON_BIN="$SCRIPT_DIR/CareIntel/.venv/Scripts/python.exe"
    elif [ -f "$SCRIPT_DIR/CareIntel/.venv/Scripts/python" ]; then
        PYTHON_BIN="$SCRIPT_DIR/CareIntel/.venv/Scripts/python"
    elif [ -f "$SCRIPT_DIR/CareIntel/.venv/bin/python" ]; then
        PYTHON_BIN="$SCRIPT_DIR/CareIntel/.venv/bin/python"
    elif command -v uv >/dev/null 2>&1; then
        PYTHON_BIN="uv run --directory $SCRIPT_DIR/CareIntel python"
    elif command -v python3 >/dev/null 2>&1; then
        PYTHON_BIN="python3"
    elif command -v python >/dev/null 2>&1; then
        PYTHON_BIN="python"
    else
        echo -e "${COLOR_RED}[Error] Python was not found in CareIntel/.venv or system PATH.${COLOR_RESET}"
        exit 1
    fi

    # Check for CareIntel/.env
    if [ ! -f "$SCRIPT_DIR/CareIntel/.env" ]; then
        echo -e "${COLOR_YELLOW}[CareIntel] Warning: CareIntel/.env not detected.${COLOR_RESET}"
        if [ -f "$SCRIPT_DIR/CareIntel/.env.example" ]; then
            echo -e "${COLOR_YELLOW}            You can copy the template: cp CareIntel/.env.example CareIntel/.env${COLOR_RESET}"
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 2. Start Backend Service (CareIntel)
# ------------------------------------------------------------------------------
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "${COLOR_BLUE}[Backend] Starting CareIntel FastAPI on http://${BACKEND_HOST}:${BACKEND_PORT} ...${COLOR_RESET}"
    (
        cd "$SCRIPT_DIR/CareIntel" || exit 1
        exec $PYTHON_BIN -m uvicorn careintel.main:app \
            --host "$BACKEND_HOST" \
            --port "$BACKEND_PORT" \
            $RELOAD_FLAG
    ) &
    BACKEND_PID=$!

    # Optional Celery Worker
    if [ "$START_WORKER" = true ]; then
        echo -e "${COLOR_BLUE}[Worker] Starting Celery worker...${COLOR_RESET}"
        # Determine pool flag: Windows requires '-P solo'
        CELERY_POOL_FLAG=""
        case "$OSTYPE" in
            msys*|cygwin*|win32*)
                CELERY_POOL_FLAG="-P solo"
                ;;
        esac

        (
            cd "$SCRIPT_DIR/CareIntel" || exit 1
            exec $PYTHON_BIN -m celery -A careintel.workers.celery_app:celery_app worker \
                $CELERY_POOL_FLAG \
                --loglevel=INFO \
                -Q careintel_default,careintel_processing,careintel_retrieval,careintel_ai,careintel_workflow
        ) &
        WORKER_PID=$!
    fi
fi

# ------------------------------------------------------------------------------
# 3. Start Frontend Service (NIRO-Triage)
# ------------------------------------------------------------------------------
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "${COLOR_GREEN}[Frontend] Starting NIRO-Triage workstation on http://localhost:${FRONTEND_PORT} ...${COLOR_RESET}"
    (
        cd "$SCRIPT_DIR" || exit 1
        exec npm run dev -- -p "$FRONTEND_PORT"
    ) &
    FRONTEND_PID=$!
fi

# ------------------------------------------------------------------------------
# 4. Status Display & Wait Loop
# ------------------------------------------------------------------------------
echo -e "${COLOR_CYAN}------------------------------------------------------------${COLOR_RESET}"
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "  ${COLOR_BOLD}Backend API:${COLOR_RESET}     http://${BACKEND_HOST}:${BACKEND_PORT}"
    echo -e "  ${COLOR_BOLD}API Docs:${COLOR_RESET}        http://${BACKEND_HOST}:${BACKEND_PORT}/api/docs"
    echo -e "  ${COLOR_BOLD}Health Probe:${COLOR_RESET}    http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1/health/live"
fi
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "  ${COLOR_BOLD}Frontend UI:${COLOR_RESET}     http://localhost:${FRONTEND_PORT}"
fi
if [ "$START_WORKER" = true ]; then
    echo -e "  ${COLOR_BOLD}Celery Worker:${COLOR_RESET}   Active (Queues: default, processing, retrieval, ai, workflow)"
fi
echo -e "${COLOR_CYAN}------------------------------------------------------------${COLOR_RESET}"
echo -e "${COLOR_YELLOW}Press [Ctrl+C] to stop all services.${COLOR_RESET}"
echo ""

# Monitor processes
# In bash 4.3+, 'wait -n' waits for the first process to terminate.
# In earlier bash versions, fall back to standard 'wait'.
if [ "${BASH_VERSINFO[0]:-0}" -ge 4 ]; then
    wait -n
else
    wait
fi
