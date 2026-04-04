#!/bin/bash
# ══════════════════════════════════════════════════════════════
# First-time VPS Setup for Hearth Core App
# Run ONCE as root on your VPS
# After this, all future deploys happen via GitHub Actions
# ══════════════════════════════════════════════════════════════
set -e

echo "══════════════════════════════════════════════"
echo "  Hearth Core App — First-Time VPS Setup"
echo "══════════════════════════════════════════════"

FRONTEND_DIR="/var/www/hearth-core-app"
BACKEND_DIR="$FRONTEND_DIR/backend"

# ── 1. Install PostgreSQL ──
echo "═══ Step 1: Installing PostgreSQL ═══"
if ! command -v psql &> /dev/null; then
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
fi
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ── 2. Create database and user ──
echo "═══ Step 2: Setting up database ═══"
DB_PASSWORD=$(openssl rand -hex 16)

# Create user or update password if user already exists
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='hearth'" | grep -q 1; then
  echo "User already exists — updating password"
  sudo -u postgres psql -c "ALTER USER hearth WITH PASSWORD '$DB_PASSWORD';"
else
  sudo -u postgres psql -c "CREATE USER hearth WITH PASSWORD '$DB_PASSWORD';"
fi

sudo -u postgres psql -c "CREATE DATABASE hearth_db OWNER hearth;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hearth_db TO hearth;"

# ── 3. Install Node.js 20 ──
echo "═══ Step 3: Installing Node.js ═══"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# ── 4. Install PM2 ──
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

# ── 5. Pull latest from GitHub ──
echo "═══ Step 5: Setting up project ═══"
if [ ! -d "$FRONTEND_DIR/.git" ]; then
  echo "ERROR: Git repo not found at $FRONTEND_DIR"
  echo "Please clone your GitHub repo first:"
  echo "  git clone https://github.com/digiwebdex/hearth-core-app.git $FRONTEND_DIR"
  echo "Then run this script again."
  exit 1
fi

cd "$FRONTEND_DIR"
git pull origin main

# ── 6. Setup backend .env ──
echo "═══ Step 6: Configuring backend ═══"
JWT_SECRET=$(openssl rand -hex 32)

cat > "$BACKEND_DIR/.env" << ENVFILE
DATABASE_URL="postgresql://hearth:${DB_PASSWORD}@localhost:5432/hearth_db"
JWT_SECRET="${JWT_SECRET}"
PORT=4000
CORS_ORIGIN="https://travelagencyweb.com"
UPLOAD_DIR="$BACKEND_DIR/uploads"
ENVFILE

mkdir -p "$BACKEND_DIR/uploads"

cd "$BACKEND_DIR"
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

# Start with PM2
pm2 delete hearth-core-api 2>/dev/null || true
pm2 start src/index.js --name "hearth-core-api"
pm2 save
pm2 startup

# ── 7. Build frontend ──
echo "═══ Step 7: Building frontend ═══"
cd "$FRONTEND_DIR"

cat > .env.production << ENVFILE
VITE_API_URL=https://api.travelagencyweb.com/api
VITE_APP_DOMAIN=travelagencyweb.com
ENVFILE

npm install
npm run build

# ── 8. Nginx ──
echo "═══ Step 8: Configuring Nginx ═══"
sudo cp "$FRONTEND_DIR/nginx.conf" /etc/nginx/sites-available/hearth-core
sudo ln -sf /etc/nginx/sites-available/hearth-core /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── 9. SSL (if not already done) ──
if [ ! -d "/etc/letsencrypt/live/travelagencyweb.com" ]; then
  echo "═══ Step 9: Setting up SSL ═══"
  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d travelagencyweb.com -d www.travelagencyweb.com -d api.travelagencyweb.com --non-interactive --agree-tos --register-unsafely-without-email --redirect
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "══════════════════════════════════════════════"
echo ""
echo "  Frontend: https://travelagencyweb.com"
echo "  API:      https://api.travelagencyweb.com/api/health"
echo ""
echo "  Super Admin: admin@skyline.dev / admin123"
echo "  Demo User:   user@demo.com / demo123"
echo ""
echo "  DB Password: $DB_PASSWORD"
echo "  JWT Secret:  $JWT_SECRET"
echo ""
echo "  SAVE THESE CREDENTIALS SECURELY!"
echo "══════════════════════════════════════════════"
