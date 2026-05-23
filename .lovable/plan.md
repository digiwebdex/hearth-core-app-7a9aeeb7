# 🏗️ VPS Full Architecture — Coolify Migration Plan

আপনার uploaded spreadsheet অনুসারে **21 projects** + cleanup। Target: প্রতিটা project Coolify/Docker এ আলাদা DB + uploads + port + backup নিয়ে চলবে। কোনো Lovable/Supabase dependency থাকবে না।

---

## 🎯 Final Architecture

```text
/opt/
├── coolify/                    ← Coolify itself (port 8000, manages everything)
└── projects/                   ← per-project persistent data only
    ├── hearth-core/
    │   ├── uploads/            ← bind-mounted into container
    │   ├── backups/db/         ← daily pg_dump
    │   └── backups/uploads/    ← daily tar.gz
    ├── alrawsha/
    ├── lucky-cruise/
    └── ... (one folder per project)

/var/www/                       ← OLD — archive then delete after cutover
```

Host nginx **removed** (Coolify's Traefik handles 80/443)। Coolify provisions:
- Per-project PostgreSQL container (isolated network)
- Per-project app container (Node/static)
- Per-project Traefik route → `app.domain.com` + `api.domain.com`
- Auto SSL (Let's Encrypt)
- Auto deploys from GitHub on push
- Built-in backups (S3/local)

---

## 📋 Phases

### **Phase 0 — Pre-flight (1 day)**
- VPS-wide snapshot via Hostinger panel
- Install Coolify (`curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`)
- Open ports 8000 (admin), 80, 443; close everything else
- Backup all `/var/www/*` → `/srv/backup/pre-coolify-YYYYMMDD.tar.gz`
- Backup all PM2 databases → `/srv/backup/db/pre-coolify-*.sql.gz`
- Kill all legacy PM2 processes (after backup)

### **Phase 1 — Pilot: hearth-core (Day 2)**
This is your main SaaS, highest risk → migrate first to validate flow.

1. Rename old folder `hearth-core-app` → archive
2. In Coolify GUI: New Project → "hearth-core"
3. Add resources:
   - PostgreSQL 16 (auto-generated password)
   - Application: GitHub repo `digiwebdex/hearth-core-app`, branch `main`
   - Build: `npm install && npm run build` (frontend) + `cd backend && npm ci && npx prisma migrate deploy`
   - Start: `cd backend && node src/index.js`
   - Persistent storage: `/app/backend/uploads` → `/opt/projects/hearth-core/uploads`
4. Environment variables (Coolify UI):
   - `DATABASE_URL` (auto-injected by Coolify DB resource)
   - `JWT_SECRET`, `VITE_API_URL=https://api.travelagencyweb.com`
5. Domains:
   - `app.travelagencyweb.com` → frontend service
   - `api.travelagencyweb.com` → backend service (port 3001 internal)
6. Restore old DB into Coolify Postgres:
   ```bash
   gunzip < /srv/backup/db/hearth-pre-coolify.sql.gz | \
     docker exec -i <coolify-pg-container> psql -U postgres -d hearth
   ```
7. Copy uploads: `rsync -av /var/www/hearth-core-app/backend/uploads/ /opt/projects/hearth-core/uploads/`
8. Trigger deploy → SSL auto-issued → smoke test
9. Setup nightly backup schedule in Coolify

### **Phase 2 — Active full-stack projects (Day 3-5)**
Apply same Coolify recipe to:
- `alrawsha` (alrawshaintl.com)
- `lucky-cruise` (luckytoursandtravels.com) — finish half-migration first
- All others marked "Existing API – migrate"

### **Phase 3 — Static / frontend-only sites (Day 6)**
For `ecotrippers`, `manasik-travel`, `darul-furkan`, etc.:
- Coolify "Static Site" resource type
- Build command: `npm run build` → publish `dist/`
- No DB, no uploads volume unless needed
- Domain → auto SSL

### **Phase 4 — Special: darul-furkan Supabase export (Day 7)**
1. Export Supabase DB: `pg_dump` via Supabase dashboard
2. Export Supabase Storage bucket via API → tar
3. Import into fresh Coolify PostgreSQL + `/opt/projects/darul-furkan/uploads/`
4. Update app `.env` to point at VPS DB
5. Deploy via Coolify
6. Verify, then disconnect Supabase project

### **Phase 5 — Investigate / Archive (Day 8)**
- `primeskyint`: find domain or kill PM2 + archive
- `digiwebdex` (old): confirm tilessaas replacement, then archive
- `kurigram`, `masudtravels` (orphans): DNS check → archive
- Move archived folders → `/srv/archive/YYYY-MM-DD/<name>.tar.gz` → delete from `/var/www`

### **Phase 6 — Hardening (Day 9)**
- UFW: allow 22, 80, 443, 8000 (Coolify admin behind VPN ideally)
- Fail2ban for SSH + Coolify
- Off-server backup: `rclone` to Hostinger Object Storage or Backblaze B2 nightly
- Test full restore on a separate test VPS

---

## 🔧 What I'll Generate For You

I'll produce in this repo `vps/` directory:

1. **`vps/install/01-pre-flight.sh`** — snapshot, backup all, kill PM2
2. **`vps/install/02-install-coolify.sh`** — Coolify install + firewall
3. **`vps/projects/<name>/coolify.json`** — import-ready Coolify config per project
4. **`vps/projects/<name>/migrate.sh`** — DB restore + uploads rsync per project
5. **`vps/backup/nightly.sh`** — off-server rclone backup
6. **`vps/docs/RUNBOOK-bn.md`** — Bengali step-by-step copy-paste commands for every phase
7. **`vps/docs/ROLLBACK.md`** — emergency rollback if Coolify cutover fails

---

## ⚠️ Critical Decisions Needed From You

1. **Coolify vs raw docker-compose?** Spreadsheet says "Coolify/Docker". Coolify = GUI + auto SSL + auto deploy. Raw compose = more manual but lighter. **I recommend Coolify** since your spreadsheet specifies it. Confirm?
2. **Old `/var/www` projects:** delete after backup or keep 30 days as `.tar.gz`?
3. **Off-server backup destination:** Hostinger Object Storage, Backblaze B2, or AWS S3?
4. **Downtime window:** can each project tolerate ~10 min DNS/SSL cutover, or need blue-green?

---

## ✅ Deliverables Order

After you confirm the 4 questions above, I'll commit Phase 0 + Phase 1 scripts first (so you can run pilot tonight), then Phase 2–6 in subsequent batches as each phase completes successfully on the VPS.

**Next action:** Approve plan → answer 4 questions → I write Phase 0 + 1 scripts → you run them on VPS → report output → proceed to Phase 2.
