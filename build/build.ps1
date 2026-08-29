# ASMR-DSP PowerShell Build Script for Windows 11
Set-Location "$PSScriptRoot\.."

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  ASMR-DSP Windows 11 PowerShell Build Script" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# Check Python
try {
    $pyVer = python --version 2>&1
    Write-Host "[OK] Detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Error "Python is not found in PATH. Please run in Anaconda or activate Python."
    exit 1
}

Write-Host "[1/4] Installing Python requirements..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "[2/4] Executing test suite..." -ForegroundColor Yellow
python tests/run_tests.py
if ($LASTEXITCODE -ne 0) {
    Write-Error "Automated test suite failed! Stopping build."
    exit 1
}

Write-Host "[3/4] Compiling standalone executable via PyInstaller..." -ForegroundColor Yellow
pyinstaller --noconfirm --log-level=WARN build/asmr_dsp.spec

if (Test-Path "dist\ASMR-DSP\ASMR-DSP.exe") {
    Write-Host "[OK] Standalone executable generated at: dist\ASMR-DSP\ASMR-DSP.exe" -ForegroundColor Green
} else {
    Write-Error "PyInstaller build failed."
    exit 1
}

# Inno Setup check
$isccPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (Test-Path $isccPath) {
    Write-Host "[4/4] Generating Inno Setup Windows Installer..." -ForegroundColor Yellow
    & $isccPath "build\installer.iss"
    Write-Host "[SUCCESS] Installer created: dist\ASMR-DSP-Setup.exe" -ForegroundColor Green
} else {
    Write-Host "[INFO] Inno Setup 6 not detected. Distributable folder: dist\ASMR-DSP\" -ForegroundColor Cyan
}

Write-Host "Build process completed successfully!" -ForegroundColor Green
