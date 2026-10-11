"""Gemini API integration for Gemma caption generation."""

import io
import json
import os
import re
import time
from typing import Any

import httpx
from google import genai
from google.genai import errors
from google.genai import types

EVENT_TYPES = {"diwali", "graduation", "college", "trip", "family", "other"}
EMOTIONS = {"joy", "calm", "nostalgia", "pride", "excitement", "love"}

BASE_INSTRUCTION = (
    "Analyze this photo and return JSON only with exactly these keys: caption, keywords, "
    "event, emotion, mood_words, suggested_title. caption must be 4 to 18 words and describe only visible details. "
    "keywords must be 3 to 6 unique lowercase strings, each 1 to 24 characters. event must be one of "
    "diwali, graduation, college, trip, family, other. emotion must be one of joy, calm, nostalgia, pride, "
    "excitement, love. mood_words must be an array of at most 3 short strings. suggested_title must be 2 to 6 words. "
    "Do not identify people or guess locations. Name a place only if a sign or label in the image shows it."
)


class UpstreamFailure(Exception):
    """A safe, short description of a Gemini service failure."""


class InvalidModelOutput(Exception):
    """Gemma returned content that does not satisfy the public output contract."""


def _response_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if not isinstance(text, str) or not text.strip():
        raise InvalidModelOutput("Gemma returned no text")
    return text.strip()


def _generate(
    client: genai.Client,
    model: str,
    image_file: Any,
    prompt: str,
    transient_retries: list[int],
) -> str:
    # why: one shared retry keeps transient retries bounded across upload and JSON repair calls.
    while True:
        try:
            result = client.models.generate_content(
                model=model,
                contents=[image_file, prompt],
            )
            return _response_text(result)
        except errors.APIError as exc:
            status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
            if status not in (429, 500, 502, 503, 504) or transient_retries[0] == 0:
                suffix = f" (HTTP {status})" if isinstance(status, int) else ""
                raise UpstreamFailure("Gemini request failed" + suffix) from None
            transient_retries[0] -= 1
            time.sleep(0.5)  # why: short backoff preserves the request's overall time budget.
        except InvalidModelOutput:
            raise
        # why: catch timeout and connection errors separately with clear messages
        except (httpx.TimeoutException, TimeoutError):
            raise UpstreamFailure("Gemini timed out") from None
        except (httpx.NetworkError, ConnectionError):
            raise UpstreamFailure("Could not reach Gemini") from None
        except Exception:
            raise UpstreamFailure("Gemini request failed") from None
    raise UpstreamFailure("Gemini request failed")


def _upload_image(
    client: genai.Client,
    image: bytes,
    mime_type: str,
    transient_retries: list[int],
) -> Any:
    # why: the documented Gemma image flow uses uploaded File parts; inline image bytes returned HTTP 500.
    while True:
        try:
            return client.files.upload(
                file=io.BytesIO(image),
                config=types.UploadFileConfig(mime_type=mime_type),
            )
        except errors.APIError as exc:
            status = getattr(exc, "code", None) or getattr(exc, "status_code", None)
            if status not in (429, 500, 502, 503, 504) or transient_retries[0] == 0:
                suffix = f" (HTTP {status})" if isinstance(status, int) else ""
                raise UpstreamFailure("Gemini image upload failed" + suffix) from None
            transient_retries[0] -= 1
            time.sleep(0.5)
        except (httpx.TimeoutException, TimeoutError):
            raise UpstreamFailure("Gemini image upload timed out") from None
        except (httpx.NetworkError, ConnectionError):
            raise UpstreamFailure("Could not reach Gemini") from None
        except Exception:
            raise UpstreamFailure("Gemini image upload failed") from None


def _parse_and_validate(raw: str) -> dict[str, Any]:
    # Strip only a surrounding Markdown fence so model formatting cannot bypass JSON validation.
    cleaned = re.sub(r"^\s*```(?:json)?\s*|\s*```\s*$", "", raw, flags=re.IGNORECASE)
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise InvalidModelOutput("Gemma returned invalid JSON") from exc
    if not isinstance(value, dict):
        raise InvalidModelOutput("Gemma returned invalid JSON")
    if set(value) != {"caption", "keywords", "event", "emotion", "mood_words", "suggested_title"}:
        raise InvalidModelOutput("Gemma returned unexpected fields")
    caption = value.get("caption")
    keywords = value.get("keywords")
    event = value.get("event")
    emotion = value.get("emotion")
    mood_words = value.get("mood_words")
    title = value.get("suggested_title")
    if not isinstance(caption, str) or not 4 <= len(caption.split()) <= 18:
        raise InvalidModelOutput("Gemma returned an invalid caption")
    if (
        not isinstance(keywords, list)
        or not 3 <= len(keywords) <= 6
        or any(
            not isinstance(word, str)
            or not word.strip()
            or len(word.strip()) > 24
            or word.strip() != word.strip().lower()
            for word in keywords
        )
        or len({word.strip() for word in keywords if isinstance(word, str)}) != len(keywords)
    ):
        raise InvalidModelOutput("Gemma returned invalid keywords")
    # why: closed vocabularies keep photo tags consistent for later section grouping and search.
    if not isinstance(emotion, str) or emotion not in EMOTIONS:
        raise InvalidModelOutput("Gemma returned invalid tags")
    if not isinstance(event, str) or event not in EVENT_TYPES:
        raise InvalidModelOutput("Gemma returned invalid tags")
    if not isinstance(mood_words, list) or len(mood_words) > 3 or any(
        not isinstance(word, str) or not word.strip() or len(word.strip()) > 32 for word in mood_words
    ):
        raise InvalidModelOutput("Gemma returned invalid mood words")
    if not isinstance(title, str) or not 2 <= len(title.split()) <= 6:
        raise InvalidModelOutput("Gemma returned an invalid title")
    return {
        "caption": caption.strip(),
        "keywords": [word.strip() for word in keywords],
        "event": event,
        "emotion": emotion,
        "mood_words": [word.strip() for word in mood_words],
        "suggested_title": title.strip(),
    }


def analyze_image(image: bytes, mime_type: str) -> tuple[dict[str, Any], str]:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMMA_MODEL", "").strip()
    if not api_key or not model:
        raise UpstreamFailure("Backend credentials or model are not configured")
    try:
        # why: the documented Gemma 4 26B model returned a response faster than the 31B variant.
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=30_000),
        )
    except Exception:
        raise UpstreamFailure("Gemini client could not be initialized") from None
    prompt = BASE_INSTRUCTION
    transient_retries = [1]
    image_file = _upload_image(client, image, mime_type, transient_retries)
    try:
        for attempt in range(2):
            raw = _generate(client, model, image_file, prompt, transient_retries)
            try:
                return _parse_and_validate(raw), model
            except InvalidModelOutput:
                if attempt:
                    raise
                prompt = (
                    BASE_INSTRUCTION
                    + " Your previous response did not match the schema. Return one valid JSON object, "
                    "with no markdown, following the exact keys and limits."
                )
        raise InvalidModelOutput("Gemma returned invalid JSON")
    finally:
        # why: delete temporary API copies after analysis; the provider's TTL cleans up if deletion fails.
        try:
            client.files.delete(name=image_file.name)
        except Exception:
            pass
