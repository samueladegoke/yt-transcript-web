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
from .models import ExtractRequest, ExtractResponse, TranscriptSegment
from .transcript_service import (
    TranscriptError,
    fetch_transcript,
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
    response = JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded",
            "retry_after": exc.detail,
        },
    )
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(exc.limit)
    response.headers["X-RateLimit-Remaining"] = "0"
    response.headers["X-RateLimit-Reset"] = str(int(exc.reset_at))
    response.headers["Retry-After"] = str(int(exc.reset_at - exc.current))
    return response


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


def _fetch_transcript_or_raise(url: str, request: Request) -> tuple[str, list[TranscriptSegment]]:
    """
    Fetch transcript and convert TranscriptError to HTTPException.
    
    Logs all exceptions before wrapping (MVP-002).
    """
    extra = create_logging_extra(request)
    
    try:
        return fetch_transcript(url)
    except TranscriptError as exc:
        # Log exception before wrapping (MVP-002)
        logger.warning(
            f"Transcript fetch error: {exc}",
            extra={**extra, "url": url}
        )
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
        "Extract request received",
        extra={**extra, "url": str(extract_req.url)}
    )
    
    video_id, transcript = _fetch_transcript_or_raise(str(extract_req.url), request)
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
@limiter.limit("10/minute")  # MVP-005: 10 req/min
def summarize(request: Request, extract_req: ExtractRequest) -> dict:
    """
    Generate a summary of the transcript.
    
    Rate limited to 10 requests per minute per IP (MVP-005).
    """
    extra = create_logging_extra(request)
    
    logger.info(
        "Summary request received",
        extra={**extra, "url": str(extract_req.url)}
    )
    
    video_id, transcript = _fetch_transcript_or_raise(str(extract_req.url), request)

    # Simple extractive summary - first 5 segments
    summary_parts = [seg.text for seg in transcript[:5]]
    summary = " ".join(summary_parts)

    return {"video_id": video_id, "summary": summary}
