#!/usr/bin/env bash
# Backup TravelAgencyWeb PostgreSQL database to /srv/travelagencyweb/backups/database
# Cron: 0 2 * * * /srv/travelagencyweb/scripts/backup-db.sh >> /srv/travelagencyweb/data/logs/backup-db.log 2>&1
set -euo pipefail

BACKUP_DIR=/srv/travelagencyweb/backups/database
KEEP_DAYS=14
STAMP=$(date +%Y%m%d-%H%M%S)
CONTAINER=travelagencyweb-postgres
DB=${POSTGRES_DB:-travelagencyweb_db}
USER=${POSTGRES_USER:-travelagencyweb_user}

mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/${DB}-${STAMP}.sql.gz"

echo "[$(date -Iseconds)] Backing up $DB → $OUT"
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-}" "$CONTAINER" \
  pg_dump -U "$USER" -d "$DB" --no-owner --no-acl --clean --if-exists \
  | gzip -9 > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "[$(date -Iseconds)] OK ($SIZE)"

find "$BACKUP_DIR" -type f -name "${DB}-*.sql.gz" -mtime +${KEEP_DAYS} -delete
echo "[$(date -Iseconds)] Pruned backups older than ${KEEP_DAYS} days"
