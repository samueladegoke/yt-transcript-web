# YouTube Transcript MCP Server and CLI

A Python package for fetching and analyzing YouTube video transcripts via MCP (Model Context Protocol) and CLI.

## Features

- **Fetch Transcripts**: Get full transcripts from YouTube videos
- **Video Info**: Retrieve basic video information
- **Analysis**: Generate summaries, outlines, and key points
- **Multiple Formats**: Output as text, JSON, or SRT subtitles
- **MCP Server**: Integration with AI assistants via MCP protocol

## Two Installation Modes

### 🚀 Proxy Mode (Recommended — Zero Config)
Connects to Sam's hosted backend. No local dependencies beyond Python.

```bash
# Install and run via uvx (no install needed)
uvx yt-transcript-proxy

# Or install globally
pip install yt-transcript-mcp
yt-transcript-proxy
```

### 🔧 Full Local Mode
Runs the complete server locally. Requires `youtube-transcript-api` and network access to YouTube.

```bash
yt-transcript-mcp
```

**Note:** Local mode requires a working YouTube transcript backend. Configure via `RENDER_BACKEND_URL` env var if using a custom backend.

## Installation

### Quick Start (uvx — No Install)

```bash
# Proxy mode (recommended)
uvx yt-transcript-proxy

# Full local server
uvx yt-transcript-mcp
```

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd yt-transcript-web

# Install in development mode
pip install -e .
```

### From PyPI

```bash
pip install yt-transcript-mcp
```

## CLI Usage

### Get Transcript

```bash
# Get transcript as text
yt-transcript transcript <url>

# Get transcript as JSON
yt-transcript transcript <url> --format json

# Get transcript as SRT subtitles
yt-transcript transcript <url> --format srt

# Save to file
yt-transcript transcript <url> --output transcript.txt

# Specify language
yt-transcript transcript <url> --lang es
```

### Get Video Info

```bash
# Get video information
yt-transcript info <url>

# Get info as JSON
yt-transcript info <url> --format json
```

### Analyze Video

```bash
# Get summary
yt-transcript analyze <url>

# Get outline
yt-transcript analyze <url> --type outline

# Get key points
yt-transcript analyze <url> --type key_points

# Analyze and save
yt-transcript analyze <url> --output analysis.json --format json
```

### Health Check

```bash
# Check environment configuration
yt-transcript health
```

## MCP Server Usage

Start the MCP server:

```bash
yt-transcript-mcp
```

Configure in your AI assistant's MCP settings:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "yt-transcript-mcp",
      "env": {
        "YOUTUBE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Configuration

Set the following environment variables:

- `YOUTUBE_API_KEY`: YouTube Data API key (optional, for enhanced features)

## Development

### Running Tests

```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```

### Project Structure

```
yt-transcript-web/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── cli.py           # CLI implementation
│   │   ├── mcp_server.py    # MCP server
│   │   └── transcript_service.py  # Core service
├── tests/
│   ├── __init__.py
│   └── test_cli.py          # CLI tests
├── pyproject.toml
├── setup.py
└── README.md
```

## License

MIT
