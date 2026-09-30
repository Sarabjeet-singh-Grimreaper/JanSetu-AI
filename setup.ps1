# JanSetu AI - 1-Click Automated Setup for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   JanSetu AI (जनसेतु) - 1-Click Automated Setup" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js v18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

node scripts/setup.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nSetup encountered an error." -ForegroundColor Red
    exit $LASTEXITCODE
}
