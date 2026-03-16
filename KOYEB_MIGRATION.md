# Koyeb Migration Guide — yt-transcript-web Backend

## Prerequisites
1. Koyeb account: https://app.koyeb.com (sign up with GitHub)
2. GitHub repo: `samueladegoke/yt-transcript-web` (already exists)

## Step-by-Step Migration

### 1. Create Koyeb App
1. Go to https://app.koyeb.com/apps/create
2. Choose "GitHub" as source
3. Select repository: `samueladegoke/yt-transcript-web`
4. Branch: `main`

### 2. Configure Service
- **Name:** `yt-transcript-api`
- **Region:** Frankfurt (EU IPs, less likely blocked by YouTube)
- **Instance type:** Nano (256MB RAM, 0.1 vCPU) — free tier
- **Build method:** Dockerfile
- **Dockerfile path:** `backend/Dockerfile`
- **Port:** 8000
- **Health check path:** `/health`

### 3. Set Environment Variables
```
YT_PROXY=http://user:pass@geo.iproyal.com:12321
KILO_API_KEY=<copy-from-render>
KILO_BASE_URL=https://api.kilo.ai/api/gateway
KILO_MODEL=minimax/minimax-m2.5:free
CORS_ORIGINS=https://yt-transcript-web.pages.dev,http://localhost:5173
YOUTUBE_COOKIES_B64=<copy-from-render>
```

### 4. Deploy
Click "Deploy" and wait for build to complete (~3-5 minutes).

### 5. Update Frontend
After deployment, update Cloudflare Pages:
1. Go to Cloudflare Pages → yt-transcript-web → Settings → Environment Variables
2. Update `VITE_API_URL` to new Koyeb URL (e.g., `https://your-app.koyeb.dev`)
3. Redeploy frontend

### 6. Test
```bash
# Health check
curl https://your-app.koyeb.dev/health

# Test transcript (should work with Koyeb's EU IPs)
curl -X POST https://your-app.koyeb.dev/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=f8cfH5XX-XU","language":"en"}'
```

## Rollback Plan
If Koyeb doesn't work, Render backend is still running as backup.
