# Equalizer APO Setup & Configuration Guide for Logitech G PRO X SE

This guide explains how to install and configure Equalizer APO on Windows 11 with your **Logitech G PRO X SE Gaming Headset** and **Dolby Atmos for Headphones**.

---

## 1. Download & Install Equalizer APO

1. Download the official 64-bit installer from SourceForge:
   👉 [Equalizer APO on SourceForge](https://sourceforge.net/projects/equalizerapo/) (Official, Open Source, Safe).
2. Run `EqualizerAPO64-1.3.2.exe`.
3. Accept the default installation folder:
   `C:\Program Files\EqualizerAPO`

---

## 2. Configurator Setup (Crucial for Dolby Atmos Compatibility)

During installation, the **Equalizer APO Configurator** dialog will appear:

1. Under the **Playback devices** tab, locate **PRO X SE Gaming Headset** (or your Generic USB Audio endpoint).
2. Check the box next to **PRO X SE Gaming Headset**.
3. Check the **Troubleshooting options (only use in case of problems)** checkbox at the bottom right.
4. For the PRO X SE endpoint:
   - Select **Install as LFX/GFX** (recommended for maximum Windows 11 / Dolby Atmos compatibility) or **Install as SFX/EFX (experimental)** if LFX/GFX is already hooked.
   - Uncheck "Use original APO" if audio drops occur, or leave checked by default.
5. Click **Close** and allow the Configurator to finish.
6. **Restart your PC** once to initialize the Windows audio pipeline hook.

---

## 3. Verifying Equalizer APO

1. Launch **ASMR-DSP**.
2. Click the **Test EQ (+4dB Tone)** button.
3. You will hear a noticeable +4 dB boost in speech / 1 kHz frequencies for 3 seconds, which then returns to normal.
4. When you click **🌙 ASMR Relaxation**, ASMR-DSP will write the configuration directly to `C:\Program Files\EqualizerAPO\config\config.txt` and Windows audio will update instantaneously without needing a reboot!
