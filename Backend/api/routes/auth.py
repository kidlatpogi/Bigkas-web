from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from models.schemas import LoginRequest, LoginResponse
from services.login_backoff import backoff_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Authenticates with Supabase password grant and enforces exponential backoff.

    Lockout policy:
    - 3rd failed attempt  => 5 minutes
    - 4th failed attempt  => 10 minutes
    - 5th failed attempt  => 20 minutes
    - ... continues doubling
    """

    result = await backoff_service.login_with_backoff(
        email=payload.email.strip().lower(),
        password=payload.password,
    )

    if result["status"] == 200:
        return LoginResponse(
            success=True,
            access_token=result["session"].get("access_token"),
            refresh_token=result["session"].get("refresh_token"),
            expires_in=result["session"].get("expires_in"),
            token_type=result["session"].get("token_type"),
            user=result["session"].get("user"),
        )

    if result["status"] == 423:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={
                "error": result["error"],
                "remaining_seconds": result.get("remaining_seconds", 0),
            },
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": result.get("error", "Invalid email or password.")},
    )
