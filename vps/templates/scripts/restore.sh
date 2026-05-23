#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Per-Project Restore Script
# Usage:
#   bash restore.sh                              → restore latest DB + uploads
#   bash restore.sh db <backup.sql.gz>           → restore specific DB
#   bash restore.sh uploads <backup.tar.gz>      → restore specific uploads
# ═══════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"

set -a; source "$PROJECT_DIR/.env"; set +a

MODE="${1:-all}"

confirm() {
    echo "⚠️  $1"
    read -p "Type 'YES' to continue: " ans
    [ "$ans" = "YES" ] || { echo "Aborted."; exit 1; }
}

restore_db() {
    local FILE="${1:-$(ls -t "$BACKUP_DIR/db"/*.sql.gz | head -1)}"
    [ -f "$FILE" ] || { echo "❌ DB backup not found: $FILE"; exit 1; }
    confirm "This will OVERWRITE database '$DB_NAME' with: $FILE"
    echo "📥 Restoring DB from $FILE ..."
    gunzip -c "$FILE" | docker exec -i "${PROJECT_NAME}-db" psql -U "$DB_USER" -d "$DB_NAME"
    echo "✅ DB restored"
    docker restart "${PROJECT_NAME}-app"
}

restore_uploads() {
    local FILE="${1:-$(ls -t "$BACKUP_DIR/uploads"/*.tar.gz 2>/dev/null | head -1)}"
    [ -f "$FILE" ] || { echo "ℹ️  No uploads backup found, skipping"; return; }
    confirm "This will OVERWRITE uploads with: $FILE"
    echo "📥 Restoring uploads from $FILE ..."
    rm -rf "$PROJECT_DIR/data/uploads"
    tar -xzf "$FILE" -C "$PROJECT_DIR/data"
    chown -R 1000:1000 "$PROJECT_DIR/data/uploads"
    echo "✅ Uploads restored"
}

case "$MODE" in
    db)       restore_db "${2:-}" ;;
    uploads)  restore_uploads "${2:-}" ;;
    all)      restore_db; restore_uploads ;;
    *)        echo "Usage: $0 [db|uploads|all] [<file>]"; exit 1 ;;
esac
