# AGENTS.md — protocol for every agent (Antigravity, Claude Code, OpenCode, ChatGPT)

## Read first, in order
`AGENTS.md` → `CONTEXT.md` → `progress.md` → `git status`. Then plan briefly before editing.

## Rules
- Focused changes only. No needless refactors, dependencies or repo-wide scans.
- Run tests/checks and report real results only. Never claim something works unless verified. Review the diff.
- No destructive git without asking. Commit locally in small commits (pre-authorized, `git add <file>`, never `git add .`). Ask before push, PR or remote changes.
- Never write secrets into any file. `.env` is gitignored; `.env.example` is committed.
- Add a 1–2 line "why" comment to non-trivial code (the owner learns from it).
- Update `progress.md` after each milestone.
- Never write "trained a model" anywhere. Gemma 4 is used via API.

## Integrity
- All implementation happens during the event. The docs in this repo were written before it as planning only; commit them with an honest message such as `docs: add pre-event planning docs`.
- No prebuilt app code, no backdating, no pasted prior work.
- If a rule is ambiguous, flag it for the organizers; do not guess.

## Plan (hours from event start; if the window is 16 h the extra time is buffer)
| Hours | Work | Checkpoint |
|---|---|---|
| 0–1 | Create public repo, Apache 2.0 license, .gitignore, `.env.example`, commit docs; verify model ID; one minimal real Gemma request | C0: real response received |
| 1–3 | FastAPI `/analyze`: JSON validation, one retry, backoff on 429, clear error state | C1: real photo → valid JSON |
| 3–5 | Upload, resize, WebP, IndexedDB, PhotoCards | C2: survives page refresh |
| 5–7 | Memory groups, TemplatePicker, 3 templates | C3: full core demo works |
| 7–9 | Petals, polish, accessibility pass | C4: reduced-motion + AA checked |
| 9–10 | Evaluation: 15 hand-labeled photos vs Gemma tags, report honestly in README | C5: result in README |
| 10–11 | README status (tested / untested / planned), screenshots, demo script, asset credits | C6 |
| 11–12 | Submit on MLH, test from a clean clone | done |

## Cut order (cut from the top first)
1. video export · 2. student-helper chat · 3. link-only/remote storage · 4. extra polish/animation · 5. extra templates.
Never cut: real Gemma call, honest error state, core demo.

## Handoff format
Objective · done · files changed · git status · tests run and results · issues and decisions · exact next step.