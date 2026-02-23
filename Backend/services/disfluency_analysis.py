"""
Bigkas Backend — Disfluency & Fluency Analysis Module
=====================================================

Detects filler words/sounds, calculates silence ratio, and produces
a quantitative Fluency Score (0–100).

Pipeline
--------
1.  **Silence Detection** — compute per-frame RMS energy, classify
    frames as silent or active using a dB threshold.
2.  **Filler Sound Detection** — use spectral heuristics to flag
    short, low-variation voiced segments likely to be "um"/"uh".
    (Full ASR-based filler detection would require a speech-to-text
    engine; this module provides the acoustic approximation.)
3.  **Fluency Score** — combine silence ratio and filler ratio into
    a single 0–100 score.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import librosa
import numpy as np

from utils.constants import (
    SILENCE_RATIO_GOOD,
    SILENCE_RATIO_EXCESSIVE,
)

logger = logging.getLogger(__name__)

HOP_LENGTH: int = 512
SILENCE_DB_THRESHOLD: float = -35.0  # Frames below this are "silent"

# Filler-sound heuristic thresholds
FILLER_MIN_DURATION_SEC: float = 0.15   # Fillers are ≥150 ms
FILLER_MAX_DURATION_SEC: float = 1.0    # But ≤1 s
FILLER_SPECTRAL_FLATNESS_MAX: float = 0.2  # Voiced → low flatness


@dataclass
class FluencyMetrics:
    """Quantitative fluency measurements."""

    total_duration_sec: float
    speech_duration_sec: float
    silence_duration_sec: float
    silence_ratio: float              # 0–1
    estimated_filler_count: int
    filler_duration_sec: float
    filler_ratio: float               # 0–1
    silence_score: float              # 0–100
    filler_score: float               # 0–100
    fluency_score: float              # 0–100 (weighted composite)
    low_confidence: bool = False
    confidence_reason: str = ""


@dataclass
class FluencyAnalysisResult:
    success: bool
    metrics: Optional[FluencyMetrics] = None
    error: Optional[str] = None


def _detect_silence_frames(
    y: np.ndarray,
    sr: int,
    hop_length: int = HOP_LENGTH,
    threshold_db: float = SILENCE_DB_THRESHOLD,
) -> np.ndarray:
    """Return a boolean mask where True = silent frame."""
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)
    return rms_db < threshold_db


def _detect_filler_segments(
    y: np.ndarray,
    sr: int,
    hop_length: int = HOP_LENGTH,
) -> list[dict]:
    """
    Heuristic filler-sound detection via spectral flatness + voicing.

    Fillers ("um", "uh", "er") are characterised by:
      - Voiced (low spectral flatness, i.e., tonal)
      - Short duration (150 ms – 1 s)
      - Relatively steady pitch (low F0 variance within segment)

    Returns a list of dicts with start_sec, end_sec, duration_sec.
    """
    # Get spectral flatness per frame
    flatness = librosa.feature.spectral_flatness(
        y=y, hop_length=hop_length
    )[0]

    # Get RMS to identify active (non-silent) frames
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)
    active = rms_db >= SILENCE_DB_THRESHOLD

    # Voiced + active frames = potential filler
    potential_filler = active & (flatness < FILLER_SPECTRAL_FLATNESS_MAX)

    # Group consecutive potential-filler frames into segments
    segments = []
    frame_dur = hop_length / sr
    in_segment = False
    seg_start = 0

    for i, is_filler in enumerate(potential_filler):
        if is_filler and not in_segment:
            seg_start = i
            in_segment = True
        elif not is_filler and in_segment:
            duration = (i - seg_start) * frame_dur
            if FILLER_MIN_DURATION_SEC <= duration <= FILLER_MAX_DURATION_SEC:
                segments.append({
                    "start_sec": round(seg_start * frame_dur, 3),
                    "end_sec": round(i * frame_dur, 3),
                    "duration_sec": round(duration, 3),
                })
            in_segment = False

    # Handle segment that extends to end
    if in_segment:
        duration = (len(potential_filler) - seg_start) * frame_dur
        if FILLER_MIN_DURATION_SEC <= duration <= FILLER_MAX_DURATION_SEC:
            segments.append({
                "start_sec": round(seg_start * frame_dur, 3),
                "end_sec": round(len(potential_filler) * frame_dur, 3),
                "duration_sec": round(duration, 3),
            })

    return segments


def _score_silence_ratio(ratio: float) -> float:
    """Map silence ratio to 0–100 (lower silence → higher score)."""
    if ratio <= SILENCE_RATIO_GOOD:
        return 100.0
    if ratio >= SILENCE_RATIO_EXCESSIVE:
        return 0.0
    return 100.0 * (1.0 - (ratio - SILENCE_RATIO_GOOD) / (
        SILENCE_RATIO_EXCESSIVE - SILENCE_RATIO_GOOD
    ))


def _score_filler_ratio(ratio: float) -> float:
    """Map filler ratio to 0–100.  Targets: ≤2 % excellent, ≥10 % poor."""
    good = 0.02
    poor = 0.10
    if ratio <= good:
        return 100.0
    if ratio >= poor:
        return 0.0
    return 100.0 * (1.0 - (ratio - good) / (poor - good))


def analyse_fluency(
    y: np.ndarray,
    sr: int,
    *,
    hop_length: int = HOP_LENGTH,
) -> FluencyAnalysisResult:
    """
    Analyse disfluency markers and compute a fluency score.

    Parameters
    ----------
    y : np.ndarray
        Pre-processed mono waveform.
    sr : int
        Sample rate.

    Returns
    -------
    FluencyAnalysisResult
    """
    try:
        total_dur = librosa.get_duration(y=y, sr=sr)

        # Silence detection
        silence_mask = _detect_silence_frames(y, sr, hop_length)
        frame_dur = hop_length / sr
        silence_dur = float(np.sum(silence_mask)) * frame_dur
        speech_dur = total_dur - silence_dur
        silence_ratio = silence_dur / max(total_dur, 1e-6)

        # Filler detection
        filler_segs = _detect_filler_segments(y, sr, hop_length)
        filler_count = len(filler_segs)
        filler_dur = sum(s["duration_sec"] for s in filler_segs)
        filler_ratio = filler_dur / max(speech_dur, 1e-6)

        # Scores
        silence_scr = _score_silence_ratio(silence_ratio)
        filler_scr = _score_filler_ratio(filler_ratio)

        # Weighted fluency composite (60 % silence, 40 % filler)
        fluency_score = round(0.60 * silence_scr + 0.40 * filler_scr, 2)

        metrics = FluencyMetrics(
            total_duration_sec=round(total_dur, 2),
            speech_duration_sec=round(speech_dur, 2),
            silence_duration_sec=round(silence_dur, 2),
            silence_ratio=round(silence_ratio, 4),
            estimated_filler_count=filler_count,
            filler_duration_sec=round(filler_dur, 3),
            filler_ratio=round(filler_ratio, 4),
            silence_score=round(silence_scr, 2),
            filler_score=round(filler_scr, 2),
            fluency_score=fluency_score,
        )

        logger.info(
            "Fluency analysis — silence=%.1f%% (%.1f), "
            "fillers=%d (%.1f), composite=%.1f",
            silence_ratio * 100, silence_scr,
            filler_count, filler_scr,
            fluency_score,
        )

        return FluencyAnalysisResult(success=True, metrics=metrics)

    except Exception as exc:
        logger.exception("Fluency analysis failed: %s", exc)
        return FluencyAnalysisResult(
            success=False, error=f"Fluency analysis failed: {exc}"
        )
