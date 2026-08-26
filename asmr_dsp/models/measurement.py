"""
Headphone Measurement & Target Curve Models.
Supports parsing CSV, TXT, AutoEQ measurement exports, calculating deviation against
target response curves (Harman Target, Optimum HiFi, Flat, ASMR Warmth),
and generating corrective parametric EQ filter sets.
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict
import csv
import io
import math
from .profile import EQFilter, FilterType


@dataclass
class FrequencyPoint:
    freq: float
    spl_db: float


@dataclass
class HeadphoneMeasurement:
    """
    Represents raw frequency response data for a headphone model.
    Includes provenance tracking to prevent misidentifying reference curves.
    """
    headphone_name: str = "Uncalibrated Generic"
    source: str = "None"
    is_verified_individual: bool = False
    disclaimer: str = "No verified headphone measurement loaded."
    raw_points: List[FrequencyPoint] = field(default_factory=list)

    @classmethod
    def from_csv_text(cls, csv_text: str, headphone_name: str = "Custom Measurement", source: str = "CSV Import", is_verified: bool = False) -> "HeadphoneMeasurement":
        points = []
        reader = csv.reader(io.StringIO(csv_text.strip()))
        for row in reader:
            if not row or len(row) < 2:
                continue
            try:
                f = float(row[0].strip())
                db = float(row[1].strip())
                if 10.0 <= f <= 24000.0 and not math.isnan(f) and not math.isnan(db):
                    points.append(FrequencyPoint(freq=f, spl_db=db))
            except ValueError:
                continue

        points.sort(key=lambda p: p.freq)
        if is_verified:
            disclaimer = f"Verified individual measurement: {headphone_name} (Source: {source})"
        else:
            disclaimer = f"Imported curve: {headphone_name} (Source: {source}). Not a verified individual PRO X SE measurement."

        return cls(
            headphone_name=headphone_name,
            source=source,
            is_verified_individual=is_verified,
            disclaimer=disclaimer,
            raw_points=points
        )

    def interpolate_spl_at(self, target_freq: float) -> float:
        """Logarithmic interpolation of SPL at a given frequency."""
        if not self.raw_points:
            return 0.0
        if target_freq <= self.raw_points[0].freq:
            return self.raw_points[0].spl_db
        if target_freq >= self.raw_points[-1].freq:
            return self.raw_points[-1].spl_db

        # Binary search for interval
        left = 0
        right = len(self.raw_points) - 1
        while right - left > 1:
            mid = (left + right) // 2
            if self.raw_points[mid].freq <= target_freq:
                left = mid
            else:
                right = mid

        p1 = self.raw_points[left]
        p2 = self.raw_points[right]
        if p1.freq == p2.freq:
            return p1.spl_db

        # Logarithmic frequency interpolation
        t = (math.log10(target_freq) - math.log10(p1.freq)) / (math.log10(p2.freq) - math.log10(p1.freq))
        return p1.spl_db + t * (p2.spl_db - p1.spl_db)


@dataclass
class TargetCurve:
    name: str
    description: str
    points: List[FrequencyPoint] = field(default_factory=list)

    def interpolate_spl_at(self, freq: float) -> float:
        if not self.points:
            return 0.0
        if freq <= self.points[0].freq:
            return self.points[0].spl_db
        if freq >= self.points[-1].freq:
            return self.points[-1].spl_db

        left, right = 0, len(self.points) - 1
        while right - left > 1:
            mid = (left + right) // 2
            if self.points[mid].freq <= freq:
                left = mid
            else:
                right = mid

        p1, p2 = self.points[left], self.points[right]
        t = (math.log10(freq) - math.log10(p1.freq)) / (math.log10(p2.freq) - math.log10(p1.freq))
        return p1.spl_db + t * (p2.spl_db - p1.spl_db)


def get_builtin_target_curves() -> Dict[str, TargetCurve]:
    """Provide standard target curves: Harman 2018 Over-Ear, ASMR Warmth Target, Flat/Diffuse."""
    harman_oe_raw = [
        (20, 5.5), (30, 5.4), (50, 5.0), (70, 4.2), (100, 3.0), (150, 1.8), (200, 1.0),
        (300, 0.3), (500, 0.0), (1000, 0.0), (1500, 0.5), (2000, 2.5), (3000, 7.5),
        (4000, 6.0), (5000, 4.0), (6000, 2.0), (7000, 1.0), (8000, 0.0), (10000, -2.0),
        (12000, -4.0), (15000, -6.0), (20000, -8.0)
    ]
    asmr_warmth_raw = [
        (20, 1.0), (50, 1.5), (100, 2.0), (200, 1.5), (400, 0.5), (1000, 0.0),
        (2000, 1.0), (3500, 2.5), (5000, 1.0), (7000, -1.0), (9000, -2.5),
        (12000, -4.5), (16000, -6.5), (20000, -8.0)
    ]
    flat_raw = [(20, 0.0), (1000, 0.0), (20000, 0.0)]

    return {
        "harman_2018_over_ear": TargetCurve(
            name="Harman Over-Ear (2018)",
            description="Industry standard preferred consumer curve with bass shelf and pinna gain.",
            points=[FrequencyPoint(f, spl) for f, spl in harman_oe_raw]
        ),
        "asmr_warmth_relaxed": TargetCurve(
            name="ASMR Warmth & Intimacy",
            description="Gentle low-mid warmth, preserved speech presence, smoothed harsh upper harmonics.",
            points=[FrequencyPoint(f, spl) for f, spl in asmr_warmth_raw]
        ),
        "flat_reference": TargetCurve(
            name="Flat / Acoustic Reference",
            description="Strictly flat transfer target for uncolored studio monitoring comparison.",
            points=[FrequencyPoint(f, spl) for f, spl in flat_raw]
        )
    }
