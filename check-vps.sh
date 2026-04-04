#!/bin/bash
# ══════════════════════════════════════════════════════════════
# VPS Pre-Deployment Diagnostic Script
# Run on your VPS: bash check-vps.sh
# ══════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Hearth Core App — VPS Diagnostic Report         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2)"
echo ""

# ── 1. System Resources ──
echo "═══ 1. SYSTEM RESOURCES ═══"
echo "CPU Cores: $(nproc)"
echo "RAM: $(free -h | awk '/Mem:/ {print $2 " total, " $3 " used, " $7 " available"}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $2 " total, " $3 " used, " $4 " free (" $5 " used)"}')"
echo ""

# ── 2. Software Versions ──
echo "═══ 2. INSTALLED SOFTWARE ═══"
for cmd in node npm npx pm2 nginx git psql certbot docker; do
  if command -v $cmd &> /dev/null; then
    ver=$($cmd --version 2>/dev/null | head -1)
    echo "  ✅ $cmd → $ver"
  else
    echo "  ❌ $cmd → NOT INSTALLED"
  fi
done
echo ""

# ── 3. Port Scan ──
echo "═══ 3. PORT USAGE ═══"
echo "  Checking ports commonly used for web apps..."
echo ""
printf "  %-8s %-12s %s\n" "PORT" "STATUS" "PROCESS"
printf "  %-8s %-12s %s\n" "────" "──────" "───────"
for port in 80 443 3000 3001 3002 4000 4001 4173 5000 5432 8080 8443; do
  proc=$(ss -tlnp 2>/dev/null | grep ":${port} " | awk '{print $NF}' | sed 's/.*"\(.*\)".*/\1/' | head -1)
  if [ -n "$proc" ]; then
    printf "  %-8s %-12s %s\n" "$port" "🔴 IN USE" "$proc"
  else
    printf "  %-8s %-12s %s\n" "$port" "🟢 FREE" "-"
  fi
done
echo ""

# ── 4. Nginx Sites ──
echo "═══ 4. NGINX CONFIGURATION ═══"
if command -v nginx &> /dev/null; then
  echo "  Nginx status: $(systemctl is-active nginx 2>/dev/null || echo 'unknown')"
  echo ""
  echo "  Enabled sites:"
  if [ -d /etc/nginx/sites-enabled ]; then
    for site in /etc/nginx/sites-enabled/*; do
      if [ -f "$site" ]; then
        domains=$(grep -oP 'server_name\s+\K[^;]+' "$site" 2>/dev/null | head -3)
        echo "    → $(basename $site): $domains"
      fi
    done
  else
    echo "    (no sites-enabled directory)"
  fi
  echo ""
  echo "  Available sites:"
  if [ -d /etc/nginx/sites-available ]; then
    ls -1 /etc/nginx/sites-available/ 2>/dev/null | while read f; do echo "    → $f"; done
  fi
else
  echo "  Nginx not installed"
fi
echo ""

# ── 5. PM2 Processes ──
echo "═══ 5. PM2 RUNNING PROCESSES ═══"
if command -v pm2 &> /dev/null; then
  pm2 list 2>/dev/null || echo "  No PM2 processes"
else
  echo "  PM2 not installed"
fi
echo ""

# ── 6. Docker Containers ──
echo "═══ 6. DOCKER CONTAINERS ═══"
if command -v docker &> /dev/null; then
  docker ps --format "  {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null || echo "  Docker not running or no permissions"
else
  echo "  Docker not installed (that's fine)"
fi
echo ""

# ── 7. PostgreSQL ──
echo "═══ 7. POSTGRESQL ═══"
if command -v psql &> /dev/null; then
  echo "  Version: $(psql --version 2>/dev/null)"
  echo "  Status: $(systemctl is-active postgresql 2>/dev/null || echo 'unknown')"
  echo "  Databases:"
  sudo -u postgres psql -lt 2>/dev/null | grep -v template | grep -v "^$" | awk '{print "    → " $1}' | head -10
else
  echo "  PostgreSQL not installed"
fi
echo ""

# ── 8. Existing web projects ──
echo "═══ 8. WEB DIRECTORIES ═══"
for dir in /var/www /home/*/public_html /srv/www; do
  if [ -d "$dir" ]; then
    echo "  $dir/:"
    ls -1 "$dir" 2>/dev/null | while read d; do
      if [ -d "$dir/$d" ]; then
        echo "    📁 $d"
      fi
    done
  fi
done
echo ""

# ── 9. SSL Certificates ──
echo "═══ 9. SSL CERTIFICATES ═══"
if [ -d /etc/letsencrypt/live ]; then
  for cert_dir in /etc/letsencrypt/live/*/; do
    domain=$(basename "$cert_dir")
    if [ "$domain" != "README" ]; then
      expiry=$(openssl x509 -enddate -noout -in "${cert_dir}fullchain.pem" 2>/dev/null | cut -d= -f2)
      echo "  🔒 $domain → expires: $expiry"
    fi
  done
else
  echo "  No Let's Encrypt certificates found"
fi
echo ""

# ── 10. Recommended free port ──
echo "═══ 10. RECOMMENDATION ═══"
SUGGESTED=""
for port in 4000 4001 3001 3002 5000; do
  if ! ss -tlnp 2>/dev/null | grep -q ":${port} "; then
    SUGGESTED=$port
    break
  fi
done
if [ -n "$SUGGESTED" ]; then
  echo "  ✅ Suggested backend port: $SUGGESTED"
else
  echo "  ⚠️  All common ports in use. Check higher ports (5001+)"
fi
echo ""
echo "═══ DONE ═══"
echo "Copy the output above and share it with Lovable so I can"
echo "generate the exact deployment config for your VPS."
