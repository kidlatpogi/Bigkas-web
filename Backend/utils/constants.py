"""
Bigkas Backend — Shared Constants
"""

# ── Scoring Thresholds ──────────────────────────────────────────────
# These define the "healthy speech" reference ranges sourced from
# phonetics literature (Teixeira et al., 2013; Baken & Orlikoff, 2000).

# Jitter — cycle-to-cycle variation in fundamental frequency (F0).
# Normal conversational speech: < 1.04 % (relative jitter).
# Values above 2 % indicate significant vocal instability.
JITTER_NORMAL_UPPER: float = 0.0104        # 1.04 %
JITTER_PATHOLOGICAL_UPPER: float = 0.02    # 2.0 %

# Shimmer — cycle-to-cycle variation in amplitude.
# Normal conversational speech: < 3.81 % (relative shimmer).
# Values above 6 % indicate significant breathiness / projection issues.
SHIMMER_NORMAL_UPPER: float = 0.0381       # 3.81 %
SHIMMER_PATHOLOGICAL_UPPER: float = 0.06   # 6.0 %

# Pitch stability — standard deviation of F0 in semitones.
# A stable speaker has σ ≤ 2 semitones; anxious speakers often > 4.
PITCH_SD_STABLE: float = 2.0              # semitones
PITCH_SD_UNSTABLE: float = 5.0            # semitones

# Minimum SNR (dB) for reliable acoustic analysis
MIN_SNR_DB: float = 10.0

# ── Filler / Disfluency ────────────────────────────────────────────
FILLER_WORDS: list = [
    "um", "uh", "er", "ah", "like", "you know",
    "so", "basically", "actually", "literally",
    "I mean", "right", "okay",
]

# Silence ratio thresholds (proportion of total duration)
SILENCE_RATIO_GOOD: float = 0.20          # ≤ 20 % is natural
SILENCE_RATIO_EXCESSIVE: float = 0.50     # > 50 % too much silence

# ── Visual Engagement ──────────────────────────────────────────────
EYE_CONTACT_GOOD: float = 0.70            # ≥ 70 % looking at camera
HEAD_ORIENTATION_TOLERANCE_DEG: float = 15.0  # ±15° from centre

# ── Confidence Score Weights (default) ─────────────────────────────
WEIGHT_ACOUSTIC: float = 0.30
WEIGHT_FLUENCY: float = 0.35
WEIGHT_VISUAL: float = 0.35

# ── Audio Config (mirrors frontend constants.js) ───────────────────
SAMPLE_RATE: int = 22_050
MAX_DURATION_SEC: int = 120
ALLOWED_AUDIO_TYPES: list = [
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/ogg", "audio/webm",
    "audio/mp4", "audio/x-m4a",
]

# ── Sync ────────────────────────────────────────────────────────────
SYNC_BATCH_SIZE: int = 10   # Max sessions per sync request
