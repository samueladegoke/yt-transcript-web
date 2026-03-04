"""
YouTube Transcript API - Main Application

Implements MVPs:
- MVP-002: Structured Logging with correlation IDs
- MVP-003: Proxy Credential Masking (in transcript_service.py)
- MVP-004: Input Validation Hardening (in models.py)
- MVP-005: Rate Limiting Re-implementation
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .logging_config import (
    CORRELATION_ID_HEADER,
    get_logger,
    setup_logging,
)
from .middleware import (
    CorrelationIdMiddleware,
    RequestLoggingMiddleware,
    create_logging_extra,
)
from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    ExtractRequest,
    ExtractResponse,
    TranscriptSegment,
    VideoInfoRequest,
    VideoInfoResponse,
)
from .transcript_service import (
    TranscriptError,
    VideoInfoError,
    extract_links,
    fetch_transcript,
    fetch_video_info,
    summarize_segments,
    to_markdown,
    to_plain_text,
)

# Load environment variables
load_dotenv()

# Setup structured logging (MVP-002)
logger = setup_logging()


# =============================================================================
# Rate Limiting Configuration (MVP-005)
# =============================================================================

# Per-IP rate limiting
limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_key(request: Request) -> str:
    """Get the rate limit key (IP address) for a request."""
    return get_remote_address(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting YouTube Transcript API", extra={"version": "0.1.0"})
    yield
    # Shutdown
    logger.info("Shutting down YouTube Transcript API")


# Create FastAPI app with lifespan
app = FastAPI(
    title="YT Transcript API",
    version="0.1.0",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter


# Custom rate limit exceeded handler (MVP-005)
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded with proper headers."""
    # Use slowapi's default handler to avoid accessing non-existent attributes
    # on RateLimitExceeded (exc.limit, exc.reset_at, exc.current don't exist)
    return await _rate_limit_exceeded_handler(request, exc)


# =============================================================================
# Middleware Stack
# =============================================================================

# Correlation ID middleware (MVP-002)
app.add_middleware(CorrelationIdMiddleware)

# Request logging middleware (MVP-002)
app.add_middleware(RequestLoggingMiddleware)


# =============================================================================
# CORS Configuration
# =============================================================================

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "https://yt-transcript-web.pages.dev"
).split(",")

# Production hardening: strip whitespace and filter empty origins
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", CORRELATION_ID_HEADER],
    allow_credentials=False,  # Production hardening: disable credentials
)


# =============================================================================
# Request Body Size Limit Middleware (MVP-004)
# =============================================================================

MAX_REQUEST_BODY_SIZE = 10 * 1024  # 10KB


@app.middleware("http")
async def limit_request_body_size(request: Request, call_next):
    """Limit request body size to 10KB (MVP-004)."""
    content_length = request.headers.get("content-length")

    if content_length and int(content_length) > MAX_REQUEST_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={
                "detail": f"Request body too large. Maximum size is {MAX_REQUEST_BODY_SIZE} bytes."
            },
        )

    # For chunked transfers (no Content-Length), read and count bytes
    if content_length is None:
        body = b""
        async for chunk in request.stream():
            body += chunk
            if len(body) > MAX_REQUEST_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={
                        "detail": f"Request body too large. Maximum size is {MAX_REQUEST_BODY_SIZE} bytes."
                    },
                )
        # Reconstruct the request with the body
        from starlette.datastructures import Headers
        from starlette.requests import empty_receive

        # Create a new request with the body
        async def receive():
            return {"type": "http.request", "body": body}

        request._receive = receive

    return await call_next(request)


# =============================================================================
# Health Endpoint (30 req/min - MVP-005)
# =============================================================================


@app.get("/health")
@limiter.limit("30/minute")
def health(request: Request) -> dict[str, str]:
    """Health check endpoint with rate limiting."""
    return {"status": "ok"}


# =============================================================================
# API Endpoints
# =============================================================================


def _fetch_transcript_or_raise(
    url: str, request: Request
) -> tuple[str, list[TranscriptSegment]]:
    """
    Fetch transcript and convert TranscriptError to HTTPException.

    Logs all exceptions before wrapping (MVP-002).
    """
    extra = create_logging_extra(request)

    try:
        return fetch_transcript(url)
    except TranscriptError as exc:
        # Log exception before wrapping (MVP-002)
        logger.warning(f"Transcript fetch error: {exc}", extra={**extra, "url": url})
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/extract", response_model=ExtractResponse)
@limiter.limit("10/minute")  # MVP-005: 10 req/min
def extract(request: Request, extract_req: ExtractRequest) -> ExtractResponse:
    """
    Extract transcript from YouTube video.

    Rate limited to 10 requests per minute per IP (MVP-005).
    """
    extra = create_logging_extra(request)

    logger.info(
        "Extract request received", extra={**extra, "url": str(extract_req.url)}
    )

    video_id, transcript = _fetch_transcript_or_raise(str(extract_req.url), request)
    plain_text = to_plain_text(transcript)  # Clean without timestamps
    plain_text_with_timestamps = to_plain_text(
        transcript, include_timestamps=True
    )  # With timestamps
    markdown = to_markdown(transcript, title=f"Transcript: {video_id}")

    return ExtractResponse(
        video_id=video_id,
        title=f"Transcript: {video_id}",
        transcript=transcript,
        plain_text=plain_text,
        plain_text_with_timestamps=plain_text_with_timestamps,
        markdown=markdown,
    )


@app.post("/api/summary")
@limiter.limit("10/minute")  # MVP-005: 10 req/min
def summarize(request: Request, extract_req: ExtractRequest) -> dict:
    """
    Generate a summary of the transcript.

    Rate limited to 10 requests per minute per IP (MVP-005).
    """
    extra = create_logging_extra(request)

    logger.info(
        "Summary request received", extra={**extra, "url": str(extract_req.url)}
    )

    video_id, transcript = _fetch_transcript_or_raise(str(extract_req.url), request)

    summary = summarize_segments(transcript, limit=5)

    return {"video_id": video_id, "summary": summary}


@app.post("/api/video-info", response_model=VideoInfoResponse)
@limiter.limit("10/minute")  # MVP-005: 10 req/min
async def video_info(
    request: Request, extract_req: ExtractRequest
) -> VideoInfoResponse:
    """
    Fetch video info including transcript, description, title, channel, and extracted links.

    Uses asyncio to fetch transcript and YouTube metadata in parallel.
    Rate limited to 10 requests per minute per IP (MVP-005).
    """
    import asyncio

    extra = create_logging_extra(request)

    logger.info(
        "Video info request received", extra={**extra, "url": str(extract_req.url)}
    )

    # First get the video ID from the URL
    from .transcript_service import parse_video_id

    video_id = parse_video_id(str(extract_req.url))

    # Fetch transcript and video info in parallel using asyncio
    async def fetch_transcript_async():
        """Run transcript fetch in thread pool (blocking I/O)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, fetch_transcript, str(extract_req.url))

    async def fetch_video_info_async():
        """Fetch video info directly (already async)."""
        return await fetch_video_info(video_id)

    try:
        # Run both fetches in parallel
        transcript_result, video_metadata = await asyncio.gather(
            fetch_transcript_async(), fetch_video_info_async(), return_exceptions=True
        )
    except Exception as exc:
        logger.warning(
            f"Parallel fetch error: {exc}", extra={**extra, "url": str(extract_req.url)}
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Handle transcript errors
    if isinstance(transcript_result, Exception):
        logger.warning(
            f"Transcript fetch error: {transcript_result}",
            extra={**extra, "url": str(extract_req.url)},
        )
        raise HTTPException(
            status_code=400, detail=str(transcript_result)
        ) from transcript_result

    # Handle video info errors
    if isinstance(video_metadata, Exception):
        logger.warning(
            f"Video info fetch error: {video_metadata}",
            extra={**extra, "url": str(extract_req.url)},
        )
        raise HTTPException(
            status_code=400, detail=str(video_metadata)
        ) from video_metadata

    # Unpack results
    _, transcript = transcript_result
    title, description, channel = video_metadata

    # Extract links from description
    links = extract_links(description)

    # Format outputs
    plain_text = to_plain_text(transcript)  # Clean without timestamps
    plain_text_with_timestamps = to_plain_text(
        transcript, include_timestamps=True
    )  # With timestamps
    markdown = to_markdown(transcript, title=f"Transcript: {title}")

    return VideoInfoResponse(
        video_id=video_id,
        title=title,
        description=description,
        channel=channel,
        transcript=transcript,
        plain_text=plain_text,
        plain_text_with_timestamps=plain_text_with_timestamps,
        links=links,
        markdown=markdown,
    )


# =============================================================================
# AI Analysis Endpoint
# =============================================================================


KILO_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
KILO_MODEL = "meta/llama-4-maverick-17b-128e-instruct"


async def call_kilo_api(prompt: str, analysis_type: str) -> str:
    """Call Kilo auto-free model API for AI analysis."""
    import aiohttp

    system_prompt = {
        "summary": "You are a helpful assistant that creates concise summaries of video transcripts.",
        "action_points": "You are a helpful assistant that extracts actionable points from video transcripts.",
        "next_steps": "You are a helpful assistant that suggests next steps based on video transcripts.",
        "structured_edit": "You are a professional editor. Your task is to structure the transcript into a coherent document with proper paragraphs and punctuation, ensuring no words or letters are lost from the original text.",
        "all": "You are a helpful assistant that provides summary, action points, and next steps from video transcripts.",
    }.get(analysis_type, "You are a helpful assistant.")

    import os

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    # Get API key from environment
    api_key = "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"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
        headers["HTTP-Referer"] = "https://yt-transcript-web.pages.dev"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                KILO_API_URL,
                json={
                    "model": KILO_MODEL,
                    "messages": messages,
                    "max_tokens": 2000,
                },
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=300),
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.warning(f"Kilo API error: {response.status} - {error_text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"AI service unavailable: {response.status}",
                    )

                result = await response.json()
                return result["choices"][0]["message"]["content"]
    except aiohttp.ClientError as exc:
        logger.warning(f"Kilo API connection error: {exc}")
        raise HTTPException(
            status_code=502, detail="AI service unavailable. Please try again later."
        ) from exc


def build_analysis_prompt(
    transcript: str,
    description: str | None,
    links: list[str],
    analysis_type: str,
) -> str:
    """Build the prompt for AI analysis based on analysis type."""
    context_parts = [f"Transcript:\n{transcript}"]

    if description:
        context_parts.append(f"\nVideo Description:\n{description}")

    if links:
        context_parts.append(
            f"\nLinks from description:\n" + "\n".join(f"- {link}" for link in links)
        )

    context = "\n".join(context_parts)

    if analysis_type == "summary":
        return f"""{context}

Please provide a concise summary of this video content (2-4 paragraphs)."""
    elif analysis_type == "action_points":
        return f"""{context}

Please extract the key actionable points from this video. Format as a bulleted list."""
    elif analysis_type == "next_steps":
        return f"""{context}

Based on this video content, what are the recommended next steps? Format as a numbered list."""
    elif analysis_type == "structured_edit":
        return f"""{context}

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
        return f"""{context}

Please provide:
1. A concise summary (2-4 paragraphs)
2. Key action points (bulleted list)
3. Recommended next steps (numbered list)

Format your response clearly with headings."""


@app.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("5/minute")  # Stricter rate limit for AI endpoint
async def analyze(request: Request, analyze_req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze video transcript using AI (Kilo auto-free model).

    Supports analysis types: summary, action_points, next_steps, all
    Rate limited to 5 requests per minute per IP.
    """
    import asyncio

    extra = create_logging_extra(request)

    logger.info(
        "Analyze request received",
        extra={
            **extra,
            "url": str(analyze_req.url),
            "analysis_type": analyze_req.analysis_type,
        },
    )

    # Get video ID
    from .transcript_service import parse_video_id

    video_id = parse_video_id(str(analyze_req.url))

    # Fetch video info and transcript in parallel
    async def fetch_transcript_async():
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, fetch_transcript, str(analyze_req.url))

    async def fetch_video_info_async():
        return await fetch_video_info(video_id)

    try:
        transcript_result, video_metadata = await asyncio.gather(
            fetch_transcript_async(), fetch_video_info_async(), return_exceptions=True
        )
    except Exception as exc:
        logger.warning(
            f"Parallel fetch error: {exc}", extra={**extra, "url": str(analyze_req.url)}
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Handle transcript errors
    if isinstance(transcript_result, Exception):
        logger.warning(f"Transcript fetch error: {transcript_result}", extra={**extra})
        raise HTTPException(
            status_code=400, detail=str(transcript_result)
        ) from transcript_result

    # Handle video info errors
    if isinstance(video_metadata, Exception):
        logger.warning(f"Video info fetch error: {video_metadata}", extra={**extra})
        raise HTTPException(
            status_code=400, detail=str(video_metadata)
        ) from video_metadata

    # Unpack results
    _, transcript = transcript_result
    title, description, channel = video_metadata

    # Extract links from description
    links = extract_links(description) if description else []

    # Get plain text transcript
    plain_text = to_plain_text(transcript)

    # Build prompt and call AI
    prompt = build_analysis_prompt(
        plain_text, description, links, analyze_req.analysis_type
    )

    ai_result = await call_kilo_api(prompt, analyze_req.analysis_type)

    # Parse AI result based on analysis type
    summary = None
    action_points = None
    next_steps = None
    structured_edit = None

    if analyze_req.analysis_type in ("summary", "all"):
        summary = ai_result
    elif analyze_req.analysis_type == "action_points":
        action_points = ai_result
    elif analyze_req.analysis_type == "next_steps":
        next_steps = ai_result
    elif analyze_req.analysis_type == "structured_edit":
        from datetime import datetime
        # Agent-friendly structure with YAML frontmatter
        frontmatter = "---\n"
        frontmatter += f"title: \"{title}\"\n"
        frontmatter += f"video_id: \"{video_id}\"\n"
        frontmatter += f"channel: \"{channel}\"\n"
        frontmatter += f"date_extracted: \"{datetime.now().isoformat()}\"\n"
        frontmatter += "---\n\n"
        
        doc_header = f"# {title}\n\n"
        doc_header += "## VIDEO DESCRIPTION\n"
        doc_header += (description if description else "No description available") + "\n\n"
        doc_header += "## LINKS\n"
        if links:
            doc_header += "\n".join(f"- {link}" for link in links) + "\n\n"
        else:
            doc_header += "No links found\n\n"
            
        structured_edit = frontmatter + doc_header + ai_result
    else:
        # Parse "all" response - look for sections
        current_section = "summary"
        summary_parts = []
        action_parts = []
        next_parts = []

        for line in ai_result.split("\n"):
            line_lower = line.lower().strip()
            if "summary" in line_lower and ":" in line:
                current_section = "summary"
                continue
            elif "action" in line_lower and "point" in line_lower:
                current_section = "action_points"
                continue
            elif "next step" in line_lower or "next steps" in line_lower:
                current_section = "next_steps"
                continue

            if current_section == "summary":
                summary_parts.append(line)
            elif current_section == "action_points":
                action_parts.append(line)
            else:
                next_parts.append(line)

        summary = "\n".join(summary_parts).strip() if summary_parts else ai_result
        action_points = "\n".join(action_parts).strip() if action_parts else None
        next_steps = "\n".join(next_parts).strip() if next_parts else None

    return AnalyzeResponse(
        summary=summary,
        action_points=action_points,
        next_steps=next_steps,
        structured_edit=structured_edit,
    )
