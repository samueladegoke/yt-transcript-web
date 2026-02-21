# Proxy Sentinel

High-performance async proxy checking tool with real-time progress streaming.

## Features

- **Fast Async Checking**: Check 100+ proxies concurrently with aiohttp
- **Real-time Progress**: WebSocket-based live progress streaming
- **Modern Frontend**: React + Vite + Tailwind CSS
- **FastAPI Backend**: High-performance Python async API

## Project Structure

```
proxy_check/
├── frontend/          # React + Vite frontend
│   ├── src/          # React components
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── backend/          # FastAPI backend
│   ├── main.py       # API server
│   ├── proxy_lib_async.py  # Async proxy checker
│   └── requirements.txt
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend
- `CORS_ORIGINS` - Allowed CORS origins (default: localhost:5173,localhost:5174)
- `MAX_CONCURRENT` - Max concurrent proxy checks (default: 100)
- `PROXY_TIMEOUT` - Timeout per proxy check in seconds (default: 8)

### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)

## Deployment

### Frontend (Cloudflare Pages)
The frontend can be deployed to Cloudflare Pages:
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set root directory: `frontend`

### Backend
The FastAPI backend can be deployed to any Python hosting service (Railway, Render, Fly.io, etc.)

## License

MIT
