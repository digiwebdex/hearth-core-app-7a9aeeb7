#!/usr/bin/env bash
# =============================================================================
# Nightly backup — all Coolify Postgres + /opt/projects/*/uploads → off-server
# Add to cron: 0 3 * * * /opt/scripts/nightly-backup.sh >> /var/log/backup.log 2>&1
# =============================================================================
set -euo pipefail

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="/srv/backup/nightly/${STAMP}"
RETAIN_DAYS=30
RCLONE_REMOTE="${RCLONE_REMOTE:-}"   # e.g. "b2:smtrade-vps-backups"  (set in env or cron)

mkdir -p "${DEST}/db" "${DEST}/uploads"

echo "[$(date)] Nightly backup → ${DEST}"

# ---- 1) Dump every Coolify-managed Postgres container ---------------------
for cid in $(docker ps --filter "ancestor=postgres" --format "{{.ID}}"); do
  name="$(docker inspect --format '{{.Name}}' "$cid" | tr -d '/')"
  echo "  → pg_dumpall: ${name}"
  docker exec -i "$cid" pg_dumpall -U postgres 2>/dev/null \
    | gzip -9 > "${DEST}/db/${name}.sql.gz" || echo "    ⚠️ failed: ${name}"
done

# ---- 2) Snapshot every project's uploads ----------------------------------
for d in /opt/projects/*/uploads; do
  [ -d "$d" ] || continue
  proj="$(basename "$(dirname "$d")")"
  echo "  → uploads: ${proj}"
  tar -czf "${DEST}/uploads/${proj}.tar.gz" -C "$(dirname "$d")" uploads
done

# ---- 3) Off-server copy (rclone) ------------------------------------------
if [ -n "${RCLONE_REMOTE}" ] && command -v rclone >/dev/null 2>&1; then
  echo "  → rclone copy → ${RCLONE_REMOTE}"
  rclone copy "${DEST}" "${RCLONE_REMOTE}/${STAMP}" --transfers=4 --checkers=8
else
  echo "  ⚠️ RCLONE_REMOTE not set — keeping local copy only"
fi

# ---- 4) Retention ---------------------------------------------------------
find /srv/backup/nightly -maxdepth 1 -type d -mtime "+${RETAIN_DAYS}" -exec rm -rf {} \;

echo "[$(date)] ✅ backup complete — $(du -sh "${DEST}" | cut -f1)"
