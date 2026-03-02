"""
Tests for transcript_service module.
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch

from app.models import TranscriptSegment
from app.transcript_service import (
    TranscriptError,
    fetch_transcript,
    parse_video_id,
)


class MockTranscriptSegment:
    """Mock for transcript segment objects from youtube_transcript_api."""
    def __init__(self, start: float, duration: float, text: str):
        self.start = start
        self.duration = duration
        self.text = text


class TestParseVideoId:
    """Tests for parse_video_id function."""

    @pytest.mark.parametrize(
        "url,expected_id",
        [
            # Standard watch URLs (11-char IDs)
            ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("http://www.youtube.com/watch?v=abc123DEFgh", "abc123DEFgh"),
            # Short URLs (11-char IDs)
            ("http://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            # Shorts URLs (11-char IDs)
            ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/shorts/abc123DEFgh", "abc123DEFgh"),
            # Embed URLs (11-char IDs)
            ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtube.com/embed/abc123DEFgh", "abc123DEFgh"),
            # Mobile URLs (11-char IDs)
            ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            # IDs with underscores and hyphens
            ("https://youtu.be/abc_def-123", "abc_def-123"),
            ("https://www.youtube.com/watch?v=abc_def-123", "abc_def-123"),
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
            "https://vimeo.com/12345678901",
            "https://example.com/watch?v=abc123DEFgh",
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
            # Invalid video ID format (not 11 chars)
            "https://youtu.be/abc",
            "https://youtu.be/abc123",
            "https://www.youtube.com/watch?v=short",
            "https://www.youtube.com/watch?v=waytoolongvideo",
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
        # Mock the fetch method - it returns objects with .text, .start, .duration
        mock_instance = MagicMock()
        mock_instance.fetch.return_value = [
            MockTranscriptSegment(0.0, 5.0, "Hello world"),
            MockTranscriptSegment(5.0, 10.0, "This is a test"),
        ]
        mock_api.return_value = mock_instance

        video_id, segments = fetch_transcript("https://youtu.be/dQw4w9WgXcQ")

        assert video_id == "dQw4w9WgXcQ"
        assert len(segments) == 2
        assert segments[0].text == "Hello world"
        assert segments[1].text == "This is a test"
        mock_instance.fetch.assert_called_once()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_video_unavailable(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles VideoUnavailable error."""
        from youtube_transcript_api import VideoUnavailable

        mock_instance = MagicMock()
        mock_instance.fetch.side_effect = VideoUnavailable(video_id="testid12345")
        mock_api.return_value = mock_instance

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/testid12345")

        assert "video" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_no_transcript(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles NoTranscriptFound error."""
        from youtube_transcript_api import NoTranscriptFound

        mock_instance = MagicMock()
        mock_instance.fetch.side_effect = NoTranscriptFound(
            video_id="testid12345",
            requested_language_codes=["en"],
            transcript_data=None,
        )
        mock_api.return_value = mock_instance

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/testid12345")

        assert "transcript" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_transcripts_disabled(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript handles TranscriptsDisabled error."""
        from youtube_transcript_api import TranscriptsDisabled

        mock_instance = MagicMock()
        mock_instance.fetch.side_effect = TranscriptsDisabled(video_id="testid12345")
        mock_api.return_value = mock_instance

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/testid12345")

        assert "transcript" in str(exc_info.value).lower()

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_empty_result(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript raises error when no transcript text returned."""
        mock_instance = MagicMock()
        mock_instance.fetch.return_value = []
        mock_api.return_value = mock_instance

        with pytest.raises(TranscriptError) as exc_info:
            fetch_transcript("https://youtu.be/testid12345")

        assert "No transcript text was returned" in str(exc_info.value)

    @patch("app.transcript_service.YouTubeTranscriptApi")
    def test_fetch_transcript_filters_empty_text(self, mock_api: MagicMock) -> None:
        """Test fetch_transcript filters out segments with empty text."""
        mock_instance = MagicMock()
        mock_instance.fetch.return_value = [
            MockTranscriptSegment(0.0, 5.0, "Valid text"),
            MockTranscriptSegment(5.0, 5.0, ""),
            MockTranscriptSegment(10.0, 5.0, "  "),
            MockTranscriptSegment(15.0, 5.0, "More valid text"),
        ]
        mock_api.return_value = mock_instance

        video_id, segments = fetch_transcript("https://youtu.be/testid12345")

        assert len(segments) == 2
        assert segments[0].text == "Valid text"
        assert segments[1].text == "More valid text"
