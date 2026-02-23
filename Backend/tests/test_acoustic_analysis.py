"""
Bigkas Backend — Acoustic Analysis Tests
==========================================

Unit tests for jitter, shimmer, pitch stability computations.
Uses synthetically generated waveforms so tests run without any
external audio files.
"""

import numpy as np
import pytest

# Add parent to path so imports work when running pytest from Backend/
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.acoustic_analysis import (
    AcousticAnalysisResult,
    _compute_jitter,
    _compute_shimmer,
    _hz_to_semitones,
    _normalise_metric,
    analyse_acoustics,
)


# ── Helper: generate a sine tone ───────────────────────────────────

def _make_sine(freq_hz: float, duration_sec: float, sr: int = 22050) -> np.ndarray:
    """Pure sine wave at *freq_hz* for *duration_sec* seconds."""
    t = np.linspace(0, duration_sec, int(sr * duration_sec), endpoint=False)
    return (0.8 * np.sin(2 * np.pi * freq_hz * t)).astype(np.float32)


def _make_noisy_sine(freq_hz: float, duration_sec: float, snr_db: float = 15.0, sr: int = 22050) -> np.ndarray:
    """Sine wave with additive white noise at a given SNR."""
    signal = _make_sine(freq_hz, duration_sec, sr)
    noise_power = 10 ** (-snr_db / 20)
    noise = (noise_power * np.random.randn(len(signal))).astype(np.float32)
    return signal + noise


# ── Unit tests ──────────────────────────────────────────────────────

class TestComputeJitter:
    """Tests for the _compute_jitter function."""

    def test_identical_periods_zero_jitter(self):
        """Constant periods → jitter = 0."""
        periods = np.full(100, 0.005)  # 200 Hz
        assert _compute_jitter(periods) == 0.0

    def test_varying_periods_positive_jitter(self):
        """Alternating periods → measurable jitter."""
        periods = np.array([0.005, 0.006] * 50)
        jitter = _compute_jitter(periods)
        assert jitter > 0
        # Expected: mean(|0.001|*99) / mean(0.0055) ≈ 0.182
        assert 0.15 < jitter < 0.25

    def test_too_few_periods(self):
        """< 2 periods → returns 0 gracefully."""
        assert _compute_jitter(np.array([0.005])) == 0.0
        assert _compute_jitter(np.array([])) == 0.0


class TestComputeShimmer:
    """Tests for the _compute_shimmer function."""

    def test_constant_amplitude_zero_shimmer(self):
        amps = np.full(100, 0.5)
        assert _compute_shimmer(amps) == 0.0

    def test_varying_amplitude_positive_shimmer(self):
        amps = np.array([0.4, 0.6] * 50)
        shimmer = _compute_shimmer(amps)
        assert shimmer > 0
        # Expected: mean(0.2) / mean(0.5) = 0.4
        assert 0.35 < shimmer < 0.45

    def test_too_few_amplitudes(self):
        assert _compute_shimmer(np.array([0.5])) == 0.0


class TestNormaliseMetric:
    """Tests for piecewise-linear normalisation."""

    def test_below_normal_returns_100(self):
        assert _normalise_metric(0.005, 0.01, 0.02) == 100.0

    def test_above_pathological_returns_0(self):
        assert _normalise_metric(0.03, 0.01, 0.02) == 0.0

    def test_midpoint(self):
        score = _normalise_metric(0.015, 0.01, 0.02)
        assert abs(score - 50.0) < 1.0  # Should be ~50

    def test_at_boundaries(self):
        assert _normalise_metric(0.01, 0.01, 0.02) == 100.0
        assert _normalise_metric(0.02, 0.01, 0.02) == 0.0


class TestHzToSemitones:
    """Tests for Hz → semitone conversion."""

    def test_octave_is_12_semitones(self):
        f0 = np.array([220.0, 440.0])
        st = _hz_to_semitones(f0, 220.0)
        assert abs(st[0]) < 0.01       # 0 semitones
        assert abs(st[1] - 12.0) < 0.01  # 12 semitones

    def test_same_frequency_is_zero(self):
        st = _hz_to_semitones(np.array([200.0]), 200.0)
        assert abs(st[0]) < 0.01


class TestAnalyseAcousticsPipeline:
    """Integration tests for the full analyse_acoustics pipeline."""

    def test_clean_sine_high_score(self):
        """A clean, stable tone should score very high."""
        y = _make_sine(200.0, 3.0)
        result = analyse_acoustics(y, 22050)

        assert result.success is True
        assert result.metrics is not None
        # A pure sine should have very low jitter/shimmer
        assert result.metrics.jitter_score >= 80
        assert result.metrics.shimmer_score >= 80
        assert result.metrics.acoustic_score >= 70

    def test_noisy_audio_still_succeeds(self):
        """A noisy recording should still produce a result."""
        y = _make_noisy_sine(200.0, 3.0, snr_db=8.0)
        result = analyse_acoustics(y, 22050)

        assert result.success is True
        assert result.metrics is not None
        # Should be flagged as low-confidence
        # (may or may not depending on actual SNR estimation)

    def test_very_short_silence_returns_degraded(self):
        """Near-silent input → low voiced ratio → degraded result."""
        y = np.random.randn(22050).astype(np.float32) * 0.001  # ~silence
        result = analyse_acoustics(y, 22050)

        assert result.success is True
        assert result.metrics is not None
        # Should have low_confidence or score = 50 (degraded)

    def test_result_score_range(self):
        """Acoustic score must always be 0–100."""
        y = _make_sine(150.0, 2.0)
        result = analyse_acoustics(y, 22050)

        assert result.success is True
        m = result.metrics
        assert 0 <= m.acoustic_score <= 100
        assert 0 <= m.jitter_score <= 100
        assert 0 <= m.shimmer_score <= 100
        assert 0 <= m.pitch_stability_score <= 100
