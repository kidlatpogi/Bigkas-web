"""
Bigkas Backend — Auth Middleware

Extracts and verifies the Supabase JWT from the Authorization header.
Provides a ``get_current_user`` dependency for protected routes.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config.settings import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)
_jwks_cache: Optional[dict] = None


def _supabase_jwks_url() -> Optional[str]:
    if not settings.SUPABASE_URL:
        return None
    return f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _get_supabase_jwks(force_refresh: bool = False) -> Optional[dict]:
    global _jwks_cache
    if _jwks_cache and not force_refresh:
        return _jwks_cache

    url = _supabase_jwks_url()
    if not url:
        return None

    try:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(url)
            res.raise_for_status()
            data = res.json()
            if isinstance(data, dict) and isinstance(data.get("keys"), list):
                _jwks_cache = data
                return data
    except Exception as exc:
        logger.warning("Failed to fetch Supabase JWKS: %s", exc)
    return None


def _decode_rs256_with_jwks(token: str, kid: Optional[str]) -> Optional[dict]:
    jwks = _get_supabase_jwks()
    if not jwks:
        return None

    keys = jwks.get("keys", [])

    # Try matching key id first when present.
    if kid:
        for key in keys:
            if key.get("kid") != kid:
                continue
            try:
                return jwt.decode(
                    token,
                    key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
            except JWTError:
                break

    # Fallback: try all JWKS keys.
    for key in keys:
        try:
            return jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except JWTError:
            continue

    # Key rotation case: force refresh once, then retry.
    jwks = _get_supabase_jwks(force_refresh=True)
    if not jwks:
        return None
    for key in jwks.get("keys", []):
        try:
            return jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except JWTError:
            continue
    return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    FastAPI dependency that validates the Bearer token and returns the
    decoded JWT payload (contains ``sub`` = user_id, ``email``, etc.).

    Raises 401 if the token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip().strip('"').strip("'")

    try:
        header = jwt.get_unverified_header(token)
        token_alg = (header or {}).get("alg", "")
        kid = (header or {}).get("kid")
    except JWTError:
        logger.warning("JWT header parse failed before verification.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = None
    logger.debug("JWT auth start: alg=%s kid=%s", token_alg, kid)

    # Supabase hosted projects commonly issue RS256 JWTs.
    if token_alg == "RS256":
        logger.debug("JWT RS256 path selected; attempting JWKS verification.")
        payload = _decode_rs256_with_jwks(token, kid)

        # Do not fall back to HS256 for RS256 tokens.
        # If JWKS verification fails, this is a deployment/config issue
        # (e.g., wrong SUPABASE_URL, networking, or stale key rotation).
        if payload is None:
            logger.warning(
                "JWT RS256 verification failed (kid=%s). Check SUPABASE_URL/JWKS availability.",
                kid,
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired RS256 token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if token_alg and token_alg not in {"RS256", "HS256"}:
        logger.warning("Unsupported JWT alg in token header: %s", token_alg)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported token algorithm: {token_alg}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fallback: local/dev HS256 secret verification.
    if payload is None:
        logger.debug("JWT HS256 fallback path selected.")
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM, "HS256"],
                options={"verify_aud": False},
            )
        except JWTError as exc:
            logger.warning("JWT HS verification failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user ID.",
        )

    return {
        "id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "authenticated"),
    }
