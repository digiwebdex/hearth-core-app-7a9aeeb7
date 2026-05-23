#!/usr/bin/env bash
# =============================================================================
# Phase 0 — Install Coolify + firewall + persistent storage tree
# Run as: sudo bash vps/install/02-install-coolify.sh
# Prereq: 01-pre-flight.sh completed AND backup downloaded off-server
# =============================================================================
set -euo pipefail

echo "════════════════════════════════════════════════════════════════"
echo "🚀 INSTALLING COOLIFY + INFRASTRUCTURE"
echo "════════════════════════════════════════════════════════════════"

# ----------------------------------------------------------------------------
# 0) Safety check — must have a recent backup
# ----------------------------------------------------------------------------
LATEST_BACKUP="$(ls -dt /srv/backup/pre-coolify-* 2>/dev/null | head -1 || true)"
if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No pre-coolify backup found in /srv/backup/"
  echo "   Run vps/install/01-pre-flight.sh first."
  exit 1
fi
echo "✅ Found backup: ${LATEST_BACKUP}"

# ----------------------------------------------------------------------------
# 1) Stop & disable host nginx (Coolify Traefik will take 80/443)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [1/6] Stopping host nginx (Traefik takes over) ═══"
if systemctl is-active --quiet nginx; then
  systemctl stop nginx
  systemctl disable nginx
  echo "✅ nginx stopped + disabled"
else
  echo "ℹ️  nginx already stopped"
fi

# Stop apache2 too if present
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true

# ----------------------------------------------------------------------------
# 2) Stop all PM2 processes (we backed up state in phase 0)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [2/6] Stopping PM2 processes ═══"
if command -v pm2 >/dev/null 2>&1; then
  pm2 save || true
  pm2 stop all || true
  pm2 kill   || true
  systemctl disable pm2-root 2>/dev/null || true
  echo "✅ PM2 stopped (state saved earlier)"
fi

# ----------------------------------------------------------------------------
# 3) Persistent storage tree
# ----------------------------------------------------------------------------
echo ""
echo "═══ [3/6] Creating /opt/projects + /srv/backup tree ═══"
mkdir -p /opt/projects
mkdir -p /srv/backup/{db,uploads,offsite}
mkdir -p /srv/archive
chmod 755 /opt/projects /srv/backup /srv/archive
echo "✅ storage tree ready"

# ----------------------------------------------------------------------------
# 4) Firewall (UFW)
# ----------------------------------------------------------------------------
echo ""
echo "═══ [4/6] Firewall (UFW) ═══"
if ! command -v ufw >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y ufw
fi
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    comment 'SSH'
ufw allow 80/tcp    comment 'HTTP (Traefik)'
ufw allow 443/tcp   comment 'HTTPS (Traefik)'
ufw allow 8000/tcp  comment 'Coolify admin'
ufw allow 6001/tcp  comment 'Coolify realtime'
ufw --force enable
ufw status verbose
echo "✅ firewall active"

# ----------------------------------------------------------------------------
# 5) Install Coolify
# ----------------------------------------------------------------------------
echo ""
echo "═══ [5/6] Installing Coolify ═══"
if [ -d /data/coolify ]; then
  echo "ℹ️  Coolify already installed at /data/coolify"
else
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
fi

# ----------------------------------------------------------------------------
# 6) Done — show admin URL
# ----------------------------------------------------------------------------
IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ COOLIFY INSTALLED"
echo ""
echo "🌐 Admin UI:  http://${IP}:8000"
echo "🔑 First visit will prompt you to create the root admin account."
echo ""
echo "Next steps:"
echo "  1) Open http://${IP}:8000 in browser, create admin account."
echo "  2) In Coolify → Servers → 'localhost' should already be connected."
echo "  3) Run: sudo bash vps/projects/hearth-core/migrate.sh"
echo "════════════════════════════════════════════════════════════════"
