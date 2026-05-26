#!/usr/bin/env bash
# Restore database from a .sql.gz dump.
# Usage: /srv/travelagencyweb/scripts/restore-db.sh /path/to/dump.sql.gz
set -euo pipefail

FILE=${1:?Usage: restore-db.sh <dump.sql.gz>}
CONTAINER=travelagencyweb-postgres
DB=${POSTGRES_DB:-travelagencyweb_db}
USER=${POSTGRES_USER:-travelagencyweb_user}

[ -f "$FILE" ] || { echo "File not found: $FILE" >&2; exit 1; }

echo "⚠️  This will OVERWRITE database '$DB' in container '$CONTAINER'."
read -p "Type 'RESTORE' to continue: " CONFIRM
[ "$CONFIRM" = "RESTORE" ] || { echo "Aborted."; exit 1; }

echo "[$(date -Iseconds)] Restoring $FILE → $DB"
gunzip -c "$FILE" | docker exec -i "$CONTAINER" psql -U "$USER" -d "$DB"
echo "[$(date -Iseconds)] Restore complete."
