#!/usr/bin/env bash
# start.sh — Render start script
set -e

# Move to project root (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[start] Project root: $(pwd)"
echo "[start] client/dist exists: $([ -d client/dist ] && echo YES || echo NO)"

# Start uvicorn from backend/ so imports work correctly
cd backend
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
