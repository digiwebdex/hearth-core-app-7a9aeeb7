#!/usr/bin/env bash
# Pull latest code from GitHub and redeploy via docker-compose.
# Run on the VPS: /srv/travelagencyweb/scripts/deploy.sh
set -euo pipefail

APP=/srv/travelagencyweb/app
cd "$APP"

echo "[$(date -Iseconds)] git pull"
git pull --ff-only

echo "[$(date -Iseconds)] docker compose build"
docker compose --env-file .env build

echo "[$(date -Iseconds)] docker compose up -d"
docker compose --env-file .env up -d

echo "[$(date -Iseconds)] Waiting for API health…"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3028/api/health >/dev/null 2>&1 \
     || docker exec travelagencyweb-api curl -fsS http://127.0.0.1:3027/api/health >/dev/null 2>&1; then
    echo "[$(date -Iseconds)] API healthy ✓"
    exit 0
  fi
  sleep 2
done
echo "[$(date -Iseconds)] API failed to become healthy" >&2
docker compose logs --tail=80 travelagencyweb-api >&2
exit 1
