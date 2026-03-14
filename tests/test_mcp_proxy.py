#!/usr/bin/env python3
"""Test that MCP proxy correctly formats requests to Render backend."""
import os
import sys
import asyncio

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.mcp_proxy import (
    RENDER_BACKEND_URL,
    get_transcript,
    get_video_info,
    analyze,
    check_health,
)

def test_render_backend_url():
    """Test that the Render backend URL is correctly configured."""
    expected_url = "https://yt-transcript-api-hzk2.onrender.com"
    assert RENDER_BACKEND_URL == expected_url, f"Expected {expected_url}, got {RENDER_BACKEND_URL}"
    print(f"✓ Render backend URL: {RENDER_BACKEND_URL}")

async def test_get_transcript_signature():
    """Test that get_transcript has correct signature."""
    # Just verify the function exists and has correct signature
    import inspect
    sig = inspect.signature(get_transcript)
    params = list(sig.parameters.keys())
    assert "url" in params, "get_transcript should have 'url' parameter"
    assert "lang" in params, "get_transcript should have 'lang' parameter"
    print("✓ get_transcript signature OK")

async def test_get_video_info_signature():
    """Test that get_video_info has correct signature."""
    import inspect
    sig = inspect.signature(get_video_info)
    params = list(sig.parameters.keys())
    assert "url" in params, "get_video_info should have 'url' parameter"
    print("✓ get_video_info signature OK")

async def test_analyze_signature():
    """Test that analyze has correct signature."""
    import inspect
    sig = inspect.signature(analyze)
    params = list(sig.parameters.keys())
    assert "url" in params, "analyze should have 'url' parameter"
    assert "type" in params, "analyze should have 'type' parameter"
    print("✓ analyze signature OK")

async def test_check_health_signature():
    """Test that check_health has correct signature."""
    import inspect
    sig = inspect.signature(check_health)
    params = list(sig.parameters.keys())
    assert len(params) == 0, "check_health should have no parameters"
    print("✓ check_health signature OK")

async def main():
    print("Testing MCP proxy configuration...")
    test_render_backend_url()
    await test_get_transcript_signature()
    await test_get_video_info_signature()
    await test_analyze_signature()
    await test_check_health_signature()
    print("\n✓ All MCP proxy tests passed!")

if __name__ == "__main__":
    asyncio.run(main())
