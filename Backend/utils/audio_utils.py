"""
Bigkas Backend — Audio Utility Functions

Pre-processing pipeline that validates, loads, and cleans raw audio
before it reaches the analysis modules.
"""

import io
import logging
import tempfile
from pathlib import Path
from typing import Tuple, Optional

import librosa
import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

# ── Constants ───────────────────────────────────────────────────────
TARGET_SR: int = 22_050          # Librosa default — good balance for speech
MIN_DURATION_SEC: float = 0.5    # Reject clips shorter than 500 ms
MAX_DURATION_SEC: float = 120.0  # Reject clips longer than 2 minutes
SILENCE_THRESHOLD_DB: float = -40.0  # dB below which a frame is "silent"


class AudioValidationError(Exception):
    """Raised when the input audio fails validation checks."""
    pass


def load_audio(
    file_bytes: bytes,
    *,
    target_sr: int = TARGET_SR,
    mono: bool = True,
) -> Tuple[np.ndarray, int]:
    """
    Load raw bytes into a NumPy waveform array.

    Parameters
    ----------
    file_bytes : bytes
        Raw file content (.wav, .mp3, .ogg, .webm, etc.).
    target_sr : int
        Target sample rate for resampling.
    mono : bool
        If True, down-mix to single channel.

    Returns
    -------
    y : np.ndarray (float32, shape=(n_samples,))
        The mono waveform normalised to [-1, 1].
    sr : int
        The sample rate after resampling.

    Raises
    ------
    AudioValidationError
        If the file cannot be decoded or is too short / too long.
    """
    try:
        # Write bytes to a temporary file — librosa.load needs a path or
        # file-like object, but not all codecs work with BytesIO.
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        y, sr = librosa.load(tmp_path, sr=target_sr, mono=mono)
        Path(tmp_path).unlink(missing_ok=True)
    except Exception as exc:
        raise AudioValidationError(
            f"Failed to decode audio file: {exc}"
        ) from exc

    duration = librosa.get_duration(y=y, sr=sr)

    if duration < MIN_DURATION_SEC:
        raise AudioValidationError(
            f"Audio is too short ({duration:.2f}s). "
            f"Minimum duration is {MIN_DURATION_SEC}s."
        )

    if duration > MAX_DURATION_SEC:
        raise AudioValidationError(
            f"Audio is too long ({duration:.2f}s). "
            f"Maximum duration is {MAX_DURATION_SEC}s."
        )

    logger.info(
        "Audio loaded — duration=%.2fs, sr=%d, samples=%d",
        duration, sr, len(y),
    )
    return y, sr


def trim_silence(
    y: np.ndarray,
    sr: int,
    *,
    top_db: float = 30.0,
) -> np.ndarray:
    """
    Trim leading/trailing silence from the waveform.

    Uses librosa.effects.trim which finds the first and last frames
    whose RMS energy exceeds *top_db* dB below the waveform peak.
    """
    y_trimmed, _ = librosa.effects.trim(y, top_db=top_db)
    trimmed_dur = librosa.get_duration(y=y_trimmed, sr=sr)

    if trimmed_dur < MIN_DURATION_SEC:
        logger.warning(
            "After trimming silence the clip is only %.2fs — "
            "returning original waveform.",
            trimmed_dur,
        )
        return y

    return y_trimmed


def apply_noise_gate(
    y: np.ndarray,
    sr: int,
    *,
    threshold_db: float = SILENCE_THRESHOLD_DB,
    frame_length: int = 2048,
    hop_length: int = 512,
) -> np.ndarray:
    """
    Zero-out frames whose RMS energy is below *threshold_db*.

    This is a simple noise-gate that suppresses very-low-energy frames
    (background hum, breath noise) without distorting the signal.

    Parameters
    ----------
    y : np.ndarray
        Input waveform.
    sr : int
        Sample rate (unused but kept for API consistency).
    threshold_db : float
        RMS frames below this level (in dB) are zeroed.
    frame_length : int
        STFT frame length.
    hop_length : int
        STFT hop between frames.

    Returns
    -------
    y_gated : np.ndarray
        Noise-gated waveform (same shape as *y*).
    """
    rms = librosa.feature.rms(
        y=y, frame_length=frame_length, hop_length=hop_length
    )[0]

    # Convert threshold from dB to linear
    threshold_linear = librosa.db_to_amplitude(threshold_db)

    # Build a per-sample mask by expanding the frame-level gate
    mask = np.repeat(rms >= threshold_linear, hop_length)[: len(y)]
    if len(mask) < len(y):
        mask = np.pad(mask, (0, len(y) - len(mask)), constant_values=True)

    return y * mask.astype(y.dtype)


def preprocess(
    file_bytes: bytes,
    *,
    target_sr: int = TARGET_SR,
    trim: bool = True,
    noise_gate: bool = True,
) -> Tuple[np.ndarray, int]:
    """
    Full preprocessing pipeline: load → trim → noise-gate.

    This is the single entry-point that analysis modules should call.
    """
    y, sr = load_audio(file_bytes, target_sr=target_sr)

    if trim:
        y = trim_silence(y, sr)

    if noise_gate:
        y = apply_noise_gate(y, sr)

    return y, sr


def compute_snr(y: np.ndarray, sr: int) -> float:
    """
    Estimate Signal-to-Noise Ratio (SNR) in dB.

    Uses a simple energy-based heuristic:
      - Signal frames  = top 80 % of RMS energy
      - Noise frames   = bottom 20 % of RMS energy

    Returns
    -------
    snr_db : float
        Estimated SNR in decibels.  A value < 10 dB is very noisy.
    """
    rms = librosa.feature.rms(y=y)[0]
    sorted_rms = np.sort(rms)
    n = len(sorted_rms)

    noise_rms = np.mean(sorted_rms[: max(1, n // 5)]) + 1e-10
    signal_rms = np.mean(sorted_rms[n // 5 :]) + 1e-10

    snr_db = 20.0 * np.log10(signal_rms / noise_rms)
    return float(snr_db)
