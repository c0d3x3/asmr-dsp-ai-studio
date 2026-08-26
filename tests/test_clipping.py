"""Unit tests for headroom analysis and clipping protection."""
import unittest
from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType
from asmr_dsp.engine.clipping_guard import ClippingGuard


class TestClippingGuard(unittest.TestCase):

    def test_clipping_detection_positive_boost_without_preamp(self):
        p = DSPProfile(
            name="Hot Profile",
            preamp_db=0.0,
            filters=[
                EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=4.5, q=1.414)
            ]
        )
        analysis = ClippingGuard.inspect(p)
        self.assertTrue(analysis["is_clipping_risk"])
        self.assertAlmostEqual(analysis["max_boost_db"], 4.5, delta=0.2)
        # Recommended preamp should be negative to offset the boost with a margin
        self.assertLess(analysis["recommended_preamp_db"], -4.5)

    def test_safe_profile_with_compensated_preamp(self):
        p = DSPProfile(
            name="Safe Profile",
            preamp_db=-5.0,
            filters=[
                EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=4.5, q=1.414)
            ]
        )
        analysis = ClippingGuard.inspect(p)
        self.assertFalse(analysis["is_clipping_risk"])
        self.assertGreater(analysis["headroom_db"], 0.0)

    def test_auto_safe_preamp_application(self):
        p = DSPProfile(
            name="Fixable Profile",
            preamp_db=0.0,
            filters=[
                EQFilter(filter_type=FilterType.PEAK, frequency=2000.0, gain_db=3.0, q=1.414)
            ]
        )
        modified, rec_val = ClippingGuard.apply_auto_safe_preamp(p)
        self.assertLess(modified.preamp_db, -3.0)
        # After auto safe preamp, clipping risk should be eliminated
        analysis_after = ClippingGuard.inspect(modified)
        self.assertFalse(analysis_after["is_clipping_risk"])


if __name__ == "__main__":
    unittest.main()
