# ══════════════════════════════════════════════════════════════
# PowerShell Manual Deploy Script for Travel Agency Web
# Run from your local machine: .\deploy-powershell.ps1
# ══════════════════════════════════════════════════════════════

param(
    [string]$VpsHost = "YOUR_VPS_IP",
    [string]$SshUser = "root",
    [string]$SshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Travel Agency Web — Deploy to VPS" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Validate SSH key exists
if (-not (Test-Path $SshKeyPath)) {
    Write-Host "❌ SSH key not found at: $SshKeyPath" -ForegroundColor Red
    Write-Host "   Set -SshKeyPath parameter or place your key at the default path." -ForegroundColor Yellow
    exit 1
}

if ($VpsHost -eq "YOUR_VPS_IP") {
    Write-Host "❌ Set your VPS IP: .\deploy-powershell.ps1 -VpsHost 123.45.67.89" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Deploying to $VpsHost..." -ForegroundColor Green

$deployScript = @'
set -e
echo "═══ Pulling latest code ═══"
cd /var/www/tawss-frontend
git pull origin main

echo "═══ Building frontend ═══"
npm install
npm run build

echo "═══ Deploying backend ═══"
cd /var/www/tawss-frontend/backend

if [ ! -f .env ]; then
  echo "⚠️  Backend .env not found! Run SETUP-VPS.sh first."
  exit 1
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss

# Restart PM2
pm2 describe tawss-api > /dev/null 2>&1 && pm2 restart tawss-api || pm2 start src/index.js --name "tawss-api"
pm2 save

echo "═══ Reloading Nginx ═══"
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
'@

# Run via SSH
ssh -i $SshKeyPath -o StrictHostKeyChecking=no "$SshUser@$VpsHost" $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "   Frontend: https://travelagencyweb.com" -ForegroundColor Cyan
    Write-Host "   API:      https://api.travelagencyweb.com/api/health" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed! Check the output above." -ForegroundColor Red
}
