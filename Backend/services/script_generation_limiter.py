"""
Script Generation Gatekeeper
============================
Server-side enforcement for:
- 60-second cooldown between successful generations
- Daily token allowances (new vs regenerate)
"""

from __future__ import annotations

import httpx
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from config.settings import settings


class ScriptGenerationLimiter:
    """Enforces script generation token and cooldown limits via profile tracking."""

    def __init__(self) -> None:
        self._supabase_url = (settings.SUPABASE_URL or "").rstrip("/")
        self._anon_key = settings.SUPABASE_ANON_KEY or ""
        self._service_key = settings.SUPABASE_SERVICE_ROLE_KEY or ""

    @property
    def is_configured(self) -> bool:
        """Check if Supabase credentials are available."""
        return bool(self._supabase_url and self._anon_key and self._service_key)

    async def check_and_consume(
        self, client: httpx.AsyncClient, user_id: str, action: str
    ) -> Dict[str, Any]:
        """
        Validate cooldown + daily tokens, then consume 1 token on success.

        Returns:
            {
                "allowed": bool,
                "status": int,
                "error": str,
                "remaining_seconds": int (if not allowed),
                "cooldown_until": str (ISO 8601, if not allowed),
                "generation_tokens": int,
                "regeneration_tokens": int,
            }
        """
        if not self.is_configured:
            return {
                "allowed": False,
                "status": 503,
                "error": "Script generation limiter is not configured on the backend.",
            }

        profile = await self._fetch_profile_limits(client, user_id)
        if not profile:
            return {
                "allowed": False,
                "status": 404,
                "error": "Profile not found.",
            }

        now = datetime.now(timezone.utc)
        patch_payload: Dict[str, Any] = {}

        generation_tokens = int(profile.get("generation_tokens") or 10)
        regeneration_tokens = int(profile.get("regeneration_tokens") or 10)

        # Daily reset
        token_reset_at = profile.get("token_reset_at")
        if token_reset_at:
            reset_dt = datetime.fromisoformat(token_reset_at.replace("Z", "+00:00"))
            if reset_dt.date() != now.date():
                generation_tokens = 10
                regeneration_tokens = 10
                patch_payload["generation_tokens"] = generation_tokens
                patch_payload["regeneration_tokens"] = regeneration_tokens
                patch_payload["token_reset_at"] = now.isoformat()
        else:
            patch_payload["token_reset_at"] = now.isoformat()

        # Cooldown check applies only to new generation action
        if action == "new":
            last_generated = profile.get("last_generated_at")

            if last_generated:
                last_gen_dt = datetime.fromisoformat(last_generated.replace("Z", "+00:00"))
                elapsed = (now - last_gen_dt).total_seconds()
                if elapsed < 60:
                    remaining = int(60 - elapsed) + 1
                    cooldown_until = (last_gen_dt.replace(tzinfo=timezone.utc).timestamp() + 60)
                    cooldown_iso = datetime.fromtimestamp(cooldown_until, tz=timezone.utc).isoformat()
                    return {
                        "allowed": False,
                        "status": 429,
                        "error": "Please wait before generating another script.",
                        "remaining_seconds": remaining,
                        "cooldown_until": cooldown_iso,
                        "generation_tokens": generation_tokens,
                        "regeneration_tokens": regeneration_tokens,
                    }

        # Token consumption
        if action == "regenerate":
            if regeneration_tokens <= 0:
                return {
                    "allowed": False,
                    "status": 403,
                    "error": "You have reached your daily limit.",
                    "generation_tokens": generation_tokens,
                    "regeneration_tokens": regeneration_tokens,
                }
            regeneration_tokens -= 1
            patch_payload["regeneration_tokens"] = regeneration_tokens
        else:
            if generation_tokens <= 0:
                return {
                    "allowed": False,
                    "status": 403,
                    "error": "You have reached your daily limit.",
                    "generation_tokens": generation_tokens,
                    "regeneration_tokens": regeneration_tokens,
                }
            generation_tokens -= 1
            patch_payload["generation_tokens"] = generation_tokens

        if action == "new":
            patch_payload["last_generated_at"] = now.isoformat()
        await self._update_profile_limits(client, user_id, patch_payload)

        return {
            "allowed": True,
            "generation_tokens": generation_tokens,
            "regeneration_tokens": regeneration_tokens,
            "cooldown_until": (now.timestamp() + 60),
        }

    async def _fetch_profile_limits(
        self, client: httpx.AsyncClient, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch profile token and cooldown fields."""
        response = await client.get(
            f"{self._supabase_url}/rest/v1/profiles",
            params={
                "select": "id,generation_tokens,regeneration_tokens,last_generated_at,token_reset_at",
                "id": f"eq.{user_id}",
                "limit": 1,
            },
            headers={
                "apikey": self._service_key,
                "Authorization": f"Bearer {self._service_key}",
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        return data[0] if data else None

    async def _update_profile_limits(
        self, client: httpx.AsyncClient, user_id: str, payload: Dict[str, Any]
    ) -> None:
        """Update profile token/cooldown fields."""
        response = await client.patch(
            f"{self._supabase_url}/rest/v1/profiles",
            params={"id": f"eq.{user_id}"},
            json=payload,
            headers={
                "apikey": self._service_key,
                "Authorization": f"Bearer {self._service_key}",
                "Content-Type": "application/json",
            },
            timeout=15.0,
        )
        response.raise_for_status()


# Singleton instance
limiter_service = ScriptGenerationLimiter()
