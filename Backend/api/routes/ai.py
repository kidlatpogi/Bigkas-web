"""
AI Script Generation Routes
============================
Server-side script generation with rate limiting to prevent API key exhaustion.
"""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from services.script_generation_limiter import limiter_service
from services.ai_service import generate_script_with_ai


router = APIRouter(prefix="/ai", tags=["AI"])


class ScriptGenerationRequest(BaseModel):
    """Request body for script generation."""
    user_id: str = Field(..., description="User ID from Supabase auth")
    prompt: str = Field(..., min_length=1, max_length=2000)
    vibe: str = Field(..., description="Professional, Casual, Humorous, or Inspirational")
    target_word_count: int = Field(..., ge=50, le=2000, description="Target word count")
    duration_minutes: float = Field(..., ge=0.5, le=20.0, description="Target duration in minutes")
    action: Literal["new", "regenerate"] = Field(default="new")


class ScriptGenerationResponse(BaseModel):
    """Response body for successful script generation."""
    title: str
    content: str
    generation_tokens: int
    regeneration_tokens: int


@router.post("/generate-script", response_model=ScriptGenerationResponse, status_code=200)
async def generate_script(request: ScriptGenerationRequest):
    """
    Generate a speech script with AI, enforcing 60-second cooldown per user.

    Returns:
        200 OK: Script generated successfully
        429 Too Many Requests: User is in cooldown period
        500 Internal Server Error: AI services failed
        503 Service Unavailable: Rate limiter not configured
    """
    if not limiter_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Script generation rate limiter is not configured on the backend.",
        )

    async with httpx.AsyncClient() as client:
        gatekeeper_result = await limiter_service.check_and_consume(client, request.user_id, request.action)

        if not gatekeeper_result.get("allowed", False):
            status_code = gatekeeper_result.get("status", 429)
            raise HTTPException(
                status_code=status_code,
                detail={
                    "error": gatekeeper_result.get("error", "Request blocked."),
                    "remaining_seconds": gatekeeper_result.get("remaining_seconds", 0),
                    "cooldown_until": gatekeeper_result.get("cooldown_until"),
                    "generation_tokens": gatekeeper_result.get("generation_tokens"),
                    "regeneration_tokens": gatekeeper_result.get("regeneration_tokens"),
                },
            )

        # Cooldown passed, call AI service
        try:
            result = await generate_script_with_ai(
                prompt=request.prompt,
                vibe=request.vibe,
                target_word_count=request.target_word_count,
                duration_minutes=request.duration_minutes,
            )
            return ScriptGenerationResponse(
                title=result.get("title", "Generated Script"),
                content=result.get("content", ""),
                generation_tokens=gatekeeper_result.get("generation_tokens", 0),
                regeneration_tokens=gatekeeper_result.get("regeneration_tokens", 0),
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={
                    "error": str(e) or "Failed to generate script. Please try again.",
                },
            )

