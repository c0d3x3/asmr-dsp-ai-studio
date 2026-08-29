@echo off
setlocal enabledelayedexpansion

REM Set working directory to repository root
cd /d "%~dp0\.."

echo ===================================================================
echo   ASMR-DSP Windows 11 Build Script
echo   Building standalone ASMR-DSP.exe and Installer
echo ===================================================================

REM 1. Verify Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM 2. Install / Verify dependencies
echo [1/4] Installing Python requirements...
python -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed to install. Continuing...
)

REM 3. Run Automated Tests
echo [2/4] Running automated DSP and safety tests...
python tests/run_tests.py
if %errorlevel% neq 0 (
    echo [ERROR] Unit tests failed! Aborting build.
    pause
    exit /b 1
)

REM 4. Build Standalone Executable via PyInstaller
echo [3/4] Building standalone executable with PyInstaller...
pyinstaller --clean --noconfirm build/asmr_dsp.spec
if %errorlevel% neq 0 (
    echo [ERROR] PyInstaller build failed.
    pause
    exit /b 1
)

echo [OK] Standalone executable created at dist\ASMR-DSP\ASMR-DSP.exe

REM 5. Compile Inno Setup Installer (if Inno Setup is installed)
echo [4/4] Checking for Inno Setup 6 compiler...
set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"

if exist "%ISCC%" (
    echo Compiling Windows Installer with Inno Setup...
    "%ISCC%" build\installer.iss
    if %errorlevel% equ 0 (
        echo [OK] Windows installer built successfully at dist\ASMR-DSP-Setup.exe
    ) else (
        echo [WARNING] Inno Setup compilation failed. Standalone folder is still available.
    )
) else (
    echo [INFO] Inno Setup 6 not found. Standalone executable is available at:
    echo        dist\ASMR-DSP\ASMR-DSP.exe
)

echo.
echo ===================================================================
echo   Build Complete!
echo ===================================================================
pause
