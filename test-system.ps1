# SDRMS System Health Check Script
Write-Host "🔍 SDRMS System Health Check" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds = 5
    )
    
    Write-Host "Testing $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ OK" -ForegroundColor Green
            return $true
        } else {
            Write-Host " ❌ Failed (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " ❌ Failed (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Function to test authentication
function Test-Authentication {
    Write-Host "Testing Authentication..." -ForegroundColor Yellow -NoNewline
    
    try {
        $body = @{
            login = "admin"
            password = "admin123"
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -Headers $headers -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            $responseData = $response.Content | ConvertFrom-Json
            if ($responseData.success) {
                Write-Host " ✅ OK" -ForegroundColor Green
                return $true
            } else {
                Write-Host " ❌ Failed (Login unsuccessful)" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host " ❌ Failed (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " ❌ Failed (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Test Backend Health
Write-Host "📊 Backend Health Check:" -ForegroundColor Cyan
$backendHealth = Test-Endpoint -Name "Backend Health" -Url "http://localhost:3001/health"

# Test Frontend
Write-Host ""
Write-Host "🎨 Frontend Check:" -ForegroundColor Cyan
$frontendHealth = Test-Endpoint -Name "Frontend App" -Url "http://localhost:3000"

# Test Authentication if backend is running
Write-Host ""
Write-Host "🔐 Authentication Check:" -ForegroundColor Cyan
if ($backendHealth) {
    $authHealth = Test-Authentication
} else {
    Write-Host "Authentication Test Skipped (Backend not available)" -ForegroundColor Yellow
    $authHealth = $false
}

# Summary
Write-Host ""
Write-Host "📋 System Status Summary:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Backend Server: " -NoNewline
if ($backendHealth) { Write-Host "✅ Running" -ForegroundColor Green } else { Write-Host "❌ Not Running" -ForegroundColor Red }

Write-Host "Frontend App:   " -NoNewline
if ($frontendHealth) { Write-Host "✅ Running" -ForegroundColor Green } else { Write-Host "❌ Not Running" -ForegroundColor Red }

Write-Host "Authentication: " -NoNewline
if ($authHealth) { Write-Host "✅ Working" -ForegroundColor Green } else { Write-Host "❌ Not Working" -ForegroundColor Red }

Write-Host ""

if ($backendHealth -and $frontendHealth -and $authHealth) {
    Write-Host "🎉 All systems are operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access your application:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 Login with:" -ForegroundColor Yellow
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
} else {
    Write-Host "⚠️ Some services are not running properly." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    
    if (-not $backendHealth) {
        Write-Host "   • Start backend: cd backend && node server.js" -ForegroundColor White
        Write-Host "   • Check MongoDB is running" -ForegroundColor White
    }
    
    if (-not $frontendHealth) {
        Write-Host "   • Start frontend: cd frontend && npm start" -ForegroundColor White
        Write-Host "   • Check if port 3000 is available" -ForegroundColor White
    }
    
    if (-not $authHealth -and $backendHealth) {
        Write-Host "   • Check database initialization" -ForegroundColor White
        Write-Host "   • Run: cd backend && node initUnifiedData.js" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
