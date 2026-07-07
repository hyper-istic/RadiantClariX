# ============================================
# RadiantClariX - Complete Service Starter
# ============================================
# This script starts both the Node.js backend AND the Python AI model service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    RadiantClariX Service Launcher     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location -Path $PSScriptRoot

# ============================================
# Step 1: Start Node.js Backend Server
# ============================================
Write-Host "Step 1: Starting Node.js Backend Server..." -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path ".\node_modules")) {
    Write-Host "WARNING: node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install Node.js dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "OK: Node.js dependencies ready" -ForegroundColor Green
Write-Host ""

# Start Node.js server in new window
Write-Host "Starting Node.js server on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; node server.js"

Write-Host "OK: Node.js server started in new window" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 2

# ============================================
# Step 2: Start Python AI Model Service
# ============================================
Write-Host "Step 2: Starting Python AI Model Service..." -ForegroundColor Yellow
Write-Host ""

# Check if venv exists
if (-Not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "OK: Virtual environment created" -ForegroundColor Green
}

Write-Host "OK: Virtual environment found" -ForegroundColor Green

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "OK: Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Check if required packages are installed
Write-Host "Checking required Python packages..." -ForegroundColor Yellow
$packages = @("fastapi", "uvicorn", "transformers", "torch", "pillow")
$missing = @()

foreach ($pkg in $packages) {
    $installed = & python -c "import $pkg" 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missing += $pkg
    }
}

if ($missing.Count -gt 0) {
    Write-Host "WARNING: Missing packages: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Installing required packages..." -ForegroundColor Yellow
    & pip install fastapi uvicorn transformers torch pillow python-multipart
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install packages" -ForegroundColor Red
        exit 1
    }
}

Write-Host "OK: All required packages installed" -ForegroundColor Green
Write-Host ""

# Check if model files exist
Write-Host "Checking model files..." -ForegroundColor Yellow
$chestModelPath = ".\xray_models\chest\hf_model"
$chestProcessorPath = ".\xray_models\chest\hf_processor"
$bonesModelPath = ".\xray_models\bones\resnet.pt"

if (-Not (Test-Path $chestModelPath)) {
    Write-Host "ERROR: Chest model files not found at: $chestModelPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $chestProcessorPath)) {
    Write-Host "ERROR: Chest processor files not found at: $chestProcessorPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $bonesModelPath)) {
    Write-Host "ERROR: Bones model file not found at: $bonesModelPath" -ForegroundColor Red
    exit 1
}

Write-Host "OK: All model files found (Chest + Bones)" -ForegroundColor Green
Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         SERVICES READY          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OK: Node.js Backend: http://localhost:5000" -ForegroundColor Green
Write-Host "OK: Chest AI Model:  http://localhost:8502" -ForegroundColor Green
Write-Host "OK: Bones AI Model:  http://localhost:8503" -ForegroundColor Green
Write-Host ""
Write-Host "Available Endpoints:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Node.js Backend (Port 5000):" -ForegroundColor White
Write-Host "   - GET  /                  - Health check" -ForegroundColor Gray
Write-Host "   - POST /api/auth/*        - Authentication" -ForegroundColor Gray
Write-Host "   - POST /api/user/*        - User management" -ForegroundColor Gray
Write-Host "   - POST /api/scan-history  - Scan history" -ForegroundColor Gray
Write-Host ""
Write-Host "   Chest AI Model (Port 8502):" -ForegroundColor White
Write-Host "   - GET  /              - Health check" -ForegroundColor Gray
Write-Host "   - GET  /health        - Model status" -ForegroundColor Gray
Write-Host "   - POST /predict       - Analyze chest X-ray" -ForegroundColor Gray
Write-Host ""
Write-Host "   Bones AI Model (Port 8503):" -ForegroundColor White
Write-Host "   - GET  /              - Health check" -ForegroundColor Gray
Write-Host "   - GET  /health        - Model status" -ForegroundColor Gray
Write-Host "   - POST /predict       - Detect bone fractures" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update MODEL_API_URL in services/api.js with your IP" -ForegroundColor White
Write-Host "   2. Make sure your mobile device is on the same WiFi" -ForegroundColor White
Write-Host "   3. Start your React Native app: npm start or expo start" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: Press Ctrl+C in this window to stop all AI Model services" -ForegroundColor Yellow
Write-Host "WARNING: Close the Node.js window to stop the backend server" -ForegroundColor Yellow
Write-Host ""

# Start both AI model servers in parallel using Start-Job
Write-Host "Starting AI Model services..." -ForegroundColor Yellow
Write-Host ""

# Start Chest Model
$chestJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location $scriptPath
    & "$scriptPath\venv\Scripts\python.exe" "$scriptPath\chest_model_api.py"
} -ArgumentList $PSScriptRoot

Write-Host "OK: Chest Model service starting (Port 8502)..." -ForegroundColor Green

# Start Bones Model
$bonesJob = Start-Job -ScriptBlock {
    param($scriptPath)
    Set-Location $scriptPath
    & "$scriptPath\venv\Scripts\python.exe" "$scriptPath\bones_model_api.py"
} -ArgumentList $PSScriptRoot

Write-Host "OK: Bones Model service starting (Port 8503)..." -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for models to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

# Monitor both jobs and display output
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI MODELS RUNNING - PRESS CTRL+C TO STOP  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        # Check if jobs are still running
        if ($chestJob.State -ne "Running" -and $bonesJob.State -ne "Running") {
            Write-Host "ERROR: Both model services stopped unexpectedly" -ForegroundColor Red
            break
        }
        
        # Receive output from both jobs
        Receive-Job -Job $chestJob -ErrorAction SilentlyContinue
        Receive-Job -Job $bonesJob -ErrorAction SilentlyContinue
        
        Start-Sleep -Milliseconds 500
    }
}
finally {
    # Cleanup: Stop both jobs
    Write-Host ""
    Write-Host "Stopping AI Model services..." -ForegroundColor Yellow
    Stop-Job -Job $chestJob -ErrorAction SilentlyContinue
    Stop-Job -Job $bonesJob -ErrorAction SilentlyContinue
    Remove-Job -Job $chestJob -ErrorAction SilentlyContinue
    Remove-Job -Job $bonesJob -ErrorAction SilentlyContinue
    Write-Host "OK: All AI Model services stopped" -ForegroundColor Green
}
