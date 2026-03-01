from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import ExtractRequest, ExtractResponse, TranscriptSegment
from .transcript_service import (
    TranscriptError,
    fetch_transcript,
    to_markdown,
    to_plain_text,
)

load_dotenv()

app = FastAPI(title="YT Transcript API", version="0.1.0")

# CORS: Use environment variable for production, validate explicitly
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "https://yt-transcript-web.pages.dev"
).split(",")

# Production hardening: strip whitespace and filter empty origins
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=False,  # Production hardening: disable credentials
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _fetch_transcript_or_raise(url: str) -> tuple[str, list[TranscriptSegment]]:
    """Fetch transcript and convert TranscriptError to HTTPException."""
    try:
        return fetch_transcript(url)
    except TranscriptError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest) -> ExtractResponse:
    video_id, transcript = _fetch_transcript_or_raise(str(req.url))
    plain_text = to_plain_text(transcript)
    markdown = to_markdown(transcript, title=f"Transcript: {video_id}")

    return ExtractResponse(
        video_id=video_id,
        title=f"Transcript: {video_id}",
        transcript=transcript,
        plain_text=plain_text,
        markdown=markdown,
    )


@app.post("/api/summary")
def summarize(req: ExtractRequest) -> dict:
    """Generate a summary of the transcript"""
    video_id, transcript = _fetch_transcript_or_raise(str(req.url))

    # Simple extractive summary - first 5 segments
    summary_parts = [seg.text for seg in transcript[:5]]
    summary = " ".join(summary_parts)

    return {"video_id": video_id, "summary": summary}
