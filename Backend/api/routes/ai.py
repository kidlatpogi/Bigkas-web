"""
AI Script Generation Routes
============================
Server-side script generation with rate limiting to prevent API key exhaustion.
"""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query
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


class UserTokensResponse(BaseModel):
    """Response body for user token balance."""
    generation_tokens: int
    regeneration_tokens: int


@router.get("/user-tokens", response_model=UserTokensResponse)
async def get_user_tokens(user_id: str = Query(..., min_length=1)):
    """
    Get the current token balance for the authenticated user.
    Applies the daily PHT reset if needed so the returned value is always fresh.

    Returns:
        generation_tokens: Number of new generation tokens available
        regeneration_tokens: Number of regeneration tokens available
    """
    from datetime import datetime, timezone, timedelta

    if not limiter_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="Script generation rate limiter is not configured on the backend.",
        )

    async with httpx.AsyncClient() as client:
        profile = await limiter_service._fetch_profile_limits(client, user_id)

        if not profile:
            return UserTokensResponse(
                generation_tokens=10,
                regeneration_tokens=10,
            )

        generation_tokens = int(profile.get("generation_tokens") or 10)
        regeneration_tokens = int(profile.get("regeneration_tokens") or 10)

        # Apply daily reset check (12:01 AM PHT) so the balance shown is always current
        now = datetime.now(timezone.utc)
        PHT = timezone(timedelta(hours=8))
        token_reset_at = profile.get("token_reset_at")
        should_reset = False
        if token_reset_at:
            reset_dt = datetime.fromisoformat(token_reset_at.replace("Z", "+00:00"))
            now_pht = now.astimezone(PHT)
            reset_pht = reset_dt.astimezone(PHT)
            boundary_pht = now_pht.replace(hour=0, minute=1, second=0, microsecond=0)
            if reset_pht < boundary_pht:
                should_reset = True
        else:
            should_reset = True

        if should_reset:
            generation_tokens = 10
            regeneration_tokens = 10
            # Persist the reset so check_and_consume won’t double-reset later
            await limiter_service._update_profile_limits(client, user_id, {
                "generation_tokens": 10,
                "regeneration_tokens": 10,
                "token_reset_at": now.isoformat(),
            })

        return UserTokensResponse(
            generation_tokens=generation_tokens,
            regeneration_tokens=regeneration_tokens,
        )



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

