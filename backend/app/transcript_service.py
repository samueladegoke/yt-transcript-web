from __future__ import annotations

import re
from collections import Counter
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, VideoUnavailable, YouTubeTranscriptApi

from .models import TranscriptSegment


class TranscriptError(RuntimeError):
    pass


def parse_video_id(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "youtu.be" in host:
        video_id = parsed.path.strip("/").split("/")[0]
        if video_id:
            return video_id

    if "youtube.com" in host:
        if parsed.path == "/watch":
            values = parse_qs(parsed.query).get("v")
            if values and values[0]:
                return values[0]

        if parsed.path.startswith("/shorts/") or parsed.path.startswith("/embed/"):
            parts = [p for p in parsed.path.split("/") if p]
            if len(parts) >= 2:
                return parts[1]

    raise TranscriptError("Unable to parse a valid YouTube video ID from URL.")


def fetch_transcript(url: str, languages: list[str] | None = None) -> tuple[str, list[TranscriptSegment]]:
    video_id = parse_video_id(url)
    lang_candidates = languages or ["en", "en-US", "en-GB"]

    try:
        raw_segments = YouTubeTranscriptApi.get_transcript(video_id, languages=lang_candidates)
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
        raise TranscriptError(str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise TranscriptError("Transcript extraction failed. Try again in a moment.") from exc

    segments = [
        TranscriptSegment(
            start=float(item.get("start", 0.0)),
            duration=float(item.get("duration", 0.0)),
            text=str(item.get("text", "")).strip(),
        )
        for item in raw_segments
        if str(item.get("text", "")).strip()
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
    summary = " ".join(seg.text for seg in segments[:3]).strip() or "Transcript extracted successfully."
    keywords = _top_keywords(segments)

    lines = [f"# {heading}", "", "## Summary", "", summary, "", "## Key Takeaways", ""]
    if keywords:
        lines.extend(f"- {word.capitalize()}" for word in keywords)
    else:
        lines.append("- Review the transcript highlights below.")

    lines.extend(["", "## Transcript", ""])
    lines.extend(f"- **{format_seconds(seg.start)}** {seg.text}" for seg in segments)

    return "\n".join(lines)
