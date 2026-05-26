# TravelAgencyWeb — VPS Handover

| Item | Value |
|---|---|
| Project | TravelAgencyWeb / Hearth Core App |
| VPS IP | 187.77.144.38 |
| Frontend | https://travelagencyweb.com, https://www.travelagencyweb.com, https://app.travelagencyweb.com |
| API | https://api.travelagencyweb.com |
| Repo | https://github.com/digiwebdex/hearth-core-app-7a9aeeb7.git |
| Runtime | Docker via Coolify (legacy PM2 `hearth-api` retained until cutover verified) |

## Coolify services
- `travelagencyweb-frontend` — Nginx static, internal :80
- `travelagencyweb-api` — Node 20 + Express + Prisma, internal :3027
- `travelagencyweb-postgres` — PostgreSQL 16, internal :5432 (NOT publicly exposed)

## Filesystem layout (VPS)
```
/srv/travelagencyweb/
├── app/         # git clone of the repo (frontend at root, backend in ./backend)
├── data/
│   ├── postgres/   # bind-mount for DB (or Coolify-managed volume — see below)
│   ├── uploads/    # mounted into API container at /app/uploads
│   ├── logs/       # mounted into API container at /app/logs
│   └── temp/
├── backups/{database,uploads,full-project,restore-test}/
├── scripts/     # backup-db.sh, backup-uploads.sh, restore-*.sh, deploy.sh, health-check.sh, verify-migration.sh
└── docs/        # this file + architecture/env/deployment guides
```

**Coolify-managed Postgres volume:** if you let Coolify provision the database (recommended), the actual Docker volume name is shown in the Coolify UI under the database resource → "Storage". Record it here after creation, e.g. `postgres-abcd1234-data`. Nightly `pg_dump` in `scripts/backup-db.sh` writes plain-SQL backups into `/srv/travelagencyweb/backups/database/` regardless of where the live volume lives.

## Ports
- Public: 80, 443, 22 (SSH).
- Internal only: 3027 (API container), 5432 (DB container), 8000 (Coolify UI on loopback).
- Legacy PM2 `hearth-api` binds host :3027 until cutover. Coolify Traefik routes by hostname, not host port, so no conflict during parallel run.

## Environment variables — see `app/.env.example` and `backend/.env.example`. Secret values live in Coolify env editor, never in git.

## Build / start commands
- Frontend build: `npm run build` (Vite, `VITE_API_URL` baked at build)
- Backend start: `npx prisma migrate deploy && node src/index.js`
- Stack: `cd /srv/travelagencyweb/app && docker compose --env-file .env up -d`

## Health
- `GET https://api.travelagencyweb.com/api/health` returns `{status, database, service, uptime, environment, timestamp}`.
- Quick probe: `/srv/travelagencyweb/scripts/health-check.sh`.

## Backup / restore
- Daily DB dump: cron `0 2 * * *` → `scripts/backup-db.sh`
- Daily uploads tar: cron `0 3 * * *` → `scripts/backup-uploads.sh`
- Restore: `scripts/restore-db.sh <dump.sql.gz>` and `scripts/restore-uploads.sh <archive.tar.gz>` (both require typing `RESTORE` to proceed).
- Weekly restore drill into `backups/restore-test/`.

## Admin user
- Initial admin is seeded by `backend/prisma/seed.js`. To reset: `docker exec -it travelagencyweb-api node prisma/seed.js`.

## Deployment procedure
1. Merge to main on GitHub.
2. SSH to VPS → `/srv/travelagencyweb/scripts/deploy.sh` (pulls, rebuilds, waits for `/api/health`).
3. Or trigger Coolify auto-deploy webhook (preferred).

## Verification checklist (post-cutover)
See `/srv/travelagencyweb/docs/deployment-guide.md` → "Acceptance checklist (31 items)".

## API endpoint inventory
See `/srv/travelagencyweb/docs/api-endpoints.md` for the full live route list and the gap vs. the requested endpoint list (blogs, team, testimonials, promo-ads, seo, homepage-content — not yet implemented).
