#!/usr/bin/env python3
"""
YouTube Transcript MCP Proxy Server

Lightweight MCP server that acts as a client to the Render backend.
This server does NOT use youtube_transcript_api locally.
Instead, it forwards all requests to: https://yt-transcript-api-hzk2.onrender.com

Usage:
    uvx --from git+https://github.com/samueladegoke/yt-transcript-web.git#subdirectory=backend yt-transcript-proxy
"""
import os
import httpx
from typing import Any, Dict, Optional
from mcp.server.fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP("youtube-transcript-proxy")

# Backend URL — defaults to localhost (same VM as MCP server)
# Override with RENDER_BACKEND_URL env var for remote backends
RENDER_BACKEND_URL = os.getenv(
    "RENDER_BACKEND_URL",
    "http://localhost:8000"
)


def _get_client() -> httpx.AsyncClient:
    """Create an HTTP client with appropriate timeout."""
    return httpx.AsyncClient(timeout=60.0)


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
    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/transcript",
            json={"url": url, "lang": lang}
        )
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            raise Exception(data["error"])
        
        # Return formatted transcript
        segments = data.get("segments", [])
        return "\n".join([seg.get("text", "") for seg in segments])


@mcp.tool()
async def get_video_info(url: str) -> Dict[str, Any]:
    """
    Get information about a YouTube video.
    
    Args:
        url: YouTube video URL or video ID
    
    Returns:
        Video information as dict with keys:
        - video_id
        - title
        - channel
        - duration
        - view_count
        - upload_date
    """
    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/video-info",
            json={"url": url}
        )
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            raise Exception(data["error"])
        
        return data


@mcp.tool()
async def analyze(url: str, type: str = "summary") -> Dict[str, Any]:
    """
    Analyze a YouTube video transcript.
    
    Args:
        url: YouTube video URL or video ID
        type: Type of analysis (summary, outline, key_points)
    
    Returns:
        Analysis results based on type:
        - summary: {summary: str}
        - outline: {outline: List[str]}
        - key_points: {key_points: List[str]}
    """
    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/analyze",
            json={"url": url, "type": type}
        )
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            raise Exception(data["error"])
        
        return data


@mcp.tool()
async def check_health() -> Dict[str, str]:
    """
    Check health of the Render backend.
    
    Returns:
        Health status dict with:
        - status: "healthy" or "unhealthy"
        - backend: backend URL
        - message: additional info
    """
    async with _get_client() as client:
        try:
            response = await client.get(f"{RENDER_BACKEND_URL}/health")
            response.raise_for_status()
            data = response.json()
            return {
                "status": "healthy",
                "backend": RENDER_BACKEND_URL,
                "message": data.get("message", "Backend is operational")
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": RENDER_BACKEND_URL,
                "message": str(e)
            }


def main():
    """Main entry point for MCP proxy server."""
    mcp.run()


if __name__ == "__main__":
    main()
