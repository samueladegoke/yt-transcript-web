"""
Transcript service for fetching YouTube video transcripts.

Handles:
- Video ID parsing with strict hostname validation
- Proxy configuration with credential masking
- Transcript fetching with error handling
"""

from __future__ import annotations

import os
import re
from collections import Counter
from urllib.parse import parse_qs, quote, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
)
from youtube_transcript_api.proxies import GenericProxyConfig

from .logging_config import get_logger, mask_proxy_url
from .models import TranscriptSegment, validate_video_id_format

logger = get_logger("transcript_service")

# =============================================================================
# Proxy Configuration (MVP-003: Credential Masking)
# =============================================================================

# Proxy configuration - credentials should be in environment variables only
# Format: protocol://user:pass@host:port or just protocol://host:port
_SOCKS5_PROXY = os.getenv("SOCKS5_PROXY")
_HTTP_PROXY = os.getenv("HTTP_PROXY")
_PROXY = _HTTP_PROXY or _SOCKS5_PROXY

# Separate proxy auth from URL (for credential rotation without restart)
_PROXY_USER = os.getenv("PROXY_USER")
_PROXY_PASS = os.getenv("PROXY_PASS")


def get_proxy_config() -> str | None:
    """
    Get the current proxy configuration.
    
    Returns the proxy URL with masked credentials for logging.
    """
    if not _PROXY:
        return None
    
    return mask_proxy_url(_PROXY)


def get_proxy_for_api() -> str | None:
    """
    Get proxy URL for API calls.
    
    Combines base proxy URL with credentials from environment variables
    to support credential rotation without code changes.
    """
    if not _PROXY:
        return None
    
    # If credentials are separate, rebuild the URL
    if _PROXY_USER and _PROXY_PASS:
        # Parse the base proxy URL
        if "@" not in _PROXY:
            # No credentials in base URL, add them
            # URL-encode credentials to handle special characters (@, :, /, etc.)
            parsed = urlparse(_PROXY)
            encoded_user = quote(_PROXY_USER, safe="")
            encoded_pass = quote(_PROXY_PASS, safe="")
            return f"{parsed.scheme}://{encoded_user}:{encoded_pass}@{parsed.netloc}"
    
    return _PROXY


def reload_proxy_config() -> None:
    """
    Reload proxy configuration from environment.
    
    Use this for credential rotation without restarting the application.
    Reads environment variables again to get new credentials.
    """
    global _SOCKS5_PROXY, _HTTP_PROXY, _PROXY, _PROXY_USER, _PROXY_PASS
    
    _SOCKS5_PROXY = os.getenv("SOCKS5_PROXY")
    _HTTP_PROXY = os.getenv("HTTP_PROXY")
    _PROXY = _HTTP_PROXY or _SOCKS5_PROXY
    _PROXY_USER = os.getenv("PROXY_USER")
    _PROXY_PASS = os.getenv("PROXY_PASS")
    
    logger.info(
        "Proxy configuration reloaded",
        extra={"proxy_url": get_proxy_config()}
    )


def mask_proxy_url_for_logs(url: str) -> str:
    """
    Mask user:pass credentials in proxy URLs for logging.
    
    This is the main helper function required by MVP-003.
    """
    return mask_proxy_url(url)


class TranscriptError(RuntimeError):
    pass


# =============================================================================
# API Instance Creation
# =============================================================================


def _create_api_with_proxy() -> YouTubeTranscriptApi:
    """Create YouTubeTranscriptApi instance with proxy if configured."""
    proxy_url = get_proxy_for_api()
    
    if proxy_url:
        # Support both http:// and socks5:// URLs
        final_proxy_url = proxy_url
        if final_proxy_url.startswith("socks5://"):
            # Convert socks5 to http format for GenericProxyConfig
            final_proxy_url = "http://" + final_proxy_url[9:]
        
        # Log the proxy URL with masked credentials
        logger.info(
            "Creating YouTubeTranscriptApi with proxy",
            extra={"proxy_url": mask_proxy_url(final_proxy_url)}
        )
        
        proxy_config = GenericProxyConfig(
            http_url=final_proxy_url, 
            https_url=final_proxy_url
        )
        return YouTubeTranscriptApi(proxy_config=proxy_config)
    
    return YouTubeTranscriptApi()


# =============================================================================
# Video ID Parsing
# =============================================================================


# Allowed YouTube hostnames (for SSRF prevention)
ALLOWED_YOUTUBE_HOSTS = frozenset({
    "youtube.com", 
    "www.youtube.com", 
    "youtu.be", 
    "m.youtube.com"
})


def parse_video_id(url: str) -> str:
    """
    Parse video ID from YouTube URL.
    
    Strict hostname validation prevents SSRF attacks.
    """
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    # SECURITY: Strict hostname validation (prevents SSRF)
    if host not in ALLOWED_YOUTUBE_HOSTS:
        raise TranscriptError("Invalid YouTube domain.")

    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
        if video_id:
            # Validate video ID format (MVP-004)
            try:
                return validate_video_id_format(video_id)
            except ValueError as e:
                raise TranscriptError(str(e)) from e

    if host in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        if parsed.path == "/watch":
            values = parse_qs(parsed.query).get("v")
            if values and values[0]:
                try:
                    return validate_video_id_format(values[0])
                except ValueError as e:
                    raise TranscriptError(str(e)) from e

        if parsed.path.startswith("/shorts/") or parsed.path.startswith("/embed/"):
            parts = [p for p in parsed.path.split("/") if p]
            if len(parts) >= 2:
                try:
                    return validate_video_id_format(parts[1])
                except ValueError as e:
                    raise TranscriptError(str(e)) from e

    raise TranscriptError("Unable to parse a valid YouTube video ID from URL.")


# =============================================================================
# Transcript Fetching
# =============================================================================


def fetch_transcript(
    url: str, languages: list[str] | None = None
) -> tuple[str, list[TranscriptSegment]]:
    """
    Fetch transcript for a YouTube video.
    
    Returns tuple of (video_id, segments).
    """
    video_id = parse_video_id(url)
    lang_candidates = languages or ["en", "en-US", "en-GB"]

    try:
        api = _create_api_with_proxy()
        transcript = api.fetch(video_id, languages=lang_candidates)
            
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
        # Log the error before wrapping
        logger.warning(
            f"Transcript fetch failed: {exc}",
            extra={"video_id": video_id, "error_type": type(exc).__name__}
        )
        raise TranscriptError(str(exc)) from exc
    
    except (RequestBlocked, IpBlocked) as exc:
        # YouTube is blocking the IP - log and suggest proxy
        proxy_info = get_proxy_config()
        
        logger.warning(
            f"YouTube blocked request: {exc}",
            extra={
                "video_id": video_id,
                "has_proxy": proxy_info is not None,
                "proxy_url": proxy_info,
            }
        )
        
        if not _PROXY:
            raise TranscriptError(
                "YouTube is blocking requests from this IP address. "
                "Please configure a proxy using SOCKS5_PROXY or HTTP_PROXY environment variable."
            ) from exc
        
        raise TranscriptError(
            f"YouTube blocked the request even with proxy. Try a different proxy. Error: {exc}"
        ) from exc
    
    except Exception as exc:  # pragma: no cover
        # Log all exceptions before wrapping
        logger.error(
            f"Transcript extraction failed: {exc}",
            extra={"video_id": video_id, "error_type": type(exc).__name__}
        )
        raise TranscriptError(
            f"Transcript extraction failed: {exc}. Try again in a moment."
        ) from exc

    segments = [
        TranscriptSegment(
            start=float(seg.start),
            duration=float(seg.duration),
            text=str(seg.text).strip(),
        )
        for seg in transcript
        if str(seg.text).strip()
    ]

    if not segments:
        raise TranscriptError("No transcript text was returned for this video.")

    return video_id, segments


# =============================================================================
# Formatting Helpers
# =============================================================================


def format_seconds(seconds: float) -> str:
    total = max(0, int(seconds))
    m, s = divmod(total, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h:02}:{m:02}:{s:02}"
    return f"{m:02}:{s:02}"


def to_plain_text(segments: list[TranscriptSegment]) -> str:
    return "\n".join(f"[{format_seconds(seg.start)}] {seg.text}" for seg in segments)


def _top_keywords(segments: list[TranscriptSegment]) -> list[str]:
    words: list[str] = []
    stop = {
        "the",
        "and",
        "that",
        "with",
        "this",
        "from",
        "have",
        "were",
        "your",
        "about",
        "there",
        "they",
        "what",
        "when",
        "where",
        "which",
        "would",
        "could",
        "should",
        "into",
        "also",
        "just",
        "because",
        "them",
        "then",
        "than",
        "been",
        "being",
        "will",
        "youtube",
        "video",
    }

    for segment in segments:
        words.extend(re.findall(r"[a-zA-Z]{4,}", segment.text.lower()))

    ranked = [w for w, _ in Counter(w for w in words if w not in stop).most_common(5)]
    return ranked


def to_markdown(segments: list[TranscriptSegment], title: str | None = None) -> str:
    heading = title or "YouTube Transcript"
    summary = (
        " ".join(seg.text for seg in segments[:3]).strip()
        or "Transcript extracted successfully."
    )
    keywords = _top_keywords(segments)

    lines = [f"# {heading}", "", "## Summary", "", summary, "", "## Key Takeaways", ""]
    if keywords:
        lines.extend(f"- {word.capitalize()}" for word in keywords)
    else:
        lines.append("- Review the transcript highlights below.")

    lines.extend(["", "## Transcript", ""])
    lines.extend(f"- **{format_seconds(seg.start)}** {seg.text}" for seg in segments)

    return "\n".join(lines)
