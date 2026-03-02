# SPEC.md: YouTube Transcript Web Interface

## 1. Vision
A sleek, dark-mode web interface that allows users to paste a YouTube URL and receive a structured, downloadable transcript.

## 2. Technical Stack
- **Frontend**: React.js, Tailwind CSS, Vite.
- **Backend**: FastAPI (Python).
- **Deployment**: 
    - Frontend: Cloudflare Pages.
    - Backend: Cloudflare Workers (or local tunnel for testing).

## 3. Core Features
- **URL Input**: Clean hero section with a search bar for the YouTube link.
- **Extraction Engine**: Uses the existing logic from `skills/youtube-transcript/scripts/extract_transcript.py`.
- **Live Display**: Scrollable, time-stamped transcript viewer.
- **Download Actions**:
    - Download as `.txt` (Plain).
    - Download as `.md` (Formatted with Summary/Takeaways).
- **Design**: E.T.D. "Masterpiece" Dark Mode (Charcoal #121212, Neon Green #00E676, Electric Blue #2962FF).

## 4. Security & Performance
- **Anti-Bot**: Must handle YouTube rate limits using the E.T.D. proxy logic if necessary.
- **Latency**: Sub-3 second extraction for standard length videos.

## 5. Security & Compliance

### Dependency Vulnerability Scanning
- **Automated Scanning**: GitHub Dependabot scans dependencies for known vulnerabilities
- **Schedule**: 
  - Python packages (pip): Weekly checks
  - GitHub Actions: Monthly checks
- **Alerts**: Automatic PRs with vulnerability details and remediation steps
- **Compliance**: Meets audit requirements for 30-day vulnerability detection

---

