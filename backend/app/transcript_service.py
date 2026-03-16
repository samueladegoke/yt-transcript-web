"""YouTube Transcript Service

Handles fetching transcripts and video info from YouTube via proxy.
Uses youtube_transcript_api with IPRoyal proxy to bypass YouTube IP blocks.
"""
import os
from typing import Optional, List
from dataclasses import dataclass

import requests
from http.cookiejar import MozillaCookieJar
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig


@dataclass
class TranscriptSegment:
    """A single segment of transcript text."""
    start: float
    duration: float
    text: str


def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
    if not url:
        raise ValueError("URL cannot be empty")

    # Handle various YouTube URL formats
    if "youtu.be/" in url:
        return url.split("youtu.be/")[-1].split("?")[0].split("&")[0]
    elif "youtube.com/watch?v=" in url:
        return url.split("v=")[-1].split("&")[0]
    elif "youtube.com/embed/" in url:
        return url.split("embed/")[-1].split("?")[0].split("&")[0]
    elif "youtube.com/v/" in url:
        return url.split("/v/")[-1].split("?")[0].split("&")[0]
    elif "youtube.com/shorts/" in url:
        return url.split("shorts/")[-1].split("?")[0].split("&")[0]

    # If it looks like a raw video ID, return it
    stripped = url.strip()
    if len(stripped) in [11, 12] and not stripped.startswith("http"):
        return stripped

    raise ValueError(f"Could not extract video ID from: {url}")


def get_proxy_url() -> Optional[str]:
    """Get proxy URL from YT_PROXY env var (IPRoyal credentials)."""
    return os.getenv("YT_PROXY")


def get_proxy_config() -> Optional[GenericProxyConfig]:
    """Create GenericProxyConfig from YT_PROXY env var."""
    proxy_url = get_proxy_url()
    if not proxy_url:
        return None
    return GenericProxyConfig(
        http_url=proxy_url,
        https_url=proxy_url,
    )


def get_transcript(url: str, lang: str = "en") -> List[TranscriptSegment]:
    """
    Fetch transcript for a YouTube video using proxy + cookies.

    Args:
        url: YouTube video URL or video ID
        lang: Language code (default: 'en')

    Returns:
        List of TranscriptSegment objects

    Raises:
        ValueError: If URL is invalid or transcript not found
    """
    video_id = extract_video_id(url)
    proxy_config = get_proxy_config()

    # Load YouTube cookies for bot protection bypass
    # Check file first, then YOUTUBE_COOKIES_B64 env var
    import tempfile, base64
    http_client = None
    cookies_file = os.path.join(os.path.dirname(__file__), "..", "youtube_cookies.txt")
    if not os.path.exists(cookies_file):
        b64 = os.getenv("YOUTUBE_COOKIES_B64")
        if b64:
            try:
                cookies_file = tempfile.mktemp(suffix=".txt")
                with open(cookies_file, "wb") as f:
                    f.write(base64.b64decode(b64))
            except Exception:
                cookies_file = None
    if cookies_file and os.path.exists(cookies_file):
        cj = MozillaCookieJar(cookies_file)
        try:
            cj.load(ignore_discard=True, ignore_expires=True)
            http_client = requests.Session()
            http_client.cookies = cj
        except Exception:
            http_client = None

    try:
        api = YouTubeTranscriptApi(proxy_config=proxy_config, http_client=http_client)
        result = api.fetch(video_id, languages=[lang])
    except Exception as exc:
        error_type = type(exc).__name__
        if "NotFound" in error_type or "NoTranscript" in error_type:
            raise ValueError(
                f"No transcript found for video {video_id}. "
                "The video may not have captions."
            )
        elif "Blocked" in error_type or "RequestBlocked" in error_type:
            raise ValueError(
                f"YouTube blocked the request for video {video_id}. "
                "The proxy may be unavailable."
            )
        else:
            raise ValueError(f"Transcript fetch failed: {exc}")

    segments = []
    for entry in result:
        segments.append(
            TranscriptSegment(
                start=float(entry.start),
                duration=float(entry.duration),
                text=entry.text,
            )
        )

    return segments
