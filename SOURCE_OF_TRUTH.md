# YouTube Transcript Web — Source of Truth

> **Single Source of Truth** for everything about this project.
> **This document exists to prevent hallucinations, accidental deletions, and architectural confusion.**
>
> **Last Updated:** 2026-03-16 (10:13 UTC) | **Repo:** `samueladegoke/yt-transcript-web`

---

## 🚨 Anti-Hallucination Rules (READ FIRST)

Before any model makes changes to this project, it MUST:

1. **Read this file entirely** — no assumptions about what exists
2. **Check the File Manifest** below before deleting, moving, or renaming anything
3. **Add to the Changelog** after any substantial change (with reasoning)
4. **Never delete without checking `PROTECTED FILES`** list
5. **Never truncate transcripts** — the rule is "DO NOT lose or change any words, phrases, or letters"

---

## 📦 What This Project Is

**YouTube Transcript Web** — A full-stack YouTube transcript extraction platform that provides:
- **Web UI** for extracting and downloading YouTube video transcripts
- **REST API** for programmatic transcript extraction and AI-powered analysis
- **MCP (Model Context Protocol)** integration for AI assistants (Claude, Cursor, VS Code, etc.)
- **CLI** for command-line transcript extraction

---

## 🏗️ Architecture

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| Frontend | React + Vite + Tailwind CSS | `frontend/` | Cloudflare Pages UI |
| Backend API | FastAPI + Python + uvicorn | `backend/main.py` | Core API server |
| MCP Proxy | Python MCP + httpx | `backend/app/mcp_proxy.py` | Lightweight MCP bridge |
| MCP Server | Standalone MCP | `backend/app/mcp_server.py` | Direct MCP server |
| CLI | Python argparse | `backend/app/cli.py` | Command-line interface |
| Transcript Service | youtube_transcript_api | `backend/app/transcript_service.py` | Core extraction logic |
| Deployment | Azure VM (systemd) | `yt-transcript-api.service` | Production hosting |
| Tunnel | ngrok | `ngrok-yt.service` | HTTPS tunnel |
| Frontend Deploy | Cloudflare Pages | `frontend/wrangler.toml` | Static hosting |

### Data Flow
```
User → Frontend (Cloudflare Pages) → ngrok HTTPS → Backend API (Azure VM:8000)
                                            ↓
AI Assistant → MCP Proxy → Backend API → youtube_transcript_api → YouTube
```

---

## 📡 API Endpoints

| Endpoint | Method | Rate Limit | Request | Response |
|----------|--------|------------|---------|----------|
| `/` | GET | — | — | `{name, version, status}` |
| `/health` | GET | — | — | `{status, service}` |
| `/api/extract` | POST | 10/min | `{url, language}` | Full transcript extraction |
| `/api/video-info` | POST | 10/min | `{url}` | Video metadata + transcript + links |
| `/api/summary` | POST | — | `{url, lang}` | AI summary |
| `/api/analyze` | POST | 5/min | `{url, type}` | AI analysis (7 types) |

### Analysis Types (`/api/analyze`)
| Type | Description | Output |
|------|-------------|--------|
| `summary` | Concise overview | `{result: "markdown"}` |
| `outline` | Structured outline | `{result: "markdown"}` |
| `key_points` | Key takeaways | `{result: "markdown"}` |
| `action_points` | Actionable items | `{result: "markdown"}` |
| `next_steps` | Suggested next steps | `{result: "markdown"}` |
| `structured_edit` | **Professional Edit** — all 4 sections combined | `{result: "## PROFESSIONAL EDIT TRANSCRIPT\n...\n## SUMMARY\n...\n## ACTION POINTS\n...\n## NEXT STEPS\n..."}` |
| `all` | All analysis types | Combined result |

---

## 📁 File Manifest

### Root Level
| File | Purpose | Protected? |
|------|---------|-----------|
| `SOURCE_OF_TRUTH.md` | **This file** — single source of truth | ✅ YES |
| `PROJECT_SPEC.md` | Project specification (references this doc) | ✅ YES |
| `README.md` | User-facing documentation | ✅ YES |
| `pyproject.toml` | Python package config (MCP/CLI install) | ⚠️ Cautious |
| `LICENSE` | MIT license | ✅ YES |
| `.gitignore` | Git ignore rules | ⚠️ Cautious |
| `.githooks/pre-commit` | Feature protection hook | ✅ YES |

### `backend/` — API Server
| File | Purpose | Protected? |
|------|---------|-----------|
| `main.py` | **Core API** — all endpoints, KILO integration | ✅ YES |
| `app/__init__.py` | Package init | ❌ Safe to edit |
| `app/main.py` | App redirect for Render | ⚠️ Cautious |
| `app/cli.py` | CLI tool | ⚠️ Cautious |
| `app/mcp_proxy.py` | MCP proxy server | ✅ YES |
| `app/mcp_server.py` | Standalone MCP server | ✅ YES |
| `app/transcript_service.py` | Transcript extraction logic | ✅ YES |
| `requirements.txt` | Python dependencies | ⚠️ Cautious |
| `Dockerfile` | Container config | ⚠️ Cautious |
| `render.yaml` | Render deployment config | ⚠️ Cautious |

### `frontend/` — Web UI
| File | Purpose | Protected? |
|------|---------|-----------|
| `src/App.jsx` | Main app component | ⚠️ Cautious |
| `src/components/` | UI components | ⚠️ Cautious |
| `package.json` | Node dependencies | ⚠️ Cautious |
| `vite.config.js` | Build config | ⚠️ Cautious |
| `tailwind.config.js` | Styling config | ❌ Safe to edit |
| `wrangler.toml` | Cloudflare Pages config | ⚠️ Cautious |

### `docs/`
| File | Purpose |
|------|---------|
| `MCP_README.md` | MCP integration guide |

---

## 🔒 Protected Files (DO NOT DELETE)

These files MUST NOT be deleted, moved, or renamed without explicit justification recorded in the Changelog:

1. `SOURCE_OF_TRUTH.md` — this document
2. `PROJECT_SPEC.md` — project specification
3. `backend/main.py` — core API server (527 lines, all endpoints)
4. `backend/app/mcp_proxy.py` — MCP proxy server
5. `backend/app/mcp_server.py` — standalone MCP server
6. `backend/app/transcript_service.py` — transcript extraction
7. `backend/app/cli.py` — CLI tool
8. `frontend/src/App.jsx` — main app component
9. `pyproject.toml` — package metadata for PyPI/MCP install
10. `README.md` — user documentation

**If any model tries to delete a protected file, STOP and ask the user first.**

---

## ⚙️ Core Rules (Never Violate)

### Rule 1: No Words Lost
> *"DO NOT lose or change any words, phrases, or letters from the transcript"*

- **NEVER truncate transcripts** before sending to AI for analysis
- `max_tokens` for `structured_edit`/`all` must be at least **16,000**
- API timeout for long transcripts must be at least **300 seconds**

### Rule 2: All Analysis Types Must Work
All 7 analysis types must have corresponding implementations:
`summary`, `outline`, `key_points`, `action_points`, `next_steps`, `structured_edit`, `all`

### Rule 3: Professional Edit Format
`structured_edit` must output 4 sections with markdown headers:
- `## PROFESSIONAL EDIT TRANSCRIPT`
- `## SUMMARY`
- `## ACTION POINTS`
- `## NEXT STEPS`

### Rule 4: MCP API Paths
All MCP proxy paths use `/api/` prefix:
- `/api/extract` (not `/transcript`)
- `/api/video-info` (not `/video-info`)
- `/api/analyze` (not `/analyze`)

### Rule 5: Feature Protection
Any change to **protected files** must pass through the pre-commit hook at `.githooks/pre-commit`.

---

## 🔄 Change Log

### 2026-03-16 (10:59 UTC) — Restore Professional Edit Download Buttons
**Why:** Commit `113dfaa` had two download buttons (.txt + .md) positioned at the top-right of the Professional Edit result header. A later UI overhaul replaced this with a generic single download button, losing the dual-format download for Professional Edit.

**Changes:**
- **Added** special rendering case for `structured_edit` results (checks `aiResult.analysis_type === 'structured_edit'`)
- **Restored** dual download buttons: `Download .txt` + `Download .md` at top-right of result header
- **File naming:** `getSafeFilename(title, '_edited').txt/.md` → `{clean_title}_{YYYY-MM-DD}_edited.txt/.md`
- **Layout:** `flex justify-between` — title left, download buttons right

**File:** `frontend/src/App.jsx` — `DownloadOptions` component, AI results display section
**Source:** Restored from commit `113dfaa` (git show `113dfaa:frontend/src/App.jsx` lines 441-465)

### 2026-03-16 (10:13 UTC) — Consolidation + Source of Truth
**Why:** Two versions of the project existed — `yt-transcript-web/` (outer, deployed UI) and `yt-transcript-upgrade/` (inner, richer backend with structured_edit + KILO + truncation fix). Risk of confusion, deletion of the wrong version, and hallucinations.

**Changes:**
- **Consolidated** inner backend features into outer (main.py: 197→527 lines, added analyze/KILO/truncation fix)
- **Copied** PROJECT_SPEC.md, .githooks, updated backend/app files from inner
- **Created** SOURCE_OF_TRUTH.md — single comprehensive doc for the project
- **Removed** nested `yt-transcript-upgrade/` directory (contents merged)
- **Purpose:** Eliminate confusion, establish one source of truth, prevent accidental deletions

### 2026-03-16 (00:18 UTC) — Transcript Truncation Fix
**Why:** The `analyze_with_kilo` function truncated transcripts before AI analysis, violating "no words lost" rule. Professional Edit received incomplete transcripts.

**Changes:**
- **Removed** transcript truncation (was cutting at 8,000/12,000 chars)
- **Increased** max_tokens: 4,000 → 16,000 for `structured_edit`/`all`
- **Increased** API timeout: 120s → 300s
- **Commit:** `a8566cc` (in upgrade branch)

**Source:** `backend/main.py` lines 107-118, 164-178

### 2026-03-15 (21:00 UTC) — Original AI Format Restored + MCP Fix
**Why:** Commit `113dfaa` had specific system prompts for Professional Edit. Restored code used JSON instead of markdown.

**Changes:**
- Restored markdown headers for `structured_edit`
- Added description+links context to KILO analysis
- Fixed MCP proxy API paths (`/transcript` → `/api/extract`, etc.)

### 2026-03-15 — Full Feature Restoration
**Why:** Commit `7ae7014` accidentally stripped 439 lines from App.jsx, removing all AI features.

**Restored:** VideoInfo, SearchBar, DownloadOptions, AI analysis buttons, all 7 analysis types

### 2026-03-14 — E.T.D Brand + UI Overhaul
**Changes:** Elohim Tech Dynamics branding, glassmorphism, premium UI, framer-motion animations, favicon

### 2026-03-13 — Accuracy Overhaul
**Changes:** Corrected GitHub URLs, MCP tools, install docs (commit `5e8f724`)

### Earlier — Core Build
- CLI bridge for yt-transcript (PR #5)
- MCP server for IDE integration (PR #6)
- Universal Adapters v1.0.0 (PR #11)
- PyPI packaging with pyproject.toml
- Cloudflare Pages frontend deployment
- Azure VM + ngrok backend deployment

---

## 🔑 Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |
| `TRANSCRIPT_SCRIPT_PATH` | (auto) | Override transcript module path |
| `KILO_BASE_URL` | `https://api.kilo.ai/api/openrouter` | AI analysis API base |
| `KILO_API_KEY` | JWT token | AI API authentication |
| `KILO_MODEL` | `kilo-auto/free` | AI model for analysis |
| `RENDER_BACKEND_URL` | `https://yt-transcript-api-hzk2.onrender.com` | MCP proxy target |

---

## 🚀 Deployment

| Component | Platform | URL | Service |
|-----------|----------|-----|---------|
| Frontend | Cloudflare Pages | `https://yt-transcript-web.pages.dev` | wrangler |
| Backend | Azure VM | `https://kathline-blotty-allie.ngrok-free.dev` | systemd |
| MCP Proxy | Install via `uvx` | `pip install git+...#subdirectory=backend` | — |

### Service Commands
```bash
# Backend
systemctl --user restart yt-transcript-api.service
systemctl --user restart ngrok-yt.service

# Logs
journalctl --user -u yt-transcript-api.service -f
journalctl --user -u ngrok-yt.service -f
```

---

## 🧪 MCP Tools

| Tool | Function | Parameters |
|------|----------|------------|
| `get_transcript` | Extract transcript | `url: str, lang: str = "en"` |
| `get_video_info` | Get video metadata | `url: str` |
| `analyze` | AI analysis | `url: str, type: str = "summary"` |
| `check_health` | Server health | none |

### MCP Install (one-liner)
```bash
uvx --from "git+https://github.com/samueladegoke/yt-transcript-web.git#subdirectory=backend" yt-transcript-proxy
```

---

## 📊 Project Status

| Metric | Status |
|--------|--------|
| API Endpoints | 6/6 ✅ |
| Analysis Types | 7/7 ✅ |
| MCP Tools | 4/4 ✅ |
| Transcription | No truncation ✅ |
| Frontend Deploy | Cloudflare Pages ✅ |
| Backend Deploy | Azure VM + ngrok ✅ |
| Source of Truth | This doc ✅ |

---

## ⚠️ Known Issues & Lessons

1. **Don't delete files without reading SOURCE_OF_TRUTH.md first** — this doc exists because models deleted the wrong version
2. **Outer vs Inner version confusion** — the project had two copies; consolidated 2026-03-16
3. **JSX fragment incident** — a fix for a fragment wrapper accidentally stripped 439 lines
4. **Truncation was the wrong fix** — increasing max_tokens was the right solution, not cutting the transcript

---

*This is the single source of truth. When in doubt, read this file.*
