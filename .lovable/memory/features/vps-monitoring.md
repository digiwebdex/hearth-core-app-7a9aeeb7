---
name: VPS Monitoring & Telegram Alerts
description: Health check + auto PM2 restart + Telegram alerts for 14 sites on srv1468666
type: feature
---

## Setup on srv1468666 (Hostinger VPS)

**Script:** `/opt/scripts/healthcheck.sh` (runs every 5 min via root crontab)
**Config:** `/opt/scripts/sites.conf` — format `pm2_app|url|expected_codes|restart(yes/no)`
- Multi-code supported: `200,302`
**Telegram creds:** `/opt/scripts/telegram.env` (chmod 600)
- Bot: `@hostinger_vps_alart_bot` (token 8686885907:...)
- Chat ID: 5282513309 (Iqbal Hossain)
**State dir:** `/var/lib/site-health-state/` — anti-spam (alerts only on UP↔DOWN transitions)
**Logs:** `/var/log/site-health.log` (all) + `/var/log/site-health-alerts.log` (DOWN/RECOVERED only)

## Behavior
- DOWN → `pm2 restart <name>` (if yes) + 🚨 Telegram alert (only first time)
- UP after DOWN → ✅ RECOVERED Telegram alert
- Repeated DOWN → no spam

## Archived (do NOT re-enable)
- `/root/vps-system/bin/health-alert.sh.OLD-DISABLED`
- `/root/vps-system/bin/health-check.sh.OLD-DISABLED`
