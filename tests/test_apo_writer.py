"""Unit tests for Equalizer APO syntax generation and atomic file write."""
import unittest
import os
import tempfile
from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType
from asmr_dsp.engine.apo_writer import APOWriter


class TestAPOWriter(unittest.TestCase):

    def test_syntax_formatting(self):
        p = DSPProfile(
            name="Relaxation Test",
            target_device="PRO X SE Gaming Headset",
            preamp_db=-2.5,
            filters=[
                EQFilter(filter_type=FilterType.HIGH_PASS, frequency=30.0, gain_db=0.0, q=0.707, comment="Sub HP"),
                EQFilter(filter_type=FilterType.PEAK, frequency=2800.0, gain_db=1.5, q=1.414, comment="Speech Intelligibility"),
                EQFilter(filter_type=FilterType.HIGH_SHELF, frequency=8500.0, gain_db=-2.0, q=0.707, comment="Gentle Highs")
            ]
        )
        writer = APOWriter()
        text = writer.format_profile_to_apo_text(p)

        self.assertIn('Device: "PRO X SE Gaming Headset"', text)
        self.assertIn('Preamp: -2.50 dB', text)
        self.assertIn('Filter 1: ON HP Fc 30.0 Hz # Sub HP', text)
        self.assertIn('Filter 2: ON PK Fc 2800.0 Hz Gain +1.50 dB Q 1.414 # Speech Intelligibility', text)
        self.assertIn('Filter 3: ON HSC Fc 8500.0 Hz Gain -2.00 dB Q 0.707 # Gentle Highs', text)

    def test_atomic_file_write(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            test_cfg = os.path.join(tmpdir, "config.txt")
            writer = APOWriter(config_file_path=test_cfg)
            p = DSPProfile(name="Temp Profile", preamp_db=-1.0)

            success, msg = writer.write_profile(p)
            self.assertTrue(success)
            self.assertTrue(os.path.exists(test_cfg))

            with open(test_cfg, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("Preamp: -1.00 dB", content)
            self.assertIn("Profile: Temp Profile", content)


if __name__ == "__main__":
    unittest.main()
