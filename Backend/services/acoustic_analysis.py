"""
Bigkas Backend — Acoustic Analysis Module
==========================================

Extracts **Jitter**, **Shimmer**, and **Pitch Stability** from a
mono waveform using Librosa and fundamental signal-processing.

Theory
------
* **Jitter** — cycle-to-cycle variation in the fundamental period (T₀).
  High jitter signals vocal trembling, a common marker of speaking
  anxiety (PSA).  We compute *relative jitter* (a.k.a. jitter %):

        Jitter_rel = (1 / (N-1)) Σ|Tᵢ - Tᵢ₊₁| / T̄

  where Tᵢ is the i-th pitch period and T̄ is the mean period.

* **Shimmer** — cycle-to-cycle variation in amplitude.  High shimmer
  indicates breathiness or poor vocal projection:

        Shimmer_rel = (1 / (N-1)) Σ|Aᵢ - Aᵢ₊₁| / Ā

  where Aᵢ is the peak amplitude of the i-th voiced frame.

* **Pitch Stability** — standard deviation of the fundamental
  frequency (F0) expressed in **semitones** relative to the median.
  A stable speaker keeps σ ≤ 2 st; anxious speakers often exceed 4 st.

Noise Resilience
----------------
1.  **SNR check** — if estimated SNR < 10 dB, we flag the result as
    low-confidence and widen the normalization window so that noisy
    recordings are not unfairly penalised.
2.  **Voiced-frame filtering** — only pitched (voiced) frames are
    included; unvoiced/silent frames are discarded before computing
    jitter, shimmer, and pitch statistics.
3.  **Outlier capping** — F0 values outside the plausible speech range
    (75–600 Hz) are excluded to prevent harmonic-tracking artefacts
    from skewing the metrics.
4.  **Minimum-voiced-ratio guard** — if less than 20 % of frames are
    voiced we return a degraded-confidence result rather than crashing.

Normalisation to 0–100
----------------------
Each metric is converted to a 0–100 sub-score via a piecewise-linear
mapping:
    * Value ≤ normal threshold  → 100 (excellent)
    * Value ≥ pathological upper → 0 (very poor)
    * Value in between          → linear interpolation

The three sub-scores are combined with configurable weights to produce
the *acoustic component* of the Speaking Confidence Score.

References
----------
* Teixeira, J.P., Oliveira, C. & Lopes, C., 2013.  Vocal Acoustic
  Analysis — Jitter, Shimmer and HNR Parameters.  Procedia Technology.
* Baken, R.J. & Orlikoff, R.F., 2000.  Clinical Measurement of Speech
  and Voice.  Singular Publishing Group.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional, Tuple

import librosa
import numpy as np

from utils.audio_utils import compute_snr
from utils.constants import (
    JITTER_NORMAL_UPPER,
    JITTER_PATHOLOGICAL_UPPER,
    MIN_SNR_DB,
    PITCH_SD_STABLE,
    PITCH_SD_UNSTABLE,
    SHIMMER_NORMAL_UPPER,
    SHIMMER_PATHOLOGICAL_UPPER,
)

logger = logging.getLogger(__name__)

# ── Tunable Constants ───────────────────────────────────────────────
F0_MIN_HZ: float = 75.0           # Lowest plausible F0 (male bass)
F0_MAX_HZ: float = 600.0          # Highest plausible F0 (child/soprano)
MIN_VOICED_RATIO: float = 0.20    # Need ≥ 20 % voiced frames
HOP_LENGTH: int = 512             # ~23 ms at 22 050 Hz

# Sub-score weights *within* the acoustic component
W_JITTER: float = 0.35
W_SHIMMER: float = 0.35
W_PITCH: float = 0.30


# ── Data Classes ────────────────────────────────────────────────────
@dataclass
class AcousticMetrics:
    """Raw acoustic measurements extracted from the waveform."""

    jitter_relative: float          # Relative jitter (0–1 fraction)
    shimmer_relative: float         # Relative shimmer (0–1 fraction)
    pitch_mean_hz: float            # Mean F0 in Hz
    pitch_median_hz: float          # Median F0 in Hz
    pitch_std_hz: float             # Std-dev of F0 in Hz
    pitch_std_semitones: float      # Std-dev of F0 in semitones
    voiced_ratio: float             # Fraction of voiced frames
    snr_db: float                   # Estimated Signal-to-Noise Ratio
    duration_sec: float             # Total audio duration
    num_voiced_frames: int          # Count of valid voiced frames

    # Derived sub-scores (0–100)
    jitter_score: float = 0.0
    shimmer_score: float = 0.0
    pitch_stability_score: float = 0.0
    acoustic_score: float = 0.0     # Weighted composite

    # Confidence flag
    low_confidence: bool = False
    confidence_reason: str = ""


@dataclass
class AcousticAnalysisResult:
    """Public-facing result returned by the analysis function."""

    success: bool
    metrics: Optional[AcousticMetrics] = None
    error: Optional[str] = None


# ── Core Extraction Functions ───────────────────────────────────────

def _extract_f0(
    y: np.ndarray,
    sr: int,
    *,
    fmin: float = F0_MIN_HZ,
    fmax: float = F0_MAX_HZ,
    hop_length: int = HOP_LENGTH,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract the fundamental frequency (F0) contour using pYIN.

    pYIN (probabilistic YIN) is more robust than plain autocorrelation
    on noisy, consumer-grade microphone input.

    Returns
    -------
    f0 : np.ndarray
        F0 per frame (Hz).  Unvoiced frames are np.nan.
    voiced_flag : np.ndarray[bool]
        True for voiced frames, False otherwise.
    """
    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=fmin,
        fmax=fmax,
        sr=sr,
        hop_length=hop_length,
        fill_na=np.nan,
    )
    return f0, voiced_flag


def _compute_jitter(periods: np.ndarray) -> float:
    """
    Compute **relative jitter** from an array of pitch periods (seconds).

            Jitter_rel = mean(|Tᵢ - Tᵢ₊₁|) / mean(T)

    Parameters
    ----------
    periods : np.ndarray
        Consecutive pitch periods in seconds.  Must have len ≥ 2.

    Returns
    -------
    jitter : float
        Relative jitter as a fraction (e.g., 0.008 = 0.8 %).
    """
    if len(periods) < 2:
        return 0.0

    period_diffs = np.abs(np.diff(periods))
    mean_period = np.mean(periods)

    if mean_period < 1e-10:
        return 0.0

    jitter = np.mean(period_diffs) / mean_period
    return float(jitter)


def _compute_shimmer(amplitudes: np.ndarray) -> float:
    """
    Compute **relative shimmer** from per-cycle peak amplitudes.

            Shimmer_rel = mean(|Aᵢ - Aᵢ₊₁|) / mean(A)

    Parameters
    ----------
    amplitudes : np.ndarray
        Peak amplitude of each voiced pitch cycle.  Must have len ≥ 2.

    Returns
    -------
    shimmer : float
        Relative shimmer as a fraction (e.g., 0.03 = 3 %).
    """
    if len(amplitudes) < 2:
        return 0.0

    amp_diffs = np.abs(np.diff(amplitudes))
    mean_amp = np.mean(amplitudes)

    if mean_amp < 1e-10:
        return 0.0

    shimmer = np.mean(amp_diffs) / mean_amp
    return float(shimmer)


def _extract_cycle_amplitudes(
    y: np.ndarray,
    sr: int,
    f0_voiced: np.ndarray,
    hop_length: int = HOP_LENGTH,
) -> np.ndarray:
    """
    Estimate per-cycle peak amplitudes aligned with voiced F0 frames.

    For each voiced frame we compute the RMS energy in a window centred
    on that frame.  This is a robust proxy for per-cycle amplitude that
    works even when exact glottal-pulse boundaries are not available.

    Parameters
    ----------
    y : np.ndarray
        Mono waveform.
    sr : int
        Sample rate.
    f0_voiced : np.ndarray
        F0 values for voiced frames only (Hz).
    hop_length : int
        Hop that was used for F0 extraction.

    Returns
    -------
    amplitudes : np.ndarray
        Per-frame peak amplitude (linear scale).
    """
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]

    # We'll map the voiced-frame indices to RMS frames
    # Since f0_voiced was filtered, we pass through the frame-level RMS
    # Note: f0_voiced length may differ from rms length after filtering,
    # so we take the minimum overlap.
    n = min(len(f0_voiced), len(rms))
    return rms[:n]


def _hz_to_semitones(f0_hz: np.ndarray, ref_hz: float) -> np.ndarray:
    """
    Convert F0 values from Hz to semitones relative to *ref_hz*.

    semitones = 12 * log₂(f / ref)
    """
    with np.errstate(divide="ignore", invalid="ignore"):
        semitones = 12.0 * np.log2(f0_hz / ref_hz)
    return semitones


# ── Normalisation Helpers ───────────────────────────────────────────

def _normalise_metric(
    value: float,
    normal_upper: float,
    pathological_upper: float,
) -> float:
    """
    Map a raw metric to a 0–100 sub-score via piecewise-linear scaling.

    * value ≤ normal_upper         → 100  (excellent)
    * value ≥ pathological_upper   →   0  (very poor)
    * in between                   → linear interpolation

    The "lower is better" convention is used for jitter, shimmer,
    and pitch-std because lower values indicate healthier vocal control.
    """
    if value <= normal_upper:
        return 100.0
    if value >= pathological_upper:
        return 0.0

    # Linear interpolation between the two thresholds
    score = 100.0 * (1.0 - (value - normal_upper) / (pathological_upper - normal_upper))
    return max(0.0, min(100.0, score))


# ── Public API ──────────────────────────────────────────────────────

def analyse_acoustics(
    y: np.ndarray,
    sr: int,
    *,
    hop_length: int = HOP_LENGTH,
) -> AcousticAnalysisResult:
    """
    Full acoustic analysis pipeline.

    Parameters
    ----------
    y : np.ndarray
        Pre-processed mono waveform (float32, normalised to [-1, 1]).
    sr : int
        Sample rate (typically 22 050 Hz after preprocessing).
    hop_length : int
        Hop size for STFT / F0 analysis.

    Returns
    -------
    AcousticAnalysisResult
        Contains ``success=True`` and populated ``metrics`` on success,
        or ``success=False`` and an ``error`` message on failure.

    Example
    -------
    >>> from utils.audio_utils import preprocess
    >>> y, sr = preprocess(raw_bytes)
    >>> result = analyse_acoustics(y, sr)
    >>> if result.success:
    ...     print(f"Jitter:  {result.metrics.jitter_relative:.4f}")
    ...     print(f"Shimmer: {result.metrics.shimmer_relative:.4f}")
    ...     print(f"Score:   {result.metrics.acoustic_score:.1f}/100")
    """
    try:
        duration = librosa.get_duration(y=y, sr=sr)

        # ── Step 1: Estimate SNR ────────────────────────────────────
        snr_db = compute_snr(y, sr)
        low_confidence = snr_db < MIN_SNR_DB
        confidence_reason = ""
        if low_confidence:
            confidence_reason = (
                f"Low SNR ({snr_db:.1f} dB < {MIN_SNR_DB} dB). "
                "Results may be less accurate."
            )
            logger.warning(confidence_reason)

        # ── Step 2: Extract F0 contour ──────────────────────────────
        f0_raw, voiced_flag = _extract_f0(y, sr, hop_length=hop_length)

        # Filter to voiced frames only, removing NaN & out-of-range
        voiced_mask = voiced_flag & ~np.isnan(f0_raw)
        if voiced_mask.any():
            f0_valid = f0_raw[voiced_mask]
            # Outlier capping: discard values outside plausible range
            range_mask = (f0_valid >= F0_MIN_HZ) & (f0_valid <= F0_MAX_HZ)
            f0_valid = f0_valid[range_mask]
        else:
            f0_valid = np.array([])

        num_total_frames = len(f0_raw)
        num_voiced = len(f0_valid)
        voiced_ratio = num_voiced / max(num_total_frames, 1)

        # Guard: not enough voiced content
        if voiced_ratio < MIN_VOICED_RATIO or num_voiced < 2:
            return AcousticAnalysisResult(
                success=True,
                metrics=AcousticMetrics(
                    jitter_relative=0.0,
                    shimmer_relative=0.0,
                    pitch_mean_hz=0.0,
                    pitch_median_hz=0.0,
                    pitch_std_hz=0.0,
                    pitch_std_semitones=0.0,
                    voiced_ratio=voiced_ratio,
                    snr_db=snr_db,
                    duration_sec=duration,
                    num_voiced_frames=num_voiced,
                    jitter_score=50.0,
                    shimmer_score=50.0,
                    pitch_stability_score=50.0,
                    acoustic_score=50.0,
                    low_confidence=True,
                    confidence_reason=(
                        f"Insufficient voiced content ({voiced_ratio:.0%}). "
                        "Scores are estimated."
                    ),
                ),
            )

        # ── Step 3: Compute pitch periods ───────────────────────────
        periods = 1.0 / f0_valid  # T = 1 / F0

        # ── Step 4: Compute jitter ──────────────────────────────────
        jitter_rel = _compute_jitter(periods)

        # ── Step 5: Compute shimmer ─────────────────────────────────
        # Build a boolean index into the original f0 array so we can
        # pull the corresponding RMS amplitudes.
        rms_all = librosa.feature.rms(y=y, hop_length=hop_length)[0]

        # Align voiced indices: the mask was applied to f0_raw; we
        # AND with the range_mask applied to f0_valid. Rebuild the
        # full-length mask.
        full_mask = np.zeros(len(f0_raw), dtype=bool)
        voiced_indices = np.where(voiced_mask)[0]
        # Apply range mask on voiced-only subset
        range_indices = voiced_indices[range_mask] if len(voiced_indices) == len(
            f0_raw[voiced_mask]
        ) else voiced_indices[: len(range_mask)][range_mask]

        amplitudes: np.ndarray
        if len(range_indices) > 0 and len(rms_all) > 0:
            safe_indices = range_indices[range_indices < len(rms_all)]
            amplitudes = rms_all[safe_indices]
        else:
            amplitudes = rms_all[: num_voiced]

        shimmer_rel = _compute_shimmer(amplitudes)

        # ── Step 6: Pitch statistics ────────────────────────────────
        pitch_mean = float(np.mean(f0_valid))
        pitch_median = float(np.median(f0_valid))
        pitch_std_hz = float(np.std(f0_valid))

        # Convert to semitones for perceptually-uniform measurement
        f0_semitones = _hz_to_semitones(f0_valid, pitch_median)
        pitch_std_st = float(np.nanstd(f0_semitones))

        # ── Step 7: Normalise to 0–100 sub-scores ──────────────────
        # For noisy audio, widen the "normal" thresholds by 30 % so we
        # don't over-penalise genuine speech masked by noise.
        noise_factor = 1.3 if low_confidence else 1.0

        jitter_score = _normalise_metric(
            jitter_rel,
            JITTER_NORMAL_UPPER * noise_factor,
            JITTER_PATHOLOGICAL_UPPER * noise_factor,
        )

        shimmer_score = _normalise_metric(
            shimmer_rel,
            SHIMMER_NORMAL_UPPER * noise_factor,
            SHIMMER_PATHOLOGICAL_UPPER * noise_factor,
        )

        pitch_score = _normalise_metric(
            pitch_std_st,
            PITCH_SD_STABLE * noise_factor,
            PITCH_SD_UNSTABLE * noise_factor,
        )

        # ── Step 8: Weighted acoustic composite ────────────────────
        acoustic_score = (
            W_JITTER * jitter_score
            + W_SHIMMER * shimmer_score
            + W_PITCH * pitch_score
        )
        acoustic_score = round(max(0.0, min(100.0, acoustic_score)), 2)

        metrics = AcousticMetrics(
            jitter_relative=round(jitter_rel, 6),
            shimmer_relative=round(shimmer_rel, 6),
            pitch_mean_hz=round(pitch_mean, 2),
            pitch_median_hz=round(pitch_median, 2),
            pitch_std_hz=round(pitch_std_hz, 2),
            pitch_std_semitones=round(pitch_std_st, 4),
            voiced_ratio=round(voiced_ratio, 4),
            snr_db=round(snr_db, 2),
            duration_sec=round(duration, 2),
            num_voiced_frames=num_voiced,
            jitter_score=round(jitter_score, 2),
            shimmer_score=round(shimmer_score, 2),
            pitch_stability_score=round(pitch_score, 2),
            acoustic_score=acoustic_score,
            low_confidence=low_confidence,
            confidence_reason=confidence_reason,
        )

        logger.info(
            "Acoustic analysis complete — jitter=%.4f (%.1f), "
            "shimmer=%.4f (%.1f), pitch_σ=%.2f st (%.1f), "
            "composite=%.1f, snr=%.1f dB",
            jitter_rel, jitter_score,
            shimmer_rel, shimmer_score,
            pitch_std_st, pitch_score,
            acoustic_score, snr_db,
        )

        return AcousticAnalysisResult(success=True, metrics=metrics)

    except Exception as exc:
        logger.exception("Acoustic analysis failed: %s", exc)
        return AcousticAnalysisResult(
            success=False,
            error=f"Acoustic analysis failed: {exc}",
        )
