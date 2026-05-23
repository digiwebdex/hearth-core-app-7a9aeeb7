#!/bin/bash
# ═══════════════════════════════════════════════════════════
# ONE-TIME MIGRATION: /var/www/hearth-core-app → /opt/projects/hearth-core
# Run on VPS as root. SAFE — does NOT delete /var/www until you verify.
#
# Pre-requisites:
#   - /var/www/hearth-core-app exists with backend + dist
#   - PostgreSQL on host has hearth_db (or you have a dump to import)
#   - Phase 0 backups already taken
# ═══════════════════════════════════════════════════════════
set -euo pipefail

# ─── Config (verify before running!) ───
PROJECT=hearth-core
OLD_DIR=/var/www/hearth-core-app
NEW_DIR=/opt/projects/$PROJECT
DOMAIN=app.travelagencyweb.com
APP_PORT=4101
DB_PORT=5401
REDIS_PORT=6401
DB_USER=hearth
DB_NAME=hearth_db
REPO_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"   # location of vps/ templates

# ─── Existing host DB connection (for dump) — EDIT THESE ───
OLD_DB_HOST=${OLD_DB_HOST:-127.0.0.1}
OLD_DB_PORT=${OLD_DB_PORT:-5432}
OLD_DB_USER=${OLD_DB_USER:-hearth}
OLD_DB_NAME=${OLD_DB_NAME:-hearth_db}
# OLD_DB_PASSWORD must be exported in environment before running

log() { echo -e "\n\033[1;36m═══ $1 ═══\033[0m"; }
ok()  { echo -e "\033[1;32m✅ $1\033[0m"; }
err() { echo -e "\033[1;31m❌ $1\033[0m"; exit 1; }

# ─── [1] Pre-flight checks ───
log "[1/10] Pre-flight checks"
[ -d "$OLD_DIR" ] || err "Old directory not found: $OLD_DIR"
[ -d "$REPO_DIR/vps/templates" ] || err "Template not found at: $REPO_DIR/vps/templates"
command -v docker > /dev/null || err "Docker not installed"
[ -z "${OLD_DB_PASSWORD:-}" ] && echo "⚠️  OLD_DB_PASSWORD not set — DB import will be skipped"
ok "Pre-flight passed"

# ─── [2] Create folder skeleton ───
log "[2/10] Create $NEW_DIR skeleton"
mkdir -p "$NEW_DIR"/{app,frontend/dist,data/{postgres,redis,uploads},backups/{db,uploads},logs/{app,postgres,nginx},scripts}
ok "Folders created"

# ─── [3] Copy templates ───
log "[3/10] Copy template files"
cp "$REPO_DIR/vps/templates/compose/docker-compose.cat-a.yml" "$NEW_DIR/docker-compose.yml"
cp "$REPO_DIR/vps/templates/scripts/"*.sh "$NEW_DIR/scripts/"
chmod +x "$NEW_DIR/scripts/"*.sh
ok "Templates copied"

# ─── [4] Generate .env with strong secrets ───
log "[4/10] Generate .env"
if [ ! -f "$NEW_DIR/.env" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    JWT=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
    cat > "$NEW_DIR/.env" << EOF
PROJECT_NAME=$PROJECT
APP_DOMAIN=$DOMAIN
APP_PORT=$APP_PORT
DB_PORT=$DB_PORT
REDIS_PORT=$REDIS_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT
EOF
    chmod 600 "$NEW_DIR/.env"
    ok ".env generated (strong random secrets)"
else
    ok ".env already exists — keeping current values"
fi

# ─── [5] Copy code (backend + frontend dist + uploads) ───
log "[5/10] Sync code & assets"
rsync -a --delete \
      --exclude='node_modules' --exclude='.env' --exclude='dist' --exclude='uploads' \
      "$OLD_DIR/backend/" "$NEW_DIR/app/"

if [ -d "$OLD_DIR/dist" ]; then
    rsync -a --delete "$OLD_DIR/dist/" "$NEW_DIR/frontend/dist/"
fi

if [ -d "$OLD_DIR/backend/uploads" ]; then
    rsync -a "$OLD_DIR/backend/uploads/" "$NEW_DIR/data/uploads/"
fi

# Compat symlink: app/uploads → ../data/uploads
cd "$NEW_DIR/app" && rm -rf uploads && ln -s ../data/uploads uploads && cd - > /dev/null
ok "Code, frontend, uploads synced"

# ─── [6] Dockerfile for app ───
log "[6/10] Write app/Dockerfile"
cat > "$NEW_DIR/app/Dockerfile" << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget openssl
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate 2>/dev/null || true
EXPOSE 3000
CMD ["node", "src/index.js"]
DOCKERFILE
ok "Dockerfile written"

# ─── [7] Start DB only + import old data ───
log "[7/10] Start postgres container"
cd "$NEW_DIR"
docker compose up -d db
echo "Waiting for postgres to be ready..."
for i in $(seq 1 30); do
    if docker exec ${PROJECT}-db pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then break; fi
    sleep 2
done
ok "Postgres up"

if [ -n "${OLD_DB_PASSWORD:-}" ]; then
    log "[7b] Import existing DB data"
    PGPASSWORD="$OLD_DB_PASSWORD" pg_dump \
        -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" "$OLD_DB_NAME" \
        | docker exec -i ${PROJECT}-db psql -U $DB_USER -d $DB_NAME
    ok "DB imported"
else
    echo "⚠️  Skipped DB import (set OLD_DB_PASSWORD to enable)"
fi

# ─── [8] Build + start full stack ───
log "[8/10] Build + start app"
docker compose build app
docker compose up -d
sleep 8
docker compose ps

# ─── [9] Health probe ───
log "[9/10] Health probe"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/health" || echo "000")
if [ "$HTTP" = "200" ]; then
    ok "App responding on :$APP_PORT (HTTP 200)"
else
    echo "⚠️  App returned HTTP $HTTP — check logs:"
    docker compose logs --tail=80 app
fi

# ─── [10] Nginx site config ───
log "[10/10] Generate nginx site config"
sed -e "s|__DOMAIN__|$DOMAIN|g" \
    -e "s|__APP_PORT__|$APP_PORT|g" \
    -e "s|__PROJECT_NAME__|$PROJECT|g" \
    "$REPO_DIR/vps/templates/nginx/site-cat-a.conf" \
    > "/etc/nginx/sites-available/$PROJECT.conf"

echo "📄 Nginx config written to: /etc/nginx/sites-available/$PROJECT.conf"
echo ""
echo "Manual next steps:"
echo "  1. Review:   cat /etc/nginx/sites-available/$PROJECT.conf"
echo "  2. SSL:      certbot --nginx -d $DOMAIN"
echo "  3. Enable:   ln -sfn /etc/nginx/sites-available/$PROJECT.conf /etc/nginx/sites-enabled/"
echo "  4. Reload:   nginx -t && systemctl reload nginx"
echo "  5. Verify:   curl -I https://$DOMAIN"
echo "  6. Cron:     (crontab -l; echo '0 3 * * * $NEW_DIR/scripts/backup.sh >> $NEW_DIR/logs/backup.log 2>&1') | crontab -"
echo ""
echo "  After 24h smooth operation → archive old folder:"
echo "    tar -czf /var/backups/www/${PROJECT}-pre-migration-\$(date +%Y%m%d).tar.gz $OLD_DIR"
echo "    pm2 delete <old-process-name>"

ok "Migration scaffold COMPLETE for $PROJECT"
