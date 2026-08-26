"""Unit tests for prioritized profile storage and user preferences."""
import unittest
import os
import tempfile
import json
from asmr_dsp.models.profile import DSPProfile, EQFilter, FilterType
from asmr_dsp.main import SettingsManager, load_all_profiles


class TestStorage(unittest.TestCase):

    def test_settings_manager_save_and_load(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            sm = SettingsManager(tmpdir)
            sm.settings["selected_endpoint_id"] = "{custom-guid-123}"
            sm.settings["active_profile_id"] = "custom-test-profile"
            sm.save()

            # Load in fresh instance
            sm2 = SettingsManager(tmpdir)
            self.assertEqual(sm2.settings["selected_endpoint_id"], "{custom-guid-123}")
            self.assertEqual(sm2.settings["active_profile_id"], "custom-test-profile")

    def test_profile_loading(self):
        profiles = load_all_profiles()
        self.assertGreater(len(profiles), 0)
        profile_ids = [p.id for p in profiles]
        self.assertIn("asmr-relaxation-builtin", profile_ids)
        self.assertIn("asmr-detail-builtin", profile_ids)


if __name__ == "__main__":
    unittest.main()
