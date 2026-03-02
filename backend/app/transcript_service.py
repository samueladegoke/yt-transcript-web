from __future__ import annotations

import os
import re
from collections import Counter
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    RequestBlocked,
    IpBlocked,
)
from youtube_transcript_api.proxies import GenericProxyConfig

from .models import TranscriptSegment

# Proxy configuration for YouTube rate limiting
SOCKS5_PROXY = os.getenv("SOCKS5_PROXY")
HTTP_PROXY = os.getenv("HTTP_PROXY")
PROXY = HTTP_PROXY or SOCKS5_PROXY


class TranscriptError(RuntimeError):
    pass


def _create_api_with_proxy() -> YouTubeTranscriptApi:
    """Create YouTubeTranscriptApi instance with proxy if configured."""
    if PROXY:
        # Support both http:// and socks5:// URLs
        proxy_url = PROXY
        if proxy_url.startswith("socks5://"):
            # Convert socks5 to http format for GenericProxyConfig
            # socks5://user:pass@host:port -> http://user:pass@host:port
            proxy_url = "http://" + proxy_url[9:]
        
        proxy_config = GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)
        return YouTubeTranscriptApi(proxy_config=proxy_config)
    
    return YouTubeTranscriptApi()


def parse_video_id(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    # SECURITY FIX: Strict hostname validation (prevents SSRF)
    allowed_hosts = {"youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"}
    if host not in allowed_hosts:
        raise TranscriptError("Invalid YouTube domain.")

    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
        if video_id:
            return video_id

    if host in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        if parsed.path == "/watch":
            values = parse_qs(parsed.query).get("v")
            if values and values[0]:
                return values[0]

        if parsed.path.startswith("/shorts/") or parsed.path.startswith("/embed/"):
            parts = [p for p in parsed.path.split("/") if p]
            if len(parts) >= 2:
                return parts[1]

    raise TranscriptError("Unable to parse a valid YouTube video ID from URL.")


def fetch_transcript(
    url: str, languages: list[str] | None = None
) -> tuple[str, list[TranscriptSegment]]:
    video_id = parse_video_id(url)
    lang_candidates = languages or ["en", "en-US", "en-GB"]

    try:
        api = _create_api_with_proxy()
        transcript = api.fetch(video_id, languages=lang_candidates)
            
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
        raise TranscriptError(str(exc)) from exc
    except (RequestBlocked, IpBlocked) as exc:
        # YouTube is blocking the IP - suggest using a proxy
        if not PROXY:
            raise TranscriptError(
                "YouTube is blocking requests from this IP address. "
                "Please configure a proxy using SOCKS5_PROXY or HTTP_PROXY environment variable."
            ) from exc
        raise TranscriptError(
            f"YouTube blocked the request even with proxy. Try a different proxy. Error: {exc}"
        ) from exc
    except Exception as exc:  # pragma: no cover
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
