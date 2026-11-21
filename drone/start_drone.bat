@echo off
REM ============================================================
REM  EcoScrap Drone Bridge — Windows Startup Script
REM  Run this BEFORE starting the main EcoScrap backend
REM ============================================================

echo.
echo ========================================
echo   EcoScrap Drone Bridge Server
echo ========================================
echo.

REM Check Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.9+ and add to PATH.
    pause
    exit /b 1
)

REM Navigate to drone directory
cd /d "%~dp0"

REM Install dependencies if needed
echo [1/3] Checking Python dependencies...
pip install -r requirements_drone.txt -q
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo       Dependencies OK.

REM Show configuration
echo.
echo [2/3] Configuration:
echo       Serial Port : Check config.py - DRONE_SERIAL_PORT
echo       Bridge URL  : http://localhost:5003
echo       Sim URL     : http://localhost:5002  (if using CoppeliaSim)
echo.
echo       Make sure:
echo         1. Ground Unit ESP32 is plugged into PC via USB-C
echo         2. Air Unit ESP32 is powered on the drone
echo         3. Both ESP32 MAC addresses are correctly configured
echo         4. Flight Controller is powered and GPS has fix
echo.

REM Start drone bridge server
echo [3/3] Starting Drone Bridge Server...
echo.
python drone_bridge_server.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Drone bridge server stopped unexpectedly.
    echo         Check the error above. Common issues:
    echo         - Wrong COM port in config.py
    echo         - Ground ESP32 not connected
    echo         - Port 5003 already in use
    pause
)
