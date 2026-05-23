# 📖 VPS Migration Runbook (বাংলা)

প্রতি step একটার পর একটা চালাবেন। আগেরটা সফল না হওয়া পর্যন্ত পরেরটা **চালাবেন না**।

---

## 🛡️ Phase 0 — Pre-flight (আজই)

### Step 0.1 — Hostinger panel snapshot
1. Hostinger VPS dashboard → আপনার VPS → **Snapshots** → **Create snapshot**
2. Name: `pre-coolify-YYYYMMDD`
3. Snapshot **complete হওয়া পর্যন্ত wait করুন** (~5-15 min)

### Step 0.2 — VPS এ repo update
```bash
cd /var/www/hearth-core-app
git pull origin main
ls vps/install/   # 01-pre-flight.sh, 02-install-coolify.sh দেখা উচিত
```

### Step 0.3 — Full backup script চালান
```bash
sudo bash /var/www/hearth-core-app/vps/install/01-pre-flight.sh
```
Output এর শেষে `BACKUP_ROOT` path note করুন (e.g. `/srv/backup/pre-coolify-20260523-...`).

### Step 0.4 — Backup আপনার local PC তে download করুন (PowerShell)
```powershell
# Windows PowerShell এ আপনার machine থেকে চালান
$VPS_IP   = "YOUR.VPS.IP"
$STAMP    = "20260523-XXXXXX"  # আগের output থেকে
scp -r "root@${VPS_IP}:/srv/backup/pre-coolify-${STAMP}" "C:\vps-backups\"
```
**Verify**: Local PC তে folder টা সম্পূর্ণ আছে কি দেখুন। **শুধু confirm হলেই Phase 1 এ যান।**

---

## 🚀 Phase 1 — Coolify install + hearth-core pilot

### Step 1.1 — Coolify install
```bash
sudo bash /var/www/hearth-core-app/vps/install/02-install-coolify.sh
```
Output এ দেখাবে: `http://<VPS_IP>:8000`

### Step 1.2 — Coolify admin account
1. Browser → `http://<VPS_IP>:8000`
2. Root admin email + strong password তৈরি করুন
3. **Servers** menu → `localhost` auto-connected আছে কিনা verify করুন

### Step 1.3 — Coolify UI তে hearth-core project তৈরি
1. **+ New Project** → name: `hearth-core`
2. **+ New Resource** → **PostgreSQL 16**
   - Name: `hearth-pg`
   - Database: `hearth`
   - User: `postgres`
   - Deploy → ready হওয়া পর্যন্ত wait
   - **Container ID copy করুন** (Resource → Configuration → Container Name)
3. **+ New Resource** → **Application** → **Public Repository**
   - URL: `https://github.com/digiwebdex/hearth-core-app`
   - Branch: `main`
   - Build Pack: **Nixpacks** (auto-detect)
   - Build command: `npm install && npm run build && cd backend && npm ci && npx prisma generate && npx prisma migrate deploy`
   - Start command: `cd backend && node src/index.js`
   - Port: `3001`
4. **Environment Variables** tab:
   - `DATABASE_URL` = (Coolify → DB resource → Connection String → Internal)
   - `JWT_SECRET` = (generate strong random)
   - `NODE_ENV` = `production`
   - `VITE_API_URL` = `https://api.travelagencyweb.com`
5. **Storages** tab → Add persistent storage:
   - Source: `/opt/projects/hearth-core/uploads`
   - Destination: `/app/backend/uploads`
6. **Domains** tab:
   - `app.travelagencyweb.com` → port `3001`
   - `api.travelagencyweb.com` → port `3001` (same container, nginx routes by path)

### Step 1.4 — Data migration (DB + uploads)
PG container ID note করুন (Coolify → DB → details), তারপর:
```bash
export COOLIFY_PG_CONTAINER="<paste container id>"
export COOLIFY_PG_USER=postgres
export COOLIFY_PG_DB=hearth
sudo -E bash /var/www/hearth-core-app/vps/projects/hearth-core/migrate.sh
```

### Step 1.5 — Deploy + verify
1. Coolify → Application → **Deploy** button
2. **Logs** tab live দেখুন — build successful হওয়া পর্যন্ত wait
3. Health check green হওয়ার জন্য wait
4. **Test commands** (VPS এ):
```bash
curl -I https://api.travelagencyweb.com/api/health
curl -I https://app.travelagencyweb.com/
```
Both should return `HTTP/2 200`.

### Step 1.6 — DNS cutover
Hostinger DNS dashboard → `travelagencyweb.com`:
- `A   app   <VPS_IP>`
- `A   api   <VPS_IP>`
- TTL: 300 (5 min)

Wait 5-10 min → browser এ `https://app.travelagencyweb.com` open করে login test।

---

## 📅 Phase 2-6

Phase 1 pilot **green হলে** আমাকে confirm করুন। তারপর আমি batch-by-batch দিব:
- Phase 2: alrawsha + lucky-cruise + অন্যান্য active full-stack (5 projects)
- Phase 3: ecotrippers + manasik + static sites (6 projects)
- Phase 4: darul-furkan Supabase export migration
- Phase 5: orphan archive (kurigram, masudtravels, primesky, old digiwebdex)
- Phase 6: hardening + off-server backup automation

---

## 🆘 Rollback (কিছু failed হলে)

```bash
# 1) Stop Coolify
docker stop $(docker ps -q)
# 2) Restore Hostinger panel snapshot from Phase 0.1
# (panel এ Snapshots → restore)
# 3) PM2 + nginx auto-restart হবে — site আগের state এ ফিরবে
```

Local PC তে backup আছে → কোনো data হারাবে না।
