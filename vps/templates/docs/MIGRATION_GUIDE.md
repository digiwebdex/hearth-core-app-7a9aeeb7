# 📖 Per-Project Migration Guide

প্রতিটা project কে `/var/www/<name>` থেকে `/opt/projects/<name>/` এ migrate করার exact steps।

---

## 🎯 Pre-flight Checklist (প্রতি project এর জন্য)

- [ ] Backup taken (DB + uploads + code)
- [ ] Port assigned in [`PORT_REGISTRY.md`](PORT_REGISTRY.md)
- [ ] DNS pointing to VPS (no change needed during migration)
- [ ] Maintenance window planned (~5-15 min downtime)

---

## 🟢 Category A Migration (Full-stack)

### Step 1: Skeleton তৈরি
```bash
PROJECT=hearth-core           # ← change this
APP_PORT=4101                 # ← from PORT_REGISTRY.md
DB_PORT=5401
REDIS_PORT=6401
DOMAIN=app.travelagencyweb.com
DB_NAME=hearth_db
DB_USER=hearth

mkdir -p /opt/projects/$PROJECT/{app,frontend/dist,data/{postgres,redis,uploads},backups/{db,uploads},logs/{app,postgres,nginx},scripts}
cd /opt/projects/$PROJECT
```

### Step 2: Template files copy
```bash
REPO=/var/www/$PROJECT     # OR wherever the vps/ folder is cloned
cp $REPO/vps/templates/compose/docker-compose.cat-a.yml ./docker-compose.yml
cp $REPO/vps/templates/compose/env.cat-a.example       ./.env
cp $REPO/vps/templates/scripts/*.sh                    ./scripts/
chmod +x ./scripts/*.sh
```

### Step 3: `.env` fill up (এক বার strong passwords generate করুন)
```bash
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
JWT=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)

cat > .env << EOF
PROJECT_NAME=$PROJECT
APP_DOMAIN=$DOMAIN
APP_PORT=$APP_PORT
DB_PORT=$DB_PORT
REDIS_PORT=$REDIS_PORT
DB_USER=$DB_USER
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT
EOF
chmod 600 .env
```

### Step 4: Code move
```bash
# Backend (Node.js + Prisma)
rsync -a --exclude='node_modules' --exclude='.env' --exclude='dist' \
      /var/www/$PROJECT/backend/  /opt/projects/$PROJECT/app/

# Frontend build output (if pre-built on dev/CI)
rsync -a /var/www/$PROJECT/dist/  /opt/projects/$PROJECT/frontend/dist/

# Existing uploads (CRITICAL — preserve user data)
rsync -a /var/www/$PROJECT/backend/uploads/  /opt/projects/$PROJECT/data/uploads/

# Symlink uploads inside app for compatibility
cd /opt/projects/$PROJECT/app && rm -rf uploads && ln -s ../data/uploads uploads
```

### Step 5: Dockerfile inside `app/`
```bash
cat > /opt/projects/$PROJECT/app/Dockerfile << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "src/index.js"]
DOCKERFILE
```

### Step 6: DB migration — existing data import
```bash
# Start ONLY db container first
cd /opt/projects/$PROJECT
docker compose up -d db
sleep 10

# Import existing dump (from old host postgres OR old container)
# Example: from old host postgres:
PGPASSWORD=OLD_PASS pg_dump -h localhost -U old_user old_db_name | \
    docker exec -i ${PROJECT}-db psql -U $DB_USER -d $DB_NAME

# Verify
docker exec ${PROJECT}-db psql -U $DB_USER -d $DB_NAME -c '\dt'
```

### Step 7: Build + start app
```bash
docker compose build app
docker compose up -d
docker compose ps
docker compose logs --tail=50 app
```

### Step 8: Host nginx update
```bash
# Generate site config from template
sed -e "s|__DOMAIN__|$DOMAIN|g" \
    -e "s|__APP_PORT__|$APP_PORT|g" \
    -e "s|__PROJECT_NAME__|$PROJECT|g" \
    /opt/projects/$PROJECT/../../vps/templates/nginx/site-cat-a.conf \
    > /etc/nginx/sites-available/$PROJECT.conf

ln -sfn /etc/nginx/sites-available/$PROJECT.conf /etc/nginx/sites-enabled/$PROJECT.conf

# Remove old config (after verification!)
# rm /etc/nginx/sites-enabled/<old-config>

nginx -t && systemctl reload nginx
```

### Step 9: Verify
```bash
bash /opt/projects/$PROJECT/scripts/healthcheck.sh
curl -I https://$DOMAIN
```

### Step 10: Cron — Daily backup
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/projects/$PROJECT/scripts/backup.sh >> /opt/projects/$PROJECT/logs/backup.log 2>&1") | crontab -
```

### Step 11: Cleanup old (only after 24h smooth running!)
```bash
# Stop old PM2 process
pm2 delete <old-process-name>
pm2 save

# Archive old /var/www folder
tar -czf /var/backups/www/${PROJECT}-pre-migration-$(date +%Y%m%d).tar.gz /var/www/$PROJECT
rm -rf /var/www/$PROJECT
```

---

## 🟡 Category B Migration (Static only)

Same as A but skip Steps 5-7, use `docker-compose.cat-b.yml`, no DB/Redis.

```bash
mkdir -p /opt/projects/$PROJECT/{public,logs}
cp /var/www/$PROJECT/* /opt/projects/$PROJECT/public/  # or rsync from dist
cp $REPO/vps/templates/compose/docker-compose.cat-b.yml ./docker-compose.yml
# Minimal nginx.conf inside project (SPA fallback)
cat > nginx.conf << 'EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    gzip on; gzip_types text/css application/javascript image/svg+xml;
    location / { try_files $uri $uri/ /index.html; }
    location ~* \.(jpg|jpeg|png|gif|svg|css|js|woff2)$ { expires 30d; }
}
EOF
docker compose up -d
```

---

## 🚨 Rollback if Migration Fails

```bash
# Stop new containers
cd /opt/projects/$PROJECT && docker compose down

# Restore old nginx config
ln -sfn /etc/nginx/sites-available/<old-config> /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Restart old PM2
pm2 start <old-ecosystem>
```

---

## ✅ Acceptance Criteria

- [ ] `bash scripts/healthcheck.sh` → all green
- [ ] `https://<domain>` responds 200 with fresh data
- [ ] Logs flowing into `logs/app/` and `logs/postgres/`
- [ ] Daily backup cron registered
- [ ] Old `/var/www/<name>` archived after 24h grace period
