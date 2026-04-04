# ══════════════════════════════════════════════════════════════
# PowerShell Manual Deploy Script for Hearth Core App
# Run from your local machine: .\deploy-powershell.ps1
# ══════════════════════════════════════════════════════════════

param(
    [string]$VpsHost = "YOUR_VPS_IP",
    [string]$SshUser = "root",
    [string]$SshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Hearth Core App — Deploy to VPS" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SshKeyPath)) {
    Write-Host "SSH key not found at: $SshKeyPath" -ForegroundColor Red
    exit 1
}

if ($VpsHost -eq "YOUR_VPS_IP") {
    Write-Host "Set your VPS IP: .\deploy-powershell.ps1 -VpsHost 123.45.67.89" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying to $VpsHost..." -ForegroundColor Green

$deployScript = @'
set -e
cd /var/www/hearth-core-app
git pull origin main

npm install
npm run build

cd /var/www/hearth-core-app/backend

if [ ! -f .env ]; then
  echo "Backend .env not found! Run SETUP-VPS.sh first."
  exit 1
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss

pm2 describe hearth-core-api > /dev/null 2>&1 && pm2 restart hearth-core-api || pm2 start src/index.js --name "hearth-core-api"
pm2 save

sudo nginx -t && sudo systemctl reload nginx

echo "Deployment complete!"
'@

ssh -i $SshKeyPath -o StrictHostKeyChecking=no "$SshUser@$VpsHost" $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "   Frontend: https://travelagencyweb.com" -ForegroundColor Cyan
    Write-Host "   API:      https://api.travelagencyweb.com/api/health" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Deployment failed! Check the output above." -ForegroundColor Red
}
