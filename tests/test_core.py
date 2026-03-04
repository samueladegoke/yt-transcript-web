from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from youtube_transcript_api import TranscriptsDisabled

from app.transcript_service import (
    TranscriptError,
    fetch_transcript,
    parse_video_id,
    summarize_segments,
)


class _MockTranscriptSegment:
    def __init__(self, start: float, duration: float, text: str) -> None:
        self.start = start
        self.duration = duration
        self.text = text


@patch("app.transcript_service.YouTubeTranscriptApi")
def test_standard_video_fetches_segments(mock_api: MagicMock) -> None:
    mock_instance = MagicMock()
    mock_instance.fetch.return_value = [
        _MockTranscriptSegment(0.0, 5.0, "Hello world"),
        _MockTranscriptSegment(5.0, 5.0, "This is yt-transcript"),
    ]
    mock_api.return_value = mock_instance

    video_id, segments = fetch_transcript("https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    assert video_id == "dQw4w9WgXcQ"
    assert len(segments) == 2
    assert segments[0].text == "Hello world"


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/watch?v=dQw4w9WgXcQ",
        "https://vimeo.com/123456",
        "https://www.youtube.com/watch?v=short",
    ],
)
def test_invalid_url_rejected(url: str) -> None:
    with pytest.raises(TranscriptError):
        parse_video_id(url)


@patch("app.transcript_service.YouTubeTranscriptApi")
def test_age_restricted_videos_raise_clear_error(mock_api: MagicMock) -> None:
    mock_instance = MagicMock()
    mock_instance.fetch.side_effect = TranscriptsDisabled(video_id="sensitiv1A2")
    mock_api.return_value = mock_instance

    with pytest.raises(TranscriptError) as exc:
        fetch_transcript("https://youtu.be/sensitiv1A2")

    assert "transcript" in str(exc.value).lower()


def test_summarize_segments_handles_dict_like_objects() -> None:
    data = [
        {"start": 0, "text": "Segment one"},
        {"start": 5, "text": "Segment two"},
        {"start": 9, "text": "  "},
    ]

    summary = summarize_segments(data, limit=2)

    assert summary == "Segment one Segment two"
