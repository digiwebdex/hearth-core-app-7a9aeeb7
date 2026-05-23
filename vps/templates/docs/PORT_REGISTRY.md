# 🔢 VPS Port Registry — Master Allocation

**Rule:** প্রতি project এর জন্য fixed port range। Conflict zero।
Host nginx (port 80/443) → `127.0.0.1:<app-port>` এ proxy করবে।

## Range Map

| Range | Purpose | Host-exposed |
|-------|---------|--------------|
| `80`, `443` | Host Nginx (only edge) | Public |
| `22` | SSH | Public (firewall'd) |
| `4101-4199` | Cat A backend APIs | `127.0.0.1` only |
| `4201-4299` | Cat B static nginx | `127.0.0.1` only |
| `5401-5499` | Cat A PostgreSQL | `127.0.0.1` only (backups) |
| `6401-6499` | Cat A Redis | `127.0.0.1` only |

## 🟢 Category A — Backend Projects (13)

| # | Project | Domain | App Port | DB Port | Redis Port | Folder |
|---|---------|--------|----------|---------|------------|--------|
| 1 | hearth-core | app.travelagencyweb.com | **4101** | **5401** | 6401 | `/opt/projects/hearth-core/` |
| 2 | lucky-cruise | luckycruise.com | 4102 | 5402 | 6402 | `/opt/projects/lucky-cruise/` |
| 3 | tilessaas | tilessaas.com | 4103 | 5403 | 6403 | `/opt/projects/tilessaas/` |
| 4 | smelitehajjinvoice | invoice.smelitehajj.com | 4104 | 5404 | 6404 | `/opt/projects/smelitehajjinvoice/` |
| 5 | travelsaas | travelsaas.com | 4105 | 5405 | 6405 | `/opt/projects/travelsaas/` |
| 6 | world-jumper-bd | worldjumperbd.com | 4106 | 5406 | 6406 | `/opt/projects/world-jumper-bd/` |
| 7 | digiwebdex | digiwebdex.com | 4107 | 5407 | 6407 | `/opt/projects/digiwebdex/` |
| 8 | smtradeapp | smtradeint.com | 4108 | 5408 | 6408 | `/opt/projects/smtradeapp/` |
| 9 | smtradeapp-soft | soft.smtradeint.com | 4109 | 5409 | 6409 | `/opt/projects/smtradeapp-soft/` |
| 10-13 | (reserved) | — | 4110-4113 | 5410-5413 | 6410-6413 | — |

## 🟡 Category B — Static Sites (8)

| # | Project | Domain | Port | Folder |
|---|---------|--------|------|--------|
| 14 | darul-furkan | darulfurkan.com | **4201** | `/opt/projects/darul-furkan/` |
| 15 | smelitehajjwebsite | smelitehajj.com | 4202 | `/opt/projects/smelitehajj-web/` |
| 16 | kurigram-overseas | kurigramoverseas.com | 4203 | `/opt/projects/kurigram-overseas/` |
| 17 | manasik-travel-hub | manasiktravelhub.com | 4204 | `/opt/projects/manasik-travel-hub/` |
| 18 | masudtravelsagency | masudtravelsagency.com | 4205 | `/opt/projects/masudtravelsagency/` |
| 19 | saz-travel | saztravel.com | 4206 | `/opt/projects/saz-travel/` |
| 20 | seventrip-net | seventrip.net | 4207 | `/opt/projects/seventrip-net/` |
| 21 | ecotrippers | ecotrippers.com | 4208 | `/opt/projects/ecotrippers/` |

## 🔴 Category C — Cleanup (5)

| # | Item | Decision |
|---|------|----------|
| 22 | ecotripperstudy | Investigate → B or delete |
| 23 | rofrof-travels | Investigate → B or delete |
| 24 | sm-trade-international | ✅ Deleted |
| 25 | certbot | Keep (system) |
| 26 | package-lock.json | ✅ Deleted |

## 🚫 Retired Ports (after migration)

`3002`, `3003`, `3021`, `3027`, `3101`, `3105`, `5440` — all old PM2/random ports get killed in Phase 5.
