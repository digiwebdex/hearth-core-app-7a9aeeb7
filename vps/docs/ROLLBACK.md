# 🆘 Emergency Rollback

## Trigger conditions
- Coolify deploy fails AND health check red > 15 min
- DNS cutover but site returns 5xx > 5 min
- Data corruption discovered post-migration

## Level 1 — Coolify-only rollback (no data loss)
Coolify UI → Application → **Deployments** tab → click previous green deployment → **Redeploy**.

## Level 2 — Restore DB from nightly backup
```bash
LATEST="$(ls -t /srv/backup/nightly | head -1)"
gunzip -c /srv/backup/nightly/${LATEST}/db/<container>.sql.gz \
  | docker exec -i <coolify-pg-container> psql -U postgres
```

## Level 3 — Restore uploads
```bash
LATEST="$(ls -t /srv/backup/nightly | head -1)"
tar -xzf /srv/backup/nightly/${LATEST}/uploads/<project>.tar.gz \
  -C /opt/projects/<project>/
```

## Level 4 — Full VPS rollback (Hostinger panel snapshot)
1. Hostinger panel → VPS → **Snapshots**
2. Select `pre-coolify-YYYYMMDD` → **Restore**
3. VPS reboots → old PM2 + nginx state restored
4. DNS already pointing to same IP → site live again
5. ⚠️ Any data created AFTER snapshot is lost — that's why nightly off-server backup is mandatory.

## Level 5 — Fresh VPS rebuild
1. Provision new VPS, same IP if possible
2. Re-run Phase 0 + Phase 1 from this repo
3. Restore latest off-server backup
