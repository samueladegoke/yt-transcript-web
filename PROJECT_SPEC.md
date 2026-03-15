# YouTube Transcript Web — Project Specification

> **Single Source of Truth** — Last updated: 2026-03-15 (21:40 UTC)
> 
> **Rule:** This file MUST be updated whenever substantial changes are made to the codebase.
> **Rule:** Every feature listed here must have a corresponding implementation in the code.
> **Rule:** If a feature is removed, this document must be updated with explicit justification.

## 🏗️ Architecture

| Component | Technology | Location |
|-----------|-----------|----------|
| Frontend | React + Vite + Tailwind CSS | `frontend/` |
| Backend | FastAPI (Python) + uvicorn | `backend/main.py` |
| HTTPS Bridge | ngrok tunnel | `ngrok-yt.service` |
| MCP Proxy | Python MCP + httpx | `backend/app/mcp_proxy.py` |
| MCP Server | Standalone MCP server | `backend/app/mcp_server.py` |
| Transcript Service | youtube_transcript_api + proxy | `backend/app/transcript_service.py` |
| Deployment | Azure VM (systemd) | `yt-transcript-api.service` |

## 📡 API Endpoints

All endpoints are POST unless otherwise specified. Backend runs on `http://localhost:8000`.

| Endpoint | Method | Rate Limit | Request Body | Response |
|----------|--------|------------|--------------|----------|
| `/` | GET | — | — | `{name, version, status, proxy}` |
| `/health` | GET | — | — | `{status, service, proxy, kilo}` |
| `/api/extract` | POST | 10/min | `{url, language}` | `{success, video_id, title, language, transcript_text, transcript_lines[], generated_at, extraction_ms}` |
| `/api/video-info` | POST | 10/min | `{url}` | `{success, video_id, title, channel, duration, view_count, upload_date, description, links[], transcript[], plain_text, plain_text_with_timestamps, markdown}` |
| `/api/summary` | POST | 10/min | `{url}` | `{success, video_id, title, summary, generated_at}` |
| `/api/analyze` | POST | 5/min | `{url, type}` | `{success, video_id, title, analysis_type, result, generated_at}` |

### Analysis Types for `/api/analyze`

| Type | Description | Result Format |
|------|-------------|---------------|
| `summary` | Concise summary | `{result: "summary text..."}` |
| `outline` | Structured outline | `{result: "markdown outline..."}` |
| `key_points` | Key insights | `{result: "markdown key points..."}` |
| `action_points` | Actionable items | `{result: "markdown action items..."}` |
| `next_steps` | Logical next steps | `{result: "markdown next steps..."}` |
| `structured_edit` | **Professional Edit** — combines all features | `{result: "## PROFESSIONAL EDIT TRANSCRIPT\n...\n## SUMMARY\n...\n## ACTION POINTS\n...\n## NEXT STEPS\n..."}` |
| `all` | All analysis types combined | `{result: "complete markdown analysis..."}` |

> **Note:** All analysis types return raw markdown/text under a `result` key. The `structured_edit` type outputs 4 `##`-headed sections as specified in the original commit `113dfaa`.

### Request Models

```python
class ExtractRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=10)

class VideoInfoRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)

class SummaryRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=10)

class AnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=5, max_length=500)
    type: str = Field(default="summary", pattern="^(summary|outline|key_points|action_points|next_steps|structured_edit|all)$")
    language: str = Field(default="en", min_length=2, max_length=10)
    transcript: Optional[str] = Field(default=None, description="Pre-fetched transcript text (skips YouTube fetch)")
```

## 🎨 Frontend Features

### Core UI Components
- **Hero** — Animated hero section with branding
- **TabNavigation** — Tabbed interface
- **TranscriptDisplay** — Transcript rendering with timestamps
- **VideoInfo** — Thumbnail, channel, duration, views, upload date, description (expand/collapse), extracted links
- **SearchBar** — Live transcript search with result count
- **FilteredTranscriptDisplay** — Search-aware transcript rendering
- **DownloadOptions** — Download buttons + AI Analysis buttons
- **MCPIntegration** — MCP setup instructions for AI tools
- **BrandIcon** — 4-tier icon resolution
- **SkeletonLoader** — Loading states
- **ErrorToast** — Error notifications
- **EmptyState** — Empty state display
- **Footer** — Site footer

### Download Formats
- TXT with timestamps
- Clean TXT (no timestamps)
- Markdown (with headers, links)
- SRT subtitles
- JSON (full data)

### AI Analysis Buttons (in DownloadOptions)
- **Summary** — Quick overview
- **Action Points** — Actionable items
- **Next Steps** — What to do next
- **Professional Edit** (`structured_edit`) — Complete combined analysis + professionally edited transcript

### Design System
- **Background:** Navy/dark (#0a0b1a)
- **Accents:** Gold/yellow (#fbbf24, #f59e0b), Cyan/electric blue (#00bfff, #38bdf8)
- **Effects:** Glassmorphism (card-highlight), noise texture, metallic gold
- **Animations:** Framer-motion
- **Typography:** Fontshare (general) + Plus Jakarta Sans (headings)
- **Buttons:** btn-gold, btn-glass

### API Integration Pattern
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:8000');

// Extract transcript
fetch(`${API_BASE_URL}/api/extract`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, language: 'en' })
});

// AI Analysis (Professional Edit)
fetch(`${API_BASE_URL}/api/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, type: 'structured_edit' })
});

// Video info
fetch(`${API_BASE_URL}/api/video-info`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url })
});
```

## 🔌 MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_transcript` | Fetch full transcript text | `url: str, lang: str = "en"` |
| `get_video_info` | Get video metadata | `url: str` |
| `analyze` | Analyze transcript | `url: str, type: str = "summary"` |
| `check_health` | Verify backend connectivity | (none) |

### MCP Proxy Configuration
```python
# Default backend URL (points to localhost on the same VM)
RENDER_BACKEND_URL = os.getenv("RENDER_BACKEND_URL", "http://localhost:8000")
```

### MCP Server Configuration (mcporter)
```json
{
  "command": "uvx",
  "args": ["--from", "git+https://github.com/samueladegoke/yt-transcript-web.git#subdirectory=backend", "yt-transcript-proxy"],
  "env": { "RENDER_BACKEND_URL": "http://localhost:8000" }
}
```

## 🔒 Backend Infrastructure

### Services (systemd user services)
| Service | Command | Restart | Purpose |
|---------|---------|---------|---------|
| `yt-transcript-api` | `uvicorn main:app --host 0.0.0.0 --port 8000` | always | FastAPI backend |
| `ngrok-yt` | `ngrok http 8000 --log=stdout` | always | HTTPS tunnel |

### Environment Variables (systemd)
| Variable | Value | Purpose |
|----------|-------|---------|
| `CORS_ORIGINS` | Cloudflare Pages + ngrok URLs | CORS policy |
| `YT_PROXY` | IPRoyal residential proxy | Bypass YouTube rate limits |
| `KILO_BASE_URL` | `https://api.kilo.ai/api/openrouter` | AI analysis API |
| `KILO_API_KEY` | JWT token | Authentication |
| `KILO_MODEL` | `kilo-auto/free` | Analysis model |
| `PATH` | `/usr/local/bin:...` | Must include yt-dlp location |

### Dependencies
- `youtube_transcript_api` — Transcript extraction
- `yt-dlp` — Video metadata (requires `--js-runtimes node`)
- `httpx` — Async HTTP client (MCP proxy)
- `fastapi` + `uvicorn[standard]` + `uvloop` — Web framework

## 📐 Critical Metrics

| Metric | Value | Purpose |
|--------|-------|---------|
| Frontend lines (App.jsx) | 747+ | Feature protection baseline |
| Backend endpoints | 6 | API completeness |
| MCP tools | 4 | Integration completeness |
| Analysis types | 7 | AI feature completeness |

## 🔄 Change Log

### 2026-03-15 — Full Feature Restoration
**Why:** Commit `7ae7014` ("fix: wrap transcript tab JSX in fragment") accidentally stripped 439 lines from App.jsx, removing all AI analysis features, video info, search, and download options.

**Restored:**
- VideoInfo component (thumbnail, channel, description, links)
- SearchBar component (transcript search)
- DownloadOptions component (AI analysis buttons)
- Professional Edit (`structured_edit`) analysis type
- `/api/summary` endpoint
- `action_points`, `next_steps`, `structured_edit`, `all` analysis types
- yt-dlp `--js-runtimes node` flag
- yt-dlp proxy for metadata

**Root causes fixed:**
- yt-dlp not in systemd PATH → added `/usr/local/bin` to PATH
- KILO model name invalid → corrected to `kilo-auto/free`
- Frontend API URL wrong → fixed to ngrok HTTPS URL

### 2026-03-15 (21:00 UTC) — Original AI Format Restored + MCP Fix
**Why:** Commit `113dfaa` had specific system prompts and markdown format for Professional Edit. The restored code used JSON format instead, losing the original structure.

**Backend changes:**
- `analyze_with_kilo` — restored original system prompts for each analysis type (summary, action_points, next_steps, structured_edit, all)
- `structured_edit` now uses markdown headers (`## PROFESSIONAL EDIT TRANSCRIPT`, `## SUMMARY`, `## ACTION POINTS`, `## NEXT STEPS`) instead of JSON keys
- Added `description` and `links` parameters to `analyze_with_kilo` — the AI now sees video context for richer analysis
- Added `transcript` parameter to `AnalyzeRequest` — frontend sends already-fetched transcript to avoid YouTube re-fetch blocking
- `/api/analyze` endpoint now fetches description+links from yt-dlp for context

**MCP proxy fix (`mcp_proxy.py`):**
- `get_transcript` — fixed path: `/transcript` → `/api/extract`
- `get_video_info` — fixed path: `/video-info` → `/api/video-info`
- `analyze` — fixed path: `/analyze` → `/api/analyze`
- `analyze` — added `transcript` parameter, updated analysis types list
- `get_transcript` — returns timestamped text instead of raw segments

### 2026-03-14 — Initial Cloudflare Build Fix
**Why:** JSX fragment issue needed fixing for Cloudflare Pages to build
**Mistake:** Instead of adding a fragment wrapper, the entire App.jsx was replaced with a stripped version, losing all AI features

## ⚠️ DO NOT REMOVE WITHOUT EXPLICIT JUSTIFICATION

The following features are **required** and must not be removed without updating this spec file with explicit reasoning:

1. **All 6 API endpoints** — `/`, `/health`, `/api/extract`, `/api/video-info`, `/api/summary`, `/api/analyze`
2. **All 7 analysis types** — `summary`, `outline`, `key_points`, `action_points`, `next_steps`, `structured_edit`, `all`
3. **VideoInfo component** — Required for displaying video metadata
4. **AI Analysis buttons** — Required for all analysis types
5. **Professional Edit** — Combined analysis feature
6. **SearchBar** — Required for transcript search
7. **DownloadOptions** — All 5 download formats (TXT, TXT-clean, MD, SRT, JSON)
8. **MCP tools** — `get_transcript`, `get_video_info`, `analyze`, `check_health`
9. **CORS configuration** — Must include Cloudflare Pages + current HTTPS tunnel URL
10. **yt-dlp with `--js-runtimes node`** — Required for YouTube metadata
