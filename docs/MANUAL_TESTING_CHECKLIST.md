# ASMR-DSP: Manual Testing Checklist

Use this checklist on your Windows 11 PC to verify every component of the ASMR-DSP system.

---

### Step 1: Device Verification
- [ ] Windows Sound settings confirm: `PRO X SE Gaming Headset` selected.
- [ ] Format is `16-bit, 48000 Hz (DVD Quality)`.
- [ ] Spatial Audio is set to `Dolby Atmos for Headphones`.
- [ ] Audio Enhancements set to `Off`.

### Step 2: Equalizer APO Pipeline Hook
- [ ] Open Equalizer APO Configurator: `PRO X SE Gaming Headset` is checked.
- [ ] Run `python asmr_dsp/main.py --test-eq`.
- [ ] Confirm you hear an immediate subtle mid-frequency lift that safely expires after 3 seconds.

### Step 3: One-Click Profile Switching
- [ ] Click **🌙 ASMR Relaxation**: Verify whispering voice warmth and lack of harsh sibilance on YouTube salon videos.
- [ ] Click **🔬 ASMR Detail**: Verify crispness of pencil, paper, tapping, and scissors.
- [ ] Click **✂️ Salon / Haircut**: Verify clear metallic scissor snips and comb movements.
- [ ] Click **🎵 Music**: Verify balanced, punchy audio.
- [ ] Click **🎧 Reference / Flat**: Verify audio returns to raw uncolored state.

### Step 4: Headroom & Clipping Guard
- [ ] Open EQ Editor for any profile with high boosts.
- [ ] Verify Preamp displays a safe negative dB value matching the maximum boost.
- [ ] Verify no audible distortion occurs during loud audio peaks.

### Step 5: System Tray & Auto-Startup
- [ ] Minimize application: Verify icon appears in Windows system tray.
- [ ] Right-click tray icon: Switch profile directly from menu.
- [ ] Verify hotkeys (e.g. `Ctrl+Alt+1`) trigger profile switches.
