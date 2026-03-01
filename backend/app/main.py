import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import ExtractRequest, ExtractResponse
from .transcript_service import TranscriptError, fetch_transcript, to_markdown, to_plain_text

app = FastAPI(title="YT Transcript API", version="0.1.0")

# CORS: Use environment variable, default to production URL
allowed_origins = os.getenv("ALLOWED_ORIGINS", "https://yt-transcript-web.pages.dev").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=['GET', 'POST'],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest) -> ExtractResponse:
    try:
        video_id, transcript = fetch_transcript(str(req.url))
    except TranscriptError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    plain_text = to_plain_text(transcript)
    markdown = to_markdown(transcript, title=f"Transcript: {video_id}")

    return ExtractResponse(
        video_id=video_id,
        title=f"Transcript: {video_id}",
        transcript=transcript,
        plain_text=plain_text,
        markdown=markdown,
    )


@app.post("/api/summary")
def summarize(req: ExtractRequest) -> dict:
    """Generate a summary of the transcript"""
    try:
        video_id, transcript = fetch_transcript(str(req.url))
    except TranscriptError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    
    # Simple extractive summary - first 5 segments
    summary_parts = [seg["text"] for seg in transcript[:5]]
    summary = " ".join(summary_parts)
    
    return {"video_id": video_id, "summary": summary}
