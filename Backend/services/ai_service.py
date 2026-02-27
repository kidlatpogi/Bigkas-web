"""
AI Script Generation Service
=============================
Calls Gemini (primary) and Groq (fallback) to generate speech scripts.
"""

from __future__ import annotations

import json
from typing import Dict, Any

import httpx

from config.settings import settings


SYSTEM_PROMPT = """You are a professional Speech Writing Assistant for the "Bigkas" platform.
Your mission is to generate a speech script based strictly on the user's time requirements.

INPUT PARAMETERS:
- TOPIC: {prompt}
- VIBE: {vibe} (Professional, Casual, Humorous, Inspirational)
- TARGET DURATION: {duration} minutes
- WORD COUNT TARGET: {targetWordCount} (Based on 150 words per minute)

STRICT CONSTRAINTS:
1. WORD COUNT: The content must be within +/- 5% of {targetWordCount} words. This is critical for pacing.
2. STRUCTURE: Every speech must have an engaging Hook (Intro), three clear points (Body), and a powerful call to action (Conclusion).
3. JSON ONLY: Your entire response must be a single, valid JSON object. Do not include any conversational filler or markdown code blocks outside the JSON.

JSON SCHEMA:
{{
  "title": "A short, impactful title",
  "content": "The full script text properly formatted with paragraph breaks (\\n\\n)"
}}"""


async def generate_script_with_ai(
    prompt: str,
    vibe: str,
    target_word_count: int,
    duration_minutes: float,
) -> Dict[str, Any]:
    """
    Generate a speech script using AI (Gemini → Groq fallback).

    Args:
        prompt: The topic/prompt for the script
        vibe: Professional, Casual, Humorous, or Inspirational
        target_word_count: Target number of words
        duration_minutes: Target duration in minutes

    Returns:
        {"title": str, "content": str}

    Raises:
        Exception: If all AI services fail
    """
    # Try Gemini first
    try:
        return await _call_gemini(prompt, vibe, target_word_count, duration_minutes)
    except Exception:
        # Fallback to Groq
        try:
            return await _call_groq(prompt, vibe, target_word_count, duration_minutes)
        except Exception:
            raise Exception("All AI services failed. Please try again later.")


async def _call_gemini(
    prompt: str, vibe: str, target_word_count: int, duration_minutes: float
) -> Dict[str, Any]:
    """Call Google Gemini API."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise Exception("Gemini API key is not configured.")

    system_instruction = SYSTEM_PROMPT.format(
        prompt=prompt,
        vibe=vibe,
        targetWordCount=target_word_count,
        duration=duration_minutes,
    )

    user_prompt = (
        f"TOPIC: {prompt}\n"
        f"VIBE: {vibe}\n"
        f"TARGET DURATION: {duration_minutes} minutes\n"
        f"ESTIMATED WORD COUNT: {target_word_count} words"
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
            json={
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"},
            },
            headers={"Content-Type": "application/json"},
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        result_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(result_text)


async def _call_groq(
    prompt: str, vibe: str, target_word_count: int, duration_minutes: float
) -> Dict[str, Any]:
    """Call Groq API."""
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise Exception("Groq API key is not configured.")

    system_instruction = SYSTEM_PROMPT.format(
        prompt=prompt,
        vibe=vibe,
        targetWordCount=target_word_count,
        duration=duration_minutes,
    )

    user_prompt = (
        f"TOPIC: {prompt}\n"
        f"VIBE: {vibe}\n"
        f"TARGET DURATION: {duration_minutes} minutes\n"
        f"ESTIMATED WORD COUNT: {target_word_count} words"
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
            },
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        result_text = data["choices"][0]["message"]["content"]
        return json.loads(result_text)
