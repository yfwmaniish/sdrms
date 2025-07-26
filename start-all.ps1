# SDRMS Complete System Startup Script
Write-Host "🚀 SDRMS - Subscriber Data Record Management System" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""

# Check if MongoDB and backend requirements are met
Write-Host "🔍 Checking system requirements..." -ForegroundColor Yellow

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js is available" -ForegroundColor Green

# Check if we're in the correct directory
$rootDir = Get-Location
if (!(Test-Path "backend") -or !(Test-Path "frontend")) {
    Write-Host "❌ Please run this script from the sdrms root directory" -ForegroundColor Red
    Write-Host "Expected structure: sdrms/backend and sdrms/frontend" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directory structure is correct" -ForegroundColor Green
Write-Host ""

# Function to start services in new windows
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Directory,
        [string]$Command,
        [string]$Arguments
    )
    
    Write-Host "🚀 Starting $ServiceName..." -ForegroundColor Cyan
    
    $scriptBlock = {
        param($dir, $cmd, $args)
        Set-Location $dir
        & $cmd $args
    }
    
    $commandString = "Set-Location '$Directory'; & $Command $Arguments"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $commandString -WindowStyle Normal
}

Write-Host "📋 Starting SDRMS Services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend Server
Write-Host "1️⃣ Starting Backend Server (Port 3001)..." -ForegroundColor Cyan
Start-Service -ServiceName "Backend Server" -Directory "$rootDir\backend" -Command "node" -Arguments "server.js"

# Wait a moment for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend Application  
Write-Host "2️⃣ Starting Frontend Application (Port 3000)..." -ForegroundColor Cyan
Start-Service -ServiceName "Frontend App" -Directory "$rootDir\frontend" -Command "npm" -Arguments "start"

Write-Host ""
Write-Host "🎉 SDRMS System Started Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Demo Login Credentials:" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "   • Both services will open in separate PowerShell windows" -ForegroundColor White
Write-Host "   • The frontend will automatically open in your browser" -ForegroundColor White
Write-Host "   • Use Ctrl+C in each window to stop the respective service" -ForegroundColor White
Write-Host "   • Make sure MongoDB and OpenSearch containers are running" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
