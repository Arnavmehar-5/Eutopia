# DESIGN.md — Eutopia (spec for coding agents; implement exactly, don't improvise)

Mood: calm, Japanese, paper-and-ink. Photos are the hero. Accessibility beats decoration.

## 1. Tokens (define once as CSS variables; templates override only the marked ones)
| Token | Value | Notes |
|---|---|---|
| bg (washi) | #F7F2E9 | template override |
| surface | #FFFDF8 | cards |
| ink | #1F1E24 | main text, template override |
| ink-soft | #5C5A63 | secondary text |
| line | #D9D2C3 | 1 px borders, template override |
| accent | #F2A7BD | sakura, decoration only, template override |
| accent-strong | #B8466A | links, focus ring, text on light bg; check AA |
| sky | #8DB7D9 | secondary decoration |
| moss | #7A9A6D | secondary decoration |
| error | #A62B3A | error text/border |

## 2. Type
- Display: **Shippori Mincho** 500/700. Body: **Zen Kaku Gothic New** 400/500 (Google Fonts, with serif/sans-serif fallbacks).
- Scale (px): 14, 16, 20, 28, 44, 72. Body 16/1.6. Display line height 1.15.

## 3. Spacing, shape, layout
- Spacing scale (px): 4, 8, 16, 24, 32, 48, 64, 96. Section padding 96 desktop, 48 mobile.
- Max content width 1100. Breakpoints: 640, 1024. Radius: 12 cards, 999 pills. Shadow: 0 8px 30px rgba(31,30,36,.08).

## 4. Templates (each = token overrides + one gallery layout)
| id | bg | ink | line | accent | layout |
|---|---|---|---|---|---|
| calm (default) | #F7F2E9 | #1F1E24 | #D9D2C3 | #F2A7BD | masonry, 3 col (2 tablet, 1 mobile), generous whitespace |
| nostalgia | #EFE3CF | #3A2E24 | #CBB89B | #C98B5A | single column, photos with white border, rotated ±1.5°, subtle paper grain image |
| celebration | #FFF4E0 | #2A1A12 | #E8CFA0 | #D9472B (gold secondary #F2A33A) | 2 col grid, first photo as wide hero, thin accent divider lines |

Emotion → default template: calm, love → calm; nostalgia → nostalgia; joy, excitement, pride → celebration. User can always override.
Extra templates (cut order 5 only): graduation (#0F1B33 / #F5EFE0 / gold #D4AF37), college (#FFF6E5 / #222 / #4F8EF7), diwali (#2A1208 / #FFF1D6 / #FF9F1C).

## 5. Components (all states required)
- **UploadDropzone:** idle, dragover, processing (progress), error. Shows the privacy notice: photos are sent to the AI provider.
- **PhotoCard:** image, AI caption (labeled "AI-generated"), emotion pill, status (pending / done / failed).
- **MemoryGroupCard:** group title (editable), photo count, template chip.
- **TemplatePicker:** 3 swatches with a live preview of the current group.
- **GalleryView:** applies the selected template's tokens and layout.
- **ErrorBanner:** plain text "AI unavailable: <reason>. Showing no caption." Never show fake captions or silent fallbacks.
- **EmptyState:** one line plus an upload button.

## 6. Petals (canvas, fixed, pointer-events none, below content)
- Count: 24 desktop, 12 mobile. Size 8–16 px. Own simple petal SVG/path. Colour accent at opacity .55–.85.
- Fall speed 20–45 px/s; sway amplitude 20–50 px, period 4–8 s; rotation up to ±45°/s. Spawn above viewport, recycle at bottom.
- Scroll effect: speed multiplier = 1 + min(|scrollVelocity|/2000, 0.6).
- Pause when `document.hidden`. If `prefers-reduced-motion`: no animation, a few static petals only.
- Budget: 60 fps on a mid laptop; if it drops, reduce count first. Clouds (parallax) are optional (cut order 4).

## 7. Accessibility
- Text contrast WCAG AA. Focus ring 2 px accent-strong, visible on every control. Keyboard operable throughout.
- Alt text = AI caption; if missing, "Photo (no caption yet)".

## 8. Assets
Own SVGs for petals/paper. Any download must be CC0/royalty-free and credited in README. No copyrighted anime art.

## 9. Gemma output contract (JSON only, validate before use)
`caption` (≤18 words), `emotion` (joy | calm | nostalgia | pride | excitement | love), `event_type` (diwali | graduation | college | trip | family | other), `mood_words` (≤3), `suggested_title`. Invalid JSON → one retry → error state.
