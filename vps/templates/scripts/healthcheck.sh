#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Health Check
# Usage: bash healthcheck.sh
# Exit:  0 = all healthy, 1 = something wrong
# ═══════════════════════════════════════════════════════════
set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
cd "$PROJECT_DIR"
set -a; source .env; set +a

FAIL=0
check() {
    local NAME="$1" CMD="$2"
    if eval "$CMD" > /dev/null 2>&1; then
        echo "✅ $NAME"
    else
        echo "❌ $NAME"
        FAIL=1
    fi
}

echo "═══ Health: $PROJECT_NAME ═══"
check "app container running"   "docker ps --filter name=${PROJECT_NAME}-app   --filter status=running -q | grep -q ."
check "db container running"    "docker ps --filter name=${PROJECT_NAME}-db    --filter status=running -q | grep -q ."
check "redis container running" "docker ps --filter name=${PROJECT_NAME}-redis --filter status=running -q | grep -q ."
check "app /api/health → 200"   "[ \"\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${APP_PORT}/api/health)\" = '200' ]"
check "db accepts connections"  "docker exec ${PROJECT_NAME}-db pg_isready -U ${DB_USER} -d ${DB_NAME}"
check "redis responds PONG"     "[ \"\$(docker exec ${PROJECT_NAME}-redis redis-cli ping)\" = 'PONG' ]"
check "https reachable"         "curl -skf https://${APP_DOMAIN} -o /dev/null"

# Disk usage
DISK=$(df -h "$PROJECT_DIR" | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK" -gt 85 ]; then echo "⚠️  Disk ${DISK}% — cleanup soon"; else echo "✅ Disk ${DISK}%"; fi

exit $FAIL
