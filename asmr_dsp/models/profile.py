"""
Profile and Filter Data Models for ASMR-DSP.
Handles JSON serialization/deserialization, filter parameter validation,
and separation of headphone correction from use-case tuning.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Optional, Dict, Any
import json
import uuid
import datetime
import math


class FilterType(str, Enum):
    PEAK = "PK"
    LOW_SHELF = "LS"
    HIGH_SHELF = "HS"
    HIGH_PASS = "HP"
    LOW_PASS = "LP"
    BAND_PASS = "BP"
    NOTCH = "NO"


@dataclass
class EQFilter:
    """Individual parametric biquad equalizer filter."""
    filter_type: FilterType = FilterType.PEAK
    frequency: float = 1000.0  # 20 Hz to 20000 Hz
    gain_db: float = 0.0       # -24.0 dB to +12.0 dB
    q: float = 1.414           # 0.1 to 20.0
    enabled: bool = True
    comment: str = ""

    def validate(self) -> List[str]:
        """Validate filter parameters and return list of validation errors."""
        errors = []
        if math.isnan(self.frequency) or math.isinf(self.frequency) or not (10.0 <= self.frequency <= 22000.0):
            errors.append(f"Frequency {self.frequency} Hz is outside safe audio range [10, 22000] Hz.")
        if math.isnan(self.gain_db) or math.isinf(self.gain_db) or not (-24.0 <= self.gain_db <= 12.0):
            errors.append(f"Gain {self.gain_db} dB is outside safe range [-24, +12] dB.")
        if math.isnan(self.q) or math.isinf(self.q) or not (0.1 <= self.q <= 20.0):
            errors.append(f"Q factor {self.q} is outside stable range [0.1, 20.0].")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.filter_type.value if isinstance(self.filter_type, FilterType) else str(self.filter_type),
            "freq": round(self.frequency, 1),
            "gain": round(self.gain_db, 2),
            "q": round(self.q, 3),
            "enabled": self.enabled,
            "comment": self.comment
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EQFilter":
        ft_val = data.get("type", "PK")
        try:
            filter_type = FilterType(ft_val)
        except ValueError:
            filter_type = FilterType.PEAK

        return cls(
            filter_type=filter_type,
            frequency=float(data.get("freq", 1000.0)),
            gain_db=float(data.get("gain", 0.0)),
            q=float(data.get("q", 1.414)),
            enabled=bool(data.get("enabled", True)),
            comment=str(data.get("comment", ""))
        )


@dataclass
class SpatialSettings:
    """Optional subtle spatial processing / crossfeed settings."""
    crossfeed_enabled: bool = False
    crossfeed_cutoff_hz: float = 700.0  # Standard Chu Moy / Bauer frequency
    crossfeed_feed_db: float = -6.0     # Channel cross-attenuation
    hf_smoothing_enabled: bool = False  # Anti-fatigue gentle high-end roll-off
    hf_smoothing_cutoff: float = 8500.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SpatialSettings":
        if not data:
            return cls()
        return cls(
            crossfeed_enabled=bool(data.get("crossfeed_enabled", False)),
            crossfeed_cutoff_hz=float(data.get("crossfeed_cutoff_hz", 700.0)),
            crossfeed_feed_db=float(data.get("crossfeed_feed_db", -6.0)),
            hf_smoothing_enabled=bool(data.get("hf_smoothing_enabled", False)),
            hf_smoothing_cutoff=float(data.get("hf_smoothing_cutoff", 8500.0))
        )


@dataclass
class DSPProfile:
    """Complete DSP Profile containing Preamp, Filters, Device target, and metadata."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Profile"
    category: str = "ASMR"  # ASMR, Music, Gaming, Movies, Utility
    description: str = ""
    icon: str = "🎧"
    target_device: str = "PRO X SE Gaming Headset"  # Matches Windows endpoint
    preamp_db: float = 0.0  # Automatic or manual digital attenuation to prevent clipping
    filters: List[EQFilter] = field(default_factory=list)
    spatial: SpatialSettings = field(default_factory=SpatialSettings)
    is_experimental: bool = True
    is_builtin: bool = False
    notes: str = ""
    created_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

    def validate(self) -> List[str]:
        errors = []
        if not self.name.strip():
            errors.append("Profile name cannot be empty.")
        for i, f in enumerate(self.filters):
            f_errors = f.validate()
            for err in f_errors:
                errors.append(f"Filter #{i+1} ({f.frequency}Hz): {err}")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "icon": self.icon,
            "target_device": self.target_device,
            "preamp_db": round(self.preamp_db, 2),
            "filters": [f.to_dict() for f in self.filters],
            "spatial": self.spatial.to_dict(),
            "is_experimental": self.is_experimental,
            "is_builtin": self.is_builtin,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DSPProfile":
        filters = [EQFilter.from_dict(f) for f in data.get("filters", [])]
        spatial = SpatialSettings.from_dict(data.get("spatial", {}))
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", "Untitled Profile"),
            category=data.get("category", "General"),
            description=data.get("description", ""),
            icon=data.get("icon", "🎧"),
            target_device=data.get("target_device", "PRO X SE Gaming Headset"),
            preamp_db=float(data.get("preamp_db", 0.0)),
            filters=filters,
            spatial=spatial,
            is_experimental=bool(data.get("is_experimental", True)),
            is_builtin=bool(data.get("is_builtin", False)),
            notes=data.get("notes", ""),
            created_at=data.get("created_at", datetime.datetime.utcnow().isoformat()),
            updated_at=data.get("updated_at", datetime.datetime.utcnow().isoformat())
        )

    @classmethod
    def from_json(cls, json_str: str) -> "DSPProfile":
        data = json.loads(json_str)
        return cls.from_dict(data)

    def clone(self, new_name: Optional[str] = None) -> "DSPProfile":
        """Create a deep copy with a fresh UUID."""
        d = self.to_dict()
        d["id"] = str(uuid.uuid4())
        d["name"] = new_name or f"{self.name} (Copy)"
        d["is_builtin"] = False
        d["created_at"] = datetime.datetime.utcnow().isoformat()
        d["updated_at"] = d["created_at"]
        return DSPProfile.from_dict(d)

    def merge_correction(self, correction_filters: List[EQFilter]) -> "DSPProfile":
        """
        Produce a new profile combining headphone measurement correction
        filters with this profile's use-case tuning filters.
        """
        combined = self.clone(new_name=f"{self.name} + Correction")
        # Prepend correction filters
        merged_filters = [EQFilter.from_dict(f.to_dict()) for f in correction_filters]
        for f in self.filters:
            merged_filters.append(EQFilter.from_dict(f.to_dict()))
        combined.filters = merged_filters
        return combined
