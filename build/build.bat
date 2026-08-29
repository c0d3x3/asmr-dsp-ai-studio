@echo off
setlocal enabledelayedexpansion

REM Set working directory to repository root
cd /d "%~dp0\.."

echo ===================================================================
echo   ASMR-DSP Windows 11 Build Script
echo   Building standalone ASMR-DSP.exe and Installer
echo ===================================================================

REM Check Python environment
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH. Please run this inside Anaconda Prompt or add Python to PATH.
    pause
    exit /b 1
)

echo [1/4] Installing / Verifying Python dependencies...
pip install -r requirements.txt

echo [2/4] Running automated test suite...
python tests/run_tests.py
if %errorlevel% neq 0 (
    echo [ERROR] Unit tests failed. Aborting build.
    pause
    exit /b 1
)

echo [3/4] Packaging standalone ASMR-DSP.exe with PyInstaller...
pyinstaller --noconfirm --log-level=WARN build/asmr_dsp.spec

if not exist "dist\ASMR-DSP\ASMR-DSP.exe" (
    echo [ERROR] PyInstaller output not found in dist\ASMR-DSP\
    pause
    exit /b 1
)

echo [4/4] Executable build complete: dist\ASMR-DSP\ASMR-DSP.exe

REM Optional Inno Setup compilation if ISCC is installed
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" (
    echo [INFO] Inno Setup 6 detected. Compiling installer...
    "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" build\installer.iss
    echo [SUCCESS] Installer generated: dist\ASMR-DSP-Setup.exe
) else (
    echo [INFO] Inno Setup 6 not found in standard path. Skipping installer packaging.
    echo Standalone executable is available at: dist\ASMR-DSP\ASMR-DSP.exe
)

echo ===================================================================
echo   Build Successful!
echo ===================================================================
pause
