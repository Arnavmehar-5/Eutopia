# CONTEXT.md — read once, then rely on it

## Owner
Arnav, 2nd-year BTech CSE, SRM University-AP, solo, Windows + PowerShell. Strong in C/C++, DSA, HTML/CSS/vanilla JS, Git; learning Node/Express, SQL, MongoDB; basic React and Python. **Has not learned ML**: integrates pretrained models/APIs only. Learns best through analogies. Conventions: gitignored env + committed `.example`, small commits, `git add <file>`.

## Event
sudo Hacktober (Hacktoberfest Hack Day Amaravati x FOSS SRM AP, with MLH), in person at S209, SRM University AP, solo.
- Window: owner's confirmation email says 8 PM Oct 10 → 12 PM Oct 11, 2026 (16 h). The MLH page says 6 PM Oct 10 → 5:55 AM Oct 11 IST (12 h). **Unresolved: ask the organizers.**
- Prize tracks on the MLH challenges page: (1) Best Use of Gemma 4 (Gemini API, multimodal, open-weights); (2) Best Open-Source AI Project (open-source/open-weight AI central, public GitHub repo, open-source license).
- Verified on the MLH pages: the portal does not make Gemma mandatory for participation, and states no theme and no ML-priority rule. Both are only prize-category criteria.
- Resources linked on the portal: Gemma hub, quickstart, API docs, beginner guide (mlh.link/gemma*), the Gemma cookbook on GitHub.

## Project: Eutopia
A calm gallery that groups photos into memory groups by context and shows each in a matching template. Core path: upload → browser resize (~1280 px) + WebP → Gemma 4 via FastAPI proxy returns caption + emotion → memory groups → user picks template → gallery. Storage: IndexedDB, no originals. Real API only; clear error state, never fake captions. Stack: vanilla HTML/CSS/JS + minimal FastAPI. Full spec in `DESIGN.md`; protocol and plan in `AGENTS.md`.

## Facts found in Google's docs (verify before relying)
Model IDs seen: `gemma-4-31b-it`, `gemma-4-26b-a4b-it` via the Gemini API; image input supported. Free-tier rate limits NOT verified.

## Local setup done before the event (environment only, no app code)
- Ollama 0.40.2 installed on Windows; `gemma4:e2b` pulled (4.6 GB). A text prompt and one image prompt worked in the terminal.
- Image test (cartoon portrait): emotion "Friendly", sensible caption, but it called a light blue shirt "white" and missed a small crest. Small local models can be wrong on details, so the evaluation step matters.
- Thinking mode makes local answers slow. For the optional Ollama backend, request JSON-only output with a fixed emotion list and try to disable thinking (check `ollama run --help`).
- A deployed site cannot reach Ollama on the owner's laptop, so the demo uses the Gemini API; Ollama is a practice and fallback path only.

## Decisions
- License: Apache 2.0 (owner's choice). Use it in the LICENSE file and every doc.
- Grouping rule: group by `event_type`, then split by `emotion`; the user can rename groups and move photos. This resolves open question 4.
- Repo: `github.com/Arnavmehar-5/Eutopia`. Its creation timing relative to the event start is to be confirmed with the organizers; commit the docs honestly as pre-event planning.
- Stack above; challenge it only if something is clearly simpler.
- Cache every Gemma result by file hash; batch several photos per call if limits require.
- Small honest evaluation: owner's hand labels vs Gemma tags on ~15 demo photos.
- Optional `GEMMA_BACKEND=gemini_api|ollama` switch only if time allows (not core).

## Open questions / ambiguities
1. Event window (12 h vs 16 h). 2. Whether pre-event planning docs are allowed (assumed yes; commit honestly). 3. Model ID and rate limits. 4. (Resolved) Grouping: event_type first, then emotion, user can override.

## Architecture change — 2026-10-11
Visual system changed from washi/sakura (light, Japanese, paper-and-ink) to a dark monochrome premium design (#171721 canvas, #1e1e2a cards, #5266eb cobalt primary). Why: owner wants a more modern, premium look for the landing page and app shell. Old design archived in DESIGN_v1_washi.md. The three gallery templates (calm, nostalgia, celebration) still apply only inside #gallery-root. Full spec now in DESIGN.md.