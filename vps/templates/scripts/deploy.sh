#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Atomic Deploy Script (with auto-backup + rollback)
# Usage: bash deploy.sh
#
# Flow:
#   [1] Backup DB + uploads (safety)
#   [2] git pull latest code in app/
#   [3] docker compose build app
#   [4] prisma migrate deploy (DB schema only — data preserved)
#   [5] docker compose up -d app (rolling restart)
#   [6] Health check → if fail, auto-rollback last image
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
TS=$(date +%Y%m%d-%H%M%S)

cd "$PROJECT_DIR"
set -a; source .env; set +a

log()  { echo -e "\n\033[1;36m═══ [$(date '+%T')] $1 ═══\033[0m"; }
err()  { echo -e "\033[1;31m❌ $1\033[0m"; }
ok()   { echo -e "\033[1;32m✅ $1\033[0m"; }

# ─── [1] Pre-deploy backup ───
log "[1/6] Pre-deploy backup"
bash scripts/backup.sh

# ─── [2] Tag current image for rollback ───
log "[2/6] Tagging current image as rollback candidate"
CURRENT_IMG=$(docker inspect --format='{{.Image}}' "${PROJECT_NAME}-app" 2>/dev/null || echo "")
if [ -n "$CURRENT_IMG" ]; then
    docker tag "$CURRENT_IMG" "${PROJECT_NAME}-app:rollback-${TS}"
    ok "Rollback image: ${PROJECT_NAME}-app:rollback-${TS}"
fi

# ─── [3] Pull latest code ───
log "[3/6] git pull"
cd "$PROJECT_DIR/app"
git fetch --all --prune
git reset --hard origin/main
cd "$PROJECT_DIR"

# ─── [4] Build new image ───
log "[4/6] Build new app image"
docker compose build app

# ─── [5] Run migrations (data-safe) ───
log "[5/6] Prisma migrate deploy"
docker compose run --rm app npx prisma migrate deploy || err "Migration step failed (continuing — investigate manually)"

# ─── [6] Rolling restart + health check ───
log "[6/6] Rolling restart"
docker compose up -d --no-deps app
sleep 5

# Health check (60s window)
HEALTHY=0
for i in $(seq 1 12); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/health" || echo "000")
    if [ "$HTTP" = "200" ]; then HEALTHY=1; break; fi
    echo "  Health check #$i: HTTP $HTTP — retrying..."
    sleep 5
done

if [ "$HEALTHY" = "1" ]; then
    ok "Deploy successful — app healthy"
    # Cleanup rollback tags older than 5
    docker images "${PROJECT_NAME}-app" --format "{{.Tag}}" | grep '^rollback-' | sort -r | tail -n +6 | xargs -r -I{} docker rmi "${PROJECT_NAME}-app:{}" 2>/dev/null || true
else
    err "Health check FAILED — auto-rolling back"
    bash scripts/rollback.sh "${TS}"
    exit 1
fi
