# ASMR-DSP PowerShell Build Script for Windows 11
Set-Location "$PSScriptRoot\.."

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  ASMR-DSP Windows 11 PowerShell Build Script" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

# 1. Check Python
try {
    $pythonVersion = python --version
    Write-Host "[OK] Detected: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Error "Python is not installed or not in PATH."
    exit 1
}

# 2. Requirements
Write-Host "`n[1/4] Installing Python requirements..." -ForegroundColor Yellow
python -m pip install -r requirements.txt --quiet

# 3. Tests
Write-Host "`n[2/4] Running automated tests..." -ForegroundColor Yellow
python tests/run_tests.py
if ($LASTEXITCODE -ne 0) {
    Write-Error "Automated unit tests failed! Aborting build."
    exit 1
}

# 4. PyInstaller
Write-Host "`n[3/4] Building standalone executable with PyInstaller..." -ForegroundColor Yellow
pyinstaller --clean --noconfirm build/asmr_dsp.spec
if ($LASTEXITCODE -ne 0) {
    Write-Error "PyInstaller build failed."
    exit 1
}
Write-Host "[OK] Standalone build ready at dist\ASMR-DSP\ASMR-DSP.exe" -ForegroundColor Green

# 5. Inno Setup
Write-Host "`n[4/4] Checking for Inno Setup 6..." -ForegroundColor Yellow
$isccPaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
)

$iscc = $isccPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($iscc) {
    Write-Host "Compiling installer using $iscc..." -ForegroundColor Cyan
    & $iscc build\installer.iss
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Setup installer generated at dist\ASMR-DSP-Setup.exe" -ForegroundColor Green
    }
} else {
    Write-Host "[INFO] Inno Setup 6 not found. Standalone files ready in dist\ASMR-DSP\" -ForegroundColor Gray
}

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host "  Build Process Finished!" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
