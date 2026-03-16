from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from typing import Dict, List, Optional

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


import json
import subprocess

class ExtractRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=10)


class VideoInfoRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)


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


def analyze_with_kilo(
    transcript_text: str,
    analysis_type: str = "summary",
    description: str = None,
    links: list = None,
) -> dict:
    """
    Analyze transcript text using KILO API (OpenAI-compatible).

    Original format restored from commit 113dfaa.
    Returns raw markdown text, not structured JSON.
    """
    import urllib.request

    config = get_kilo_config()
    if not config["base_url"] or not config["api_key"]:
        raise ValueError("KILO_BASE_URL and KILO_API_KEY must be set in environment")

    # System prompts from original code (commit 113dfaa)
    system_prompts = {
        "summary": "You are a helpful assistant that creates concise summaries of video transcripts.",
        "action_points": "You are a helpful assistant that extracts actionable points from video transcripts.",
        "next_steps": "You are a helpful assistant that suggests next steps based on video transcripts.",
        "structured_edit": "You are a professional editor. Your task is to structure the transcript into a coherent document with proper paragraphs and punctuation, ensuring no words or letters are lost from the original text.",
        "outline": "You are a helpful assistant that creates structured outlines of video transcripts.",
        "key_points": "You are a helpful assistant that extracts key points and insights from video transcripts.",
        "all": "You are a helpful assistant that provides summary, action points, and next steps from video transcripts.",
    }
    system_prompt = system_prompts.get(analysis_type, system_prompts["summary"])

    # Build context with transcript + optional description + links
    # NOTE: Do NOT truncate — original rule: "DO NOT lose or change any words, phrases, or letters"
    context_parts = [f"Transcript:\n{transcript_text}"]
    if description:
        context_parts.append(f"\nVideo Description:\n{description}")
    if links:
        context_parts.append("\nLinks from description:\n" + "\n".join(f"- {link}" for link in links))
    context = "\n".join(context_parts)

    # Build user prompt based on analysis type (original format)
    if analysis_type == "summary":
        user_prompt = f"{context}\n\nPlease provide a concise summary of this video content (2-4 paragraphs)."
    elif analysis_type == "action_points":
        user_prompt = f"{context}\n\nPlease extract the key actionable points from this video. Format as a bulleted list."
    elif analysis_type == "next_steps":
        user_prompt = f"{context}\n\nBased on this video content, what are the recommended next steps? Format as a numbered list."
    elif analysis_type == "structured_edit":
        user_prompt = f"""{context}

You are a Professional Editor. Please process the provided transcript into a comprehensive, master-level document optimized for AI Agent consumption.

Follow these specific tasks and formatting rules:

1. PROFESSIONAL EDIT TRANSCRIPT: Re-structure the verbatim transcript into logical paragraphs with correct punctuation and capitalization. DO NOT lose or change any words, phrases, or letters from the original text.
2. SUMMARY: Provide a concise 2-4 paragraph summary of the content.
3. ACTION POINTS: Extract the key actionable points as a bulleted list.
4. NEXT STEPS: Provide recommended next steps based on the content as a numbered list.

Format the output using clear Markdown headers (##):

## PROFESSIONAL EDIT TRANSCRIPT
[Your verbatim restructured transcript here]

## SUMMARY
[Your summary here]

## ACTION POINTS
[Your action points here]

## NEXT STEPS
[Your next steps here]"""
    else:  # "all"
        user_prompt = f"""{context}

Please provide a complete analysis with:
1. A concise summary (2-4 paragraphs)
2. Key points and insights
3. Actionable points as a bulleted list
4. Recommended next steps as a numbered list

Format using clear Markdown headers (##)."""

    # Call KILO API (higher tokens for comprehensive analyses)
    # structured_edit needs 16000+ tokens for all 4 sections (full transcript + summary + action points + next steps)
    api_url = f"{config['base_url'].rstrip('/')}/chat/completions"
    max_tokens = 16000 if analysis_type in ("structured_edit", "all") else 2000
    payload = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": max_tokens,
    }

    req = urllib.request.Request(
        api_url,
        data=__import__("json").dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['api_key']}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = __import__("json").loads(resp.read().decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"KILO API call failed: {exc}")

    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not content:
        raise ValueError("KILO API returned empty response")

    # Return raw text under the analysis_type key (frontend expects result.structured_edit, etc.)
    return {analysis_type: content.strip()}


def get_video_title(video_id: str) -> str:
    """Get video title — best effort, no API key required."""
    try:
        proxy_url = get_proxy_url()
        import tempfile as _tf, base64 as _b64
        cookies_file = os.path.join(os.path.dirname(__file__), "youtube_cookies.txt")
        if not os.path.exists(cookies_file):
            b64 = os.getenv("YOUTUBE_COOKIES_B64")
            if b64:
                try:
                    cookies_file = _tf.mktemp(suffix=".txt")
                    with open(cookies_file, "wb") as f:
                        f.write(_b64.b64decode(b64))
                except Exception:
                    cookies_file = None
        cmd = ["yt-dlp", "--skip-download", "--print", "title", "--js-runtimes", "node", f"https://www.youtube.com/watch?v={video_id}"]
        if cookies_file and os.path.exists(cookies_file):
            cmd.insert(1, "--cookies")
            cmd.insert(2, cookies_file)
        if proxy_url:
            cmd.insert(-1, "--proxy")
            cmd.insert(-1, proxy_url)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
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


class SummaryRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=10)


class SummaryResponse(BaseModel):
    success: bool
    video_id: str
    title: str
    summary: str
    generated_at: float


@app.post("/api/summary", response_model=SummaryResponse)
async def summary_endpoint(request: SummaryRequest):
    """Quick summary of a video transcript (top segments, no AI needed)."""
    try:
        video_id = extract_video_id(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    language = request.language.strip().lower() if request.language else "en"

    try:
        segments = get_transcript(request.url, lang=language)
        if not segments:
            raise HTTPException(status_code=404, detail="No transcript found")
        # Build summary from first 6 segments
        summary_parts = [s.text for s in segments[:6] if s.text.strip()]
        summary = " ".join(summary_parts)
        if not summary.strip():
            summary = "Transcript extracted successfully."
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Summary failed: {exc}")

    title = await asyncio.to_thread(get_video_title, video_id)

    return SummaryResponse(
        success=True,
        video_id=video_id,
        title=title,
        summary=summary,
        generated_at=time.time(),
    )


class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    type: str = Field(default="summary", pattern="^(summary|outline|key_points|action_points|next_steps|structured_edit|all)$")
    language: str = Field(default="en", min_length=2, max_length=10)
    transcript: Optional[str] = Field(default=None, description="Pre-fetched transcript text (skips YouTube fetch)")


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

    # Use provided transcript or fetch from YouTube
    if request.transcript:
        transcript_text = request.transcript
    else:
        try:
            segments = get_transcript(request.url, lang=language)
            transcript_text = "\n".join(
                f"[{seconds_to_timestamp(s.start)}] {s.text}" for s in segments
            )
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc))

    # Get video metadata (description + links) for richer AI context
    import re as _re
    video_info = await asyncio.to_thread(get_video_info_from_ytdlp, video_id)
    description = video_info.get("description", "")
    link_pattern = _re.compile(r'https?://[^\s\)\]>]+')
    links = link_pattern.findall(description) if description else []
    title = video_info.get("title", await asyncio.to_thread(get_video_title, video_id))

    # Then analyze with KILO (pass description + links for context)
    try:
        analysis = analyze_with_kilo(transcript_text, request.type, description=description, links=links)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

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


def get_video_info_from_ytdlp(video_id: str) -> dict:
    """Get video metadata using yt-dlp with proxy and JS runtime."""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        import tempfile as _tf2, base64 as _b642
        cookies_file = os.path.join(os.path.dirname(__file__), "youtube_cookies.txt")
        if not os.path.exists(cookies_file):
            b64 = os.getenv("YOUTUBE_COOKIES_B64")
            if b64:
                try:
                    cookies_file = _tf2.mktemp(suffix=".txt")
                    with open(cookies_file, "wb") as f:
                        f.write(_b642.b64decode(b64))
                except Exception:
                    cookies_file = None
        cmd = [
            "yt-dlp", "--skip-download", "--dump-json",
            "--no-playlist", "--no-warnings", "--js-runtimes", "node",
            url
        ]
        if cookies_file and os.path.exists(cookies_file):
            cmd.insert(1, "--cookies")
            cmd.insert(2, cookies_file)
        proxy_url = get_proxy_url()
        if proxy_url:
            cmd.insert(-1, "--proxy")
            cmd.insert(-1, proxy_url)

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        logger.warning(f"yt-dlp video info failed: {e}")
    return {}


@app.post("/api/video-info")
async def video_info_endpoint(request: VideoInfoRequest):
    """Get video metadata including description and extracted links."""
    try:
        video_id = extract_video_id(request.url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    title = await asyncio.to_thread(get_video_title, video_id)
    info = await asyncio.to_thread(get_video_info_from_ytdlp, video_id)

    # Extract links from description
    description = info.get("description", "")
    channel = info.get("uploader", info.get("channel", "Unknown"))
    duration = info.get("duration", 0)
    view_count = info.get("view_count", 0)
    upload_date = info.get("upload_date", "")

    # Extract URLs from description
    import re as _re
    link_pattern = _re.compile(r'https?://[^\s<>\"\'\)]+')
    links = link_pattern.findall(description) if description else []

    # Get transcript
    transcript_lines = []
    plain_text_parts = []
    plain_text_with_ts = []
    markdown_parts = []
    try:
        segments = get_transcript(request.url, lang="en")
        for segment in segments:
            ts = seconds_to_timestamp(segment.start)
            transcript_lines.append({
                "timestamp": ts,
                "seconds": int(segment.start),
                "text": segment.text,
            })
            plain_text_parts.append(segment.text)
            plain_text_with_ts.append(f"[{ts}] {segment.text}")
            markdown_parts.append(f"- **[{ts}]** {segment.text}")
    except Exception:
        pass  # Transcript is optional for video-info

    return {
        "success": True,
        "video_id": video_id,
        "title": title,
        "channel": channel,
        "duration": duration,
        "view_count": view_count,
        "upload_date": upload_date,
        "description": description,
        "links": links,
        "transcript": transcript_lines,
        "plain_text": "\n".join(plain_text_parts),
        "plain_text_with_timestamps": "\n".join(plain_text_with_ts),
        "markdown": "\n".join(markdown_parts),
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
