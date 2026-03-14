#!/usr/bin/env python3
"""
YouTube Transcript MCP Server
MCP server for YouTube transcript operations.
"""
import asyncio
import json
from typing import Any, Dict, List, Optional

from mcp.server.fastmcp import FastMCP

from backend.app.transcript_service import (
    TranscriptService,
    VideoInfo,
    TranscriptSegment,
    check_environment,
)


# Initialize MCP server
mcp = FastMCP("youtube-transcript")


@mcp.tool()
async def get_transcript(url: str, lang: str = "en") -> str:
    """
    Get transcript for a YouTube video.
    
    Args:
        url: YouTube video URL or video ID
        lang: Language code (default: 'en')
    
    Returns:
        Full transcript text
    """
    async with TranscriptService() as service:
        segments = await service.get_transcript(url, lang)
        return "\n".join([seg.text for seg in segments])


@mcp.tool()
async def get_video_info(url: str) -> Dict[str, Any]:
    """
    Get information about a YouTube video.
    
    Args:
        url: YouTube video URL or video ID
    
    Returns:
        Video information as dict
    """
    async with TranscriptService() as service:
        info = await service.get_video_info(url)
        return {
            "video_id": info.video_id,
            "title": info.title,
            "channel": info.channel,
            "duration": info.duration,
            "view_count": info.view_count,
            "upload_date": info.upload_date,
        }


@mcp.tool()
async def analyze_video(url: str, analysis_type: str = "summary", lang: str = "en") -> Dict[str, Any]:
    """
    Analyze a YouTube video transcript.
    
    Args:
        url: YouTube video URL or video ID
        analysis_type: Type of analysis (summary, outline, key_points)
        lang: Language code
    
    Returns:
        Analysis results
    """
    async with TranscriptService() as service:
        return await service.analyze(url, analysis_type, lang)


@mcp.tool()
async def health_check() -> Dict[str, str]:
    """
    Check server health and environment.
    
    Returns:
        Health status
    """
    return await check_environment()


def main():
    """Main entry point for MCP server."""
    mcp.run()


if __name__ == "__main__":
    main()
