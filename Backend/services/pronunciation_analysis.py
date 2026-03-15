"""
Pronunciation analysis powered by OpenAI Whisper (open source).

The module transcribes user audio and estimates a pronunciation score (0-100)
using target-text match plus model confidence proxies.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_whisper_model = None


def _normalise_text(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _get_whisper_model():
    """Lazy-load Whisper model to keep startup fast."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    try:
        import whisper

        # tiny is fast enough for consumer hardware while keeping decent quality
        _whisper_model = whisper.load_model("tiny")
        return _whisper_model
    except Exception as exc:
        logger.warning("Whisper model unavailable: %s", exc)
        return None


@dataclass
class PronunciationMetrics:
    transcript: str
    target_text: str
    text_similarity: float      # 0-1
    asr_confidence: float       # 0-1
    pronunciation_score: float  # 0-100
    low_confidence: bool = False
    confidence_reason: str = ""


@dataclass
class PronunciationAnalysisResult:
    success: bool
    metrics: Optional[PronunciationMetrics] = None
    error: Optional[str] = None


def _confidence_from_segments(segments: list[dict]) -> float:
    """Convert Whisper segment log-probabilities into a 0-1 confidence proxy."""
    if not segments:
        return 0.0

    vals = []
    for seg in segments:
        avg_logprob = float(seg.get("avg_logprob", -2.0))
        no_speech_prob = float(seg.get("no_speech_prob", 0.0))

        # avg_logprob around -0.1 is good, around -2 is poor
        logprob_score = max(0.0, min(1.0, (avg_logprob + 2.0) / 1.9))
        speech_score = 1.0 - max(0.0, min(1.0, no_speech_prob))
        vals.append(0.7 * logprob_score + 0.3 * speech_score)

    return float(sum(vals) / len(vals))


def analyse_pronunciation(audio_path: str | Path, target_text: str = "") -> PronunciationAnalysisResult:
    """
    Run Whisper transcription and estimate pronunciation quality.

    Score formula:
        pronunciation = 100 * (0.75 * text_similarity + 0.25 * asr_confidence)
    """
    try:
        model = _get_whisper_model()
        if model is None:
            return PronunciationAnalysisResult(
                success=True,
                metrics=PronunciationMetrics(
                    transcript="",
                    target_text=target_text or "",
                    text_similarity=0.0,
                    asr_confidence=0.0,
                    pronunciation_score=50.0,
                    low_confidence=True,
                    confidence_reason="Whisper model unavailable. Returning neutral pronunciation score.",
                ),
            )

        result = model.transcribe(str(audio_path), language="en", task="transcribe")
        transcript = _normalise_text(result.get("text", ""))
        target = _normalise_text(target_text)

        if target:
            text_similarity = SequenceMatcher(None, transcript, target).ratio()
        else:
            # No target text provided: use transcript quality proxy only
            text_similarity = 0.65 if transcript else 0.0

        segments = result.get("segments") or []
        asr_conf = _confidence_from_segments(segments)

        score = 100.0 * (0.75 * text_similarity + 0.25 * asr_conf)
        score = round(max(0.0, min(100.0, score)), 2)

        low_conf = len(transcript) < 8
        reason = "Very short transcript detected." if low_conf else ""

        return PronunciationAnalysisResult(
            success=True,
            metrics=PronunciationMetrics(
                transcript=transcript,
                target_text=target,
                text_similarity=round(text_similarity, 4),
                asr_confidence=round(asr_conf, 4),
                pronunciation_score=score,
                low_confidence=low_conf,
                confidence_reason=reason,
            ),
        )
    except Exception as exc:
        logger.exception("Pronunciation analysis failed: %s", exc)
        return PronunciationAnalysisResult(success=False, error=f"Pronunciation analysis failed: {exc}")
