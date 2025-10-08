@echo off
title EcoScrapPickup Simulation Launcher
echo ================================================================
echo   🤖 EcoScrapPickup Simulation Launcher for Windows
echo ================================================================
echo.

echo 📋 This script will help you start the simulation server
echo.

echo 🔍 Checking Python installation...
python --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python and make sure it's in your PATH
    pause
    exit /b 1
) else (
    echo ✅ Python is available
)

echo.
echo 📦 Installing/checking required packages...
pip install flask requests > nul 2>&1
if errorlevel 1 (
    echo ⚠️ Warning: Could not install packages automatically
    echo Please run: pip install flask requests
)

echo.
echo 🎮 IMPORTANT: Make sure CoppeliaSim is running with your scene loaded!
echo Press any key when CoppeliaSim is ready, or Ctrl+C to cancel...
pause > nul

echo.
echo 🚀 Starting simulation server...
python start_simulation.py

echo.
echo 📋 Simulation server has stopped
pause