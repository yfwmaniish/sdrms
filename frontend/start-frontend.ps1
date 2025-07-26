# SDRMS Frontend Startup Script
Write-Host "🎨 Starting SDRMS Frontend Application..." -ForegroundColor Green

# Check if Node.js is available
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if we're in the frontend directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the frontend directory." -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the frontend
Write-Host "🌐 Starting React app on http://localhost:3000" -ForegroundColor Cyan
Write-Host "📱 Frontend will automatically open in your browser" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🔐 Demo Login Credentials:" -ForegroundColor Yellow
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Green

npm start
