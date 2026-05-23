# hearth-core — Pilot Project

**Domain:** `app.travelagencyweb.com` (+ subdomains)
**Category:** A (Full-stack)
**Ports:** app `4101`, db `5401`, redis `6401`

## Quick Commands (run on VPS at `/opt/projects/hearth-core/`)

```bash
# Status
bash scripts/healthcheck.sh

# Deploy latest code
bash scripts/deploy.sh

# Manual backup
bash scripts/backup.sh

# Restore latest backup
bash scripts/restore.sh all

# Rollback last deploy
bash scripts/rollback.sh

# Logs
docker compose logs -f app
docker compose logs -f db
```

## First-time Setup

Follow [`../../templates/docs/MIGRATION_GUIDE.md`](../../templates/docs/MIGRATION_GUIDE.md) — Category A section, end-to-end.

## Files Generated (after migration completes)

```
/opt/projects/hearth-core/
├── docker-compose.yml      (from template)
├── .env                    (filled with real secrets, chmod 600)
├── app/                    (backend code from /var/www/hearth-core-app/backend)
├── frontend/dist/          (built React app)
├── data/
│   ├── postgres/           (persistent DB volume)
│   ├── redis/              (cache)
│   └── uploads/            (user files)
├── backups/
│   ├── db/                 (daily SQL dumps, 30d retention)
│   └── uploads/            (weekly tarballs, 14d retention)
├── logs/                   (app + postgres + nginx + backup logs)
└── scripts/                (backup/restore/deploy/rollback/healthcheck)
```
