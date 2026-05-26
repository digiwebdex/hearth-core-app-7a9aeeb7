#!/usr/bin/env bash
# Compare row counts between legacy DB and new Coolify DB.
# Edit the connection strings before running.
set -euo pipefail

OLD_URL="${OLD_DATABASE_URL:?Set OLD_DATABASE_URL=postgresql://hearth:PASS@127.0.0.1:5432/hearth_db}"
NEW_URL="${NEW_DATABASE_URL:?Set NEW_DATABASE_URL=postgresql://travelagencyweb_user:PASS@127.0.0.1:5433/travelagencyweb_db}"

tables=$(psql "$OLD_URL" -At -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1")

printf "%-40s %12s %12s %6s\n" TABLE OLD NEW DIFF
echo "──────────────────────────────────────────────────────────────────────"
for t in $tables; do
  old=$(psql "$OLD_URL" -At -c "SELECT count(*) FROM \"$t\"" 2>/dev/null || echo "ERR")
  new=$(psql "$NEW_URL" -At -c "SELECT count(*) FROM \"$t\"" 2>/dev/null || echo "ERR")
  diff=$(( ${new:-0} - ${old:-0} )) || diff="?"
  printf "%-40s %12s %12s %6s\n" "$t" "$old" "$new" "$diff"
done
