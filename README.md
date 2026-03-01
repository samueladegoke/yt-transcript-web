# yt-transcript-web

React + FastAPI interface for extracting YouTube transcripts with time-stamped display and TXT/MD downloads.

## Project structure

- `frontend/` Vite + React + Tailwind web app
- `backend/` FastAPI extraction API
- `wrangler.toml` Cloudflare Pages config for frontend deployment

## Local development

### 1) Start backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Start frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## API

### `POST /api/extract`

Request body:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Response includes:

- `transcript`: list of `{ start, duration, text }`
- `plain_text`: transcript formatted for `.txt`
- `markdown`: transcript with summary and key takeaways for `.md`
