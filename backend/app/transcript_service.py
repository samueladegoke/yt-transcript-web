"""
Transcript service for fetching YouTube video transcripts.

Handles:
- Video ID parsing with strict hostname validation
- Proxy configuration with credential masking
- Transcript fetching with error handling
- YouTube Data API integration for video metadata
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
# YouTube Data API Configuration
# =============================================================================

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# URL regex pattern for extracting links from description
URL_PATTERN = re.compile(r'https?://[^\s<>"{}|\\^`\[\]]+')

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

    logger.info("Proxy configuration reloaded", extra={"proxy_url": get_proxy_config()})


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
        # Only HTTP/HTTPS proxies are supported
        # SOCKS5 is not supported by youtube-transcript-api
        if proxy_url.startswith("socks5://"):
            raise TranscriptError(
                "SOCKS5 proxies are not supported. "
                "Please use HTTP_PROXY environment variable instead of SOCKS5_PROXY."
            )
        # Log the proxy URL with masked credentials
        logger.info(
            "Creating YouTubeTranscriptApi with proxy",
            extra={"proxy_url": mask_proxy_url(proxy_url)}
        )
        
        proxy_config = GenericProxyConfig(
            http_url=proxy_url, 
            https_url=proxy_url
        )
        return YouTubeTranscriptApi(proxy_config=proxy_config)

    return YouTubeTranscriptApi()


# =============================================================================
# Video ID Parsing
# =============================================================================


# Allowed YouTube hostnames (for SSRF prevention)
ALLOWED_YOUTUBE_HOSTS = frozenset(
    {"youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"}
)


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
            extra={"video_id": video_id, "error_type": type(exc).__name__},
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
            },
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
            extra={"video_id": video_id, "error_type": type(exc).__name__},
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
# YouTube Data API - Video Metadata
# =============================================================================


class VideoInfoError(RuntimeError):
    """Error fetching video info from YouTube Data API."""

    pass


async def fetch_video_info(video_id: str) -> tuple[str, str, str]:
    """
    Fetch video metadata from YouTube Data API v3 using async HTTP.

    Returns tuple of (title, description, channel_name).

    Requires YOUTUBE_API_KEY environment variable to be set.
    """
    if not YOUTUBE_API_KEY:
        raise VideoInfoError(
            "YOUTUBE_API_KEY environment variable is not set. "
            "Please configure your YouTube Data API key."
        )

    import httpx

    url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={YOUTUBE_API_KEY}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning(
                f"YouTube API request failed: {exc}", extra={"video_id": video_id}
            )
            raise VideoInfoError(f"Failed to fetch video info: {exc}") from exc

        data = response.json()

        if "error" in data:
            error_msg = data["error"].get("message", "Unknown error")
            logger.warning(
                f"YouTube API error: {error_msg}",
                extra={"video_id": video_id, "error": error_msg},
            )
            raise VideoInfoError(f"YouTube API error: {error_msg}")

        items = data.get("items", [])
        if not items:
            raise VideoInfoError(f"Video not found: {video_id}")

        snippet = items[0].get("snippet", {})
        title = snippet.get("title", "")
        description = snippet.get("description", "")
        channel = snippet.get("channelTitle", "")

        return title, description, channel


def extract_links(description: str) -> list[str]:
    """
    Extract URLs from YouTube video description.

    Returns list of unique URLs found in the description.
    """
    if not description:
        return []

    matches = URL_PATTERN.findall(description)

    cleaned_links = []
    for link in matches:
        while link and link[-1] in ".,;:!)]}":
            link = link[:-1]
        if link and link not in cleaned_links:
            cleaned_links.append(link)

    return cleaned_links


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
