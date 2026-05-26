# Backup & Restore Guide

## Schedule (cron, on VPS)
```cron
# /etc/cron.d/travelagencyweb
0 2 * * * root /srv/travelagencyweb/scripts/backup-db.sh      >> /srv/travelagencyweb/data/logs/backup-db.log 2>&1
0 3 * * * root /srv/travelagencyweb/scripts/backup-uploads.sh >> /srv/travelagencyweb/data/logs/backup-uploads.log 2>&1
0 4 * * 0 root tar -czf /srv/travelagencyweb/backups/full-project/full-$(date +\%F).tar.gz -C /srv travelagencyweb/app travelagencyweb/docs travelagencyweb/scripts
```

## Locations
- DB dumps: `/srv/travelagencyweb/backups/database/*.sql.gz` (retain 14 days)
- Upload tars: `/srv/travelagencyweb/backups/uploads/*.tar.gz` (retain 30 days)
- Full project: `/srv/travelagencyweb/backups/full-project/*.tar.gz` (weekly, manual prune)
- Restore drills: `/srv/travelagencyweb/backups/restore-test/`

## Off-server copy
Run weekly from a second host:
```bash
rsync -avz --delete root@187.77.144.38:/srv/travelagencyweb/backups/ /local/path/travelagencyweb-backups/
```

## Restore procedure
```bash
# Database
/srv/travelagencyweb/scripts/restore-db.sh /srv/travelagencyweb/backups/database/travelagencyweb_db-YYYYMMDD-HHMMSS.sql.gz

# Uploads
/srv/travelagencyweb/scripts/restore-uploads.sh /srv/travelagencyweb/backups/uploads/uploads-YYYYMMDD-HHMMSS.tar.gz

# Smoke test
/srv/travelagencyweb/scripts/health-check.sh
curl -fsS https://api.travelagencyweb.com/api/health
```

## Restore drill (weekly)
1. Spin up a throwaway compose in `backups/restore-test/` with a fresh Postgres container.
2. Run `restore-db.sh` pointing at it.
3. Run `SELECT count(*)` on key tables (User, Tenant, Booking, Invoice). Compare to live.
4. Untar latest uploads into a temp dir, list count, spot-check 3 random files open.
5. Log result in `data/logs/restore-drill.log`.
