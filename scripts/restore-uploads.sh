#!/usr/bin/env bash
# Restore uploads from a tar.gz backup.
# Usage: /srv/travelagencyweb/scripts/restore-uploads.sh /path/to/uploads-YYYYMMDD.tar.gz
set -euo pipefail

FILE=${1:?Usage: restore-uploads.sh <uploads-*.tar.gz>}
DST=/srv/travelagencyweb/data

[ -f "$FILE" ] || { echo "File not found: $FILE" >&2; exit 1; }

echo "⚠️  This will OVERWRITE files in $DST/uploads"
read -p "Type 'RESTORE' to continue: " CONFIRM
[ "$CONFIRM" = "RESTORE" ] || { echo "Aborted."; exit 1; }

tar -xzf "$FILE" -C "$DST"
echo "[$(date -Iseconds)] Uploads restored to $DST/uploads"
