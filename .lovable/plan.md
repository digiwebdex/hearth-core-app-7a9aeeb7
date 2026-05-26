
# TravelAgencyWeb / Hearth Core — VPS-Only Migration Plan

This plan executes your instruction in **two tracks**:

- **Track A (VPS work)** — runs on `187.77.144.38` via SSH. Lovable cannot SSH; you run commands, I give you exact scripts and read your outputs.
- **Track B (Repo work)** — Dockerfiles, `docker-compose.yml`, backend `.env.example`, CORS update, scripts, and `/srv/travelagencyweb/docs/*`. I write these into the repo so Coolify can deploy them.

PM2 process `hearth-api` on port `3027` stays **untouched** until the new Coolify stack is green.

---

## Phase 0 — Audits (read-only, no changes)

Before any code change, you run these on the VPS and paste the outputs. I will fill the audit docs from real values, not guesses.

### 0.1 System + runtime audit
```bash
ssh root@187.77.144.38
lsb_release -a; uname -a; uptime; df -h /; free -h
pm2 list; pm2 describe hearth-api | head -80
ss -tulnp | grep -E '3027|5432|5433|80|443|8000'
docker ps -a; docker volume ls; docker network ls
systemctl is-active nginx postgresql docker
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/hearth-core 2>/dev/null || cat /etc/nginx/sites-enabled/*travel* 2>/dev/null
```

### 0.2 Current app + DB audit
```bash
ls -la /var/www/hearth-core-app
cat /var/www/hearth-core-app/backend/.env 2>/dev/null | sed 's/=.*/=***/'
sudo -u postgres psql -c '\l+'
sudo -u postgres psql -d hearth_db -c '\dt'
sudo -u postgres psql -d hearth_db -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null
du -sh /var/www/hearth-core-app/backend/uploads 2>/dev/null
```

### 0.3 Repo audit (I do this side)
- Confirm `backend/` is a real Node/Express + Prisma API (it is — see `backend/src/index.js`, `backend/prisma/schema.prisma`).
- Confirm frontend uses `VITE_API_URL` (it does — `src/lib/api.ts`).
- List all routes mounted in `backend/src/index.js` and reconcile with your required endpoint list.

**Deliverable:** `/srv/travelagencyweb/docs/audit-current.md` populated with real numbers.

---

## Phase 1 — Create folder structure on VPS (non-destructive)

```bash
sudo mkdir -p /srv/travelagencyweb/{app,data/{postgres,uploads,logs,temp},backups/{database,uploads,full-project,restore-test},scripts,docs}
sudo chown -R $USER:$USER /srv/travelagencyweb
cd /srv/travelagencyweb/app
git clone https://github.com/digiwebdex/hearth-core-app-7a9aeeb7.git .
mv backend backend && mkdir -p frontend
# move Vite frontend files into app/frontend (keep backend at app/backend)
```

I will produce the exact `mv` list once we agree on the layout, since the current repo has frontend at root.

---

## Phase 2 — Repo changes (I do, in Lovable)

Files I will create/edit in this repo so Coolify can deploy from GitHub:

1. **`backend/Dockerfile`** — Node 20-alpine, `prisma generate`, `npm ci --omit=dev`, runs `node src/index.js` on `PORT=3027`.
2. **`Dockerfile`** (frontend, repo root) — multi-stage: `node:20-alpine` build → `nginx:alpine` serve `dist/`.
3. **`nginx.conf`** (frontend, already exists — verify SPA fallback `try_files $uri /index.html`).
4. **`app/docker-compose.yml`** with three services:
   - `travelagencyweb-postgres` (postgres:16, volume → `/srv/travelagencyweb/data/postgres`)
   - `travelagencyweb-api` (build `./backend`, mounts uploads + logs, internal only)
   - `travelagencyweb-frontend` (build `.`, exposed via Coolify proxy)
5. **`backend/.env.example`** — fill with the variables you listed (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `UPLOAD_DIR=/app/uploads`, `LOG_DIR=/app/logs`, `PUBLIC_UPLOAD_URL`).
6. **CORS** — `backend/src/index.js` already allows `travelagencyweb.com`, `www`, `app`, `portal`. Add explicit override via `CORS_ORIGIN` env. No code change needed unless you want to drop the defaults.
7. **Health endpoint upgrade** — extend `/api/health` to include `database` (Prisma `SELECT 1`), `service: "travelagencyweb-api"`, `uptime`, `environment`.
8. **Scripts in `vps/scripts/`** (mirrored to `/srv/travelagencyweb/scripts/` on VPS):
   - `backup-db.sh`, `backup-uploads.sh`, `restore-db.sh`, `restore-uploads.sh`, `deploy.sh`, `health-check.sh`.
9. **Docs in `vps/docs/`** (mirrored to `/srv/travelagencyweb/docs/`):
   - `architecture.md`, `environment-variables.md`, `deployment-guide.md`, `backup-restore-guide.md`, `api-endpoints.md`, `handover.md`.

**No frontend UI/business-logic changes.** Only infra + docs.

---

## Phase 3 — Coolify deployment (you do, I give exact UI clicks)

In Coolify create one **Project: travelagencyweb** with three resources:

| Resource | Type | Source | Internal port | Public |
|---|---|---|---|---|
| `travelagencyweb-postgres` | Database → PostgreSQL 16 | Coolify-managed | 5432 | ❌ |
| `travelagencyweb-api` | Application → Dockerfile | GitHub repo, `backend/` context | 3027 | via `api.travelagencyweb.com` |
| `travelagencyweb-frontend` | Application → Dockerfile | GitHub repo, root context | 80 | via `travelagencyweb.com`, `www`, `app` |

DNS (Hostinger panel):
```
A  @     187.77.144.38
A  www   187.77.144.38
A  app   187.77.144.38
A  api   187.77.144.38
```

Coolify auto-issues Let's Encrypt SSL. PM2 `hearth-api` keeps running on `:3027` — Coolify API binds to a **different** internal port (e.g. `3028`) until cutover. I'll set this in compose.

---

## Phase 4 — Latest-data migration (cutover day)

```bash
# 1. Final dump from PM2/legacy DB
pg_dump -h 127.0.0.1 -p 5432 -U hearth -d hearth_db \
  --no-owner --no-acl --clean --if-exists \
  -f /srv/travelagencyweb/backups/database/cutover-$(date +%F).sql

# 2. Rsync uploads
rsync -av /var/www/hearth-core-app/backend/uploads/ \
  /srv/travelagencyweb/data/uploads/

# 3. Restore into Coolify Postgres
psql "$NEW_DATABASE_URL" -f /srv/travelagencyweb/backups/database/cutover-*.sql

# 4. Row-count parity check (script I'll provide)
bash /srv/travelagencyweb/scripts/verify-migration.sh
```

Then in Coolify swap the API domain `api.travelagencyweb.com` from Nginx→PM2 to Coolify→`travelagencyweb-api`. Freeze old PM2 by `pm2 stop hearth-api` (don't delete for 7 days).

---

## Phase 5 — Backups, restore test, acceptance

- Cron: `0 2 * * * /srv/travelagencyweb/scripts/backup-db.sh`
- Cron: `0 3 * * * /srv/travelagencyweb/scripts/backup-uploads.sh`
- Restore drill into `backups/restore-test/` weekly.
- Walk through the 31-point acceptance checklist; tick each in `handover.md`.

---

## Technical notes

- **Backend already exists** in the repo (`backend/src/index.js`, Prisma schema, 25+ routes). Your endpoint list mostly maps to existing routes (`/api/auth`, `/api/bookings`, `/api/leads`, etc.). Endpoints like `/api/blogs`, `/api/team`, `/api/testimonials`, `/api/promo-ads`, `/api/seo`, `/api/homepage-content` **do not exist yet** — I'll list the gap in `api-endpoints.md` and we decide later whether to build them (out of scope for this migration).
- **Port choice:** keep `PORT=3027` inside the API container to avoid env-var churn. Coolify routes `api.travelagencyweb.com` → container `:3027`. Host port stays free; PM2 keeps `:3027` on host until cutover (no conflict — container port is internal to Docker network).
- **Postgres volume:** Coolify manages its own named volume by default. I'll document the volume name in `handover.md` and add a nightly `pg_dump` to `/srv/travelagencyweb/backups/database/` so data is reachable from the standard path even if the live volume isn't bind-mounted.
- **Frontend env at build time:** Vite bakes `VITE_API_URL` at build. Coolify build-args will set `VITE_API_URL=https://api.travelagencyweb.com`.

---

## What I need from you to start

1. Paste outputs of **Phase 0.1** and **0.2** commands.
2. Confirm: keep `PORT=3027` (recommended) or switch to `3000`?
3. Confirm: I should proceed to create Dockerfiles + compose + scripts + docs in the repo now, or wait until after audits?

Reply with the audit outputs and I'll execute Phase 2 in one batch.
