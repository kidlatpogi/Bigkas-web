"""
Bigkas Backend — Application Settings (Analysis Only)

Loads configuration from environment variables (.env file).
This backend only handles Python ML processing — no database access.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Global application settings sourced from .env or environment."""

    # ── JWT (to verify Supabase tokens from the frontend) ───
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # ── Server ──────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # ── CORS ────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:19006"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── Audio Processing ────────────────────────────────
    MAX_AUDIO_DURATION_SEC: int = 120
    MAX_UPLOAD_SIZE_MB: int = 25

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # ── Scoring Weights (Speaking Confidence Score) ─────
    WEIGHT_ACOUSTIC: float = 0.30     # Jitter + Shimmer + Pitch Stability
    WEIGHT_FLUENCY: float = 0.35      # Filler ratio + Silence ratio
    WEIGHT_VISUAL: float = 0.35       # Eye gaze + Head orientation

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton — import this everywhere
settings = Settings()
