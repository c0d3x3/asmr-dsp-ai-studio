# Dolby Atmos & Equalizer APO Coexistence Analysis

## 1. Windows 11 Audio Pipeline (Theoretical Model)

When using **ASMR-DSP + Logitech G PRO X SE (Generic USB Audio)** on Windows 11 with Dolby Atmos enabled, the conceptual signal path is modeled as follows:

```
[ Application / Media Player / Browser / Game ]
                    │
                    ▼
[ Windows Audio Engine (WASAPI Shared Mode) ]
                    │
   ┌────────────────┴────────────────────────┐
   │ Spatial Audio & Audio Processing Stack  │
   │                                         │
   │  • Dolby Atmos for Headphones           │
   │    (Spatial audio provider / HRTF)      │
   │                                         │
   │  • Equalizer APO (APO Hook)             │
   │    (Preamp & Parametric Filters)        │
   │                                         │
   │ *Note: Exact execution order (LFX/GFX/  │
   │ SFX vs Spatial Object Renderer) varies  │
   │ by Windows APO registration mode and is │
   │ not directly queryable via user APIs.   │
   └────────────────┬────────────────────────┘
                    │
                    ▼
[ Windows Generic USB Audio Class Driver (usbaudio.sys) ]
                    │
                    ▼
[ Logitech A00102 USB DAC (16-bit, 48000 Hz) ]
                    │
                    ▼
[ PRO X SE Headset ]
```

---

## 2. Technical Limitations & Diagnostic Disclaimers

1. **Spatial Audio Status Detection**: Windows does not provide an open user-mode COM API to query whether Dolby Atmos is actively rendering spatial objects versus operating in pass-through stereo. Therefore, ASMR-DSP displays **"Spatial Audio: User-configured / not independently verified"**.
2. **Internal Processing Order**: The relative sequence of Dolby Atmos spatialization versus Equalizer APO filter application cannot be verified from user space without proprietary kernel-mode or driver-level tracing.
3. **No Direct Interception**: ASMR-DSP does not replace, disable, or alter Dolby Atmos or Windows audio drivers. It strictly generates text configurations for Equalizer APO to read.
4. **Driver Stability**: Using the Microsoft Generic USB Audio driver (`usbaudio.sys`) avoids proprietary virtual sound card conflicts (e.g. Logitech G HUB virtual endpoints), allowing standard Windows WASAPI shared endpoints to function stably.
