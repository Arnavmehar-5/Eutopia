# Eutopia

> A calm gallery for the photos you never want to delete. *Eutopia: a good place where people and nature are at peace.*

**Status: PLANNING. Nothing below is built or tested yet.** See "Honest status".

## Problem
Photos that matter (Diwali, graduation, college days) sit in a flat camera roll next to screenshots. Nothing about storage reflects *why* a photo matters, and people don't want to delete them.

## Solution
Eutopia groups photos into **memory groups** by context and lets you present each group in a **template** (background, layout, mood) that matches the memory.

Core path:
1. Upload photos. The browser resizes to ~1280 px and converts to WebP.
2. A backend proxy sends each photo to **Gemma 4 (Gemini API)**, which returns a caption and an emotion/mood tag.
3. Photos are grouped into memory groups: first by Gemma's `event_type`, then split by `emotion`. The user can rename groups and move photos.
4. The user picks a template (Calm, Nostalgia, Celebration) and adds photos into it.
5. The result is a portable gallery page.

If the AI call fails, the app shows a clearly labeled error state. It never invents captions.

## Architecture
```
Browser (vanilla HTML/CSS/JS)
  |- resize + WebP, IndexedDB store, templates, petals
  |
  | POST /analyze (image + prompt)
  v
FastAPI proxy (holds GEMINI_API_KEY, validates JSON, retries)
  v
Gemini API -> Gemma 4 (open-weights model)
```

## Honest status
| Feature | Status |
|---|---|
| Upload + resize + WebP | planned |
| Gemma 4 caption + emotion via API | planned, model ID unverified |
| Memory groups (event_type, then emotion; user can edit) | planned |
| 3 templates (Calm, Nostalgia, Celebration) | planned |
| Falling petals | planned |
| Small evaluation (Gemma tags vs my hand labels) | planned |
| Optional local fallback: Gemma 4 via Ollama (`GEMMA_BACKEND=ollama`) | optional, may be cut |
| Video export, student-helper chat, remote storage | optional, may be cut |

## Honesty notes
- Gemma 4 is used through an API. **No model was trained** in this project.
- Photos are sent to the AI provider for analysis. Do not upload anything private.
- Eutopia is a **memory layer, not a backup**: it keeps compressed copies in your browser (IndexedDB), not full-size originals.

## Setup (planned; verify at build time)
- Python 3.11+, a Gemini API key from Google AI Studio.
- Copy `.env.example` to `.env` and fill in the values.
- Install backend dependencies, run the FastAPI server, open `frontend/index.html`.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | key for the Gemini API (server only, never committed) |
| `GEMMA_MODEL` | Gemma 4 model ID (verify before use) |
| `PORT` | backend port |

## Planned structure
`frontend/` (index.html, css/, js/) · `backend/` (app/main.py) · `AGENTS.md` · `CONTEXT.md` · `progress.md` · `DESIGN.md`

## License
Apache 2.0 (planned; added to the repo at event start). Third-party assets are credited here once added.
