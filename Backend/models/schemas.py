"""
Bigkas Backend — Pydantic Schemas (Analysis Only)

Request / response models for the analysis API layer.
Auth, session CRUD, sync, and practice models are no longer needed
since those operations are handled directly by the frontend via Supabase.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Acoustic Analysis ──────────────────────────────────────────────

class AcousticMetricsResponse(BaseModel):
    """JSON shape returned by the acoustic analysis endpoint."""

    jitter_relative: float = Field(
        ..., description="Relative jitter (fraction, e.g. 0.008 = 0.8%)"
    )
    shimmer_relative: float = Field(
        ..., description="Relative shimmer (fraction, e.g. 0.03 = 3%)"
    )
    pitch_mean_hz: float
    pitch_median_hz: float
    pitch_std_hz: float
    pitch_std_semitones: float = Field(
        ..., description="Pitch variability in semitones"
    )
    voiced_ratio: float = Field(
        ..., description="Fraction of voiced frames (0–1)"
    )
    snr_db: float = Field(
        ..., description="Estimated signal-to-noise ratio (dB)"
    )
    duration_sec: float
    num_voiced_frames: int
    jitter_score: float = Field(..., ge=0, le=100)
    shimmer_score: float = Field(..., ge=0, le=100)
    pitch_stability_score: float = Field(..., ge=0, le=100)
    acoustic_score: float = Field(
        ..., ge=0, le=100,
        description="Weighted acoustic composite (0–100)",
    )
    low_confidence: bool
    confidence_reason: str


# ── Fluency Analysis ───────────────────────────────────────────────

class FluencyMetricsResponse(BaseModel):
    total_duration_sec: float
    speech_duration_sec: float
    silence_duration_sec: float
    silence_ratio: float
    estimated_filler_count: int
    filler_duration_sec: float
    filler_ratio: float
    silence_score: float = Field(..., ge=0, le=100)
    filler_score: float = Field(..., ge=0, le=100)
    fluency_score: float = Field(..., ge=0, le=100)
    low_confidence: bool
    confidence_reason: str


# ── Visual Analysis ────────────────────────────────────────────────

class VisualMetricsResponse(BaseModel):
    total_frames: int
    frames_with_face: int
    eye_contact_ratio: float
    avg_head_yaw_deg: float
    avg_head_pitch_deg: float
    head_stability_score: float = Field(..., ge=0, le=100)
    eye_contact_score: float = Field(..., ge=0, le=100)
    visual_engagement_score: float = Field(..., ge=0, le=100)
    low_confidence: bool
    confidence_reason: str


# ── Confidence Score ───────────────────────────────────────────────

class ConfidenceScoreResponse(BaseModel):
    speaking_confidence_score: float = Field(..., ge=0, le=100)
    acoustic_score: Optional[float] = None
    fluency_score: Optional[float] = None
    visual_score: Optional[float] = None
    weight_acoustic: float
    weight_fluency: float
    weight_visual: float
    tier: str = Field(
        ..., description="Excellent | Good | Fair | Needs Work"
    )
    summary: str


# ── Full Analysis Response ─────────────────────────────────────────

class AnalysisResponse(BaseModel):
    """Complete analysis result returned to the frontend.

    The frontend is responsible for persisting this data to Supabase.
    """

    success: bool
    confidence: ConfidenceScoreResponse
    acoustic: Optional[AcousticMetricsResponse] = None
    fluency: Optional[FluencyMetricsResponse] = None
    visual: Optional[VisualMetricsResponse] = None
    duration_sec: Optional[float] = None
    feedback: Optional[str] = None
    error: Optional[str] = None


# ── Generic ─────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    timestamp: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
