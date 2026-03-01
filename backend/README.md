# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API endpoint: `POST /api/extract`

Request body:

```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```
