#!/bin/bash
# ══════════════════════════════════════════════════
# VPS Manual Deploy Script for Hearth Core App
# Run on your VPS: bash deploy.sh
# ══════════════════════════════════════════════════

set -e

APP_DIR="/var/www/hearth-core-app"
BACKEND_DIR="$APP_DIR/backend"

echo "═══ Step 1: Pull latest code ═══"
cd "$APP_DIR"
git pull origin main

echo "═══ Step 2: Ensure build env ═══"
if [ ! -f .env.production ]; then
  cat > .env.production << 'EOF'
VITE_API_URL=https://api.travelagencyweb.com/api
VITE_APP_DOMAIN=travelagencyweb.com
EOF
  echo "✅ Created .env.production"
fi

echo "═══ Step 3: Build frontend ═══"
npm install
npm run build

echo "═══ Step 3: Deploy backend ═══"
cd "$BACKEND_DIR"

if [ ! -f .env ]; then
  echo "⚠️  Backend .env not found! Run SETUP-VPS.sh first."
  exit 1
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss

pm2 describe hearth-core-api > /dev/null 2>&1 && pm2 restart hearth-core-api || pm2 start src/index.js --name "hearth-core-api"
pm2 save

echo "═══ Step 4: Reload Nginx ═══"
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
echo "   Frontend: https://travelagencyweb.com"
echo "   API:      https://api.travelagencyweb.com/api/health"
