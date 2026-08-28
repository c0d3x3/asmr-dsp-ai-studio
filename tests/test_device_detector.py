"""Unit tests for Windows audio endpoint detection, Pycaw state parsing, and explicit selection."""
import unittest
from enum import Enum
from asmr_dsp.engine.device_detector import DeviceDetector, AudioEndpoint, parse_device_state


class MockPycawAudioDeviceState(Enum):
    """Simulates pycaw.constants.AudioDeviceState Enum behavior on Windows."""
    Active = 1
    Disabled = 2
    NotPresent = 4
    Unplugged = 8
    All = 15


class TestDeviceDetector(unittest.TestCase):

    def setUp(self):
        self.detector = DeviceDetector()

    def test_parse_device_state_enum(self):
        """Verify handling of pycaw AudioDeviceState Enum objects without relying on integer coercion."""
        self.assertEqual(parse_device_state(MockPycawAudioDeviceState.Active), "Active")
        self.assertEqual(parse_device_state(MockPycawAudioDeviceState.Disabled), "Disabled")
        self.assertEqual(parse_device_state(MockPycawAudioDeviceState.Unplugged), "Unplugged")
        self.assertEqual(parse_device_state(MockPycawAudioDeviceState.NotPresent), "Unplugged")

    def test_parse_device_state_integers_and_strings(self):
        """Verify fallback handling for raw integer flags and string descriptions."""
        self.assertEqual(parse_device_state(1), "Active")
        self.assertEqual(parse_device_state(2), "Disabled")
        self.assertEqual(parse_device_state(4), "Unplugged")
        self.assertEqual(parse_device_state(8), "Unplugged")
        self.assertEqual(parse_device_state("AudioDeviceState.Active"), "Active")
        self.assertEqual(parse_device_state("Disabled"), "Disabled")
        self.assertEqual(parse_device_state(None), "Unplugged")

    def test_enumerate_endpoints(self):
        devices = self.detector.enumerate_endpoints()
        self.assertGreater(len(devices), 0)
        for dev in devices:
            self.assertIsInstance(dev.name, str)
            self.assertIsInstance(dev.id, str)
            self.assertIsInstance(dev.spatial_audio_mode, str)
            self.assertIn(dev.state, ("Active", "Disabled", "Unplugged"))
            self.assertEqual(dev.sample_rate, 48000)

    def test_get_endpoint_by_id(self):
        devices = self.detector.enumerate_endpoints()
        target_id = devices[0].id
        found = self.detector.get_endpoint_by_id(target_id)
        self.assertIsNotNone(found)
        self.assertEqual(found.id, target_id)

    def test_get_endpoint_by_name_exact_and_prefixed(self):
        """Verify name lookup handles Windows audio friendly names (e.g. Speakers (...)) and base names."""
        # Query base model name
        found_base = self.detector.get_endpoint_by_name("PRO X SE Gaming Headset")
        self.assertIsNotNone(found_base)
        self.assertIn("PRO X SE", found_base.name)

        # Query Windows friendly name format with endpoint type prefix
        found_prefixed = self.detector.get_endpoint_by_name("Speakers (PRO X SE Gaming Headset)")
        self.assertIsNotNone(found_prefixed)
        self.assertIn("PRO X SE", found_prefixed.name)

        # Query case-insensitively
        found_case = self.detector.get_endpoint_by_name("speakers (pro x se gaming headset)")
        self.assertIsNotNone(found_case)

        # Non-existent device returns None
        self.assertIsNone(self.detector.get_endpoint_by_name("NonExistentAudioDevice12345"))

    def test_find_preferred_device_by_explicit_id(self):
        devices = self.detector.enumerate_endpoints()
        second_dev = devices[-1]
        matched = self.detector.find_preferred_device(preferred_id_or_name=second_dev.id)
        self.assertEqual(matched.id, second_dev.id)

    def test_find_preferred_device_by_windows_friendly_name(self):
        matched = self.detector.find_preferred_device(preferred_id_or_name="Speakers (PRO X SE Gaming Headset)")
        self.assertIsNotNone(matched)
        self.assertIn("PRO X SE", matched.name)


if __name__ == "__main__":
    unittest.main()
