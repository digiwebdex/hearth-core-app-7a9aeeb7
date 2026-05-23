#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Backup Script
# Usage: bash backup.sh
# Cron:  0 3 * * * /opt/projects/<name>/scripts/backup.sh >> /opt/projects/<name>/logs/backup.log 2>&1
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TS=$(date +%Y%m%d-%H%M)
KEEP_DB_DAYS=30
KEEP_UPLOADS_DAYS=14

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"

# Load env
set -a; source "$PROJECT_DIR/.env"; set +a

log() { echo "[$(date '+%F %T')] $1"; }

log "🔄 Backup start: $PROJECT_NAME"

# ─── [1] Database dump ───
DB_FILE="$BACKUP_DIR/db/${PROJECT_NAME}-${TS}.sql.gz"
log "📦 Dumping DB → $DB_FILE"
docker exec "${PROJECT_NAME}-db" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$DB_FILE"
DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
log "✅ DB backed up: $DB_SIZE"

# ─── [2] Uploads tarball ───
if [ -d "$PROJECT_DIR/data/uploads" ] && [ "$(ls -A "$PROJECT_DIR/data/uploads" 2>/dev/null)" ]; then
    UP_FILE="$BACKUP_DIR/uploads/${PROJECT_NAME}-uploads-${TS}.tar.gz"
    log "📦 Tarring uploads → $UP_FILE"
    tar -czf "$UP_FILE" -C "$PROJECT_DIR/data" uploads
    UP_SIZE=$(du -h "$UP_FILE" | cut -f1)
    log "✅ Uploads backed up: $UP_SIZE"
else
    log "ℹ️  No uploads to back up"
fi

# ─── [3] Cleanup old backups ───
find "$BACKUP_DIR/db" -name "*.sql.gz" -mtime +$KEEP_DB_DAYS -delete
find "$BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +$KEEP_UPLOADS_DAYS -delete
log "🧹 Cleaned backups older than ${KEEP_DB_DAYS}d (db) / ${KEEP_UPLOADS_DAYS}d (uploads)"

# ─── [4] Optional: Push to Restic/B2 (if configured) ───
if [ -f /etc/restic/restic-env.sh ]; then
    log "☁️  Restic offsite backup..."
    source /etc/restic/restic-env.sh
    restic backup "$BACKUP_DIR" --tag "$PROJECT_NAME" --tag daily || log "⚠️  Restic failed (non-fatal)"
fi

log "✅ Backup complete: $PROJECT_NAME"
