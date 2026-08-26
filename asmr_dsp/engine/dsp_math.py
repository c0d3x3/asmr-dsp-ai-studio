"""
Audio DSP Mathematics and Frequency Response Calculations.
Implements Robert Bristow-Johnson Audio EQ Cookbook biquad transfer functions,
combined complex frequency response evaluation, phase analysis, and headroom detection.
"""

import math
from typing import List, Tuple, Dict
from ..models.profile import EQFilter, FilterType


def compute_biquad_coefficients(
    filter_type: FilterType,
    f0: float,
    gain_db: float,
    q: float,
    fs: float = 48000.0
) -> Tuple[float, float, float, float, float, float]:
    """
    Calculate normalized biquad filter coefficients (b0, b1, b2, a0, a1, a2)
    using standard Audio EQ Cookbook formulas.
    Returns (b0/a0, b1/a0, b2/a0, 1.0, a1/a0, a2/a0).
    """
    # Guard Nyquist and zero frequency
    f0 = max(10.0, min(f0, fs * 0.499))
    q = max(0.01, q)

    A = 10.0 ** (gain_db / 40.0)
    w0 = 2.0 * math.pi * f0 / fs
    cos_w0 = math.cos(w0)
    sin_w0 = math.sin(w0)
    alpha = sin_w0 / (2.0 * q)

    b0, b1, b2 = 1.0, 0.0, 0.0
    a0, a1, a2 = 1.0, 0.0, 0.0

    if filter_type == FilterType.PEAK:
        b0 = 1.0 + alpha * A
        b1 = -2.0 * cos_w0
        b2 = 1.0 - alpha * A
        a0 = 1.0 + alpha / A
        a1 = -2.0 * cos_w0
        a2 = 1.0 - alpha / A

    elif filter_type == FilterType.LOW_SHELF:
        two_sqrt_A_alpha = 2.0 * math.sqrt(A) * alpha
        b0 = A * ((A + 1.0) - (A - 1.0) * cos_w0 + two_sqrt_A_alpha)
        b1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cos_w0)
        b2 = A * ((A + 1.0) - (A - 1.0) * cos_w0 - two_sqrt_A_alpha)
        a0 = (A + 1.0) + (A - 1.0) * cos_w0 + two_sqrt_A_alpha
        a1 = -2.0 * ((A - 1.0) + (A + 1.0) * cos_w0)
        a2 = (A + 1.0) + (A - 1.0) * cos_w0 - two_sqrt_A_alpha

    elif filter_type == FilterType.HIGH_SHELF:
        two_sqrt_A_alpha = 2.0 * math.sqrt(A) * alpha
        b0 = A * ((A + 1.0) + (A - 1.0) * cos_w0 + two_sqrt_A_alpha)
        b1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cos_w0)
        b2 = A * ((A + 1.0) + (A - 1.0) * cos_w0 - two_sqrt_A_alpha)
        a0 = (A + 1.0) - (A - 1.0) * cos_w0 + two_sqrt_A_alpha
        a1 = 2.0 * ((A - 1.0) - (A + 1.0) * cos_w0)
        a2 = (A + 1.0) - (A - 1.0) * cos_w0 - two_sqrt_A_alpha

    elif filter_type == FilterType.HIGH_PASS:
        b0 = (1.0 + cos_w0) / 2.0
        b1 = -(1.0 + cos_w0)
        b2 = (1.0 + cos_w0) / 2.0
        a0 = 1.0 + alpha
        a1 = -2.0 * cos_w0
        a2 = 1.0 - alpha

    elif filter_type == FilterType.LOW_PASS:
        b0 = (1.0 - cos_w0) / 2.0
        b1 = 1.0 - cos_w0
        b2 = (1.0 - cos_w0) / 2.0
        a0 = 1.0 + alpha
        a1 = -2.0 * cos_w0
        a2 = 1.0 - alpha

    elif filter_type == FilterType.NOTCH:
        b0 = 1.0
        b1 = -2.0 * cos_w0
        b2 = 1.0
        a0 = 1.0 + alpha
        a1 = -2.0 * cos_w0
        a2 = 1.0 - alpha

    elif filter_type == FilterType.BAND_PASS:
        b0 = alpha
        b1 = 0.0
        b2 = -alpha
        a0 = 1.0 + alpha
        a1 = -2.0 * cos_w0
        a2 = 1.0 - alpha

    # Normalize by a0
    return (b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0)


def evaluate_filter_response(
    filter_obj: EQFilter,
    frequencies: List[float],
    fs: float = 48000.0
) -> List[float]:
    """Calculate the dB gain response of an individual filter across frequency points."""
    if not filter_obj.enabled:
        return [0.0] * len(frequencies)

    b0, b1, b2, _, a1, a2 = compute_biquad_coefficients(
        filter_obj.filter_type,
        filter_obj.frequency,
        filter_obj.gain_db,
        filter_obj.q,
        fs
    )

    gains_db = []
    for f in frequencies:
        w = 2.0 * math.pi * f / fs
        cos_w = math.cos(w)
        cos_2w = math.cos(2.0 * w)
        sin_w = math.sin(w)
        sin_2w = math.sin(2.0 * w)

        # Numerator: B(e^-jw) = b0 + b1*e^-jw + b2*e^-j2w
        num_re = b0 + b1 * cos_w + b2 * cos_2w
        num_im = -b1 * sin_w - b2 * sin_2w

        # Denominator: A(e^-jw) = 1 + a1*e^-jw + a2*e^-j2w
        den_re = 1.0 + a1 * cos_w + a2 * cos_2w
        den_im = -a1 * sin_w - a2 * sin_2w

        num_mag_sq = num_re * num_re + num_im * num_im
        den_mag_sq = den_re * den_re + den_im * den_im

        if den_mag_sq <= 1e-12:
            gains_db.append(0.0)
        else:
            mag = math.sqrt(num_mag_sq / den_mag_sq)
            db = 20.0 * math.log10(max(1e-6, mag))
            gains_db.append(db)

    return gains_db


def compute_combined_response(
    filters: List[EQFilter],
    preamp_db: float,
    frequencies: List[float],
    fs: float = 48000.0
) -> List[float]:
    """Compute sum of all enabled filters plus the preamp gain."""
    total_gains = [preamp_db] * len(frequencies)
    for f in filters:
        if f.enabled:
            f_gains = evaluate_filter_response(f, frequencies, fs)
            for i in range(len(frequencies)):
                total_gains[i] += f_gains[i]
    return total_gains


def generate_log_frequencies(
    num_points: int = 300,
    f_min: float = 20.0,
    f_max: float = 20000.0
) -> List[float]:
    """Generate logarithmically spaced frequency points for smooth graph rendering."""
    log_min = math.log10(f_min)
    log_max = math.log10(f_max)
    step = (log_max - log_min) / (num_points - 1)
    return [10.0 ** (log_min + i * step) for i in range(num_points)]


def analyze_profile_headroom(
    filters: List[EQFilter],
    preamp_db: float,
    fs: float = 48000.0
) -> Dict[str, float]:
    """
    Evaluate profile across 400 logarithmic frequency steps to locate the maximum positive peak.
    Calculates exact recommended preamp and clipping risk.
    """
    freqs = generate_log_frequencies(400, 20.0, 20000.0)
    raw_response = compute_combined_response(filters, 0.0, freqs, fs)
    max_boost = max(raw_response) if raw_response else 0.0

    # Recommended preamp is the negative of the max boost, plus 0.2 dB safety margin if boost > 0
    if max_boost > 0.001:
        recommended_preamp = -(max_boost + 0.2)
    else:
        recommended_preamp = 0.0

    effective_peak = max_boost + preamp_db
    is_clipping_risk = effective_peak > 0.05

    return {
        "max_boost_db": round(max_boost, 2),
        "recommended_preamp_db": round(recommended_preamp, 2),
        "effective_peak_db": round(effective_peak, 2),
        "headroom_db": round(-effective_peak, 2),
        "is_clipping_risk": is_clipping_risk
    }
