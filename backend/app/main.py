from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import ExtractRequest, ExtractResponse
from .transcript_service import TranscriptError, fetch_transcript, to_markdown, to_plain_text

app = FastAPI(title="YT Transcript API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
