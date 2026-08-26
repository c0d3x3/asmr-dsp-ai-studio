"""Unit tests for DSP Profile models and serialization."""
import unittest
import os
import tempfile
from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType, SpatialSettings


class TestProfileModels(unittest.TestCase):

    def test_filter_validation_valid(self):
        f = EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=2.5, q=1.414)
        errors = f.validate()
        self.assertEqual(len(errors), 0)

    def test_filter_validation_invalid(self):
        f = EQFilter(filter_type=FilterType.PEAK, frequency=35000.0, gain_db=50.0, q=-1.0)
        errors = f.validate()
        self.assertTrue(len(errors) >= 3)

    def test_profile_json_roundtrip(self):
        p = DSPProfile(
            name="Test ASMR Profile",
            category="ASMR",
            description="Testing serialization",
            target_device="PRO X SE Gaming Headset",
            preamp_db=-3.5,
            filters=[
                EQFilter(filter_type=FilterType.HIGH_PASS, frequency=30.0, gain_db=0.0, q=0.707),
                EQFilter(filter_type=FilterType.PEAK, frequency=3500.0, gain_db=2.0, q=1.8),
                EQFilter(filter_type=FilterType.HIGH_SHELF, frequency=8000.0, gain_db=-2.5, q=0.707)
            ]
        )
        json_str = p.to_json()
        loaded = DSPProfile.from_json(json_str)
        self.assertEqual(loaded.name, p.name)
        self.assertEqual(loaded.preamp_db, -3.5)
        self.assertEqual(len(loaded.filters), 3)
        self.assertEqual(loaded.filters[1].gain_db, 2.0)
        self.assertEqual(loaded.filters[1].filter_type, FilterType.PEAK)

    def test_profile_clone(self):
        p = DSPProfile(name="Original", preamp_db=-1.5)
        clone = p.clone("Cloned Profile")
        self.assertEqual(clone.name, "Cloned Profile")
        self.assertNotEqual(clone.id, p.id)
        self.assertFalse(clone.is_builtin)

    def test_merge_correction(self):
        base = DSPProfile(
            name="Base ASMR",
            filters=[EQFilter(filter_type=FilterType.PEAK, frequency=3000.0, gain_db=2.0)]
        )
        correction = [
            EQFilter(filter_type=FilterType.PEAK, frequency=100.0, gain_db=-1.0, comment="Correction 1"),
            EQFilter(filter_type=FilterType.PEAK, frequency=6000.0, gain_db=-2.0, comment="Correction 2")
        ]
        merged = base.merge_correction(correction)
        self.assertEqual(len(merged.filters), 3)
        self.assertEqual(merged.filters[0].comment, "Correction 1")
        self.assertEqual(merged.filters[2].frequency, 3000.0)


if __name__ == "__main__":
    unittest.main()
