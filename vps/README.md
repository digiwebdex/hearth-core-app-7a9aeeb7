# 🏗️ VPS Architecture Pack

Goal: move projects from scattered `/var/www/*` + PM2 into isolated `/opt/projects/<name>/` folders with Docker, per-project database, persistent uploads, backups, rollback, and repeatable deploys.

## Layout

```text
vps/
├── templates/
│   ├── compose/
│   │   ├── docker-compose.cat-a.yml
│   │   ├── docker-compose.cat-b.yml
│   │   └── env.cat-a.example
│   ├── nginx/
│   │   └── site-cat-a.conf
│   ├── scripts/
│   │   ├── backup.sh
│   │   ├── deploy.sh
│   │   ├── healthcheck.sh
│   │   ├── restore.sh
│   │   └── rollback.sh
│   └── docs/
│       ├── MIGRATION_GUIDE.md
│       └── PORT_REGISTRY.md
└── projects/
    └── hearth-core/
        ├── README.md
        └── scripts/migrate-from-old.sh
```

## Pilot

`hearth-core` is the pilot project:

- frontend: `app.travelagencyweb.com`
- API: `api.travelagencyweb.com`
- app port: `4101`
- DB port: `5401`
- Redis port: `6401`

Run the exact VPS commands in [`templates/docs/MIGRATION_GUIDE.md`](templates/docs/MIGRATION_GUIDE.md).
