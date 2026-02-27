---
title: Bigkas Backend
emoji: 🎤
colorFrom: yellow
colorTo: gray
sdk: docker
app_port: 7860
---

# Bigkas Backend API

FastAPI backend for Bigkas — AI-powered public speaking practice platform.

## Features

- **Acoustic Analysis**: Measures pitch, volume, pace, and clarity using librosa
- **Fluency Analysis**: Detects disfluencies (filler words, repetitions, false starts)
- **Visual Analysis**: Tracks eye contact, posture, and gestures using MediaPipe
- **Confidence Scoring**: Multi-factor assessment combining acoustic, fluency, and visual metrics
- **Daily Content**: Proxies ZenQuotes API for motivational quotes

## API Endpoints

- `GET /health` - Health check
- `POST /api/analysis/analyze` - Submit audio/video for ML analysis
- `GET /api/content/daily-quote` - Fetch daily motivational quote
- `POST /api/auth/login` - Password login with exponential lockout backoff

## Security Notes

- Login backoff is enforced server-side via `profiles.failed_login_attempts` and `profiles.lockout_until`.
- Lock policy: 3rd failed password = 5m lock, then doubles (10m, 20m, ...).
- Successful login resets lockout counters to baseline.

## Tech Stack

- **Framework**: FastAPI 0.115.6
- **ML Libraries**: librosa, MediaPipe, OpenCV
- **Authentication**: Supabase JWT verification
- **Server**: uvicorn with async support
