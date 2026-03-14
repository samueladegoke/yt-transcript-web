# YouTube Transcript Web

A full-stack YouTube transcript extraction platform with:

- **Web UI** — React + Vite frontend deployed on Cloudflare Pages
- **API Backend** — FastAPI server deployed on Render
- **MCP Integration** — Model Context Protocol server for AI assistants (Claude, Cursor, VS Code, etc.)

## Quick Start

### Web UI
Visit the live app: **https://yt-transcript-web.pages.dev**

Paste any YouTube URL to extract and download transcripts as TXT or Markdown.

### MCP Integration
Connect to your AI assistant in one command:

```bash
uvx --from "git+https://github.com/samueladegoke/yt-transcript.git#subdirectory=backend" yt-transcript-proxy
```

Add to your AI tool's MCP config:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/samueladegoke/yt-transcript.git#subdirectory=backend", "yt-transcript-proxy"]
    }
  }
}
```

Supported: Claude Desktop, Cursor, VS Code Copilot, Windsurf, Cline, OpenClaw, and any MCP-compatible host.

## Project Structure

```
yt-transcript-web/
├── frontend/              # React + Vite web app
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── MCPIntegration.jsx
│   │   │   ├── MCPPlatformCard.jsx
│   │   │   ├── MCPCopyBlock.jsx
│   │   │   └── TabNavigation.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── wrangler.toml      # Cloudflare Pages config
├── backend/               # Python backend
│   ├── app/
│   │   ├── mcp_server.py  # MCP server
│   │   ├── mcp_proxy.py   # MCP proxy (CLI entrypoint)
│   │   └── transcript_service.py  # Core transcript logic
│   ├── main.py            # FastAPI application
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml        # Render deployment config
├── pyproject.toml         # Python package config
└── README.md
```

## API Endpoints

The FastAPI backend exposes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service status |
| `/health` | GET | Health check |
| `/transcript` | POST | Extract transcript (`{url, lang}`) |
| `/video-info` | POST | Get video metadata (`{url}`) |
| `/analyze` | POST | Analyze transcript (`{url, type}`) |

### Example

```bash
curl -X POST https://yt-transcript-api.onrender.com/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "lang": "en"}'
```

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### MCP Server (standalone)

```bash
pip install -e .
yt-transcript-proxy      # stdio mode for MCP hosts
yt-transcript --url "https://..."  # CLI mode
```

## Deployment

- **Frontend**: Cloudflare Pages (auto-deploys from `main` branch)
- **Backend**: Render (configured via `backend/render.yaml`)
- **MCP Server**: PyPI package (`yt-transcript-mcp`)

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push and open a PR

## License

MIT — see [LICENSE](LICENSE).
