#!/bin/bash

set -euo pipefail

LOG_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/stop-test-gate.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

INPUT=$(cat)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active')

log "Hook fired. stop_hook_active=$STOP_HOOK_ACTIVE"

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  log "Skipping — already ran once this cycle"
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
CHANGED_FILES=$(git -C "$PROJECT_DIR" diff HEAD --name-only 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  log "No changed files — skipping tests"
  exit 0
fi

HAS_BACKEND=false
HAS_FRONTEND=false

while IFS= read -r file; do
  case "$file" in
    backend/*) HAS_BACKEND=true ;;
    frontend/*) HAS_FRONTEND=true ;;
  esac
done <<< "$CHANGED_FILES"

log "Changed files: $(echo "$CHANGED_FILES" | tr '\n' ', ')"
log "backend=$HAS_BACKEND frontend=$HAS_FRONTEND"

if [ "$HAS_BACKEND" = "false" ] && [ "$HAS_FRONTEND" = "false" ]; then
  log "No backend/frontend changes — skipping tests"
  exit 0
fi

FAILURES=""

if [ "$HAS_BACKEND" = "true" ]; then
  BACKEND_OUTPUT=$(cd "$PROJECT_DIR/backend" && poetry run pytest --tb=short 2>&1) || {
    FAILURES="$FAILURES

=== BACKEND TEST FAILURES ===
$BACKEND_OUTPUT"
  }
fi

if [ "$HAS_FRONTEND" = "true" ]; then
  FRONTEND_OUTPUT=$(cd "$PROJECT_DIR/frontend" && npm test -- --run 2>&1) || {
    FAILURES="$FAILURES

=== FRONTEND TEST FAILURES ===
$FRONTEND_OUTPUT"
  }
fi

if [ -n "$FAILURES" ]; then
  log "BLOCKED — tests failed"
  echo "Tests failed. Fix the failures before completing the task:$FAILURES" >&2
  exit 2
fi

log "All tests passed — allowing stop"
exit 0
