# hearth-core — Pilot Project

**Frontend:** `https://app.travelagencyweb.com`  
**API:** `https://api.travelagencyweb.com/api`  
**Ports:** app `4101`, db `5401`, redis `6401`

## First migration

```bash
cd /var/www/hearth-core-app
git pull origin main
export OLD_DB_PASSWORD='REAL_OLD_POSTGRES_PASSWORD_HERE'
bash vps/projects/hearth-core/scripts/migrate-from-old.sh
```

## Daily operations on VPS

```bash
cd /opt/projects/hearth-core
bash scripts/healthcheck.sh
bash scripts/deploy.sh
bash scripts/backup.sh
bash scripts/rollback.sh
bash scripts/restore.sh all

docker compose ps
docker compose logs -f app
```

## Runtime layout

```text
/opt/projects/hearth-core/
├── source/                 # git source repo used for future deploys
├── app/                    # backend runtime copied from source/backend
├── frontend/dist/          # built React app served by host Nginx
├── data/postgres/          # persistent PostgreSQL data
├── data/redis/             # persistent Redis data
├── data/uploads/           # persistent uploads
├── backups/db/             # DB dumps
├── backups/uploads/        # uploads tarballs
├── logs/
├── scripts/
├── docker-compose.yml
└── .env                    # real secrets, chmod 600
```
