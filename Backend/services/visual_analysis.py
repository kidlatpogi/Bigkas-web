"""
Bigkas Backend — Visual Engagement Analysis Module
===================================================

Uses **MediaPipe Face Mesh** (468 landmarks) to track:
  * Eye gaze direction — is the user looking at the camera?
  * Head orientation (yaw / pitch / roll)
  * Basic facial expression cues (mouth openness proxy)

The module processes individual video frames and aggregates per-session
statistics into a 0–100 Visual Engagement Score.

Privacy Note
------------
All processing is local. No frames are stored or transmitted.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Lazy-load MediaPipe to avoid import cost when only doing audio analysis
_mp_face_mesh = None


def _get_face_mesh():
    """Lazy-initialise the MediaPipe FaceMesh singleton."""
    global _mp_face_mesh
    if _mp_face_mesh is None:
        import mediapipe as mp
        _mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,   # Enables iris landmarks (478 total)
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
    return _mp_face_mesh


# ── Landmark indices (MediaPipe Face Mesh) ──────────────────────────
# Nose tip
NOSE_TIP = 1
# Left / right iris centres (refined landmarks)
LEFT_IRIS_CENTER = 468
RIGHT_IRIS_CENTER = 473
# Left / right eye corners for gaze reference
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133
RIGHT_EYE_OUTER = 263
RIGHT_EYE_INNER = 362
# Forehead / chin for head pose
FOREHEAD = 10
CHIN = 152
LEFT_CHEEK = 234
RIGHT_CHEEK = 454
# Mouth landmarks
UPPER_LIP = 13
LOWER_LIP = 14

# Thresholds
HEAD_YAW_TOLERANCE_DEG = 15.0
HEAD_PITCH_TOLERANCE_DEG = 15.0
GAZE_DEVIATION_THRESHOLD = 0.25  # Normalised iris offset


@dataclass
class FrameAnalysis:
    """Per-frame visual metrics."""
    looking_at_camera: bool
    head_yaw_deg: float
    head_pitch_deg: float
    mouth_openness: float      # 0–1 normalised


@dataclass
class VisualMetrics:
    """Aggregated visual engagement statistics."""
    total_frames: int
    frames_with_face: int
    eye_contact_ratio: float          # 0–1
    avg_head_yaw_deg: float
    avg_head_pitch_deg: float
    head_stability_score: float       # 0–100
    eye_contact_score: float          # 0–100
    visual_engagement_score: float    # 0–100 (weighted composite)
    low_confidence: bool = False
    confidence_reason: str = ""


@dataclass
class VisualAnalysisResult:
    success: bool
    metrics: Optional[VisualMetrics] = None
    error: Optional[str] = None


def _estimate_head_pose(landmarks, img_w: int, img_h: int):
    """
    Estimate head yaw and pitch from key landmark positions.

    Uses a simplified geometric approach:
      * Yaw ≈ horizontal asymmetry of nose relative to cheeks
      * Pitch ≈ vertical position of nose relative to forehead-chin axis
    """
    def lm(idx):
        l = landmarks[idx]
        return np.array([l.x * img_w, l.y * img_h, l.z * img_w])

    nose = lm(NOSE_TIP)
    left_cheek = lm(LEFT_CHEEK)
    right_cheek = lm(RIGHT_CHEEK)
    forehead = lm(FOREHEAD)
    chin = lm(CHIN)

    # Yaw: compare nose-to-left vs nose-to-right distance
    d_left = np.linalg.norm(nose[:2] - left_cheek[:2])
    d_right = np.linalg.norm(nose[:2] - right_cheek[:2])
    face_width = np.linalg.norm(left_cheek[:2] - right_cheek[:2]) + 1e-6
    yaw_ratio = (d_right - d_left) / face_width
    yaw_deg = float(yaw_ratio * 90)  # Approximate mapping

    # Pitch: nose position along forehead-chin axis
    face_height = np.linalg.norm(forehead[:2] - chin[:2]) + 1e-6
    nose_rel = np.linalg.norm(nose[:2] - forehead[:2]) / face_height
    pitch_deg = float((nose_rel - 0.5) * 60)  # Centre at 0.5

    return yaw_deg, pitch_deg


def _estimate_gaze(landmarks, img_w: int, img_h: int) -> bool:
    """
    Check if the user is looking at the camera using iris positions.

    Computes the normalised offset of each iris centre within its
    respective eye bounding box.  If both eyes are centred within
    a tolerance, the user is "looking at camera".
    """
    def lm(idx):
        l = landmarks[idx]
        return np.array([l.x * img_w, l.y * img_h])

    try:
        l_iris = lm(LEFT_IRIS_CENTER)
        r_iris = lm(RIGHT_IRIS_CENTER)
        l_outer = lm(LEFT_EYE_OUTER)
        l_inner = lm(LEFT_EYE_INNER)
        r_outer = lm(RIGHT_EYE_OUTER)
        r_inner = lm(RIGHT_EYE_INNER)

        # Normalised horizontal position of iris within eye
        l_width = np.linalg.norm(l_inner - l_outer) + 1e-6
        r_width = np.linalg.norm(r_inner - r_outer) + 1e-6

        l_offset = np.linalg.norm(l_iris - (l_outer + l_inner) / 2) / l_width
        r_offset = np.linalg.norm(r_iris - (r_outer + r_inner) / 2) / r_width

        avg_offset = (l_offset + r_offset) / 2
        return avg_offset < GAZE_DEVIATION_THRESHOLD
    except (IndexError, ValueError):
        return False


def analyse_frame(frame_rgb: np.ndarray) -> Optional[FrameAnalysis]:
    """
    Analyse a single RGB video frame.

    Parameters
    ----------
    frame_rgb : np.ndarray
        Frame in RGB format, shape (H, W, 3), dtype uint8.

    Returns
    -------
    FrameAnalysis or None if no face detected.
    """
    face_mesh = _get_face_mesh()
    results = face_mesh.process(frame_rgb)

    if not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark
    h, w = frame_rgb.shape[:2]

    looking = _estimate_gaze(landmarks, w, h)
    yaw, pitch = _estimate_head_pose(landmarks, w, h)

    # Mouth openness (normalised)
    def lm_y(idx):
        return landmarks[idx].y * h

    mouth_gap = abs(lm_y(LOWER_LIP) - lm_y(UPPER_LIP))
    face_h = abs(lm_y(CHIN) - lm_y(FOREHEAD)) + 1e-6
    mouth_openness = min(1.0, mouth_gap / (face_h * 0.15))

    return FrameAnalysis(
        looking_at_camera=looking,
        head_yaw_deg=round(yaw, 2),
        head_pitch_deg=round(pitch, 2),
        mouth_openness=round(mouth_openness, 3),
    )


def analyse_video_frames(
    frames: List[np.ndarray],
) -> VisualAnalysisResult:
    """
    Aggregate per-frame analysis across a list of video frames.

    Parameters
    ----------
    frames : list[np.ndarray]
        List of RGB frames (H, W, 3).

    Returns
    -------
    VisualAnalysisResult
    """
    try:
        if not frames:
            return VisualAnalysisResult(
                success=False,
                error="No video frames provided.",
            )

        frame_results: List[FrameAnalysis] = []
        for frame in frames:
            result = analyse_frame(frame)
            if result is not None:
                frame_results.append(result)

        total = len(frames)
        detected = len(frame_results)

        if detected == 0:
            return VisualAnalysisResult(
                success=True,
                metrics=VisualMetrics(
                    total_frames=total,
                    frames_with_face=0,
                    eye_contact_ratio=0.0,
                    avg_head_yaw_deg=0.0,
                    avg_head_pitch_deg=0.0,
                    head_stability_score=0.0,
                    eye_contact_score=0.0,
                    visual_engagement_score=0.0,
                    low_confidence=True,
                    confidence_reason="No face detected in any frame.",
                ),
            )

        # Aggregate
        looking_count = sum(1 for r in frame_results if r.looking_at_camera)
        eye_contact_ratio = looking_count / detected

        yaws = [r.head_yaw_deg for r in frame_results]
        pitches = [r.head_pitch_deg for r in frame_results]

        avg_yaw = float(np.mean(np.abs(yaws)))
        avg_pitch = float(np.mean(np.abs(pitches)))

        # Head stability: penalise large average deviation and high variance
        yaw_penalty = min(1.0, avg_yaw / 45.0)
        pitch_penalty = min(1.0, avg_pitch / 45.0)
        yaw_var_penalty = min(1.0, float(np.std(yaws)) / 20.0)
        head_stability = 100.0 * (1.0 - 0.4 * yaw_penalty - 0.3 * pitch_penalty - 0.3 * yaw_var_penalty)
        head_stability = max(0.0, min(100.0, head_stability))

        # Eye contact score
        if eye_contact_ratio >= 0.70:
            eye_score = 100.0
        elif eye_contact_ratio <= 0.20:
            eye_score = 0.0
        else:
            eye_score = 100.0 * (eye_contact_ratio - 0.20) / 0.50

        # Composite: 60 % eye contact, 40 % head stability
        visual_score = round(0.60 * eye_score + 0.40 * head_stability, 2)

        metrics = VisualMetrics(
            total_frames=total,
            frames_with_face=detected,
            eye_contact_ratio=round(eye_contact_ratio, 4),
            avg_head_yaw_deg=round(avg_yaw, 2),
            avg_head_pitch_deg=round(avg_pitch, 2),
            head_stability_score=round(head_stability, 2),
            eye_contact_score=round(eye_score, 2),
            visual_engagement_score=visual_score,
            low_confidence=(detected / total) < 0.5,
            confidence_reason=(
                f"Face detected in only {detected}/{total} frames."
                if (detected / total) < 0.5 else ""
            ),
        )

        logger.info(
            "Visual analysis — eye_contact=%.1f%% (%.1f), "
            "head_stability=%.1f, composite=%.1f",
            eye_contact_ratio * 100, eye_score,
            head_stability, visual_score,
        )

        return VisualAnalysisResult(success=True, metrics=metrics)

    except Exception as exc:
        logger.exception("Visual analysis failed: %s", exc)
        return VisualAnalysisResult(
            success=False, error=f"Visual analysis failed: {exc}"
        )
