#!/usr/bin/env bash
# =============================================================================
# Phase 1 — Pilot migration: hearth-core (travelagencyweb.com)
# Run AFTER Coolify is installed and you've created the project in Coolify UI.
#
# This script does NOT create the Coolify project itself (use the UI for that).
# It ONLY:
#   1) Restores the old PostgreSQL DB into the new Coolify-managed DB container
#   2) Copies legacy uploads/ into /opt/projects/hearth-core/uploads/
#   3) Verifies health
#
# USAGE:
#   sudo COOLIFY_PG_CONTAINER=<container-id> \
#        COOLIFY_PG_USER=postgres \
#        COOLIFY_PG_DB=hearth \
#        bash vps/projects/hearth-core/migrate.sh
# =============================================================================
set -euo pipefail

PROJECT="hearth-core"
OLD_DIR="/var/www/hearth-core-app"
NEW_DATA="/opt/projects/${PROJECT}"
LATEST_BACKUP="$(ls -dt /srv/backup/pre-coolify-* 2>/dev/null | head -1 || true)"

: "${COOLIFY_PG_CONTAINER:?set COOLIFY_PG_CONTAINER=<docker container id of coolify postgres>}"
: "${COOLIFY_PG_USER:=postgres}"
: "${COOLIFY_PG_DB:=hearth}"

echo "════════════════════════════════════════════════════════════════"
echo "🚀 MIGRATING ${PROJECT}"
echo "  OLD source : ${OLD_DIR}"
echo "  NEW data   : ${NEW_DATA}"
echo "  PG cont.   : ${COOLIFY_PG_CONTAINER}"
echo "  PG db/user : ${COOLIFY_PG_DB} / ${COOLIFY_PG_USER}"
echo "  Backup src : ${LATEST_BACKUP}"
echo "════════════════════════════════════════════════════════════════"

# ---- [1] Prepare new persistent storage ------------------------------------
echo ""
echo "═══ [1/4] Preparing /opt/projects/${PROJECT} ═══"
mkdir -p "${NEW_DATA}/uploads" "${NEW_DATA}/backups/db" "${NEW_DATA}/backups/uploads"
chmod -R 755 "${NEW_DATA}"

# ---- [2] Copy uploads -------------------------------------------------------
echo ""
echo "═══ [2/4] Copying uploads ═══"
SRC_UPLOADS=""
for cand in "${OLD_DIR}/backend/uploads" "${OLD_DIR}/uploads"; do
  if [ -d "$cand" ]; then SRC_UPLOADS="$cand"; break; fi
done
if [ -n "$SRC_UPLOADS" ]; then
  rsync -avh --info=progress2 "${SRC_UPLOADS}/" "${NEW_DATA}/uploads/"
  echo "✅ uploads copied from ${SRC_UPLOADS}"
else
  echo "⚠️  no uploads folder found under ${OLD_DIR} — skipping"
fi

# ---- [3] Restore PostgreSQL into Coolify-managed container -----------------
echo ""
echo "═══ [3/4] Restoring DB into Coolify Postgres ═══"
DUMP=""
if [ -f "${LATEST_BACKUP}/db/hearth.dump" ]; then
  DUMP="${LATEST_BACKUP}/db/hearth.dump"
elif [ -f "${LATEST_BACKUP}/db/hearth_db.dump" ]; then
  DUMP="${LATEST_BACKUP}/db/hearth_db.dump"
fi

if [ -n "$DUMP" ]; then
  echo "→ Using dump: ${DUMP}"
  # Ensure target DB exists
  docker exec -i "${COOLIFY_PG_CONTAINER}" \
    psql -U "${COOLIFY_PG_USER}" -d postgres \
    -c "CREATE DATABASE \"${COOLIFY_PG_DB}\";" 2>/dev/null || true

  docker cp "${DUMP}" "${COOLIFY_PG_CONTAINER}:/tmp/restore.dump"
  docker exec -i "${COOLIFY_PG_CONTAINER}" \
    pg_restore --clean --if-exists --no-owner --no-acl \
    -U "${COOLIFY_PG_USER}" -d "${COOLIFY_PG_DB}" /tmp/restore.dump || true
  docker exec -i "${COOLIFY_PG_CONTAINER}" rm -f /tmp/restore.dump
  echo "✅ DB restored"
elif [ -f "${LATEST_BACKUP}/db/pg_dumpall.sql.gz" ]; then
  echo "→ Using pg_dumpall fallback"
  gunzip -c "${LATEST_BACKUP}/db/pg_dumpall.sql.gz" \
    | docker exec -i "${COOLIFY_PG_CONTAINER}" psql -U "${COOLIFY_PG_USER}" -d postgres
  echo "✅ DB restored (from pg_dumpall)"
else
  echo "❌ No DB dump found under ${LATEST_BACKUP}/db/"
  echo "   Looked for hearth.dump / hearth_db.dump / pg_dumpall.sql.gz"
  exit 1
fi

# ---- [4] Verify -------------------------------------------------------------
echo ""
echo "═══ [4/4] Verification ═══"
docker exec -i "${COOLIFY_PG_CONTAINER}" \
  psql -U "${COOLIFY_PG_USER}" -d "${COOLIFY_PG_DB}" \
  -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' LIMIT 20;"

du -sh "${NEW_DATA}/uploads" 2>/dev/null || true

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ${PROJECT} DATA MIGRATION COMPLETE"
echo ""
echo "Next in Coolify UI:"
echo "  1) Application → Storage → mount /app/backend/uploads"
echo "     → ${NEW_DATA}/uploads"
echo "  2) Application → Environment → set DATABASE_URL to Coolify-managed PG"
echo "  3) Click 'Deploy' → wait for green health check"
echo "  4) Domains → app.travelagencyweb.com + api.travelagencyweb.com"
echo "  5) Update DNS A records → VPS IP → wait for SSL issued"
echo "════════════════════════════════════════════════════════════════"
