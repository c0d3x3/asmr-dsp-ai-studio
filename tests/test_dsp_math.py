"""Unit tests for DSP mathematics and biquad response evaluation."""
import unittest
import math
from asmr_dsp.models.profile import EQFilter, FilterType
from asmr_dsp.engine.dsp_math import (
    compute_biquad_coefficients,
    evaluate_filter_response,
    compute_combined_response,
    generate_log_frequencies,
    analyze_profile_headroom
)


class TestDSPMath(unittest.TestCase):

    def test_log_frequencies(self):
        freqs = generate_log_frequencies(100, 20.0, 20000.0)
        self.assertEqual(len(freqs), 100)
        self.assertAlmostEqual(freqs[0], 20.0, places=2)
        self.assertAlmostEqual(freqs[-1], 20000.0, places=1)
        # Verify strictly increasing
        for i in range(len(freqs) - 1):
            self.assertLess(freqs[i], freqs[i+1])

    def test_peaking_filter_gain_at_f0(self):
        f0 = 1000.0
        gain_db = 4.0
        q = 1.414
        f = EQFilter(filter_type=FilterType.PEAK, frequency=f0, gain_db=gain_db, q=q)
        response = evaluate_filter_response(f, [f0], fs=48000.0)
        # At resonance f0, gain should be exactly or very close to gain_db
        self.assertAlmostEqual(response[0], gain_db, delta=0.1)

    def test_disabled_filter_gain_is_zero(self):
        f = EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=6.0, q=1.0, enabled=False)
        response = evaluate_filter_response(f, [100.0, 1000.0, 5000.0], fs=48000.0)
        for val in response:
            self.assertEqual(val, 0.0)

    def test_high_shelf_asymptote(self):
        f = EQFilter(filter_type=FilterType.HIGH_SHELF, frequency=4000.0, gain_db=-3.0, q=0.707)
        # Low frequency should be ~0 dB, high frequency (15 kHz) should approach -3.0 dB
        res_low = evaluate_filter_response(f, [50.0], fs=48000.0)[0]
        res_high = evaluate_filter_response(f, [18000.0], fs=48000.0)[0]
        self.assertAlmostEqual(res_low, 0.0, delta=0.2)
        self.assertAlmostEqual(res_high, -3.0, delta=0.3)

    def test_combined_response_with_preamp(self):
        f1 = EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=3.0, q=1.414)
        f2 = EQFilter(filter_type=FilterType.PEAK, frequency=1000.0, gain_db=2.0, q=1.414)
        combined = compute_combined_response([f1, f2], preamp_db=-5.0, frequencies=[1000.0])
        # At 1000 Hz, response is ~3 + 2 - 5 = 0 dB
        self.assertAlmostEqual(combined[0], 0.0, delta=0.2)


if __name__ == "__main__":
    unittest.main()
