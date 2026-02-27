"""
Bigkas Backend — FastAPI Application Entry Point (Analysis Only)
=================================================================

This backend handles ONLY the Python-based ML processing:
  - Acoustic analysis   (Librosa: jitter, shimmer, pitch stability)
  - Fluency analysis     (silence ratio, filler detection)
  - Visual analysis      (MediaPipe: eye gaze, head pose)
  - Confidence scoring   (weighted composite → 0–100)

All database operations (auth, session CRUD, scripts, sync) are handled
directly by the frontend via the Supabase JS client.

Usage:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from models.schemas import HealthResponse

# ── Logging ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("bigkas")


# ── Lifespan (startup / shutdown) ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Bigkas analysis backend starting up …")
    logger.info("   CORS origins : %s", settings.cors_origins_list)
    logger.info("   Debug mode   : %s", settings.DEBUG)
    yield
    logger.info("Bigkas analysis backend shutting down.")


# ── App instance ────────────────────────────────────────────────────
app = FastAPI(
    title="Bigkas Analysis API",
    description=(
        "Analysis-only backend for multi-modal public speaking assessment. "
        "Processes audio (Librosa) and video (MediaPipe) to produce a "
        "Speaking Confidence Score (0–100). "
        "Database operations are handled by the frontend via Supabase."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# ── CORS ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register route modules (analysis only) ─────────────────────────
from api.routes.analysis import router as analysis_router  # noqa: E402
from api.routes.auth import router as auth_router  # noqa: E402
from api.routes.content import router as content_router  # noqa: E402

app.include_router(analysis_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


# ── Health check ────────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health():
    return HealthResponse(
        status="ok",
        version="2.0.0",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


# ── Run directly ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
