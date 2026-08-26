"""Unit tests for Headphone Measurement and Target Curve parser."""
import unittest
from asmr_dsp.models.measurement import HeadphoneMeasurement, get_builtin_target_curves


class TestMeasurementParser(unittest.TestCase):

    def test_csv_parse_and_interpolation(self):
        sample_csv = """# Frequency, Raw SPL
20, 80.0
100, 85.0
1000, 82.0
10000, 75.0
20000, 70.0
"""
        meas = HeadphoneMeasurement.from_csv_text(sample_csv, "Test Headphone", source="Imported CSV", is_verified=False)
        self.assertEqual(len(meas.raw_points), 5)
        self.assertIn("Not a verified individual PRO X SE measurement", meas.disclaimer)

        # Test interpolation at exact and intermediate frequencies
        self.assertAlmostEqual(meas.interpolate_spl_at(20.0), 80.0)
        self.assertAlmostEqual(meas.interpolate_spl_at(1000.0), 82.0)
        # Logarithmic mid-point between 20 and 100 Hz (f ≈ 44.7 Hz)
        interpolated = meas.interpolate_spl_at(44.72)
        self.assertTrue(80.0 < interpolated < 85.0)

    def test_builtin_targets(self):
        targets = get_builtin_target_curves()
        self.assertIn("harman_2018_over_ear", targets)
        self.assertIn("asmr_warmth_relaxed", targets)
        self.assertIn("flat_reference", targets)

        harman = targets["harman_2018_over_ear"]
        # Harman has pinna gain peak around 3kHz (~7.5 dB)
        val_3k = harman.interpolate_spl_at(3000.0)
        self.assertAlmostEqual(val_3k, 7.5, delta=0.5)


if __name__ == "__main__":
    unittest.main()
