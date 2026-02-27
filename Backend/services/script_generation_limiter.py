"""
Script Generation Rate Limiter
===============================
Server-side cooldown enforcement to prevent API key exhaustion.

Policy: 60-second cooldown between script generations per user.
"""

from __future__ import annotations

import httpx
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from config.settings import settings


class ScriptGenerationLimiter:
    """Enforces script generation cooldown via profile tracking."""

    def __init__(self) -> None:
        self._supabase_url = (settings.SUPABASE_URL or "").rstrip("/")
        self._anon_key = settings.SUPABASE_ANON_KEY or ""
        self._service_key = settings.SUPABASE_SERVICE_ROLE_KEY or ""

    @property
    def is_configured(self) -> bool:
        """Check if Supabase credentials are available."""
        return bool(self._supabase_url and self._anon_key and self._service_key)

    async def check_and_update_cooldown(
        self, client: httpx.AsyncClient, user_id: str
    ) -> Dict[str, Any]:
        """
        Check if user can generate a script, then update the timestamp.

        Returns:
            {
                "allowed": bool,
                "remaining_seconds": int (if not allowed),
                "cooldown_until": str (ISO 8601, if not allowed)
            }
        """
        if not self.is_configured:
            return {"allowed": True}

        # Fetch current cooldown timestamp from profiles
        profile = await self._fetch_profile_cooldown(client, user_id)
        if not profile:
            # Profile not found, allow but don't update
            return {"allowed": True}

        last_generated = profile.get("last_script_generated_at")
        now = datetime.now(timezone.utc)

        if last_generated:
            last_gen_dt = datetime.fromisoformat(last_generated.replace("Z", "+00:00"))
            elapsed = (now - last_gen_dt).total_seconds()
            if elapsed < 60:
                remaining = int(60 - elapsed) + 1
                cooldown_until = (last_gen_dt.replace(tzinfo=timezone.utc).timestamp() + 60)
                cooldown_iso = datetime.fromtimestamp(cooldown_until, tz=timezone.utc).isoformat()
                return {
                    "allowed": False,
                    "remaining_seconds": remaining,
                    "cooldown_until": cooldown_iso,
                }

        # Update timestamp
        await self._update_cooldown_timestamp(client, user_id, now)
        return {"allowed": True}

    async def _fetch_profile_cooldown(
        self, client: httpx.AsyncClient, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch profile cooldown timestamp."""
        response = await client.get(
            f"{self._supabase_url}/rest/v1/profiles",
            params={
                "select": "id,last_script_generated_at",
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

    async def _update_cooldown_timestamp(
        self, client: httpx.AsyncClient, user_id: str, timestamp: datetime
    ) -> None:
        """Update profile's last_script_generated_at timestamp."""
        response = await client.patch(
            f"{self._supabase_url}/rest/v1/profiles",
            params={"id": f"eq.{user_id}"},
            json={"last_script_generated_at": timestamp.isoformat()},
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
