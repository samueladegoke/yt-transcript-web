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

### Reverse Proxy & Security Headers
- **Proxy**: Nginx reverse proxy for production deployment
- **Backend**: Proxies to FastAPI on port 8001
- **SSL/TLS**: Let's Encrypt (certbot) for automatic certificate management

#### Security Headers Enabled
| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Enforce HTTPS for 1 year |
| X-Content-Type-Options | `nosniff` | Prevent MIME type sniffing |
| X-Frame-Options | `DENY` | Prevent clickjacking attacks |
| Content-Security-Policy | `default-src 'self'` | Restrict resource loading |
| Referrer-Policy | `strict-origin-when-cross-origin` | Control referrer information |
| X-XSS-Protection | `1; mode=block` | Enable XSS filtering |
| Permissions-Policy | `geolocation=(), microphone=(), camera=()` | Disable browser features |

#### Deployment Files
- `deploy/nginx.conf` - Complete nginx configuration with security headers
- `deploy/docker-compose.yml` - Containerized deployment (optional)
- `deploy/install.sh` - Automated installation and configuration

#### Installation
```bash
# Production with Let's Encrypt
sudo ./deploy/install.sh yourdomain.com

# Development (self-signed certs)
sudo ./deploy/install.sh
```

#### Docker Deployment
```bash
# Build and start all services
docker-compose -f deploy/docker-compose.yml up -d

# View logs
docker-compose -f deploy/docker-compose.yml logs -f
```

---

