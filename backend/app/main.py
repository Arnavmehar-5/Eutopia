"""Minimal API service for analyzing one uploaded photo."""

import asyncio
from pathlib import Path
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .gemma import InvalidModelOutput, UpstreamFailure, analyze_image

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_TYPES = {"image/webp", "image/jpeg", "image/png"}
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_error_handler(_request, exc: HTTPException):
    reason = exc.detail if isinstance(exc.detail, str) else "Invalid request"
    return JSONResponse(status_code=exc.status_code, content={"ok": False, "error": reason})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request, _exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"ok": False, "error": "Image file is required"})


@app.exception_handler(Exception)
async def unexpected_error_handler(_request, _exc: Exception):
    # Keep unexpected SDK details out of HTTP responses and logs because they can contain request metadata.
    return JSONResponse(status_code=502, content={"ok": False, "error": "Analysis failed"})


def _is_image(data: bytes, content_type: str) -> bool:
    # Check the file signature as well as the browser-provided MIME type before forwarding bytes upstream.
    if content_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return False


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="Unsupported image type")
    # Read one byte beyond the cap so oversized uploads are rejected without buffering them fully.
    image = await file.read(MAX_IMAGE_BYTES + 1)
    if len(image) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 2 MB")
    if not _is_image(image, content_type):
        raise HTTPException(status_code=422, detail="File is not a valid supported image")
    try:
        # why: offload the synchronous SDK call so a hard request deadline can return
        # a clear error even if an upstream connection stalls beyond its socket timeout.
        result, model = await asyncio.wait_for(
            run_in_threadpool(analyze_image, image, content_type),
            timeout=105,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=502, detail="Gemini timed out") from None
    except InvalidModelOutput as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
    except UpstreamFailure as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from None
    return {"ok": True, "result": result, "model": model}


if __name__ == "__main__":
    import uvicorn

    # Read PORT here so the same root .env configures the service on Windows and Unix.
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", "8000")))
