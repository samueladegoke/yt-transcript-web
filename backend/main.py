from __future__ import annotations

import asyncio
import importlib.util
import logging
import os
import re
import time
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

load_dotenv()

logger = logging.getLogger("youtube_transcript_api")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000",
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


@lru_cache(maxsize=1)
def load_transcript_module():
    # Allow override via environment variable, otherwise use relative path from script location
    script_path_str = os.getenv("TRANSCRIPT_SCRIPT_PATH")
    if script_path_str:
        script_path = Path(script_path_str).resolve()
    else:
        script_path = (
            Path(__file__).resolve().parent.parent
            / "skills"
            / "youtube-transcript"
            / "scripts"
            / "extract_transcript.py"
        )

    if not script_path.exists():
        raise FileNotFoundError(f"Transcript script not found at {script_path}")

    spec = importlib.util.spec_from_file_location(
        "youtube_transcript_extract", script_path
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Failed to load transcript extraction module spec")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_transcript_lines(transcript_text: str) -> List[TranscriptLine]:
    lines: List[TranscriptLine] = []
    for raw_line in transcript_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        # Expected format from extraction script: [MM:SS] text
        match = re.match(r"^\[(\d{2}):(\d{2})\]\s+(.*)$", line)
        if not match:
            continue

        minutes = int(match.group(1))
        seconds = int(match.group(2))
        lines.append(
            TranscriptLine(
                timestamp=f"{minutes:02d}:{seconds:02d}",
                seconds=(minutes * 60) + seconds,
                text=match.group(3).strip(),
            )
        )

    return lines


app = FastAPI(
    title="YouTube Transcript API",
    version="1.0.0",
    description="FastAPI wrapper for E.T.D transcript extraction logic.",
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
        status_code=exc.status_code, content={"status": "error", "message": exc.detail}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled backend error", exc_info=exc)
    return JSONResponse(
        status_code=500, content={"status": "error", "message": "Internal server error"}
    )


@app.get("/")
def read_root():
    return {
        "name": "YouTube Transcript API",
        "version": "1.0.0",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "youtube-transcript-api",
    }


@app.post("/api/extract", response_model=ExtractResponse)
async def extract_transcript_endpoint(request: ExtractRequest):
    module = load_transcript_module()
    video_id = module.extract_video_id(request.url)

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or video ID")

    language = request.language.strip().lower() if request.language else "en"
    started = time.perf_counter()

    try:
        result = await asyncio.to_thread(
            module.get_transcript, request.url, language, True
        )
    except Exception as exc:
        logger.exception("Transcript extraction execution failed", exc_info=exc)
        raise HTTPException(
            status_code=500, detail=f"Extraction failed: {exc}"
        ) from exc

    if not result.get("success"):
        error_msg = result.get("error", "Transcript extraction failed")
        raise HTTPException(status_code=502, detail=error_msg)

    transcript_text = result.get("transcript", "").strip()
    transcript_lines = parse_transcript_lines(transcript_text)

    title = await asyncio.to_thread(module.get_video_title, video_id)
    if not title:
        title = f"YouTube Video {video_id}"

    elapsed_ms = int((time.perf_counter() - started) * 1000)

    return ExtractResponse(
        success=True,
        video_id=video_id,
        title=title,
        language=result.get("language", language),
        transcript_text=transcript_text,
        transcript_lines=transcript_lines,
        generated_at=time.time(),
        extraction_ms=elapsed_ms,
    )
