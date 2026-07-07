@echo off
REM ============================================
REM RadiantClariX - Model Service Starter (Batch)
REM Alternative to PowerShell script
REM ============================================

echo ========================================
echo   RadiantClariX - Chest Model Service
echo ========================================
echo.

cd /d "%~dp0"

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please create it first: python -m venv venv
    pause
    exit /b 1
)

echo [OK] Virtual environment found
echo [INFO] Activating virtual environment...

call venv\Scripts\activate.bat

echo [OK] Virtual environment activated
echo.

REM Check model files
if not exist "xray_models\chest\hf_model" (
    echo [ERROR] Model files not found!
    pause
    exit /b 1
)

echo [OK] Model files found
echo.
echo ========================================
echo   Starting Chest Model API Server
echo ========================================
echo.
echo Server: http://0.0.0.0:8502
echo Local:  http://localhost:8502
echo.
echo Press Ctrl+C to stop the server
echo.

python chest_model_api.py
