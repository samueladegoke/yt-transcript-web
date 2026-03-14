"""YouTube Transcript Service

Handles fetching transcripts and video info from YouTube.
"""
import asyncio
import json
import os
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import httpx


@dataclass
class TranscriptSegment:
    """A single segment of transcript text."""
    start: float
    duration: float
    text: str


@dataclass
class VideoInfo:
    """Basic video information."""
    video_id: str
    title: str
    channel: str
    duration: str
    view_count: str
    upload_date: str


class TranscriptServiceError(Exception):
    """Base exception for transcript service errors."""
    pass


class TranscriptNotFoundError(TranscriptServiceError):
    """Raised when transcript is not available."""
    pass


class InvalidUrlError(TranscriptServiceError):
    """Raised when URL is invalid."""
    pass


def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
    if not url:
        raise InvalidUrlError("URL cannot be empty")
    
    # Handle various YouTube URL formats
    if "youtu.be/" in url:
        return url.split("youtu.be/")[-1].split("?")[0].split("&")[0]
    elif "youtube.com/watch?v=" in url:
        return url.split("v=")[-1].split("&")[0]
    elif "youtube.com/embed/" in url:
        return url.split("embed/")[-1].split("?")[0].split("&")[0]
    elif "youtube.com/v/" in url:
        return url.split("/v/")[-1].split("?")[0].split("&")[0]
    
    # If it looks like a raw video ID, return it
    if len(url) in [11, 12] and not url.startswith("http"):
        return url
    
    raise InvalidUrlError(f"Could not extract video ID from: {url}")


# Global proxy configuration
_proxy_config: Dict[str, Optional[str]] = {
    "yt_proxy": None,
    "http_proxy": None,
    "socks5_proxy": None,
}


def reload_proxy_config():
    """Reload proxy configuration from environment variables.
    
    Priority order for proxy selection:
    1. YT_PROXY - Specific to YouTube transcript service
    2. HTTP_PROXY - General HTTP proxy
    3. SOCKS5_PROXY - SOCKS5 proxy fallback
    """
    global _proxy_config
    # Priority: YT_PROXY > HTTP_PROXY > SOCKS5_PROXY
    _proxy_config["yt_proxy"] = os.getenv("YT_PROXY")
    _proxy_config["http_proxy"] = os.getenv("HTTP_PROXY")
    _proxy_config["socks5_proxy"] = os.getenv("SOCKS5_PROXY")


def get_proxy_url() -> Optional[str]:
    """
    Get the appropriate proxy URL based on priority.
    Priority: YT_PROXY > HTTP_PROXY > SOCKS5_PROXY
    """
    # Reload config to get latest env vars
    reload_proxy_config()
    
    # Check in priority order
    if _proxy_config.get("yt_proxy"):
        return _proxy_config["yt_proxy"]
    if _proxy_config.get("http_proxy"):
        return _proxy_config["http_proxy"]
    if _proxy_config.get("socks5_proxy"):
        return _proxy_config["socks5_proxy"]
    return None


# Initialize proxy config on module load
reload_proxy_config()


class TranscriptService:
    """Service for fetching YouTube transcripts."""
    
    def __init__(self, api_key: Optional[str] = None, proxy_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("YOUTUBE_API_KEY")
        self.base_url = "https://www.youtube.com"
        # Use provided proxy or get from environment
        self.proxy_url = proxy_url or get_proxy_url()
        self.client = httpx.AsyncClient(
            timeout=30.0,
            proxy=self.proxy_url if self.proxy_url else None
        )
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
    
    async def get_transcript(self, url: str, lang: str = "en") -> List[TranscriptSegment]:
        """
        Fetch transcript for a YouTube video.
        
        Args:
            url: YouTube video URL or video ID
            lang: Language code (default: 'en')
        
        Returns:
            List of TranscriptSegment objects
        
        Raises:
            TranscriptNotFoundError: If transcript is not available
            InvalidUrlError: If URL is invalid
        """
        video_id = extract_video_id(url)
        
        # Try to fetch from YouTube directly
        try:
            return await self._fetch_transcript_from_youtube(video_id, lang)
        except TranscriptNotFoundError:
            # Fall back to alternative method
            return await self._fetch_transcript_fallback(video_id, lang)
    
    async def _fetch_transcript_from_youtube(self, video_id: str, lang: str = "en") -> List[TranscriptSegment]:
        """Fetch transcript directly from YouTube."""
        # This is a simplified implementation
        # In production, you'd use the YouTube API or a transcript library
        raise TranscriptNotFoundError("Transcript not available via direct fetch")
    
    async def _fetch_transcript_fallback(self, video_id: str, lang: str = "en") -> List[TranscriptSegment]:
        """Fallback method for fetching transcript."""
        # Simulated transcript for demo purposes
        # In production, integrate with youtube-transcript-api or similar
        raise TranscriptNotFoundError(
            f"Transcript not available for video {video_id}. "
            "Ensure the video has captions/subtitles enabled."
        )
    
    async def get_video_info(self, url: str) -> VideoInfo:
        """
        Get basic video information.
        
        Args:
            url: YouTube video URL or video ID
        
        Returns:
            VideoInfo object
        """
        video_id = extract_video_id(url)
        
        # Simulated video info for demo
        # In production, use YouTube Data API
        return VideoInfo(
            video_id=video_id,
            title="Sample Video Title",
            channel="Sample Channel",
            duration="10:00",
            view_count="1000",
            upload_date="2024-01-01"
        )
    
    async def analyze(self, url: str, analysis_type: str = "summary", lang: str = "en") -> Dict[str, Any]:
        """
        Analyze video transcript.
        
        Args:
            url: YouTube video URL or video ID
            analysis_type: Type of analysis (summary, outline, key_points)
            lang: Language code
        
        Returns:
            Analysis results as dict
        """
        transcript = await self.get_transcript(url, lang)
        full_text = " ".join([seg.text for seg in transcript])
        
        if analysis_type == "summary":
            return {"summary": full_text[:500] + "..." if len(full_text) > 500 else full_text}
        elif analysis_type == "outline":
            return {"outline": ["Introduction", "Main Content", "Conclusion"]}
        elif analysis_type == "key_points":
            return {"key_points": ["Point 1", "Point 2", "Point 3"]}
        else:
            return {"error": f"Unknown analysis type: {analysis_type}"}


async def check_environment() -> Dict[str, Any]:
    """Check if required environment variables are set."""
    api_key = os.getenv("YOUTUBE_API_KEY")
    return {
        "youtube_api_key": "set" if api_key else "not set",
        "status": "healthy" if api_key else "missing_api_key"
    }
