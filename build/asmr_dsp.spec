# -*- mode: python ; coding: utf-8 -*-
import os
import sys

block_cipher = None

# Base directory
base_dir = os.path.abspath(os.path.join(SPECPATH, ".."))

added_files = []
for src_dir, dst_name in [
    ("profiles", "profiles"),
    ("measurements", "measurements"),
    ("docs", "docs"),
]:
    full_path = os.path.join(base_dir, src_dir)
    if os.path.exists(full_path):
        added_files.append((full_path, dst_name))


a = Analysis(
    [os.path.join(base_dir, "asmr_dsp", "main.py")],
    pathex=[base_dir],
    binaries=[],
    datas=added_files,
    hiddenimports=[
        "PySide6",
        "PySide6.QtCore",
        "PySide6.QtGui",
        "PySide6.QtWidgets",
        "pycaw",
        "pycaw.pycaw",
        "pycaw.constants",
        "comtypes",
        "logging",
        "json",
        "math",
        "tempfile",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "scipy", "numpy"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="ASMR-DSP",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="ASMR-DSP",
)
