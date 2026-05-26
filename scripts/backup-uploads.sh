#!/usr/bin/env bash
# Backup uploaded files. Cron: 0 3 * * * /srv/travelagencyweb/scripts/backup-uploads.sh
set -euo pipefail

SRC=/srv/travelagencyweb/data/uploads
DST=/srv/travelagencyweb/backups/uploads
KEEP_DAYS=30
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$DST"
OUT="$DST/uploads-${STAMP}.tar.gz"

echo "[$(date -Iseconds)] Archiving $SRC → $OUT"
tar -czf "$OUT" -C "$(dirname "$SRC")" "$(basename "$SRC")"
echo "[$(date -Iseconds)] OK ($(du -h "$OUT" | cut -f1))"

find "$DST" -type f -name 'uploads-*.tar.gz' -mtime +${KEEP_DAYS} -delete
