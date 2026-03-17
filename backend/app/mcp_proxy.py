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
    timeout = float(os.getenv("BACKEND_TIMEOUT", "200.0"))
    return httpx.AsyncClient(timeout=timeout)


@mcp.tool()
async def get_transcript(url: str, lang: str = "en") -> str:
    """
    Get transcript for a YouTube video.

    Args:
        url: YouTube video URL or video ID
        lang: Language code (default: 'en')

    Returns:
        Full transcript text with timestamps
    """
    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/api/extract",
            json={"url": url, "language": lang}
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            raise Exception(data.get("error", "Failed to extract transcript"))

        # Return formatted transcript with timestamps
        lines = data.get("transcript_lines", [])
        return "\n".join([f"[{l.get('timestamp', '')}] {l.get('text', '')}" for l in lines])


@mcp.tool()
async def get_video_info(url: str) -> Dict[str, Any]:
    """
    Get full video information including description and links.

    Args:
        url: YouTube video URL or video ID

    Returns:
        Video information including title, channel, duration, description, links, and transcript
    """
    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/api/video-info",
            json={"url": url}
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            raise Exception(data.get("error", "Failed to get video info"))

        return data


@mcp.tool()
async def analyze(url: str, type: str = "summary", transcript: str = None) -> Dict[str, Any]:
    """
    Analyze a YouTube video transcript using AI.

    Args:
        url: YouTube video URL or video ID
        type: Analysis type — summary, action_points, next_steps, structured_edit, all
        transcript: Optional pre-fetched transcript text (skips YouTube fetch)

    Returns:
        Analysis results — for structured_edit, returns markdown with:
        ## PROFESSIONAL EDIT TRANSCRIPT, ## SUMMARY, ## ACTION POINTS, ## NEXT STEPS
    """
    payload: Dict[str, Any] = {"url": url, "type": type}
    if transcript:
        payload["transcript"] = transcript

    async with _get_client() as client:
        response = await client.post(
            f"{RENDER_BACKEND_URL}/api/analyze",
            json=payload
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("success"):
            raise Exception(data.get("error", "Analysis failed"))

        return data.get("result", data)


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
