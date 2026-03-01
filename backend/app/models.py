from __future__ import annotations

from pydantic import BaseModel, HttpUrl


class ExtractRequest(BaseModel):
    url: HttpUrl


class TranscriptSegment(BaseModel):
    start: float
    duration: float
    text: str


class ExtractResponse(BaseModel):
    video_id: str
    title: str | None = None
    transcript: list[TranscriptSegment]
    plain_text: str
    markdown: str
