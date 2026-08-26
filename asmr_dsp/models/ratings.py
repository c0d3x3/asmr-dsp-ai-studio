"""
Personal Preference & Rating System.
Stores local ratings (Better / Worse / Same, Too Bright, Too Harsh, More Relaxing, etc.)
and computes deterministic, offline tuning suggestions for filter refinement.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import json
import datetime
import os


@dataclass
class ProfileRating:
    id: str
    profile_id: str
    profile_name: str
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    comparison_result: str = "better"  # "better", "worse", "same"
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    listening_material: str = ""  # e.g., "Angelo Shoe Shine", "Scissors Haircut", "Whispering"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ProfileRating":
        return cls(**data)


class RatingsStore:
    """Manages local JSON persistence for user listening evaluations."""

    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.ratings: List[ProfileRating] = []
        self.load()

    def load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.ratings = [ProfileRating.from_dict(r) for r in data]
            except Exception:
                self.ratings = []

    def save(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump([r.to_dict() for r in self.ratings], f, indent=2)

    def add_rating(self, rating: ProfileRating):
        self.ratings.append(rating)
        self.save()

    def get_suggestions_for_profile(self, profile_id: str) -> List[str]:
        """
        Generate deterministic suggestions based on local user feedback tags.
        Zero cloud AI needed.
        """
        profile_ratings = [r for r in self.ratings if r.profile_id == profile_id]
        if not profile_ratings:
            return ["No listening ratings logged yet for this profile. Rate your sessions to receive suggestions."]

        tag_counts: Dict[str, int] = {}
        for r in profile_ratings:
            for t in r.tags:
                tag_counts[t] = tag_counts.get(t, 0) + 1

        suggestions = []
        if tag_counts.get("Too Bright", 0) + tag_counts.get("Too Harsh", 0) >= 2:
            suggestions.append("Apply a -1.5 dB high-shelf cut around 8.5 kHz or lower the Q on the 6-8 kHz peak filter to soften sibilance.")
        if tag_counts.get("Too Dull", 0) >= 2:
            suggestions.append("Gently boost the 4 kHz - 7 kHz air band by +1.0 dB (Q=1.2) to restore delicate brush/scissor texture.")
        if tag_counts.get("Too Bass-Heavy", 0) >= 2:
            suggestions.append("Enable or raise the high-pass filter cutoff to 35 Hz to eliminate chesty resonance and mic thumps.")
        if tag_counts.get("Too Thin", 0) >= 2:
            suggestions.append("Add a gentle +1.2 dB peaking boost at 180 Hz - 250 Hz to give whispering voices more body and intimate warmth.")
        if tag_counts.get("Too Distant", 0) >= 2:
            suggestions.append("Boost speech presence at 2.5 kHz - 3.5 kHz by +1.0 dB to pull close-up ear-to-ear whispers closer.")

        if not suggestions:
            suggestions.append("Feedback is balanced. Current parameters are well tuned for your listening sessions.")

        return suggestions
