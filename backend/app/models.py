"""
Pydantic models for the YouTube Transcript API.

Includes request/response models with input validation:
- URL length validation (max 500 chars)
- Video ID format validation (11 chars, alphanumeric + _ + -)
- Strict hostname validation
"""

from __future__ import annotations

import re
from typing import Any

from pydantic import (
    BaseModel,
    HttpUrl,
    ValidationInfo,
    field_validator,
    model_validator,
)


# Video ID regex: exactly 11 characters, alphanumeric + underscore + hyphen
VIDEO_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{11}$")

# Allowed YouTube hostnames
ALLOWED_YOUTUBE_HOSTS = frozenset(
    {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
    }
)


class ExtractRequest(BaseModel):
    """
    Request model for transcript extraction.

    Validators:
    - URL must be max 500 characters
    - URL must be a valid YouTube URL (hostname validation)
    """

    url: HttpUrl

    @field_validator("url")
    @classmethod
    def validate_url_length(cls, v: HttpUrl, info: ValidationInfo) -> HttpUrl:
        """Validate URL is at most 500 characters."""
        url_str = str(v)
        if len(url_str) > 500:
            raise ValueError("URL must be at most 500 characters")
        return v

    @field_validator("url")
    @classmethod
    def validate_youtube_hostname(cls, v: HttpUrl, info: ValidationInfo) -> HttpUrl:
        """Validate URL hostname is a YouTube domain (prevents SSRF)."""
        host = v.host.lower() if v.host else ""
        if host not in ALLOWED_YOUTUBE_HOSTS:
            raise ValueError(
                f"Invalid hostname '{host}'. Only YouTube URLs are allowed."
            )
        return v

    @model_validator(mode="after")
    def validate_youtube_url_structure(self) -> ExtractRequest:
        """Additional validation for YouTube URL structure."""
        url_str = str(self.url)

        # Must contain youtube.com, youtu.be, or youtu.be
        has_valid_domain = "youtube.com" in url_str or "youtu.be" in url_str
        if not has_valid_domain:
            raise ValueError("URL must be a valid YouTube video URL")

        return self


def validate_video_id_format(video_id: str) -> str:
    """
    Validate video ID format.

    Video ID must be:
    - Exactly 11 characters
    - Contains only alphanumeric characters, underscore, or hyphen

    Raises ValueError if invalid.
    """
    if not video_id:
        raise ValueError("Video ID cannot be empty")

    if len(video_id) != 11:
        raise ValueError(f"Video ID must be exactly 11 characters, got {len(video_id)}")

    if not VIDEO_ID_PATTERN.match(video_id):
        raise ValueError(
            "Video ID must contain only alphanumeric characters, underscores, or hyphens"
        )

    return video_id


class TranscriptSegment(BaseModel):
    start: float
    duration: float
    text: str


class ExtractResponse(BaseModel):
    video_id: str
    title: str | None = None
    transcript: list[TranscriptSegment]
    plain_text: str  # Clean without timestamps
    plain_text_with_timestamps: str | None = None  # With timestamps for download option
    markdown: str


class VideoInfoRequest(BaseModel):
    """Request model for video info extraction."""

    url: HttpUrl


class VideoInfoResponse(BaseModel):
    """Response model for /api/video-info endpoint."""

    video_id: str
    title: str
    description: str
    channel: str
    transcript: list[TranscriptSegment]
    plain_text: str  # Clean without timestamps
    plain_text_with_timestamps: str | None = None  # With timestamps
    links: list[str]
    markdown: str


class AnalyzeRequest(BaseModel):
    """Request model for AI analysis."""

    url: HttpUrl
    analysis_type: str = "all"

    @field_validator("analysis_type")
    @classmethod
    def validate_analysis_type(cls, v: str) -> str:
        """Validate analysis_type is one of the allowed values."""
        allowed = {"summary", "action_points", "next_steps", "all"}
        if v not in allowed:
            raise ValueError(f"analysis_type must be one of: {', '.join(allowed)}")
        return v


class AnalyzeResponse(BaseModel):
    """Response model for /api/analyze endpoint."""

    summary: str | None = None
    action_points: str | None = None
    next_steps: str | None = None
