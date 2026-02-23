"""
Bigkas Backend — Speaking Confidence Score
==========================================

Synthesises acoustic, fluency, and visual sub-scores into the final
composite **Speaking Confidence Score** (0–100).

Scoring Formula
---------------
    Score = W_acoustic × Acoustic + W_fluency × Fluency + W_visual × Visual

Default weights (configurable in settings):
  * Acoustic  = 30 %  (jitter + shimmer + pitch stability)
  * Fluency   = 35 %  (silence ratio + filler ratio)
  * Visual    = 35 %  (eye contact + head stability)

When a sub-module is unavailable (e.g., audio-only session with no
video), the missing component's weight is redistributed proportionally
across the remaining components.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class ConfidenceScoreResult:
    """Final composite speaking confidence score."""

    speaking_confidence_score: float     # 0–100
    acoustic_score: Optional[float]      # 0–100 or None
    fluency_score: Optional[float]       # 0–100 or None
    visual_score: Optional[float]        # 0–100 or None

    # Effective weights used (after redistribution)
    weight_acoustic: float
    weight_fluency: float
    weight_visual: float

    # Human-readable tier
    tier: str            # "Excellent" | "Good" | "Fair" | "Needs Work"
    summary: str         # One-line natural-language summary


def _tier_and_summary(score: float) -> tuple[str, str]:
    """Map score to a descriptive tier and summary."""
    if score >= 85:
        return "Excellent", (
            "Outstanding performance! Your vocal control, fluency, "
            "and visual engagement are all strong."
        )
    if score >= 70:
        return "Good", (
            "Solid delivery. Minor areas for improvement in vocal "
            "steadiness or eye contact."
        )
    if score >= 50:
        return "Fair", (
            "Decent effort with noticeable room for growth. Focus on "
            "reducing filler words and maintaining eye contact."
        )
    return "Needs Work", (
        "Keep practising! Work on steadying your voice, reducing "
        "pauses, and looking at the camera more consistently."
    )


def compute_confidence_score(
    *,
    acoustic_score: Optional[float] = None,
    fluency_score: Optional[float] = None,
    visual_score: Optional[float] = None,
) -> ConfidenceScoreResult:
    """
    Compute the weighted Speaking Confidence Score.

    Parameters
    ----------
    acoustic_score : float | None
        Acoustic sub-score (0–100).  None if audio analysis unavailable.
    fluency_score : float | None
        Fluency sub-score (0–100).  None if fluency analysis unavailable.
    visual_score : float | None
        Visual sub-score (0–100).  None if no video provided.

    Returns
    -------
    ConfidenceScoreResult
    """
    # Collect available components with their configured weights
    components: list[tuple[float, float]] = []  # (weight, score)
    w_a = settings.WEIGHT_ACOUSTIC
    w_f = settings.WEIGHT_FLUENCY
    w_v = settings.WEIGHT_VISUAL

    if acoustic_score is not None:
        components.append((w_a, acoustic_score))
    if fluency_score is not None:
        components.append((w_f, fluency_score))
    if visual_score is not None:
        components.append((w_v, visual_score))

    if not components:
        # No data at all — return zero
        tier, summary = _tier_and_summary(0.0)
        return ConfidenceScoreResult(
            speaking_confidence_score=0.0,
            acoustic_score=None,
            fluency_score=None,
            visual_score=None,
            weight_acoustic=0.0,
            weight_fluency=0.0,
            weight_visual=0.0,
            tier=tier,
            summary=summary,
        )

    # Redistribute weights proportionally
    total_weight = sum(w for w, _ in components)
    normalised = [(w / total_weight, s) for w, s in components]

    composite = sum(w * s for w, s in normalised)
    composite = round(max(0.0, min(100.0, composite)), 2)

    # Compute effective weights for response
    eff_a = (w_a / total_weight) if acoustic_score is not None else 0.0
    eff_f = (w_f / total_weight) if fluency_score is not None else 0.0
    eff_v = (w_v / total_weight) if visual_score is not None else 0.0

    tier, summary = _tier_and_summary(composite)

    logger.info(
        "Confidence score=%.1f [acoustic=%.1f(%.0f%%), "
        "fluency=%.1f(%.0f%%), visual=%.1f(%.0f%%)] → %s",
        composite,
        acoustic_score or 0, eff_a * 100,
        fluency_score or 0, eff_f * 100,
        visual_score or 0, eff_v * 100,
        tier,
    )

    return ConfidenceScoreResult(
        speaking_confidence_score=composite,
        acoustic_score=acoustic_score,
        fluency_score=fluency_score,
        visual_score=visual_score,
        weight_acoustic=round(eff_a, 4),
        weight_fluency=round(eff_f, 4),
        weight_visual=round(eff_v, 4),
        tier=tier,
        summary=summary,
    )
