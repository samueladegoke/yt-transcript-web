"""YouTube transcript service primitives and CLI compatibility layer.

This module exposes a synchronous extraction helper used by the FastAPI backend
and an async ``TranscriptService`` used by the CLI/tests.
"""

from __future__ import annotations

import asyncio
import base64
import os
import subprocess
import tempfile
from dataclasses import dataclass
from http.cookiejar import MozillaCookieJar
from typing import Any, Dict, List, Optional

import requests
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig


class InvalidUrlError(ValueError):
    """Raised when a provided YouTube URL/ID is invalid."""


class TranscriptNotFoundError(ValueError):
    """Raised when captions are unavailable for a video."""


@dataclass
class TranscriptSegment:
    """A single segment of transcript text."""

    start: float
    duration: float
    text: str


@dataclass
class VideoInfo:
    """Normalized video metadata used by the CLI."""

    video_id: str
    title: str
    channel: str
    duration: str
    view_count: str
    upload_date: str


def extract_video_id(url: str) -> str:
    """Extract a YouTube video ID from URL-like inputs."""
    if not url or not url.strip():
        raise InvalidUrlError("URL cannot be empty")

    value = url.strip()

    # Handle common YouTube URL formats
    if "youtu.be/" in value:
        return value.split("youtu.be/")[-1].split("?")[0].split("&")[0]
    if "youtube.com/watch?v=" in value:
        return value.split("v=")[-1].split("&")[0]
    if "youtube.com/embed/" in value:
        return value.split("embed/")[-1].split("?")[0].split("&")[0]
    if "youtube.com/v/" in value:
        return value.split("/v/")[-1].split("?")[0].split("&")[0]
    if "youtube.com/shorts/" in value:
        return value.split("shorts/")[-1].split("?")[0].split("&")[0]

    # Raw video IDs are 11 chars.
    if len(value) == 11 and not value.startswith("http"):
        return value

    raise InvalidUrlError(f"Could not extract video ID from: {url}")


def get_proxy_url() -> Optional[str]:
    """Resolve proxy configuration with explicit priority.

    Priority: YT_PROXY > HTTP_PROXY > SOCKS5_PROXY > None
    """
    return (
        os.getenv("YT_PROXY")
        or os.getenv("HTTP_PROXY")
        or os.getenv("SOCKS5_PROXY")
        or None
    )


def reload_proxy_config() -> None:
    """Compatibility no-op for tests/legacy callers.

    Proxy settings are read dynamically from environment variables.
    """
    return None


def get_proxy_config() -> Optional[GenericProxyConfig]:
    """Create ``GenericProxyConfig`` from resolved proxy URL."""
    proxy_url = get_proxy_url()
    if not proxy_url:
        return None
    return GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)


def _load_http_client_with_cookies() -> Optional[requests.Session]:
    """Build requests session with Mozilla/Netscape cookies when available."""
    cookies_file = os.path.join(os.path.dirname(__file__), "..", "youtube_cookies.txt")

    if not os.path.exists(cookies_file):
        b64 = os.getenv("YOUTUBE_COOKIES_B64")
        if b64:
            try:
                temp_path = tempfile.mktemp(suffix=".txt")
                with open(temp_path, "wb") as handle:
                    handle.write(base64.b64decode(b64))
                cookies_file = temp_path
            except Exception:
                cookies_file = ""

    if cookies_file and os.path.exists(cookies_file):
        cookie_jar = MozillaCookieJar(cookies_file)
        try:
            cookie_jar.load(ignore_discard=True, ignore_expires=True)
            session = requests.Session()
            session.cookies = cookie_jar
            return session
        except Exception:
            return None

    return None


def get_transcript(url: str, lang: str = "en") -> List[TranscriptSegment]:
    """Synchronously fetch transcript segments for a video URL/ID."""
    video_id = extract_video_id(url)
    proxy_config = get_proxy_config()
    http_client = _load_http_client_with_cookies()

    try:
        api = YouTubeTranscriptApi(proxy_config=proxy_config, http_client=http_client)
        result = api.fetch(video_id, languages=[lang])
    except Exception as exc:  # pragma: no cover - external API errors vary
        error_type = type(exc).__name__
        if "NotFound" in error_type or "NoTranscript" in error_type:
            raise TranscriptNotFoundError(
                f"No transcript found for video {video_id}. The video may not have captions."
            )
        if "Blocked" in error_type or "RequestBlocked" in error_type:
            raise ValueError(
                f"YouTube blocked the request for video {video_id}. The proxy may be unavailable."
            )
        raise ValueError(f"Transcript fetch failed: {exc}")

    return [
        TranscriptSegment(
            start=float(entry.start),
            duration=float(entry.duration),
            text=entry.text,
        )
        for entry in result
    ]


def _safe_run_yt_dlp(video_id: str, print_field: str) -> str:
    """Run yt-dlp and return stripped stdout or an empty string."""
    cmd = [
        "yt-dlp",
        "--skip-download",
        "--print",
        print_field,
        f"https://www.youtube.com/watch?v={video_id}",
    ]

    proxy_url = get_proxy_url()
    if proxy_url:
        cmd[1:1] = ["--proxy", proxy_url]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return ""


class TranscriptService:
    """Async facade consumed by the CLI."""

    async def __aenter__(self) -> "TranscriptService":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    async def get_transcript(self, url: str, lang: str = "en") -> List[TranscriptSegment]:
        return await asyncio.to_thread(get_transcript, url, lang)

    async def get_video_info(self, url: str) -> VideoInfo:
        video_id = extract_video_id(url)

        def _collect() -> VideoInfo:
            title = _safe_run_yt_dlp(video_id, "title") or f"YouTube Video {video_id}"
            channel = _safe_run_yt_dlp(video_id, "uploader") or "Unknown"
            duration = _safe_run_yt_dlp(video_id, "duration_string") or "Unknown"
            view_count = _safe_run_yt_dlp(video_id, "view_count") or "Unknown"
            upload_date = _safe_run_yt_dlp(video_id, "upload_date") or "Unknown"
            return VideoInfo(
                video_id=video_id,
                title=title,
                channel=channel,
                duration=duration,
                view_count=view_count,
                upload_date=upload_date,
            )

        return await asyncio.to_thread(_collect)

    async def analyze(self, url: str, analysis_type: str = "summary", lang: str = "en") -> Dict[str, Any]:
        segments = await self.get_transcript(url, lang)
        text = " ".join(seg.text for seg in segments)
        if analysis_type == "outline":
            items = [line.strip() for line in text.split(".") if line.strip()][:8]
            return {"outline": items}
        if analysis_type == "key_points":
            items = [line.strip() for line in text.split(".") if line.strip()][:8]
            return {"key_points": items}
        return {"summary": text[:1000]}


async def check_environment() -> Dict[str, str]:
    """Return a lightweight environment health payload for CLI health command."""
    yt_dlp_ok = await asyncio.to_thread(lambda: bool(_safe_run_yt_dlp("dQw4w9WgXcQ", "id")))
    return {
        "status": "healthy" if yt_dlp_ok else "degraded",
        "proxy": "configured" if get_proxy_url() else "not_configured",
        "yt_dlp": "available" if yt_dlp_ok else "unavailable",
    }
