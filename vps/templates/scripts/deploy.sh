#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Deploy Script
# Flow: backup → pull source → build frontend → sync backend → safe DB schema update → restart API → health check.
# Runtime folder: /opt/projects/<name>/
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
SOURCE_DIR="${SOURCE_DIR:-$PROJECT_DIR/source}"
TS=$(date +%Y%m%d-%H%M%S)

cd "$PROJECT_DIR"
set -a; source .env; set +a

log()  { echo -e "\n\033[1;36m═══ [$(date '+%T')] $1 ═══\033[0m"; }
err()  { echo -e "\033[1;31m❌ $1\033[0m"; exit 1; }
ok()   { echo -e "\033[1;32m✅ $1\033[0m"; }
warn() { echo -e "\033[1;33m⚠️  $1\033[0m"; }

write_dockerfile() {
    cat > "$PROJECT_DIR/app/Dockerfile" <<'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget openssl
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi
COPY . .
RUN npx prisma generate 2>/dev/null || true
EXPOSE 3000
CMD ["node", "src/index.js"]
DOCKERFILE
}

[ -d "$SOURCE_DIR" ] || err "Source directory missing: $SOURCE_DIR"
[ -f "$PROJECT_DIR/.env" ] || err "Missing $PROJECT_DIR/.env"

log "[1/8] Pre-deploy backup"
if docker ps --filter name="${PROJECT_NAME}-db" --filter status=running -q | grep -q .; then
    bash scripts/backup.sh
else
    warn "DB container is not running yet — skipping backup"
fi

log "[2/8] Tag current API image for rollback"
CURRENT_IMG=$(docker inspect --format='{{.Image}}' "${PROJECT_NAME}-app" 2>/dev/null || true)
if [ -n "$CURRENT_IMG" ]; then
    docker tag "$CURRENT_IMG" "${PROJECT_NAME}-app:rollback-${TS}"
    ok "Rollback image: ${PROJECT_NAME}-app:rollback-${TS}"
else
    warn "No current image found"
fi

log "[3/8] Pull latest source"
cd "$SOURCE_DIR"
if [ -d .git ]; then
    git fetch origin main --prune
    git reset --hard origin/main
else
    warn "$SOURCE_DIR is not a git repo — using existing files"
fi

log "[4/8] Build frontend"
if [ -f package.json ]; then
    if [ -f package-lock.json ]; then npm ci; else npm install; fi
    VITE_API_URL="https://${API_DOMAIN}/api" npm run build
    rsync -a --delete "$SOURCE_DIR/dist/" "$PROJECT_DIR/frontend/dist/"
    ok "Frontend updated"
else
    warn "No frontend package.json found — skipped"
fi

log "[5/8] Sync backend runtime"
rsync -a --delete --exclude='node_modules' --exclude='.env' --exclude='uploads' "$SOURCE_DIR/backend/" "$PROJECT_DIR/app/"
rm -rf "$PROJECT_DIR/app/uploads"
ln -s ../data/uploads "$PROJECT_DIR/app/uploads"
write_dockerfile
ok "Backend synced"

log "[6/8] Build API image + safe schema update"
cd "$PROJECT_DIR"
docker compose up -d db redis
docker compose build app
if [ -d "$PROJECT_DIR/app/prisma/migrations" ] && [ "$(ls -A "$PROJECT_DIR/app/prisma/migrations" 2>/dev/null)" ]; then
    docker compose run --rm app npx prisma migrate deploy
else
    docker compose run --rm app npx prisma db push
fi

log "[7/8] Restart API container"
docker compose up -d --no-deps app

HEALTHY=0
for i in $(seq 1 12); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/health" || echo "000")
    if [ "$HTTP" = "200" ]; then HEALTHY=1; break; fi
    echo "Health check #$i: HTTP $HTTP — retrying..."
    sleep 5
done

if [ "$HEALTHY" != "1" ]; then
    warn "Health check failed — attempting image rollback"
    bash scripts/rollback.sh "$TS" || true
    docker compose logs --tail=80 app
    exit 1
fi
ok "API healthy"

log "[8/8] Reload Nginx and cleanup old rollback images"
if command -v nginx >/dev/null; then
    nginx -t && systemctl reload nginx
fi
docker images "${PROJECT_NAME}-app" --format "{{.Tag}}" | grep '^rollback-' | sort -r | tail -n +6 | xargs -r -I{} docker rmi "${PROJECT_NAME}-app:{}" >/dev/null 2>&1 || true
ok "Deploy complete"
