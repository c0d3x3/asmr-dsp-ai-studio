"""Unit tests for Equalizer APO syntax generation and atomic file write."""
import unittest
import os
import tempfile
from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType
from asmr_dsp.engine.apo_writer import APOWriter
from asmr_dsp.engine.device_detector import AudioEndpoint


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

        # Equalizer APO Device syntax must NEVER include surrounding double quotes
        self.assertIn("Device: PRO X SE Gaming Headset", text)
        self.assertNotIn('Device: "', text)
        self.assertIn('Preamp: -2.50 dB', text)
        self.assertIn('Filter 1: ON HP Fc 30.0 Hz # Sub HP', text)
        self.assertIn('Filter 2: ON PK Fc 2800.0 Hz Gain +1.50 dB Q 1.414 # Speech Intelligibility', text)
        self.assertIn('Filter 3: ON HSC Fc 8500.0 Hz Gain -2.00 dB Q 0.707 # Gentle Highs', text)

    def test_pro_x_se_endpoint_device_directive(self):
        """
        Verify that targeting the PRO X SE endpoint (name + GUID) produces
        the exact unquoted Device directive matching Windows MMDevice and Equalizer APO.
        """
        pro_x_endpoint = AudioEndpoint(
            name="Speakers (PRO X SE Gaming Headset)",
            id="{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}",
            provider="(Generic USB Audio)"
        )
        writer = APOWriter()
        p = DSPProfile(name="ASMR Pro", preamp_db=-2.0)
        text = writer.format_profile_to_apo_text(p, device_target=pro_x_endpoint)

        # Verify exact target directive
        expected_directive = "Device: Speakers (PRO X SE Gaming Headset) {0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"
        self.assertIn(expected_directive, text)
        # Ensure no quotes around the directive
        self.assertNotIn(f'Device: "{pro_x_endpoint.name}"', text)
        self.assertNotIn(f'"{expected_directive}"', text)
        self.assertNotIn('Device: "', text)

    def test_device_directive_helper_variants(self):
        """Verify format_device_directive handles all device input combinations cleanly."""
        # 1. AudioEndpoint instance
        ep = AudioEndpoint(name="Speakers (PRO X SE Gaming Headset)", id="{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}")
        self.assertEqual(
            APOWriter.format_device_directive(ep),
            "Device: Speakers (PRO X SE Gaming Headset) {0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"
        )

        # 2. Name + separate device_id parameter
        self.assertEqual(
            APOWriter.format_device_directive("Speakers (PRO X SE Gaming Headset)", "{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"),
            "Device: Speakers (PRO X SE Gaming Headset) {0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"
        )

        # 3. Accidental quotes stripped
        self.assertEqual(
            APOWriter.format_device_directive('"Speakers (PRO X SE Gaming Headset)"', '"{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"'),
            "Device: Speakers (PRO X SE Gaming Headset) {0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"
        )

        # 4. GUID string only
        self.assertEqual(
            APOWriter.format_device_directive("{0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"),
            "Device: {0.0.0.00000000}.{d79b45b7-b5cd-4b44-b015-872001a114e3}"
        )

        # 5. Friendly name only
        self.assertEqual(
            APOWriter.format_device_directive("PRO X SE Gaming Headset"),
            "Device: PRO X SE Gaming Headset"
        )

        # 6. 'all devices' or empty returns empty string
        self.assertEqual(APOWriter.format_device_directive("all devices"), "")
        self.assertEqual(APOWriter.format_device_directive(""), "")
        self.assertEqual(APOWriter.format_device_directive(None), "")

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

