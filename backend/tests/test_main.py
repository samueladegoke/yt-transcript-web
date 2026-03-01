from __future__ import annotations

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.models import TranscriptSegment


client = TestClient(app)


class TestHealthEndpoint:
    """Tests for /health endpoint."""

    def test_health_returns_ok(self) -> None:
        """Test /health endpoint returns status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestExtractEndpoint:
    """Tests for /api/extract endpoint."""

    @patch("app.main.fetch_transcript")
    def test_extract_success(self, mock_fetch: MagicMock) -> None:
        """Test /api/extract returns transcript on success."""
        mock_fetch.return_value = (
            "dQw4w9WgXcQ",
            [
                TranscriptSegment(start=0.0, duration=5.0, text="Hello world"),
                TranscriptSegment(start=5.0, duration=10.0, text="This is a test"),
            ],
        )

        response = client.post(
            "/api/extract",
            json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["video_id"] == "dQw4w9WgXcQ"
        assert data["title"] == "Transcript: dQw4w9WgXcQ"
        assert len(data["transcript"]) == 2
        assert "Hello world" in data["plain_text"]
        assert "Hello world" in data["markdown"]

    @patch("app.main.fetch_transcript")
    def test_extract_handles_transcript_error(self, mock_fetch: MagicMock) -> None:
        """Test /api/extract handles TranscriptError with 400 status."""
        from app.transcript_service import TranscriptError

        mock_fetch.side_effect = TranscriptError("No transcript available")

        response = client.post(
            "/api/extract",
            json={"url": "https://www.youtube.com/watch?v=invalid"},
        )

        assert response.status_code == 400
        assert "No transcript available" in response.json()["detail"]

    @patch("app.main.fetch_transcript")
    def test_extract_with_short_url(self, mock_fetch: MagicMock) -> None:
        """Test /api/extract works with short YouTube URL."""
        mock_fetch.return_value = (
            "abc123",
            [TranscriptSegment(start=0.0, duration=5.0, text="Test content")],
        )

        response = client.post(
            "/api/extract",
            json={"url": "https://youtu.be/abc123"},
        )

        assert response.status_code == 200
        assert response.json()["video_id"] == "abc123"

    @patch("app.main.fetch_transcript")
    def test_extract_generates_plain_text(self, mock_fetch: MagicMock) -> None:
        """Test /api/extract generates plain text format."""
        mock_fetch.return_value = (
            "test123",
            [
                TranscriptSegment(start=0.0, duration=5.0, text="First segment"),
                TranscriptSegment(start=5.0, duration=5.0, text="Second segment"),
            ],
        )

        response = client.post(
            "/api/extract",
            json={"url": "https://youtu.be/test123"},
        )

        assert response.status_code == 200
        plain_text = response.json()["plain_text"]
        assert "[00:00] First segment" in plain_text
        assert "[00:05] Second segment" in plain_text

    @patch("app.main.fetch_transcript")
    def test_extract_generates_markdown(self, mock_fetch: MagicMock) -> None:
        """Test /api/extract generates markdown format."""
        mock_fetch.return_value = (
            "test456",
            [
                TranscriptSegment(
                    start=0.0, duration=5.0, text="Markdown content here"
                ),
                TranscriptSegment(start=5.0, duration=5.0, text="More content"),
            ],
        )

        response = client.post(
            "/api/extract",
            json={"url": "https://youtu.be/test456"},
        )

        assert response.status_code == 200
        markdown = response.json()["markdown"]
        assert "# Transcript: test456" in markdown
        assert "## Summary" in markdown
        assert "## Transcript" in markdown
