from __future__ import annotations

import pytest
from unittest.mock import patch, MagicMock

from app.transcript_service import (
    parse_video_id,
    fetch_transcript,
    TranscriptError,
)
from app.models import TranscriptSegment


class TestParseVideoId:
    """Tests for parse_video_id function."""

    @pytest.mark.parametrize(
        "url,expected_id",
        [
            # Standard watch URLs
            ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("http://www.youtube.com/watch?v=abc123DEF", "abc123DEF"),
            # Short URLs
            ("http://youtu.be/abc123", "abc123"),
            # Shorts URLs
            ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/shorts/abc123", "abc123"),
            # Embed URLs
            ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/embed/abc123", "abc123"),
            # Mobile URLs
            ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ],
    )
    def test_parse_video_id_valid_urls(self, url: str, expected_id: str) -> None:
        """Test parse_video_id with valid YouTube URLs."""
        result = parse_video_id(url)
        assert result == expected_id

    @pytest.mark.parametrize(
        "url",
        [
            # Invalid domains
            "https://vimeo.com/123456",
            "https://example.com/watch?v=abc",
            "https://www.google.com",
            # Malformed URLs
            "not-a-url",
            "https://",
            "",
            # Invalid YouTube URLs (no video ID)
            "https://www.youtube.com/",
            "https://youtube.com/",
            "https://youtu.be/",
            # Invalid path patterns
            "https://www.youtube.com/feed/subscriptions",
        ],
    )
    def test_parse_video_id_invalid_urls(self, url: str) -> None:
        """Test parse_video_id raises TranscriptError for invalid URLs."""
        with pytest.raises(TranscriptError):
            parse_video_id(url)


class TestFetchTranscript:
    """Tests for fetch_transcript function."""

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_success(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript successfully returns transcript."""
        mock_api.get_transcript.return_value = [
            {"start": 0.0, "duration": 5.0, "text": "Hello world"},
            {"start": 5.0, "duration": 10.0, "text": "This is a test"},
        ]

        video_id, segments = fetch_transcript("https://youtu.be/dQw4w9WgXcQ")

        assert video_id == "dQw4w9WgXcQ"
        assert len(segments) == 2
        assert segments[0].text == "Hello world"
        assert segments[1].text == "This is a test"
        mock_api.get_transcript.assert_called_once()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_video_unavailable(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles VideoUnavailable error."""
        from youtube_transcript_api import VideoUnavailable

        mock_api.get_transcript.side_effect = VideoUnavailable(video_id="invalid")

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/invalid")

        assert "video" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_no_transcript(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles NoTranscriptFound error."""
        from youtube_transcript_api import NoTranscriptFound

        mock_api.get_transcript.side_effect = NoTranscriptFound(
            video_id="no-transcript",
            requested_language_codes=["en"],
            transcript_data=None,
        )

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/no-transcript")

        assert "transcript" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_transcripts_disabled(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles TranscriptsDisabled error."""
        from youtube_transcript_api import TranscriptsDisabled

        mock_api.get_transcript.side_effect = TranscriptsDisabled(video_id="disabled")

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/disabled")

        assert "transcript" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_empty_result(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript raises error when no transcript text returned."""
        mock_api.get_transcript.return_value = []

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/empty")

        assert "No transcript text was returned" in str(exc_info.value)

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_filters_empty_text(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript filters out segments with empty text."""
        mock_api.get_transcript.return_value = [
            {"start": 0.0, "duration": 5.0, "text": "Valid text"},
            {"start": 5.0, "duration": 5.0, "text": ""},
            {"start": 10.0, "duration": 5.0, "text": "  "},
            {"start": 15.0, "duration": 5.0, "text": "More valid text"},
        ]

        video_id, segments = fetch_transcript("https://youtu.be/filter-test")

        assert len(segments) == 2
        assert segments[0].text == "Valid text"
        assert segments[1].text == "More valid text"
