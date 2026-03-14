# YouTube Transcript MCP Server - Zero-Effort Installation

This document describes how to use the YouTube Transcript MCP server with **one line** - no installation, no configuration, no API keys required.

## 🚀 One-Line Installation

The YouTube Transcript MCP server is now available as a **zero-effort** MCP tool. Run it instantly with:

### For Claude Desktop

```bash
uvx --from git+https://github.com/samueladegoke/yt-transcript-web.git#subdirectory=backend yt-transcript-proxy
```

### For Cursor / Windsurf

Add this to your MCP settings:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/samueladegoke/yt-transcript-web.git#subdirectory=backend",
        "yt-transcript-proxy"
      ]
    }
  }
}
```

## 📦 What You Get

Once connected, you'll have access to these tools:

| Tool | Description |
|------|-------------|
| `get_transcript(url, lang)` | Fetch full transcript text from a YouTube video |
| `get_video_info(url)` | Get video metadata (title, channel, duration, views, upload date) |
| `analyze(url, type)` | Analyze transcript (summary, outline, or key_points) |
| `check_health()` | Verify backend connectivity |

## 🔧 Configuration (Optional)

The proxy connects to the Render backend by default. If you need to customize:

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `RENDER_BACKEND_URL` | Custom backend URL | `https://yt-transcript-api-hzk2.onrender.com` |
| `KILO_MODEL` | Model for analysis | (configured on backend) |
| `KILO_BASE_URL` | Kilo API base URL | (configured on backend) |
| `KILO_API_KEY` | Kilo API key | (configured on backend) |

## 💡 Usage Examples

### Get a transcript
```
Get the transcript for this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Get video info
```
What's the title and view count of https://www.youtube.com/watch?v=dQw4w9WgXcQ?
```

### Analyze a video
```
Summarize this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### Check health
```
Is the transcript service healthy?
```

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────────────┐      ┌──────────────────────────┐
│  Your IDE   │─────▶│  mcp_proxy.py       │─────▶│  Render Backend          │
│  (Cursor/   │      │  (Lightweight MCP)  │      │  (yt-transcript-api)     │
│   Claude)   │      │                     │      │                          │
└─────────────┘      └─────────────────────┘      └──────────────────────────┘
                          │
                          │ Uses httpx to forward
                          │ requests to Render
                          ▼
                   No local youtube_transcript_api
                   No API keys needed
                   No installation required
```

## 🎯 Why This Matters

- **Zero Installation**: No `pip install`, no virtualenv, no dependencies
- **Zero Configuration**: Backend handles API keys and rate limits
- **Instant Setup**: Works in Claude Desktop, Cursor, Windsurf, any MCP client
- **Managed Service**: Backend on Render handles scaling, updates, and maintenance

## 📝 Notes

- The backend URL (`https://yt-transcript-api-hzk2.onrender.com`) is pre-configured
- All heavy lifting (transcript fetching, analysis) happens on the Render backend
- This proxy is stateless and lightweight (~150 lines)
- Environment variables `KILO_MODEL`, `KILO_BASE_URL`, and `KILO_API_KEY` are configured on Render

---

**Built with** [`FastMCP`](https://github.com/modelcontextprotocol/python-sdk) | [Source](https://github.com/samueladegoke/yt-transcript-web)
