from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.transcript_service import (
    extract_video_id,
    get_transcript,
    get_proxy_url,
)

load_dotenv()

logger = logging.getLogger("youtube_transcript_api")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s"
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000,*",
).split(",")


class ExtractRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=10)


class TranscriptLine(BaseModel):
    timestamp: str
    seconds: int
    text: str


class ExtractResponse(BaseModel):
    success: bool
    video_id: str
    title: str
    language: str
    transcript_text: str
    transcript_lines: List[TranscriptLine]
    generated_at: float
    extraction_ms: int


def seconds_to_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS or HH:MM:SS format."""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_video_title(video_id: str) -> str:
    """Get video title — best effort, no API key required."""
    try:
        import subprocess
        result = subprocess.run(
            ["yt-dlp", "--skip-download", "--print", "title",
             f"https://www.youtube.com/watch?v={video_id}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return f"YouTube Video {video_id}"


app = FastAPI(
    title="YouTube Transcript API",
    version="1.2.0",
    description="FastAPI wrapper for YouTube transcript extraction with proxy support.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled backend error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"}
    )


@app.get("/")
def read_root():
    proxy_status = "configured" if get_proxy_url() else "missing"
    return {
        "name": "YouTube Transcript API",
        "version": "1.2.0",
        "status": "ok",
        "proxy": proxy_status,
    }


@app.get("/health")
def health_check():
    proxy_status = "configured" if get_proxy_url() else "missing"
    return {
        "status": "healthy",
        "service": "youtube-transcript-api",
        "proxy": proxy_status,
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_transcript_endpoint(request: ExtractRequest):
    try:
        video_id = extract_video_id(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or video ID")

    language = request.language.strip().lower() if request.language else "en"
    started = time.perf_counter()

    try:
        # Fetch transcript via proxy (IPRoyal)
        segments = get_transcript(request.url, lang=language)

        transcript_lines = []
        transcript_text_parts = []
        for segment in segments:
            ts = seconds_to_timestamp(segment.start)
            transcript_lines.append(
                TranscriptLine(
                    timestamp=ts,
                    seconds=int(segment.start),
                    text=segment.text,
                )
            )
            transcript_text_parts.append(f"[{ts}] {segment.text}")

        transcript_text = "\n".join(transcript_text_parts)

    except ValueError as exc:
        error_msg = str(exc)
        if "No transcript found" in error_msg:
            raise HTTPException(status_code=404, detail=error_msg)
        elif "blocked" in error_msg.lower() or "proxy" in error_msg.lower():
            raise HTTPException(status_code=502, detail=error_msg)
        else:
            raise HTTPException(status_code=500, detail=error_msg)
    except Exception as exc:
        logger.exception("Transcript extraction failed", exc_info=exc)
        raise HTTPException(
            status_code=500,
            detail=f"Extraction failed: {exc}"
        )

    # Get video title (non-blocking, best-effort)
    title = await asyncio.to_thread(get_video_title, video_id)

    elapsed_ms = int((time.perf_counter() - started) * 1000)

    return ExtractResponse(
        success=True,
        video_id=video_id,
        title=title,
        language=language,
        transcript_text=transcript_text,
        transcript_lines=transcript_lines,
        generated_at=time.time(),
        extraction_ms=elapsed_ms,
    )
