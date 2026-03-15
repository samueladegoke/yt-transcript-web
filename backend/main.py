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


def get_kilo_config() -> dict:
    """Get KILO API configuration from env vars."""
    return {
        "model": os.getenv("KILO_MODEL", "kilo-model"),
        "base_url": os.getenv("KILO_BASE_URL"),
        "api_key": os.getenv("KILO_API_KEY"),
    }


def analyze_with_kilo(transcript_text: str, analysis_type: str = "summary") -> dict:
    """
    Analyze transcript text using KILO API (OpenAI-compatible).
    
    Args:
        transcript_text: Full transcript text
        analysis_type: summary | outline | key_points
    
    Returns:
        dict with analysis results
    """
    import urllib.request
    import json as _json

    config = get_kilo_config()
    if not config["base_url"] or not config["api_key"]:
        raise ValueError("KILO_BASE_URL and KILO_API_KEY must be set in environment")

    # Build the prompt based on analysis type
    prompts = {
        "summary": (
            "Provide a concise, professional summary of this YouTube video transcript. "
            "Focus on the main topic, key arguments, and conclusion. "
            "Write 2-4 sentences. Be specific, not generic.\n\n"
            f"Transcript:\n{transcript_text[:8000]}"
        ),
        "outline": (
            "Create a structured outline of this YouTube video transcript. "
            "Identify the main sections, topics discussed, and their order. "
            "Return as a JSON list of strings.\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Return ONLY valid JSON: {"outline": ["section 1", "section 2", ...]}'
        ),
        "key_points": (
            "Extract the key points and insights from this YouTube video transcript. "
            "Focus on actionable information, main arguments, and notable quotes. "
            "Return as a JSON list.\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Return ONLY valid JSON: {"key_points": ["point 1", "point 2", ...]}'
        ),
    }

    prompt = prompts.get(analysis_type, prompts["summary"])

    # Call KILO API (OpenAI-compatible)
    api_url = f"{config['base_url'].rstrip('/')}/chat/completions"
    payload = _json.dumps({
        "model": config["model"],
        "messages": [
            {"role": "system", "content": "You are a precise video transcript analyst. Be concise and specific."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
    }).encode("utf-8")

    req = urllib.request.Request(
        api_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['api_key']}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"KILO API call failed: {exc}")

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise ValueError("KILO API returned empty response")

    # For summary, return plain text
    if analysis_type == "summary":
        return {"summary": content.strip()}

    # For outline/key_points, try to parse JSON from response
    try:
        # Try direct JSON parse
        parsed = _json.loads(content.strip())
        return parsed
    except _json.JSONDecodeError:
        # Try to extract JSON from markdown code block
        import re
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
        if json_match:
            try:
                return _json.loads(json_match.group(1).strip())
            except _json.JSONDecodeError:
                pass
        # Fallback: return as text list split by newlines
        lines = [l.strip("- •\t ") for l in content.strip().split("\n") if l.strip()]
        key = "outline" if analysis_type == "outline" else "key_points"
        return {key: lines}


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


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    type: str = Field(default="summary", pattern="^(summary|outline|key_points)$")
    language: str = Field(default="en", min_length=2, max_length=10)


class AnalyzeResponse(BaseModel):
    success: bool
    video_id: str
    title: str
    analysis_type: str
    result: dict
    generated_at: float


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_transcript_endpoint(request: AnalyzeRequest):
    """Analyze a YouTube video transcript using KILO AI."""
    try:
        video_id = extract_video_id(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    language = request.language.strip().lower() if request.language else "en"

    # First, get the transcript
    try:
        segments = get_transcript(request.url, lang=language)
        transcript_text = "\n".join(
            f"[{seconds_to_timestamp(s.start)}] {s.text}" for s in segments
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    # Then analyze with KILO
    try:
        analysis = analyze_with_kilo(transcript_text, request.type)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    title = await asyncio.to_thread(get_video_title, video_id)

    return AnalyzeResponse(
        success=True,
        video_id=video_id,
        title=title,
        analysis_type=request.type,
        result=analysis,
        generated_at=time.time(),
    )


@app.get("/health")
def health_check():
    kilo_status = "configured" if os.getenv("KILO_API_KEY") else "missing"
    proxy_status = "configured" if get_proxy_url() else "missing"
    return {
        "status": "healthy",
        "service": "youtube-transcript-api",
        "proxy": proxy_status,
        "kilo": kilo_status,
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
