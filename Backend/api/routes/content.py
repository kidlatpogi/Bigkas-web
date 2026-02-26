from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter


router = APIRouter(prefix="/content", tags=["Content"])


DAILY_QUOTES = [
    {
        "text": "Courage is what it takes to stand up and speak.",
        "author": "Winston Churchill",
    },
    {
        "text": "The way to get started is to quit talking and begin doing.",
        "author": "Walt Disney",
    },
    {
        "text": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "author": "Winston Churchill",
    },
    {
        "text": "Believe you can and you're halfway there.",
        "author": "Theodore Roosevelt",
    },
    {
        "text": "Do one thing every day that scares you.",
        "author": "Eleanor Roosevelt",
    },
    {
        "text": "Start where you are. Use what you have. Do what you can.",
        "author": "Arthur Ashe",
    },
    {
        "text": "Act as if what you do makes a difference. It does.",
        "author": "William James",
    },
    {
        "text": "You don't have to be great to start, but you have to start to be great.",
        "author": "Zig Ziglar",
    },
    {
        "text": "Great things are done by a series of small things brought together.",
        "author": "Vincent van Gogh",
    },
    {
        "text": "The future depends on what you do today.",
        "author": "Mahatma Gandhi",
    },
]


def _daily_index_utc() -> int:
    today_utc = datetime.now(timezone.utc).date()
    return today_utc.toordinal() % len(DAILY_QUOTES)


@router.get("/daily-quote")
async def get_daily_quote():
    quote = DAILY_QUOTES[_daily_index_utc()]
    return {
        "text": quote["text"],
        "author": quote["author"],
        "source": "bigkas-static-daily",
    }
