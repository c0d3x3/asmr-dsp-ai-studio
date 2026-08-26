"""
Safe Headroom and Clipping Guard.
Monitors total EQ boost across 20Hz-20kHz, calculates maximum positive excursion,
and automatically applies negative preamp offsets to prevent digital clipping.
"""

from typing import Tuple
from ..models.profile import DSPProfile
from .dsp_math import analyze_profile_headroom


class ClippingGuard:
    """Provides automated protection against inter-sample and digital full-scale clipping."""

    @staticmethod
    def inspect(profile: DSPProfile) -> dict:
        """Inspect a profile for clipping risks and compute safe values."""
        return analyze_profile_headroom(profile.filters, profile.preamp_db)

    @staticmethod
    def apply_auto_safe_preamp(profile: DSPProfile) -> Tuple[DSPProfile, float]:
        """
        Adjust the profile's preamp to exactly offset any positive peaks with 0.2 dB margin.
        Returns (modified_profile, new_preamp_value).
        """
        analysis = analyze_profile_headroom(profile.filters, 0.0)
        rec_preamp = analysis["recommended_preamp_db"]
        profile.preamp_db = rec_preamp
        return profile, rec_preamp
