#!/usr/bin/env bash
# Quick health probe for all three services.
set -euo pipefail
echo "── Containers ──"
docker ps --filter "name=travelagencyweb-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "── API /api/health ──"
docker exec travelagencyweb-api curl -fsS http://127.0.0.1:3027/api/health || echo "API DOWN"

echo "── DB ping ──"
docker exec travelagencyweb-postgres pg_isready -U "${POSTGRES_USER:-travelagencyweb_user}" || echo "DB DOWN"

echo "── Disk ──"
df -h /srv/travelagencyweb
