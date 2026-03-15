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
        "action_points": (
            "Extract all actionable items, tasks, and recommendations from this YouTube video transcript. "
            "Return as a JSON list of actionable points.\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Return ONLY valid JSON: {"action_points": ["action 1", "action 2", ...]}'
        ),
        "next_steps": (
            "Based on this YouTube video transcript, identify the logical next steps the viewer should take. "
            "Return as a numbered list.\n\n"
            f"Transcript:\n{transcript_text[:8000]}\n\n"
            'Return ONLY valid JSON: {"next_steps": ["step 1", "step 2", ...]}'
        ),
        "structured_edit": (
            "You are a professional video transcript editor. Produce a COMPREHENSIVE analysis that includes:\n"
            "1. A concise summary (2-4 sentences)\n"
            "2. A structured outline with timestamps\n"
            "3. Key points and insights\n"
            "4. Actionable next steps\n"
            "5. A professionally edited transcript with improved readability, punctuation, and paragraph breaks\n\n"
            f"Transcript:\n{transcript_text[:12000]}\n\n"
            'Return ONLY valid JSON: {"summary": "...", "outline": ["section 1", ...], "key_points": ["...", ...], "next_steps": ["...", ...], "structured_edit": "professionally edited transcript here..."}'
        ),
        "all": (
            "Perform a COMPLETE analysis of this YouTube video transcript. Include ALL of the following:\n"
            "- Summary\n"
            "- Outline\n"
            "- Key Points\n"
            "- Action Points\n"
            "- Next Steps\n\n"
            f"Transcript:\n{transcript_text[:10000]}\n\n"
            'Return ONLY valid JSON: {"summary": "...", "outline": [...], "key_points": [...], "action_points": [...], "next_steps": [...]}'
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

    # For structured_edit, return the full edit
    if analysis_type == "structured_edit":
        try:
            parsed = _json.loads(content.strip())
            return parsed
        except _json.JSONDecodeError:
            import re
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
            if json_match:
                try:
                    return _json.loads(json_match.group(1).strip())
                except _json.JSONDecodeError:
                    pass
            return {"structured_edit": content.strip()}

    # For all types, try to parse JSON
    try:
        parsed = _json.loads(content.strip())
        return parsed
    except _json.JSONDecodeError:
        import re
        json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", content)
        if json_match:
            try:
                return _json.loads(json_match.group(1).strip())
            except _json.JSONDecodeError:
                pass
        # Fallback: return as text list split by newlines
        lines = [l.strip("- •\t ") for l in content.strip().split("\n") if l.strip()]
        key_map = {"outline": "outline", "key_points": "key_points", "action_points": "action_points", "next_steps": "next_steps"}
        key = key_map.get(analysis_type, "result")
        return {key: lines}


def get_video_title(video_id: str) -> str:
    """Get video title — best effort, no API key required."""
    try:
        proxy_url = get_proxy_url()
        cmd = ["yt-dlp", "--skip-download", "--print", "title", "--js-runtimes", "node", f"https://www.youtube.com/watch?v={video_id}"]
        if proxy_url:
            cmd = ["yt-dlp", "--skip-download", "--print", "title", "--js-runtimes", "node", "--proxy", proxy_url, f"https://www.youtube.com/watch?v={video_id}"]
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


def get_video_info_from_ytdlp(video_id: str) -> dict:
    """Get video metadata using yt-dlp with proxy and JS runtime."""
    try:
        url = f"https://www.youtube.com/watch?v={video_id}"
        cmd = [
            "yt-dlp", "--skip-download", "--dump-json",
            "--no-playlist", "--no-warnings", "--js-runtimes", "node",
            url
        ]
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
