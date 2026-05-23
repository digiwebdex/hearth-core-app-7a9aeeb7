# 📖 VPS Migration Guide

এই architecture `/var/www/<project>` থেকে `/opt/projects/<project>` এ safe migration করে। পুরাতন folder delete হয় না; আগে backup, তারপর Docker-isolated app/db/redis, তারপর Nginx switch।

## hearth-core pilot — one-time run

```bash
cd /var/www/hearth-core-app
git pull origin main

ls -la vps/templates/scripts
ls -la vps/projects/hearth-core/scripts

export OLD_DB_HOST=127.0.0.1
export OLD_DB_PORT=5432
export OLD_DB_USER=hearth
export OLD_DB_NAME=hearth_db
export OLD_DB_PASSWORD='REAL_OLD_POSTGRES_PASSWORD_HERE'

bash /var/www/hearth-core-app/vps/projects/hearth-core/scripts/migrate-from-old.sh
```

## Nginx switch after script completes

```bash
rm -f /etc/nginx/sites-enabled/hearth-core
rm -f /etc/nginx/sites-enabled/hearth-core.conf
ln -s /etc/nginx/sites-available/hearth-core.conf /etc/nginx/sites-enabled/hearth-core.conf
certbot --nginx -d app.travelagencyweb.com -d api.travelagencyweb.com
nginx -t && systemctl reload nginx
```

## Verify

```bash
bash /opt/projects/hearth-core/scripts/healthcheck.sh
curl -I https://app.travelagencyweb.com
curl -s https://api.travelagencyweb.com/api/health
```

## Daily backup cron

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/projects/hearth-core/scripts/backup.sh >> /opt/projects/hearth-core/logs/backup.log 2>&1") | crontab -
crontab -l | grep hearth-core
```

## Normal deploy after migration

```bash
bash /opt/projects/hearth-core/scripts/deploy.sh
```

GitHub Actions also calls the same deploy script after `main` receives a push.

## Rollback

```bash
bash /opt/projects/hearth-core/scripts/rollback.sh
```

## Restore latest backup

```bash
bash /opt/projects/hearth-core/scripts/restore.sh all
```

## Cleanup old PM2 and /var/www only after 24-48h stable

```bash
mkdir -p /var/backups/www
tar -czf /var/backups/www/hearth-core-old-var-www-$(date +%Y%m%d).tar.gz /var/www/hearth-core-app
pm2 delete hearth-core-api 2>/dev/null || true
pm2 save
```

`rm -rf /var/www/hearth-core-app` শুধু তখনই চালাবেন যখন নতুন `/opt/projects/hearth-core` ১-২ দিন stable থাকে।
