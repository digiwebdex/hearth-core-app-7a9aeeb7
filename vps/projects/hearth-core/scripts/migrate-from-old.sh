#!/bin/bash
# ═══════════════════════════════════════════════════════════
# ONE-TIME MIGRATION: /var/www/hearth-core-app → /opt/projects/hearth-core
# Run on VPS as root. SAFE: does NOT delete the old /var/www folder.
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT=${PROJECT:-hearth-core}
OLD_DIR=${OLD_DIR:-/var/www/hearth-core-app}
NEW_DIR=${NEW_DIR:-/opt/projects/$PROJECT}
APP_DOMAIN=${APP_DOMAIN:-app.travelagencyweb.com}
API_DOMAIN=${API_DOMAIN:-api.travelagencyweb.com}
APP_PORT=${APP_PORT:-4101}
DB_PORT=${DB_PORT:-5401}
REDIS_PORT=${REDIS_PORT:-6401}
DB_USER=${DB_USER:-hearth}
DB_NAME=${DB_NAME:-hearth_db}
OLD_DB_HOST=${OLD_DB_HOST:-127.0.0.1}
OLD_DB_PORT=${OLD_DB_PORT:-5432}
OLD_DB_USER=${OLD_DB_USER:-hearth}
OLD_DB_NAME=${OLD_DB_NAME:-hearth_db}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VPS_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TEMPLATE_DIR="$VPS_DIR/templates"
SOURCE_DIR="$NEW_DIR/source"
OLD_BACKEND_ENV="$OLD_DIR/backend/.env"

log() { echo -e "\n\033[1;36m═══ $1 ═══\033[0m"; }
ok()  { echo -e "\033[1;32m✅ $1\033[0m"; }
warn(){ echo -e "\033[1;33m⚠️  $1\033[0m"; }
err() { echo -e "\033[1;31m❌ $1\033[0m"; exit 1; }

copy_preserved_env() {
    [ -f "$OLD_BACKEND_ENV" ] || return 0
    awk -F= '
      NF < 2 { next }
      /^#/ { next }
      /^(NODE_ENV|PORT|DATABASE_URL|REDIS_URL|DB_|POSTGRES_|PROJECT_NAME|APP_DOMAIN|API_DOMAIN|APP_PORT|DB_PORT|REDIS_PORT|JWT_SECRET|CORS_ORIGIN|FRONTEND_URL|API_BASE_URL|VITE_)/ { next }
      { print }
    ' "$OLD_BACKEND_ENV" >> "$NEW_DIR/.env"
}

write_dockerfile() {
    cat > "$NEW_DIR/app/Dockerfile" <<'DOCKERFILE'
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

log "[1/11] Pre-flight checks"
[ -d "$OLD_DIR" ] || err "Old directory not found: $OLD_DIR"
[ -d "$TEMPLATE_DIR" ] || err "Template directory not found: $TEMPLATE_DIR"
command -v docker >/dev/null || err "Docker is not installed"
command -v rsync >/dev/null || err "rsync is not installed"
command -v openssl >/dev/null || err "openssl is not installed"
ok "Pre-flight passed"

log "[2/11] Create isolated folder skeleton"
mkdir -p "$NEW_DIR"/{app,source,frontend/dist,data/{postgres,redis,uploads},backups/{db,uploads,pre-migration},logs/{app,postgres,nginx},scripts}
mkdir -p /var/backups/www
ok "Folders ready: $NEW_DIR"

log "[3/11] Copy architecture templates"
cp "$TEMPLATE_DIR/compose/docker-compose.cat-a.yml" "$NEW_DIR/docker-compose.yml"
cp "$TEMPLATE_DIR/scripts/"*.sh "$NEW_DIR/scripts/"
chmod +x "$NEW_DIR/scripts/"*.sh
ok "Templates copied"

log "[4/11] Safety backup of old code folder"
BACKUP_FILE="/var/backups/www/${PROJECT}-pre-migration-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$OLD_DIR")" "$(basename "$OLD_DIR")"
ok "Backup written: $BACKUP_FILE"

log "[5/11] Generate project .env"
if [ ! -f "$NEW_DIR/.env" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    EXISTING_JWT=""
    [ -f "$OLD_BACKEND_ENV" ] && EXISTING_JWT=$(grep -E '^JWT_SECRET=' "$OLD_BACKEND_ENV" | head -1 | cut -d= -f2- || true)
    JWT=${EXISTING_JWT:-$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)}
    CRON=$(openssl rand -base64 32 | tr -d '/+=' | head -c 48)
    cat > "$NEW_DIR/.env" <<EOF
PROJECT_NAME=$PROJECT
APP_DOMAIN=$APP_DOMAIN
API_DOMAIN=$API_DOMAIN
APP_PORT=$APP_PORT
DB_PORT=$DB_PORT
REDIS_PORT=$REDIS_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASS
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@db:5432/$DB_NAME?schema=public
JWT_SECRET=$JWT
CRON_SECRET=$CRON
FRONTEND_URL=https://$APP_DOMAIN
API_BASE_URL=https://$API_DOMAIN/api
CORS_ORIGIN=https://$APP_DOMAIN,https://travelagencyweb.com,https://www.travelagencyweb.com
VITE_API_URL=https://$API_DOMAIN/api
EOF
    copy_preserved_env
    chmod 600 "$NEW_DIR/.env"
    ok ".env generated and old non-DB secrets preserved where available"
else
    ok ".env already exists — keeping current values"
fi

log "[6/11] Sync source repo into /opt"
rsync -a --delete \
  --exclude='node_modules' --exclude='dist' --exclude='backend/node_modules' --exclude='backend/uploads' \
  --exclude='backend/.env' --exclude='.env' --exclude='.env.production' \
  "$OLD_DIR/" "$SOURCE_DIR/"
ok "Source synced: $SOURCE_DIR"

log "[7/11] Build frontend dist"
cd "$SOURCE_DIR"
if [ -f package.json ]; then
    if [ -f package-lock.json ]; then npm ci; else npm install; fi
    VITE_API_URL="https://$API_DOMAIN/api" npm run build
    rsync -a --delete "$SOURCE_DIR/dist/" "$NEW_DIR/frontend/dist/"
    ok "Frontend built and copied"
else
    warn "No frontend package.json found — skipping frontend build"
fi

log "[8/11] Sync backend app + uploads"
rsync -a --delete --exclude='node_modules' --exclude='.env' --exclude='uploads' "$SOURCE_DIR/backend/" "$NEW_DIR/app/"
if [ -d "$OLD_DIR/backend/uploads" ]; then
    rsync -a "$OLD_DIR/backend/uploads/" "$NEW_DIR/data/uploads/"
fi
rm -rf "$NEW_DIR/app/uploads"
ln -s ../data/uploads "$NEW_DIR/app/uploads"
write_dockerfile
ok "Backend runtime prepared"

log "[9/11] Start Postgres and import old DB data"
cd "$NEW_DIR"
docker compose up -d db redis
for i in $(seq 1 30); do
    docker exec "${PROJECT}-db" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 && break
    sleep 2
done
if [ -n "${OLD_DB_PASSWORD:-}" ] && [ "${OLD_DB_PASSWORD}" != "your_current_db_password" ]; then
    PGPASSWORD="$OLD_DB_PASSWORD" pg_dump -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" "$OLD_DB_NAME" | docker exec -i "${PROJECT}-db" psql -U "$DB_USER" -d "$DB_NAME"
    ok "Old database imported"
else
    warn "OLD_DB_PASSWORD not set with a real value — DB import skipped"
fi

log "[10/11] Build app image and start stack"
docker compose build app
if [ -d "$NEW_DIR/app/prisma/migrations" ] && [ "$(ls -A "$NEW_DIR/app/prisma/migrations" 2>/dev/null)" ]; then
    docker compose run --rm app npx prisma migrate deploy
else
    docker compose run --rm app npx prisma db push
fi
docker compose up -d
sleep 8
docker compose ps
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${APP_PORT}/api/health" || echo "000")
[ "$HTTP" = "200" ] && ok "API healthy on localhost:$APP_PORT" || warn "API health returned HTTP $HTTP — check: docker compose logs --tail=80 app"

log "[11/11] Generate Nginx config"
sed -e "s|__APP_DOMAIN__|$APP_DOMAIN|g" \
    -e "s|__API_DOMAIN__|$API_DOMAIN|g" \
    -e "s|__APP_PORT__|$APP_PORT|g" \
    -e "s|__PROJECT_NAME__|$PROJECT|g" \
    -e "s|__CERT_DOMAIN__|$APP_DOMAIN|g" \
    "$TEMPLATE_DIR/nginx/site-cat-a.conf" > "/etc/nginx/sites-available/$PROJECT.conf"
ok "Nginx config written: /etc/nginx/sites-available/$PROJECT.conf"

echo ""
echo "Next safe commands:"
echo "  rm -f /etc/nginx/sites-enabled/$PROJECT /etc/nginx/sites-enabled/$PROJECT.conf"
echo "  ln -s /etc/nginx/sites-available/$PROJECT.conf /etc/nginx/sites-enabled/$PROJECT.conf"
echo "  certbot --nginx -d $APP_DOMAIN -d $API_DOMAIN"
echo "  nginx -t && systemctl reload nginx"
echo "  bash $NEW_DIR/scripts/healthcheck.sh"
echo "  (crontab -l 2>/dev/null; echo '0 3 * * * $NEW_DIR/scripts/backup.sh >> $NEW_DIR/logs/backup.log 2>&1') | crontab -"

echo ""
ok "Migration scaffold complete for $PROJECT. Old folder is still safe at $OLD_DIR"
