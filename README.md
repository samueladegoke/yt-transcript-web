# Proxy Check

A modern proxy checking tool with a React frontend and Python backend.

## Features

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python with async support
- **Real-time proxy validation**
- **Risk assessment scoring**

## Project Structure

```
Proxy_Check/
├── frontend/          # React + Vite frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json   # Dependencies
├── backend/           # Python backend
│   ├── main.py        # FastAPI server
│   └── ...
├── proxy_checker.py   # Main proxy checker script
└── plans/             # Project planning docs
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Deployment

- **Frontend**: Deployed on Cloudflare Pages
- **Backend**: Can be deployed on any Python hosting platform

## License

MIT
