"""
ASMR-DSP: Local Windows Headphone EQ & Profile Manager.
Desktop Application Entry Point.
"""

import sys
import os
import argparse
import logging
import json
from typing import List, Optional, Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType
from asmr_dsp.engine.apo_writer import APOWriter
from asmr_dsp.engine.device_detector import DeviceDetector, AudioEndpoint
from asmr_dsp.engine.clipping_guard import ClippingGuard
from asmr_dsp.models.ratings import RatingsStore

# Storage Directory Resolution
def get_user_data_dir() -> str:
    """Return local app data directory for user profiles, settings, and logs."""
    if sys.platform == "win32":
        data_dir = os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "ASMR-DSP")
    else:
        data_dir = os.path.expanduser("~/.asmr_dsp")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

def get_bundled_profiles_dir() -> str:
    """Return bundled default profiles directory."""
    if getattr(sys, "frozen", False):
        # Running inside PyInstaller bundle
        base = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    else:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(base, "profiles")

def setup_logging():
    log_dir = os.path.join(get_user_data_dir(), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "asmr_dsp.log")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] (%(name)s) %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return log_dir

logger = logging.getLogger("ASMR-DSP.Main")


class SettingsManager:
    """Manages persistent user preferences in LocalAppData."""
    def __init__(self, data_dir: str):
        self.settings_file = os.path.join(data_dir, "settings.json")
        self.settings: Dict[str, Any] = {
            "selected_endpoint_id": "",
            "active_profile_id": "asmr-relaxation-builtin",
            "auto_apply_on_startup": True
        }
        self.load()

    def load(self):
        if os.path.exists(self.settings_file):
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    self.settings.update(json.load(f))
            except Exception as ex:
                logger.warning(f"Could not load settings: {ex}")

    def save(self):
        try:
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, indent=2)
        except Exception as ex:
            logger.error(f"Could not save settings: {ex}")


def load_all_profiles() -> List[DSPProfile]:
    """
    Load profiles with priority:
    1. Bundled read-only default profiles
    2. User customized profiles from LocalAppData (override matching IDs)
    """
    profiles_by_id: Dict[str, DSPProfile] = {}

    # 1. Bundled profiles
    bundled_dir = get_bundled_profiles_dir()
    if os.path.exists(bundled_dir):
        for fname in sorted(os.listdir(bundled_dir)):
            if fname.endswith(".json"):
                path = os.path.join(bundled_dir, fname)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        p = DSPProfile.from_json(f.read())
                        profiles_by_id[p.id] = p
                except Exception as ex:
                    logger.error(f"Error loading bundled profile {fname}: {ex}")

    # 2. User profiles in LocalAppData
    user_profiles_dir = os.path.join(get_user_data_dir(), "profiles")
    if os.path.exists(user_profiles_dir):
        for fname in sorted(os.listdir(user_profiles_dir)):
            if fname.endswith(".json"):
                path = os.path.join(user_profiles_dir, fname)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        p = DSPProfile.from_json(f.read())
                        profiles_by_id[p.id] = p  # Overrides bundled profile if same ID
                except Exception as ex:
                    logger.error(f"Error loading user profile {fname}: {ex}")

    return list(profiles_by_id.values())


def run_cli_profile_switch(profile_name_or_id: str, endpoint_name: Optional[str] = None):
    """Switch profile directly from command line."""
    profiles = load_all_profiles()
    target = None
    for p in profiles:
        if p.id.lower() == profile_name_or_id.lower() or p.name.lower() == profile_name_or_id.lower():
            target = p
            break

    if not target:
        print(f"Error: Profile '{profile_name_or_id}' not found.")
        sys.exit(1)

    detector = DeviceDetector()
    pref_endpoint = detector.find_preferred_device(endpoint_name) if endpoint_name else None
    writer = APOWriter()
    success, msg = writer.write_profile(target, device_target=pref_endpoint or endpoint_name)
    print(f"Status: {'SUCCESS' if success else 'FAILED'}")
    print(msg)


def main():
    setup_logging()
    logger.info("Starting ASMR-DSP Application...")

    data_dir = get_user_data_dir()
    settings = SettingsManager(data_dir)

    parser = argparse.ArgumentParser(description="ASMR-DSP: Local Windows Headphone EQ & Profile Manager")
    parser.add_argument("--profile", type=str, help="Immediately activate a profile by name or ID")
    parser.add_argument("--test-eq", action="store_true", help="Apply a safe +4dB 1kHz test tone to verify APO attachment")
    parser.add_argument("--list-devices", action="store_true", help="List detected Windows audio endpoints and diagnostics")
    parser.add_argument("--device", type=str, help="Target a specific audio endpoint by name or GUID")
    parser.add_argument("--minimized", action="store_true", help="Start minimized to Windows system tray")
    args = parser.parse_args()

    detector = DeviceDetector()

    if args.list_devices:
        devices = detector.enumerate_endpoints()
        print("\n=== DETECTED PLAYBACK ENDPOINTS ===")
        for d in devices:
            print(f"- Friendly Name: {d.name}")
            print(f"  Endpoint ID:   {d.id}")
            print(f"  State:         {d.state}")
            print(f"  Format:        {d.bit_depth}-bit / {d.sample_rate} Hz ({d.channels} ch)")
            print(f"  Provider:      {d.provider}")
            print(f"  Spatial Audio: {d.spatial_audio_mode}")
            print(f"  APO Status:    {d.apo_status}")
            print()
        return

    if args.profile:
        run_cli_profile_switch(args.profile, endpoint_name=args.device)
        return

    if args.test_eq:
        pref = detector.find_preferred_device(args.device or settings.settings.get("selected_endpoint_id"))
        writer = APOWriter()
        _, test_profile = writer.generate_test_tone_config(pref)
        success, msg = writer.write_profile(test_profile, device_target=pref)
        print(f"Test EQ Active for {pref.name}: {msg}")
        return

    # Attempt PySide6 Desktop GUI launch
    try:
        from PySide6.QtWidgets import (
            QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
            QLabel, QPushButton, QGridLayout, QFrame, QMessageBox,
            QComboBox, QStyle
        )
        from PySide6.QtCore import Qt, QTimer
        from PySide6.QtGui import QIcon, QFont, QColor

        app = QApplication(sys.argv)
        app.setApplicationName("ASMR-DSP")
        app.setStyle("Fusion")

        logger.info("Initializing PySide6 Desktop Interface...")

        profiles = load_all_profiles()
        writer = APOWriter()
        endpoints = detector.enumerate_endpoints()
        current_endpoint = detector.find_preferred_device(settings.settings.get("selected_endpoint_id"))

        class MainWindow(QMainWindow):
            def __init__(self):
                super().__init__()
                self.setWindowTitle("ASMR-DSP — Headphone EQ & Profile Manager")
                self.setMinimumSize(960, 680)
                self.active_profile = profiles[0] if profiles else None
                self.selected_endpoint = current_endpoint

                central = QWidget()
                self.setCentralWidget(central)
                layout = QVBoxLayout(central)

                # Header Device Card
                header = QFrame()
                header.setStyleSheet("background-color: #1e222d; border-radius: 8px; padding: 14px;")
                h_layout = QHBoxLayout(header)

                dev_info = QVBoxLayout()
                lbl_title = QLabel("🎧 Audio Playback Endpoint:")
                lbl_title.setStyleSheet("font-size: 13px; font-weight: bold; color: #9ca3af;")
                dev_info.addWidget(lbl_title)

                self.combo_device = QComboBox()
                for ep in endpoints:
                    self.combo_device.addItem(f"{ep.name} [{ep.provider}]", ep.id)
                self.combo_device.currentIndexChanged.connect(self.on_endpoint_changed)
                dev_info.addWidget(self.combo_device)

                self.lbl_sub = QLabel(
                    f"Format: {self.selected_endpoint.bit_depth}-bit / {self.selected_endpoint.sample_rate} Hz | "
                    f"Spatial: {self.selected_endpoint.spatial_audio_mode}"
                )
                self.lbl_sub.setStyleSheet("color: #60a5fa; font-size: 12px;")
                dev_info.addWidget(self.lbl_sub)
                h_layout.addLayout(dev_info)

                self.lbl_status = QLabel(f"Active Profile:\n{self.active_profile.name if self.active_profile else 'None'}")
                self.lbl_status.setStyleSheet("background: #0f172a; color: #34d399; font-weight: bold; padding: 8px 16px; border-radius: 6px;")
                h_layout.addWidget(self.lbl_status)
                layout.addWidget(header)

                # Profile Grid
                grid_frame = QFrame()
                grid_frame.setStyleSheet("background: #111827; border-radius: 8px; padding: 12px;")
                grid = QGridLayout(grid_frame)

                row, col = 0, 0
                for p in profiles:
                    btn = QPushButton(f"{p.icon}  {p.name}\n{p.description[:55]}...")
                    btn.setMinimumHeight(75)
                    btn.setStyleSheet("""
                        QPushButton {
                            background-color: #1f2937;
                            color: #f3f4f6;
                            border: 1px solid #374151;
                            border-radius: 8px;
                            padding: 10px;
                            text-align: left;
                            font-size: 13px;
                        }
                        QPushButton:hover {
                            background-color: #2d3748;
                            border-color: #60a5fa;
                        }
                    """)
                    btn.clicked.connect(lambda checked=False, prof=p: self.select_profile(prof))
                    grid.addWidget(btn, row, col)
                    col += 1
                    if col >= 3:
                        col = 0
                        row += 1

                layout.addWidget(grid_frame)

                # Status Footer
                footer = QHBoxLayout()
                self.lbl_footer = QLabel(f"APO Config: {writer.config_path}")
                self.lbl_footer.setStyleSheet("color: #6b7280; font-size: 11px;")
                btn_test = QPushButton("Test EQ (+4dB Tone)")
                btn_test.clicked.connect(self.run_test_eq)
                footer.addWidget(self.lbl_footer)
                footer.addStretch()
                footer.addWidget(btn_test)
                layout.addLayout(footer)

            def on_endpoint_changed(self, index: int):
                ep_id = self.combo_device.itemData(index)
                ep = detector.get_endpoint_by_id(ep_id)
                if ep:
                    self.selected_endpoint = ep
                    settings.settings["selected_endpoint_id"] = ep.id
                    settings.save()
                    self.lbl_sub.setText(f"Format: {ep.bit_depth}-bit / {ep.sample_rate} Hz | Spatial: {ep.spatial_audio_mode}")
                    if self.active_profile:
                        self.select_profile(self.active_profile)

            def select_profile(self, p: DSPProfile):
                self.active_profile = p
                self.lbl_status.setText(f"Active Profile:\n{p.name}")
                success, msg = writer.write_profile(p, device_target=self.selected_endpoint)
                if not success:
                    QMessageBox.warning(self, "Equalizer APO Status", msg)

            def run_test_eq(self):
                _, test_prof = writer.generate_test_tone_config(self.selected_endpoint)
                writer.write_profile(test_prof, device_target=self.selected_endpoint)
                self.lbl_status.setText("ACTIVE TEST:\n+4dB @ 1kHz")
                QTimer.singleShot(3000, lambda: self.select_profile(self.active_profile))

        win = MainWindow()
        if not args.minimized:
            win.show()
        sys.exit(app.exec())

    except ImportError:
        logger.info("PySide6 not installed. Running in CLI mode.")
        writer = APOWriter()
        endpoints = detector.enumerate_endpoints()
        profiles = load_all_profiles()
        print("\n=======================================================")
        print(" ASMR-DSP: Local Windows Headphone EQ & Profile Manager")
        print("=======================================================")
        print(f"Target Device: {endpoints[0].name if endpoints else 'Default'}")
        print(f"Spatial Audio: User-configured / not independently verified")
        print(f"APO Config Path: {writer.config_path}")
        print(f"Available profiles: {len(profiles)}")
        for p in profiles:
            print(f" - [{p.icon}] {p.name}: {p.description}")
        print("=======================================================\n")


if __name__ == "__main__":
    main()
