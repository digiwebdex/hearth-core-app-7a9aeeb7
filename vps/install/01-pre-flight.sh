#!/usr/bin/env bash
# =============================================================================
# Phase 0 — Pre-flight: Full VPS backup + PM2 process freeze
# Run as: sudo bash vps/install/01-pre-flight.sh
# Idempotent — safe to re-run.
# =============================================================================
set -euo pipefail

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="/srv/backup/pre-coolify-${STAMP}"
LOG="${BACKUP_ROOT}/preflight.log"

mkdir -p "${BACKUP_ROOT}/www" "${BACKUP_ROOT}/db" "${BACKUP_ROOT}/pm2" "${BACKUP_ROOT}/nginx" "${BACKUP_ROOT}/etc"
exec > >(tee -a "${LOG}") 2>&1

echo "════════════════════════════════════════════════════════════════"
echo "🔒 PHASE 0 — PRE-FLIGHT BACKUP — ${STAMP}"
echo "📁 Backup root: ${BACKUP_ROOT}"
echo "════════════════════════════════════════════════════════════════"

# ----------------------------------------------------------------------------
# 1) Disk + system snapshot info
# ----------------------------------------------------------------------------
echo ""
echo "═══ [1/7] System inventory ═══"
{
  echo "Hostname: $(hostname)"
  echo "Kernel:   $(uname -a)"
  echo "OS:       $(. /etc/os-release && echo "$PRETTY_NAME")"
  echo "Date:     $(date)"
  df -hT
  free -h
  echo ""
  echo "── listening ports ──"
  ss -tlnp 2>/dev/null || netstat -tlnp
} > "${BACKUP_ROOT}/system-info.txt"

# ----------------------------------------------------------------------------
# 2) PM2 dump
# ----------------------------------------------------------------------------
echo ""
echo "═══ [2/7] PM2 snapshot ═══"
if command -v pm2 >/dev/null 2>&1; then
  pm2 jlist > "${BACKUP_ROOT}/pm2/processes.json" || true
  pm2 list   > "${BACKUP_ROOT}/pm2/list.txt"      || true
  pm2 save || true
  cp -a /root/.pm2/dump.pm2       "${BACKUP_ROOT}/pm2/" 2>/dev/null || true
  cp -a /root/.pm2/ecosystem.config.* "${BACKUP_ROOT}/pm2/" 2>/dev/null || true
  cp -a /root/.pm2/logs           "${BACKUP_ROOT}/pm2/" 2>/dev/null || true
  echo "✅ PM2 snapshot saved"
else
  echo "⚠️  pm2 not installed — skipping"
fi

# ----------------------------------------------------------------------------
# 3) PostgreSQL dump (all databases, host postgres)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [3/7] PostgreSQL dump (all databases) ═══"
if command -v pg_dumpall >/dev/null 2>&1 && systemctl is-active --quiet postgresql; then
  sudo -u postgres pg_dumpall --clean --if-exists \
    | gzip -9 > "${BACKUP_ROOT}/db/pg_dumpall.sql.gz"
  echo "✅ pg_dumpall → $(du -h "${BACKUP_ROOT}/db/pg_dumpall.sql.gz" | cut -f1)"

  # Per-database dump (easier to restore individually)
  for DB in $(sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate=false AND datname NOT IN ('postgres');"); do
    echo "  → dumping ${DB}"
    sudo -u postgres pg_dump -Fc "${DB}" \
      > "${BACKUP_ROOT}/db/${DB}.dump" 2>/dev/null || echo "    ⚠️  failed: ${DB}"
  done
else
  echo "⚠️  PostgreSQL not running on host — skipping"
fi

# ----------------------------------------------------------------------------
# 4) MySQL/MariaDB dump (if any)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [4/7] MySQL/MariaDB dump ═══"
if command -v mysqldump >/dev/null 2>&1 && systemctl is-active --quiet mysql 2>/dev/null; then
  mysqldump --all-databases --single-transaction --routines --triggers --events \
    | gzip -9 > "${BACKUP_ROOT}/db/mysql-all.sql.gz" 2>/dev/null \
    && echo "✅ mysqldump saved" || echo "⚠️  mysqldump failed (need root pwd?)"
else
  echo "ℹ️  MySQL not running — skipping"
fi

# ----------------------------------------------------------------------------
# 5) /var/www tarball (all project source + uploads)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [5/7] /var/www tarball ═══"
if [ -d /var/www ]; then
  tar --ignore-failed-read -czf "${BACKUP_ROOT}/www/var-www.tar.gz" \
      --exclude='*/node_modules' \
      --exclude='*/.next' \
      --exclude='*/dist/assets' \
      --exclude='*/.cache' \
      -C / var/www 2>"${BACKUP_ROOT}/www/tar-warnings.log" || true
  echo "✅ /var/www → $(du -h "${BACKUP_ROOT}/www/var-www.tar.gz" | cut -f1)"

  # Separate uploads tarball (full, no excludes) per project
  for d in /var/www/*/; do
    name="$(basename "$d")"
    for uploads in "${d}uploads" "${d}backend/uploads" "${d}public/uploads" "${d}storage"; do
      if [ -d "$uploads" ]; then
        echo "  → uploads: ${name} (${uploads})"
        tar -czf "${BACKUP_ROOT}/www/${name}-uploads.tar.gz" -C "$(dirname "$uploads")" "$(basename "$uploads")" 2>/dev/null || true
      fi
    done
  done
else
  echo "ℹ️  /var/www does not exist"
fi

# ----------------------------------------------------------------------------
# 6) Nginx + system configs
# ----------------------------------------------------------------------------
echo ""
echo "═══ [6/7] Nginx + system configs ═══"
[ -d /etc/nginx ]         && cp -a /etc/nginx          "${BACKUP_ROOT}/nginx/"
[ -d /etc/letsencrypt ]   && cp -a /etc/letsencrypt    "${BACKUP_ROOT}/etc/"
[ -f /etc/hosts ]         && cp -a /etc/hosts          "${BACKUP_ROOT}/etc/"
[ -d /etc/cron.d ]        && cp -a /etc/cron.d         "${BACKUP_ROOT}/etc/"
[ -d /etc/systemd/system ]&& cp -a /etc/systemd/system "${BACKUP_ROOT}/etc/"
crontab -l > "${BACKUP_ROOT}/etc/root-crontab.txt" 2>/dev/null || true
echo "✅ configs saved"

# ----------------------------------------------------------------------------
# 7) Final manifest + verification
# ----------------------------------------------------------------------------
echo ""
echo "═══ [7/7] Manifest ═══"
(cd "${BACKUP_ROOT}" && find . -type f -exec sha256sum {} \;) > "${BACKUP_ROOT}/MANIFEST.sha256"
TOTAL="$(du -sh "${BACKUP_ROOT}" | cut -f1)"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ PRE-FLIGHT COMPLETE"
echo "📦 Total backup size: ${TOTAL}"
echo "📁 Location:          ${BACKUP_ROOT}"
echo ""
echo "⚠️  IMPORTANT — DO NOT proceed to Phase 1 until you have:"
echo "    1) Downloaded ${BACKUP_ROOT} off-server (rsync / scp)"
echo "    2) Created a Hostinger panel snapshot of the VPS"
echo "    3) Verified you can restore the snapshot"
echo ""
echo "Off-server copy example (run from your LOCAL machine):"
echo "    rsync -avzP root@$(hostname -I | awk '{print $1}'):${BACKUP_ROOT} ~/vps-backups/"
echo "════════════════════════════════════════════════════════════════"
