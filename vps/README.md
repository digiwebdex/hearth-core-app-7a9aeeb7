# 🏗️ VPS Architecture Pack

**Goal:** Migrate all VPS projects from chaotic `/var/www/*` (PM2 + scattered configs) to clean **`/opt/projects/<name>/`** dockerized isolation.

## 📐 Folder Layout

```
vps/
├── README.md                    ← এই file
├── templates/                   ← Reusable template (copy → modify for each project)
│   ├── compose/
│   │   ├── docker-compose.cat-a.yml    ← Full-stack (app + db + redis)
│   │   ├── docker-compose.cat-b.yml    ← Static only (nginx)
│   │   └── env.cat-a.example
│   ├── nginx/
│   │   ├── site-cat-a.conf             ← Reverse proxy + SSL
│   │   └── site-cat-b.conf             ← Static proxy
│   ├── scripts/
│   │   ├── backup.sh                   ← Daily DB + uploads backup
│   │   ├── restore.sh                  ← Restore from backup
│   │   ├── deploy.sh                   ← Atomic deploy with rollback
│   │   ├── rollback.sh                 ← One-command rollback
│   │   └── healthcheck.sh              ← Status check
│   └── docs/
│       ├── PORT_REGISTRY.md            ← Master port allocation table
│       └── MIGRATION_GUIDE.md          ← Step-by-step per project
│
└── projects/                    ← Per-project actual configs (generated from template)
    └── hearth-core/             ← PILOT
        ├── docker-compose.yml
        ├── .env.example
        ├── nginx-site.conf
        ├── README.md
        └── scripts/
            ├── migrate-from-old.sh     ← One-time: migrate from /var/www to /opt/projects
            └── ...
```

## 🚀 Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Backups (snapshot + tar + DB dump + B2 offsite) | ✅ Done |
| 1 | **hearth-core pilot** — template validate | 🟡 In Progress |
| 2 | Remaining 12 Cat A projects | ⏳ Pending |
| 3 | 8 Cat B static projects | ⏳ Pending |
| 4 | Cat C cleanup | ⏳ Pending |
| 5 | Archive `/var/www`, kill host PM2 | ⏳ Pending |

## 🔢 Port Registry (Master)

See [`templates/docs/PORT_REGISTRY.md`](templates/docs/PORT_REGISTRY.md)

## 📖 Per-Project Migration

See [`templates/docs/MIGRATION_GUIDE.md`](templates/docs/MIGRATION_GUIDE.md)
