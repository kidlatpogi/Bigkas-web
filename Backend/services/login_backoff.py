from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import httpx

from config.settings import settings


class BackoffService:
    """Encapsulates profile lockout + Supabase password login orchestration."""

    def __init__(self) -> None:
        self._supabase_url = settings.SUPABASE_URL.rstrip("/")
        self._anon_key = settings.SUPABASE_ANON_KEY
        self._service_key = settings.SUPABASE_SERVICE_ROLE_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self._supabase_url and self._anon_key and self._service_key)

    @property
    def _rest_headers(self) -> Dict[str, str]:
        return {
            "apikey": self._service_key,
            "Authorization": f"Bearer {self._service_key}",
            "Content-Type": "application/json",
        }

    @property
    def _auth_headers(self) -> Dict[str, str]:
        return {
            "apikey": self._anon_key,
            "Content-Type": "application/json",
        }

    @property
    def _admin_auth_headers(self) -> Dict[str, str]:
        return {
            "apikey": self._service_key,
            "Authorization": f"Bearer {self._service_key}",
            "Content-Type": "application/json",
        }

    async def _fetch_user_id_by_email(self, client: httpx.AsyncClient, email: str) -> Optional[str]:
        response = await client.get(
            f"{self._supabase_url}/auth/v1/admin/users",
            headers=self._admin_auth_headers,
            params={"email": email},
            timeout=15.0,
        )
        response.raise_for_status()
        payload = response.json()

        users = payload.get("users", []) if isinstance(payload, dict) else []
        if users:
            return users[0].get("id")
        return None

    async def _fetch_profile_by_id(self, client: httpx.AsyncClient, user_id: str) -> Optional[Dict[str, Any]]:
        response = await client.get(
            f"{self._supabase_url}/rest/v1/profiles",
            headers=self._rest_headers,
            params={
                "select": "id,failed_login_attempts,lockout_until",
                "id": f"eq.{user_id}",
                "limit": "1",
            },
            timeout=15.0,
        )
        response.raise_for_status()
        rows = response.json()
        return rows[0] if rows else None

    async def _update_profile_by_id(self, client: httpx.AsyncClient, profile_id: str, payload: Dict[str, Any]) -> None:
        response = await client.patch(
            f"{self._supabase_url}/rest/v1/profiles",
            headers=self._rest_headers,
            params={"id": f"eq.{profile_id}"},
            json=payload,
            timeout=15.0,
        )
        response.raise_for_status()

    async def _password_login(self, client: httpx.AsyncClient, email: str, password: str) -> Tuple[bool, Dict[str, Any]]:
        response = await client.post(
            f"{self._supabase_url}/auth/v1/token",
            headers=self._auth_headers,
            params={"grant_type": "password"},
            json={"email": email, "password": password},
            timeout=20.0,
        )

        if response.is_success:
            return True, response.json()

        if response.status_code in (400, 401):
            return False, response.json() if response.headers.get("content-type", "").startswith("application/json") else {}

        response.raise_for_status()
        return False, {}

    @staticmethod
    def _parse_lockout_until(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed

    @staticmethod
    def _next_lock_minutes(failed_attempts: int) -> int:
        # Policy: 3rd fail => 5m, 4th => 15m, 5th => 30m, then doubles (60m, 120m, ...)
        if failed_attempts <= 2:
            return 0
        if failed_attempts == 3:
            return 5
        if failed_attempts == 4:
            return 15
        exponent = max(0, failed_attempts - 5)
        return 30 * (2 ** exponent)

    async def login_with_backoff(self, email: str, password: str) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "success": False,
                "status": 503,
                "error": "Auth backoff service is not configured on the backend.",
            }

        now = datetime.now(timezone.utc)

        async with httpx.AsyncClient() as client:
            user_id = await self._fetch_user_id_by_email(client, email)
            profile = await self._fetch_profile_by_id(client, user_id) if user_id else None

            if profile:
                lockout_until = self._parse_lockout_until(profile.get("lockout_until"))
                if lockout_until and now < lockout_until:
                    remaining_seconds = int((lockout_until - now).total_seconds())
                    return {
                        "success": False,
                        "status": 423,
                        "error": "Account temporarily locked due to failed login attempts.",
                        "remaining_seconds": max(1, remaining_seconds),
                        "unlock_time": lockout_until.isoformat(),
                    }

            success, payload = await self._password_login(client, email, password)

            if success:
                authenticated_user_id = payload.get("user", {}).get("id")
                target_profile_id = authenticated_user_id or (profile or {}).get("id")
                if target_profile_id:
                    await self._update_profile_by_id(
                        client,
                        target_profile_id,
                        {
                            "failed_login_attempts": 0,
                            "lockout_until": None,
                        },
                    )

                return {
                    "success": True,
                    "status": 200,
                    "session": {
                        "access_token": payload.get("access_token"),
                        "refresh_token": payload.get("refresh_token"),
                        "expires_in": payload.get("expires_in"),
                        "token_type": payload.get("token_type"),
                        "user": payload.get("user"),
                    },
                }

            if not user_id or not profile:
                # Keep generic response to avoid account enumeration.
                return {
                    "success": False,
                    "status": 401,
                    "error": "Invalid email or password.",
                }

            failed_attempts = int(profile.get("failed_login_attempts") or 0) + 1
            lockout_until_iso = None
            remaining_seconds = None

            if failed_attempts >= 3:
                lock_minutes = self._next_lock_minutes(failed_attempts)
                lockout_until = now + timedelta(minutes=lock_minutes)
                lockout_until_iso = lockout_until.isoformat()
                remaining_seconds = int((lockout_until - now).total_seconds())

            await self._update_profile_by_id(
                client,
                profile["id"],
                {
                    "failed_login_attempts": failed_attempts,
                    "lockout_until": lockout_until_iso,
                },
            )

            if remaining_seconds is not None:
                return {
                    "success": False,
                    "status": 423,
                    "error": "Account temporarily locked due to failed login attempts.",
                    "remaining_seconds": max(1, remaining_seconds),
                    "unlock_time": lockout_until_iso,
                }

            return {
                "success": False,
                "status": 401,
                "error": "Invalid email or password.",
            }


backoff_service = BackoffService()
