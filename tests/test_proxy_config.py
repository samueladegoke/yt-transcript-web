#!/usr/bin/env python3
"""Test that proxy configuration works correctly."""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.transcript_service import get_proxy_url, reload_proxy_config

def test_yt_proxy_priority():
    """Test that YT_PROXY takes priority over other proxies."""
    # Set environment variables
    os.environ["YT_PROXY"] = "http://yt-proxy:8080"
    os.environ["HTTP_PROXY"] = "http://http-proxy:8080"
    os.environ["SOCKS5_PROXY"] = "socks5://socks5-proxy:9090"
    
    # Reload config
    reload_proxy_config()
    
    # Get proxy URL
    proxy_url = get_proxy_url()
    
    assert proxy_url == "http://yt-proxy:8080", f"Expected YT_PROXY, got {proxy_url}"
    print("✓ YT_PROXY priority test passed")

def test_http_proxy_fallback():
    """Test that HTTP_PROXY is used when YT_PROXY is not set."""
    # Clear YT_PROXY
    os.environ.pop("YT_PROXY", None)
    os.environ["HTTP_PROXY"] = "http://http-proxy:8080"
    os.environ["SOCKS5_PROXY"] = "socks5://socks5-proxy:9090"
    
    # Reload config
    reload_proxy_config()
    
    # Get proxy URL
    proxy_url = get_proxy_url()
    
    assert proxy_url == "http://http-proxy:8080", f"Expected HTTP_PROXY, got {proxy_url}"
    print("✓ HTTP_PROXY fallback test passed")

def test_socks5_fallback():
    """Test that SOCKS5_PROXY is used when others are not set."""
    # Clear YT_PROXY and HTTP_PROXY
    os.environ.pop("YT_PROXY", None)
    os.environ.pop("HTTP_PROXY", None)
    os.environ["SOCKS5_PROXY"] = "socks5://socks5-proxy:9090"
    
    # Reload config
    reload_proxy_config()
    
    # Get proxy URL
    proxy_url = get_proxy_url()
    
    assert proxy_url == "socks5://socks5-proxy:9090", f"Expected SOCKS5_PROXY, got {proxy_url}"
    print("✓ SOCKS5_PROXY fallback test passed")

def test_no_proxy():
    """Test that None is returned when no proxy is set."""
    # Clear all proxy env vars
    os.environ.pop("YT_PROXY", None)
    os.environ.pop("HTTP_PROXY", None)
    os.environ.pop("SOCKS5_PROXY", None)
    
    # Reload config
    reload_proxy_config()
    
    # Get proxy URL
    proxy_url = get_proxy_url()
    
    assert proxy_url is None, f"Expected None, got {proxy_url}"
    print("✓ No proxy test passed")

if __name__ == "__main__":
    print("Testing proxy configuration...")
    test_yt_proxy_priority()
    test_http_proxy_fallback()
    test_socks5_fallback()
    test_no_proxy()
    print("\n✓ All proxy configuration tests passed!")
