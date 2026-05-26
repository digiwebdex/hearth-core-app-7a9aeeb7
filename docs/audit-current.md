# VPS Audit — 2026-05-26

## Host
- **IP:** 187.77.144.38 — Ubuntu 24.04.4 LTS, kernel 6.8
- **Uptime:** 3d 9h, load 0.30/0.44/0.50 (healthy)
- **Disk /:** 96 GB total, 58 GB used, **39 GB free (60% used)**
- **RAM:** 7.8 GB total, 3.5 GB used app, 4.7 GB buff/cache, **4.3 GB available**
- **Swap:** 9 GB total, 2.1 GB used → memory pressure is moderate, not critical

## Runtime mix on this VPS (heavily shared)
- **15 PM2 apps** including legacy `hearth-api` (id 3, pid → `/var/www/hearth-core-app`), `alrawsha-api`, `primesky-api`, `tubaalhijaz-api`, `smtrade-soft`, `tilessaas-backend`, `worldjumper-api`, etc.
- **Coolify** running (`coolify`, `coolify-db`, `coolify-redis`, `coolify-realtime`, `coolify-sentinel`) on host port **8030**.
- **Supabase stack** running (kong on :8000/:8443, postgres, gotrue, realtime, storage, studio, supavisor pooler on **:5432**, etc.) — shared with other projects.
- Several other Postgres containers: `digiwebdex-postgres` (127.0.0.1:5433), `tilessaas-db-1` (127.0.0.1:5435), one Coolify-spawned `db-ylmlhqaak…` (no host port), `gx3hwz28d1brfeb1tf8hj4vr` (no host port).
- One unhealthy: `mailserver` (Restarting), `sm-trade-international-libretranslate-1` (unhealthy), `digiwebdex-backend` (unhealthy). Not our problem but worth knowing.

## hearth-api specifics (legacy, in use)
| Item | Value |
|---|---|
| PM2 id | 3 |
| Process | `node /var/www/hearth-core-app/...` |
| Host port | **3027** |
| Restarts | 1 (stable) |
| Memory | 64 MB |
| DB | native systemd PostgreSQL → database `hearth_db` (size **9.3 MB**, owner `hearth`) |
| Uploads dir | `/var/www/hearth-core-app/backend/uploads` → **4 KB (empty)** |
| Nginx site | `/etc/nginx/sites-enabled/hearth-core` (5.5 KB) |

## PostgreSQL situation
- **Native systemd Postgres** (active) — hosts 15 tenant DBs including `hearth_db`, `alrawsha`, `primesky_db`, `rahekaba`, `manasik`, `seventrip_db`, `skyline_db`, `sm_elite_hajj`, `tubaalhijaz`, etc. Only reachable via Unix socket (no TCP listener seen on :5432 from systemd; the :5432 TCP listener on the host belongs to **supabase-pooler** container).
- **Coolify will provision its own Postgres** container for `travelagencyweb-postgres` — it must NOT publish on host :5432 (taken by supavisor).

## Ports already taken on host
| Port | Owner | Public |
|---|---|---|
| 22 | sshd | ✅ |
| 80 | nginx | ✅ |
| 443 | nginx | ✅ |
| 3027 | PM2 hearth-api | internal only (Nginx proxies) |
| 4080 | another node app | internal |
| 5432 | docker → supabase-pooler | ✅ |
| 5433 | docker → digiwebdex-postgres | 127.0.0.1 |
| 5435 | docker → tilessaas-db-1 | 127.0.0.1 |
| 6001-6002 | coolify-realtime | ✅ |
| 6543 | supabase-pooler | ✅ |
| 8000 | supabase-kong | ✅ |
| 8030 | coolify | ✅ |
| 8443 | supabase-kong | ✅ |

## Implications for the migration plan
1. **Coolify is already installed and running** — use Coolify UI to manage `travelagencyweb-*` resources rather than running `docker compose up` by hand. The compose file in `app/docker-compose.yml` is the reference / standalone fallback.
2. **Coolify-managed Postgres volume is the right choice** for this VPS — bind-mounting to `/srv/travelagencyweb/data/postgres` would fight with Coolify's volume manager and complicate backups. The pg_dump in `scripts/backup-db.sh` already writes to `/srv/travelagencyweb/backups/database/` regardless of where the live volume lives. The actual Docker volume name will be recorded in `handover.md` after Coolify creates it.
3. **Do not publish Postgres on host :5432** — that port belongs to supabase-pooler. The compose file already keeps DB internal (no `ports:` block on the postgres service). ✓
4. **API container will live on internal Docker network only** (port 3027 inside the container). PM2's `hearth-api` keeps :3027 on the host — no conflict because the new API binds inside Docker. Coolify Traefik routes `api.travelagencyweb.com` → container, not host.
5. **Uploads directory is empty (4 KB)** — no upload migration needed at cutover. Just keep `/srv/travelagencyweb/data/uploads/` ready.
6. **hearth_db is tiny (9.3 MB)** — cutover dump/restore will take seconds.
7. **39 GB free disk** is more than enough for a second copy of the DB + image layers (~2 GB).
