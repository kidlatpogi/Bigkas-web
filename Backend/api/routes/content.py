from __future__ import annotations

from fastapi import APIRouter
import httpx


router = APIRouter(prefix="/content", tags=["Content"])


DEFAULT_QUOTE = {
    "text": "Courage is what it takes to stand up and speak.",
    "author": "Winston Churchill",
}


@router.get("/daily-quote")
async def get_daily_quote():
    """Returns the same daily motivation source used by mobile (ZenQuotes)."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get("https://zenquotes.io/api/today")
            response.raise_for_status()
            data = response.json()

        if isinstance(data, list) and len(data) > 0:
            quote = data[0]
            text = quote.get("q")
            author = quote.get("a")
            if text and author:
                return {
                    "text": text,
                    "author": author,
                    "source": "zenquotes",
                }
    except Exception:
        pass

    return {
        **DEFAULT_QUOTE,
        "source": "fallback",
    }
