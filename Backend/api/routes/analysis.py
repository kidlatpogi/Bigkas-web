"""
Bigkas Backend — Analysis Routes
=================================

POST /api/analysis/analyse-audio   — Audio-only analysis (acoustic + fluency)
POST /api/analysis/analyse-full    — Full multi-modal analysis (audio + video)
"""

from __future__ import annotations

import io
import logging
import tempfile
from typing import Optional

import cv2
import numpy as np
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from api.middleware.auth import get_current_user
from models.schemas import (
    AcousticMetricsResponse,
    AnalysisResponse,
    ConfidenceScoreResponse,
    ErrorResponse,
    FluencyMetricsResponse,
    VisualMetricsResponse,
)
from services.acoustic_analysis import analyse_acoustics
from services.confidence_scorer import compute_confidence_score
from services.disfluency_analysis import analyse_fluency
from services.visual_analysis import analyse_video_frames
from utils.audio_utils import AudioValidationError, preprocess
from utils.constants import ALLOWED_AUDIO_TYPES, MAX_DURATION_SEC

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post(
    "/analyse-audio",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Analyse uploaded audio (acoustic + fluency)",
)
async def analyse_audio_endpoint(
    audio: UploadFile = File(..., description="Audio file (.wav, .mp3, .webm, etc.)"),
    target_text: str = Form("", description="The text the user was reading"),
    user: dict = Depends(get_current_user),
):
    """
    Accepts an audio file upload, runs the **Acoustic Analysis** and
    **Fluency Analysis** pipelines, computes the Speaking Confidence
    Score (audio-only mode — visual weight redistributed), and returns
    the full result.
    """
    # ── Validate upload ─────────────────────────────────────────────
    if audio.content_type and audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio type: {audio.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_AUDIO_TYPES)}",
        )

    file_bytes = await audio.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ── Preprocess ──────────────────────────────────────────────────
    try:
        y, sr = preprocess(file_bytes)
    except AudioValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # ── Acoustic analysis ───────────────────────────────────────────
    acoustic_result = analyse_acoustics(y, sr)
    acoustic_resp = None
    acoustic_score_val = None

    if acoustic_result.success and acoustic_result.metrics:
        m = acoustic_result.metrics
        acoustic_resp = AcousticMetricsResponse(
            jitter_relative=m.jitter_relative,
            shimmer_relative=m.shimmer_relative,
            pitch_mean_hz=m.pitch_mean_hz,
            pitch_median_hz=m.pitch_median_hz,
            pitch_std_hz=m.pitch_std_hz,
            pitch_std_semitones=m.pitch_std_semitones,
            voiced_ratio=m.voiced_ratio,
            snr_db=m.snr_db,
            duration_sec=m.duration_sec,
            num_voiced_frames=m.num_voiced_frames,
            jitter_score=m.jitter_score,
            shimmer_score=m.shimmer_score,
            pitch_stability_score=m.pitch_stability_score,
            acoustic_score=m.acoustic_score,
            low_confidence=m.low_confidence,
            confidence_reason=m.confidence_reason,
        )
        acoustic_score_val = m.acoustic_score

    # ── Fluency analysis ────────────────────────────────────────────
    fluency_result = analyse_fluency(y, sr)
    fluency_resp = None
    fluency_score_val = None

    if fluency_result.success and fluency_result.metrics:
        f = fluency_result.metrics
        fluency_resp = FluencyMetricsResponse(
            total_duration_sec=f.total_duration_sec,
            speech_duration_sec=f.speech_duration_sec,
            silence_duration_sec=f.silence_duration_sec,
            silence_ratio=f.silence_ratio,
            estimated_filler_count=f.estimated_filler_count,
            filler_duration_sec=f.filler_duration_sec,
            filler_ratio=f.filler_ratio,
            silence_score=f.silence_score,
            filler_score=f.filler_score,
            fluency_score=f.fluency_score,
            low_confidence=f.low_confidence,
            confidence_reason=f.confidence_reason,
        )
        fluency_score_val = f.fluency_score

    # ── Composite confidence score (audio-only) ────────────────────
    confidence = compute_confidence_score(
        acoustic_score=acoustic_score_val,
        fluency_score=fluency_score_val,
        visual_score=None,  # no video in this endpoint
    )

    confidence_resp = ConfidenceScoreResponse(
        speaking_confidence_score=confidence.speaking_confidence_score,
        acoustic_score=confidence.acoustic_score,
        fluency_score=confidence.fluency_score,
        visual_score=confidence.visual_score,
        weight_acoustic=confidence.weight_acoustic,
        weight_fluency=confidence.weight_fluency,
        weight_visual=confidence.weight_visual,
        tier=confidence.tier,
        summary=confidence.summary,
    )

    duration = acoustic_resp.duration_sec if acoustic_resp else None

    return AnalysisResponse(
        success=True,
        confidence=confidence_resp,
        acoustic=acoustic_resp,
        fluency=fluency_resp,
        visual=None,
        duration_sec=duration,
    )


@router.post(
    "/analyse-full",
    response_model=AnalysisResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Full multi-modal analysis (audio + video)",
)
async def analyse_full_endpoint(
    audio: UploadFile = File(..., description="Audio file"),
    video: UploadFile = File(..., description="Video file (.mp4, .webm)"),
    target_text: str = Form("", description="The text the user was reading"),
    user: dict = Depends(get_current_user),
):
    """
    Accepts both audio and video uploads.  Runs acoustic, fluency,
    *and* visual analysis pipelines, then computes the full composite
    Speaking Confidence Score.
    """
    # ── Audio processing ────────────────────────────────────────────
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    try:
        y, sr = preprocess(audio_bytes)
    except AudioValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    acoustic_result = analyse_acoustics(y, sr)
    fluency_result = analyse_fluency(y, sr)

    # ── Video processing ────────────────────────────────────────────
    video_bytes = await video.read()
    frames = []
    if video_bytes:
        # Write to temp file for OpenCV
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        cap = cv2.VideoCapture(tmp_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        # Sample ~2 frames per second to keep processing fast
        sample_interval = max(1, int(fps / 2))
        frame_idx = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % sample_interval == 0:
                # Convert BGR → RGB for MediaPipe
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frame_idx += 1

        cap.release()

    visual_result = analyse_video_frames(frames) if frames else None

    # ── Build responses ─────────────────────────────────────────────
    acoustic_resp = None
    acoustic_score_val = None
    if acoustic_result.success and acoustic_result.metrics:
        m = acoustic_result.metrics
        acoustic_resp = AcousticMetricsResponse(**{
            k: getattr(m, k) for k in AcousticMetricsResponse.model_fields
        })
        acoustic_score_val = m.acoustic_score

    fluency_resp = None
    fluency_score_val = None
    if fluency_result.success and fluency_result.metrics:
        f = fluency_result.metrics
        fluency_resp = FluencyMetricsResponse(**{
            k: getattr(f, k) for k in FluencyMetricsResponse.model_fields
        })
        fluency_score_val = f.fluency_score

    visual_resp = None
    visual_score_val = None
    if visual_result and visual_result.success and visual_result.metrics:
        v = visual_result.metrics
        visual_resp = VisualMetricsResponse(**{
            k: getattr(v, k) for k in VisualMetricsResponse.model_fields
        })
        visual_score_val = v.visual_engagement_score

    # ── Composite score ─────────────────────────────────────────────
    confidence = compute_confidence_score(
        acoustic_score=acoustic_score_val,
        fluency_score=fluency_score_val,
        visual_score=visual_score_val,
    )

    confidence_resp = ConfidenceScoreResponse(
        speaking_confidence_score=confidence.speaking_confidence_score,
        acoustic_score=confidence.acoustic_score,
        fluency_score=confidence.fluency_score,
        visual_score=confidence.visual_score,
        weight_acoustic=confidence.weight_acoustic,
        weight_fluency=confidence.weight_fluency,
        weight_visual=confidence.weight_visual,
        tier=confidence.tier,
        summary=confidence.summary,
    )

    duration = acoustic_resp.duration_sec if acoustic_resp else None

    return AnalysisResponse(
        success=True,
        confidence=confidence_resp,
        acoustic=acoustic_resp,
        fluency=fluency_resp,
        visual=visual_resp,
        duration_sec=duration,
    )
