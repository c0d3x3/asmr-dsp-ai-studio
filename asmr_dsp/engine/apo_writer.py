"""
Equalizer APO Configuration File Generator and Manager.
Generates standard Equalizer APO syntax, writes device-targeted blocks,
handles atomic file replacement, and provides honest status reporting.
"""

from dataclasses import dataclass
import os
import sys
import tempfile
import logging
from typing import List, Optional, Tuple, Dict, Any
from ..models.profile import DSPProfile, EQFilter, FilterType

logger = logging.getLogger("ASMR-DSP.APOWriter")

# Standard paths
DEFAULT_APO_DIR = r"C:\Program Files\EqualizerAPO"
DEFAULT_CONFIG_PATH = r"C:\Program Files\EqualizerAPO\config\config.txt"


@dataclass
class APOStatus:
    is_installed: bool
    config_path: str
    config_exists: bool
    last_written: Optional[str]
    target_device: str
    dsp_status_text: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_installed": self.is_installed,
            "config_path": self.config_path,
            "config_exists": self.config_exists,
            "last_written": self.last_written,
            "target_device": self.target_device,
            "dsp_status_text": self.dsp_status_text
        }


class APOWriter:
    """Manages reading, writing, and validating Equalizer APO configuration files."""

    def __init__(self, config_file_path: Optional[str] = None):
        self.config_path = config_file_path or self.detect_apo_config_path()
        self.is_apo_installed = self.check_apo_installed()

    @staticmethod
    def detect_apo_config_path() -> str:
        """Detect Equalizer APO config path from Registry or standard locations."""
        if sys.platform == "win32":
            try:
                import winreg
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\EqualizerAPO")
                install_path, _ = winreg.QueryValueEx(key, "InstallPath")
                winreg.CloseKey(key)
                if install_path:
                    cfg = os.path.join(install_path, "config", "config.txt")
                    if os.path.exists(os.path.dirname(cfg)):
                        return cfg
            except Exception:
                pass

        # Fallback to default path or user appdata directory
        if os.path.exists(os.path.dirname(DEFAULT_CONFIG_PATH)):
            return DEFAULT_CONFIG_PATH

        # Safe fallback for testing or standalone execution
        if sys.platform == "win32":
            appdata = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
            local_cfg = os.path.join(appdata, "ASMR-DSP", "apo_config.txt")
        else:
            local_cfg = os.path.expanduser("~/.asmr_dsp/apo_config.txt")

        os.makedirs(os.path.dirname(local_cfg), exist_ok=True)
        return local_cfg

    def check_apo_installed(self) -> bool:
        """Check if Equalizer APO is installed on the machine."""
        if os.path.exists(DEFAULT_APO_DIR):
            return True
        if sys.platform == "win32":
            try:
                import winreg
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\EqualizerAPO")
                winreg.CloseKey(key)
                return True
            except Exception:
                return False
        return False

    @staticmethod
    def map_filter_type_to_apo(ft: FilterType) -> str:
        """Map internal filter enum to Equalizer APO filter mnemonic."""
        if ft == FilterType.PEAK:
            return "PK"
        elif ft == FilterType.LOW_SHELF:
            return "LSC"  # Low-shelf with Q
        elif ft == FilterType.HIGH_SHELF:
            return "HSC"  # High-shelf with Q
        elif ft == FilterType.HIGH_PASS:
            return "HP"
        elif ft == FilterType.LOW_PASS:
            return "LP"
        elif ft == FilterType.NOTCH:
            return "NO"
        elif ft == FilterType.BAND_PASS:
            return "BP"
        return "PK"

    @classmethod
    def format_device_directive(
        cls,
        device_target: Optional[Any] = None,
        device_id: Optional[str] = None
    ) -> str:
        """
        Format Equalizer APO Device: directive.

        Equalizer APO syntax rules:
        - NEVER wrap device names or GUIDs in double quotes. Quotes are matched literally
          by Equalizer APO and cause 'No device matches' errors in Configuration Editor.
        - When an endpoint GUID / ID is available (e.g. '{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}'),
          including it allows Equalizer APO to match the exact hardware endpoint regardless
          of Windows friendly name prefixing or localization changes.
        - Format: Device: <Friendly Name> <Endpoint GUID>
          or:     Device: <Endpoint GUID>
          or:     Device: <Friendly Name>
        - If target is None, empty, or 'all devices', returns empty string (no Device filter line).
        """
        if device_target is None and device_id is None:
            return ""

        name_str = ""
        id_str = ""

        # Check if device_target is an AudioEndpoint object
        if hasattr(device_target, "name") and hasattr(device_target, "id"):
            name_str = str(device_target.name).strip('"\' \t\r\n')
            id_str = str(device_target.id).strip('"\' \t\r\n')
        elif isinstance(device_target, str):
            clean_str = device_target.strip('"\' \t\r\n')
            if clean_str.lower() in ("all devices", "all", "*", ""):
                return ""
            # If the string contains a GUID
            if "{" in clean_str and "}" in clean_str:
                id_str = clean_str
            else:
                name_str = clean_str

        if device_id:
            clean_id = str(device_id).strip('"\' \t\r\n')
            if clean_id:
                id_str = clean_id

        # Combine name and GUID safely without quotes
        if name_str and id_str:
            if id_str in name_str:
                return f"Device: {name_str}"
            return f"Device: {name_str} {id_str}"
        elif id_str:
            return f"Device: {id_str}"
        elif name_str:
            return f"Device: {name_str}"

        return ""

    def format_profile_to_apo_text(
        self,
        profile: DSPProfile,
        device_target: Optional[Any] = None,
        device_id: Optional[str] = None,
        device_name_override: Optional[str] = None
    ) -> str:
        """
        Generate strict, clean Equalizer APO configuration text.
        Includes device filter block, safe preamp, and parametric filter lines.
        """
        target = device_target if device_target is not None else device_name_override
        if target is None:
            target = profile.target_device or "PRO X SE Gaming Headset"

        device_directive = self.format_device_directive(target, device_id=device_id)

        # Header metadata description
        if hasattr(target, "name") and hasattr(target, "id"):
            display_target = f"{target.name} [{target.id}]"
        elif device_id and isinstance(target, str):
            display_target = f"{target} [{device_id}]"
        else:
            display_target = str(target).strip('"\'')

        lines = []

        # Header metadata
        lines.append("# ====================================================================")
        lines.append("# ASMR-DSP Generated Configuration")
        lines.append(f"# Profile: {profile.name} ({profile.category})")
        lines.append(f"# Target Endpoint: {display_target}")
        lines.append(f"# Headroom / Preamp: {profile.preamp_db:+.2f} dB")
        lines.append(f"# Updated: {profile.updated_at}")
        lines.append("# Note: In Equalizer APO, Device directives filter commands to matching endpoints.")
        lines.append("# ====================================================================")
        lines.append("")

        # Device filter block - applies only to the specific audio endpoint without quotes
        if device_directive:
            lines.append(device_directive)
            lines.append("")

        # Preamp line
        lines.append(f"Preamp: {profile.preamp_db:+.2f} dB")
        lines.append("")

        # Parametric filters
        lines.append("# --- Parametric Equalizer Filters ---")
        filter_idx = 1
        for f in profile.filters:
            status = "ON" if f.enabled else "OFF"
            apo_type = self.map_filter_type_to_apo(f.filter_type)
            comment_suffix = f" # {f.comment}" if f.comment else ""

            if f.filter_type in (FilterType.HIGH_PASS, FilterType.LOW_PASS):
                lines.append(f"Filter {filter_idx}: {status} {apo_type} Fc {f.frequency:.1f} Hz{comment_suffix}")
            else:
                lines.append(f"Filter {filter_idx}: {status} {apo_type} Fc {f.frequency:.1f} Hz Gain {f.gain_db:+.2f} dB Q {f.q:.3f}{comment_suffix}")
            filter_idx += 1

        lines.append("")
        return "\n".join(lines)

    def write_profile(
        self,
        profile: DSPProfile,
        device_target: Optional[Any] = None,
        device_id: Optional[str] = None,
        device_name_override: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Atomically write the profile to the Equalizer APO config file.
        Returns (success: bool, message: str).
        """
        target = device_target if device_target is not None else device_name_override
        content = self.format_profile_to_apo_text(profile, device_target=target, device_id=device_id)
        target_path = self.config_path

        try:
            target_dir = os.path.dirname(target_path)
            os.makedirs(target_dir, exist_ok=True)

            # Atomic write via temp file in same directory
            with tempfile.NamedTemporaryFile("w", dir=target_dir, delete=False, encoding="utf-8") as tf:
                tf.write(content)
                temp_name = tf.name

            # Replace target atomically
            if os.path.exists(target_path):
                os.replace(temp_name, target_path)
            else:
                os.rename(temp_name, target_path)

            logger.info(f"Successfully applied profile '{profile.name}' to {target_path}")
            return True, f"Profile '{profile.name}' written to {target_path}"

        except PermissionError:
            err_msg = (
                f"Permission denied writing to '{target_path}'.\n"
                "Equalizer APO's config folder may require Administrator permissions,\n"
                "or you can grant write access to 'C:\\Program Files\\EqualizerAPO\\config'."
            )
            logger.error(err_msg)
            return False, err_msg
        except Exception as ex:
            err_msg = f"Failed writing APO config: {str(ex)}"
            logger.error(err_msg)
            return False, err_msg

    def get_apo_status(self, device_name: str) -> APOStatus:
        """
        Query current Equalizer APO file state and configuration.
        Clearly separates file presence from Windows Audio engine hook state.
        """
        installed = self.check_apo_installed()
        config_exists = os.path.exists(self.config_path)
        last_written = None
        if config_exists:
            try:
                mtime = os.path.getmtime(self.config_path)
                import datetime
                last_written = datetime.datetime.fromtimestamp(mtime).isoformat()
            except Exception:
                pass

        if not installed and not config_exists:
            status_text = "Equalizer APO not detected on system."
        elif config_exists:
            status_text = f"Configuration written to {self.config_path}. Equalizer APO processes audio when output routes to '{device_name}'."
        else:
            status_text = f"Equalizer APO installed; config file not yet created at {self.config_path}."

        return APOStatus(
            is_installed=installed,
            config_path=self.config_path,
            config_exists=config_exists,
            last_written=last_written,
            target_device=device_name,
            dsp_status_text=status_text
        )

    def generate_test_tone_config(
        self,
        device_target: Optional[Any] = None,
        device_id: Optional[str] = None,
        device_name: Optional[str] = None
    ) -> Tuple[str, DSPProfile]:
        """
        Generate a safe, low-level +4 dB 1 kHz test bump to verify that Equalizer APO
        is actively attached to the Windows endpoint without risking hearing or equipment.
        """
        target = device_target if device_target is not None else device_name
        target_name = getattr(target, "name", str(target or "PRO X SE Gaming Headset")).strip('"\'')
        test_profile = DSPProfile(
            name="Test EQ (Audible Check)",
            target_device=target_name,
            preamp_db=-4.0,  # Negative preamp ensures zero clipping during test
            filters=[
                EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=4.0, q=2.0, comment="Safe test peak")
            ],
            notes="Temporary profile to verify Equalizer APO pipeline attachment."
        )
        return self.format_profile_to_apo_text(test_profile, device_target=target, device_id=device_id), test_profile
