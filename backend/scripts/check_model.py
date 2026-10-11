"""Standalone model connectivity check — does NOT import FastAPI."""

import os
import socket
import ssl
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from google import genai
from google.genai import types

# why: load .env from the project root (two levels up from backend/scripts/)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def safe_connection_category(exc: Exception) -> str | None:
    """Classify transport failures using exception types only, never message text."""
    chain = []
    current = exc
    seen = set()
    while current is not None and id(current) not in seen and len(chain) < 6:
        seen.add(id(current))
        chain.append(current)
        current = current.__cause__ or current.__context__

    if any(isinstance(item, httpx.ProxyError) for item in chain):
        return "proxy connection failure"
    if any(isinstance(item, ssl.SSLError) for item in chain):
        return "TLS handshake failure"
    if any(isinstance(item, socket.gaierror) for item in chain):
        return "DNS lookup failure"
    if any(isinstance(item, ConnectionRefusedError) for item in chain):
        return "connection refused"
    if any(isinstance(item, httpx.ConnectTimeout) for item in chain):
        return "connection timed out"
    if any(isinstance(item, httpx.ConnectError) for item in chain):
        return "transport connection failure"
    if any(isinstance(item, (httpx.TimeoutException, TimeoutError)) for item in chain):
        return "request timed out"
    return None

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMMA_MODEL", "").strip()

start = time.perf_counter()
try:
    if not api_key or not model:
        raise RuntimeError("Required configuration is missing")
    # why: the standalone probe must have its own deadline and safe output.
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=30_000),
    )
    response = client.models.generate_content(
        model=model,
        contents=["Reply with the single word: ok"],
    )
    text = getattr(response, "text", None) or ""
    print(f"OK, response length {len(text)}")
except Exception as exc:
    cls = type(exc).__name__
    # why: extract HTTP status without printing raw message (which may contain headers)
    status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    status_str = f" HTTP {status}" if status else ""
    category = safe_connection_category(exc)
    category_str = f" ({category})" if category else ""
    print(f"{cls}{status_str}{category_str}")
finally:
    print(f"Seconds taken: {time.perf_counter() - start:.1f}")
