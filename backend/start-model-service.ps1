# ============================================
# RadiantClariX - Chest Model Service Starter
# ============================================
# This script starts the FastAPI server for the chest X-ray model

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RadiantClariX - Chest Model Service  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location -Path $PSScriptRoot

# Check if venv exists
if (-Not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please create it first using: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Virtual environment found" -ForegroundColor Green

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "OK: Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Check if required packages are installed
Write-Host "Checking required packages..." -ForegroundColor Yellow
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
$modelPath = ".\xray_models\chest\hf_model"
$processorPath = ".\xray_models\chest\hf_processor"

if (-Not (Test-Path $modelPath)) {
    Write-Host "ERROR: Model files not found at: $modelPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $processorPath)) {
    Write-Host "ERROR: Processor files not found at: $processorPath" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Model files found" -ForegroundColor Green
Write-Host ""

# Test model loading (optional quick test)
Write-Host "Testing model loading (optional - press Ctrl+C to skip)..." -ForegroundColor Yellow
$testResult = & python test_model.py 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Model test passed" -ForegroundColor Green
} else {
    Write-Host "WARNING: Model test failed, but continuing anyway..." -ForegroundColor Yellow
    Write-Host "   Error: $testResult" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Chest Model API Server      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start on: http://0.0.0.0:8502" -ForegroundColor Green
Write-Host "Local access: http://localhost:8502" -ForegroundColor Green
Write-Host "Network access: http://<YOUR_IP>:8502" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "   GET  /         - Health check" -ForegroundColor White
Write-Host "   GET  /health   - Detailed health status" -ForegroundColor White
Write-Host "   POST /predict  - Analyze X-ray image" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the FastAPI server
& python chest_model_api.py
