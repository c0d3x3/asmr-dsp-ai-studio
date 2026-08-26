"""Unit tests for Windows audio endpoint detection and explicit selection."""
import unittest
from asmr_dsp.engine.device_detector import DeviceDetector, AudioEndpoint


class TestDeviceDetector(unittest.TestCase):

    def setUp(self):
        self.detector = DeviceDetector()

    def test_enumerate_endpoints(self):
        devices = self.detector.enumerate_endpoints()
        self.assertGreater(len(devices), 0)
        # Check endpoint fields
        for dev in devices:
            self.assertIsInstance(dev.name, str)
            self.assertIsInstance(dev.id, str)
            self.assertIsInstance(dev.spatial_audio_mode, str)
            self.assertEqual(dev.sample_rate, 48000)

    def test_get_endpoint_by_id(self):
        devices = self.detector.enumerate_endpoints()
        target_id = devices[0].id
        found = self.detector.get_endpoint_by_id(target_id)
        self.assertIsNotNone(found)
        self.assertEqual(found.id, target_id)

    def test_get_endpoint_by_name(self):
        found = self.detector.get_endpoint_by_name("PRO X SE Gaming Headset")
        self.assertIsNotNone(found)
        self.assertIn("PRO X SE", found.name)

    def test_find_preferred_device_by_explicit_id(self):
        devices = self.detector.enumerate_endpoints()
        second_dev = devices[-1]
        matched = self.detector.find_preferred_device(preferred_id_or_name=second_dev.id)
        self.assertEqual(matched.id, second_dev.id)


if __name__ == "__main__":
    unittest.main()
