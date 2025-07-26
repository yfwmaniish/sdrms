# SDRMS Backend Startup Script
Write-Host "🚀 Starting SDRMS Backend Server..." -ForegroundColor Green

# Check if Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're in the backend directory
if (!(Test-Path "server.js")) {
    Write-Host "❌ server.js not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "🌐 Starting server on http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health check: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host "🔐 Login endpoint: POST /api/auth/login" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Green

node server.js
