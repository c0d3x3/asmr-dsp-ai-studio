# ASMR-DSP: Local Windows Headphone EQ & Profile Manager

A dedicated, lightweight Windows 11 desktop audio control center engineered specifically for the **Logitech G PRO X SE Wired Gaming Headset (A00101/A00102 USB DAC)** with **Dolby Atmos for Headphones** coexistence and **Equalizer APO** integration.

---

## Key Highlights

- **100% Offline & Private**: Zero telemetry, no cloud AI, no accounts, no subscriptions.
- **Dolby Atmos Preserved**: Coexists harmoniously with Windows 11 Dolby Access spatial audio.
- **Zero Logitech G HUB Dependency**: Operates cleanly on the standard Windows Generic USB Audio driver.
- **Purpose-Tuned ASMR Profiles**:
  - 🌙 **ASMR Relaxation**: Smooth, intimate tuning for soft speech, whispers, and salon roleplays without sibilance fatigue.
  - 🔬 **ASMR Detail**: Tactile micro-detail for tapping, scratching, scissors, and paper friction.
  - ✂️ **Salon / Haircut**: Tailored for scissor snips, comb clicks, clippers, and close binaural movement.
  - ✏️ **Drawing / Quiet Activity**: Optimized for graphite, sketching, and ambient craft texture.
  - 🎵 **Music**: Balanced audiophile tuning with natural timbre.
  - 🎮 **Gaming**: Directional footstep emphasis with harsh explosion suppression.
  - 🎬 **Movies**: Enhanced dialogue intelligibility with cinematic sub-bass extension.
  - 💤 **Sleep**: Ultra low-fatigue high-shelf smoothing for sleep.
  - 🎧 **Reference / Flat**: Clean 0 dB baseline for immediate A/B comparisons.
- **Safe Headroom Engine**: Automatically analyzes positive EQ boost peaks and compensates digital preamp to prevent clipping.
- **Measurement & AutoEQ Ready**: Supports loading headphone measurements with clear provenance labels (e.g. distinguishing reference measurements from individual calibrations).
- **A/B & Blind Testing**: Rapid subjective comparison with optional blind shuffling.

---

## Quick Start on Windows 11

### 1. Requirements
- Windows 11 64-bit
- Equalizer APO installed and attached to `PRO X SE Gaming Headset` (see `docs/EQUALIZER_APO_SETUP_GUIDE.md`)
- Python 3.10+ (Anaconda / Miniconda or standalone Python)

### 2. Run Directly from Source
```cmd
pip install -r requirements.txt
python asmr_dsp/main.py
```

### 3. Build Standalone Installer (.exe)
Run the automated build script:
```cmd
build\build.bat
```
Or in PowerShell:
```powershell
.\build\build.ps1
```
The standalone executable will be generated at:
`dist\ASMR-DSP\ASMR-DSP.exe` and `dist\ASMR-DSP-Setup.exe` (if Inno Setup is installed).

---

## Project Structure

```
├── asmr_dsp/               # Core Python package
│   ├── engine/             # Equalizer APO writer, DSP math, device detector, clipping guard
│   ├── models/             # Profile data models, measurement parsers, local rating store
│   ├── ui/                 # PySide6 desktop interface components
│   └── main.py             # Application entry point & CLI
├── profiles/               # Built-in JSON EQ profiles
├── measurements/           # Measured frequency response curves (with disclaimer metadata)
├── tests/                  # Automated unit test suite
├── build/                  # PyInstaller spec, Inno Setup script, build.bat, build.ps1
├── docs/                   # Setup and troubleshooting documentation
├── requirements.txt        # Python dependencies
└── README.md
```
