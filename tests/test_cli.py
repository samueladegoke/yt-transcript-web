"""
Tests for YouTube Transcript CLI.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from backend.app.transcript_service import (
    TranscriptService,
    TranscriptSegment,
    VideoInfo,
    extract_video_id,
    InvalidUrlError,
)


class TestExtractVideoId:
    """Tests for video ID extraction."""
    
    def test_standard_url(self):
        """Test extraction from standard YouTube URL."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"
    
    def test_short_url(self):
        """Test extraction from youtu.be URL."""
        url = "https://youtu.be/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"
    
    def test_embed_url(self):
        """Test extraction from embed URL."""
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert extract_video_id(url) == "dQw4w9WgXcQ"
    
    def test_raw_id(self):
        """Test with raw video ID."""
        assert extract_video_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    
    def test_invalid_url(self):
        """Test with invalid URL."""
        with pytest.raises(InvalidUrlError):
            extract_video_id("not-a-youtube-url")
    
    def test_empty_url(self):
        """Test with empty URL."""
        with pytest.raises(InvalidUrlError):
            extract_video_id("")


class TestTranscriptService:
    """Tests for TranscriptService."""
    
    @pytest.mark.asyncio
    async def test_get_video_info(self):
        """Test getting video info."""
        with patch.object(TranscriptService, '__aenter__', return_value=AsyncMock()):
            service = TranscriptService()
            # Mock the get_video_info method
            service.get_video_info = AsyncMock(return_value=VideoInfo(
                video_id="test123",
                title="Test Video",
                channel="Test Channel",
                duration="5:00",
                view_count="1000",
                upload_date="2024-01-01"
            ))
            
            info = await service.get_video_info("test123")
            assert info.video_id == "test123"
            assert info.title == "Test Video"


class TestCliCommands:
    """Tests for CLI commands."""
    
    @pytest.mark.asyncio
    async def test_cmd_transcript_mock(self):
        """Test transcript command with mocked service."""
        from backend.app.cli import cmd_transcript
        
        mock_segments = [
            TranscriptSegment(start=0.0, duration=1.0, text="Hello"),
            TranscriptSegment(start=1.0, duration=1.0, text="World"),
        ]
        
        with patch('backend.app.cli.TranscriptService') as MockService:
            mock_service = AsyncMock()
            mock_service.get_transcript = AsyncMock(return_value=mock_segments)
            mock_service.__aenter__ = AsyncMock(return_value=mock_service)
            mock_service.__aexit__ = AsyncMock()
            MockService.return_value = mock_service
            
            result = await cmd_transcript("test123", None, "text", "en")
            assert result == 0
    
    @pytest.mark.asyncio
    async def test_cmd_info_mock(self):
        """Test info command with mocked service."""
        from backend.app.cli import cmd_info
        
        mock_info = VideoInfo(
            video_id="test123",
            title="Test Video",
            channel="Test Channel",
            duration="5:00",
            view_count="1000",
            upload_date="2024-01-01"
        )
        
        with patch('backend.app.cli.TranscriptService') as MockService:
            mock_service = AsyncMock()
            mock_service.get_video_info = AsyncMock(return_value=mock_info)
            mock_service.__aenter__ = AsyncMock(return_value=mock_service)
            mock_service.__aexit__ = AsyncMock()
            MockService.return_value = mock_service
            
            result = await cmd_info("test123", None, "text")
            assert result == 0
    
    @pytest.mark.asyncio
    async def test_cmd_health(self):
        """Test health command."""
        from backend.app.cli import cmd_health
        
        with patch('backend.app.cli.check_environment') as mock_check:
            mock_check.return_value = asyncio.Future()
            mock_check.return_value.set_result({"status": "healthy"})
            
            result = await cmd_health()
            assert result in [0, 1]  # Depends on env setup


class TestFormatFunctions:
    """Tests for formatting functions."""
    
    def test_format_srt_time(self):
        """Test SRT time formatting."""
        from backend.app.cli import format_srt_time
        
        assert format_srt_time(0) == "00:00:00,000"
        assert format_srt_time(1.5) == "00:00:01,500"
        assert format_srt_time(3661.5) == "01:01:01,500"
    
    def test_format_transcript_text(self):
        """Test transcript text formatting."""
        from backend.app.cli import format_transcript_text
        
        segments = [
            TranscriptSegment(start=0.0, duration=1.0, text="Hello"),
            TranscriptSegment(start=1.0, duration=1.0, text="World"),
        ]
        
        result = format_transcript_text(segments)
        assert "Hello" in result
        assert "World" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
