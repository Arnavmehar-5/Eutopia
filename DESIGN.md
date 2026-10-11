# DESIGN.md — Eutopia dark system (spec for coding agents; implement exactly, don't improvise)

Mood: dark, monochrome, premium. Photos are the hero. Accessibility beats decoration.
Supersedes the washi/sakura system (archived in DESIGN_v1_washi.md).

## 1. Tokens (define once as CSS variables; templates override only the marked ones inside #gallery-root)
| Token | Value | Notes |
|---|---|---|
| canvas | #171721 | page background |
| card | #1e1e2a | card surfaces |
| btn-fill | #272735 | button/input fill |
| text | #ededf3 | primary text |
| text-secondary | #c3c3cc | secondary/caption text |
| border-hairline | #e2e3ed | hairline borders |
| border-divider | #70707d | section dividers |
| primary | #5266eb | main CTA only (upload button). Never decoration. White text on it. |
| error | #A62B3A | error text/border |

## 2. Type
- Font: **Inter** (variable, Google Fonts), for both body and headings.
- Weights: 400 body, 480 headings/emphasis. Never 700+ for headings.
- Scale (px): 12 caption, 14 small, 16 body, 28 card title, 32 section title, 42 section display, 65 hero display.
- Body 16 px / line-height 1.5. Display line-height 1.1.

## 3. Spacing, shape, layout
- Card padding 32 px. Section max-width 1200 px. 72 px vertical space between sections. Element gap 12 px.
- Radius: pill 32 px (buttons, inputs, nav); cards 12 px; structural lines 4 px.
- No drop shadows. Separation by card colour step only.

## 4. Templates (each = token overrides + one gallery layout, scoped to #gallery-root)
| id | bg | ink | line | accent | layout |
|---|---|---|---|---|---|
| calm (default) | #F7F2E9 | #1F1E24 | #D9D2C3 | #F2A7BD | masonry, 3 col (2 tablet, 1 mobile), generous whitespace |
| nostalgia | #EFE3CF | #3A2E24 | #CBB89B | #C98B5A | single column, photos with white border, rotated ±1.5°, subtle paper grain |
| celebration | #FFF4E0 | #2A1A12 | #E8CFA0 | #D9472B (gold secondary #F2A33A) | 2 col grid, first photo as wide hero, thin accent divider lines |

The selected template styles the full-width Memories section and its photo grid. The landing page and app shell stay dark.

## 5. Components (all states required)
- **TopBar:** transparent over the hero. "Eutopia" brand left, nav links centred, ghost pill "Templates" link and cobalt pill "Upload photos" button right. On scroll: backdrop-filter blur(20px) + #171721 at 80% opacity. Remove blur if prefers-reduced-transparency.
- **Hero:** full-viewport, full-bleed. CSS gradient background with dark overlay. 65 px display heading.
- **UploadDropzone / EmptyState:** one line instruction + upload button.
- **PhotoCard:** image, AI caption (labeled "AI-generated"), emotion pill, status (pending / done / failed).
- **TemplatePicker:** 3 swatches in the gallery area.
- **GalleryView:** applies the selected template's tokens and layout inside #gallery-root.
- **ErrorBanner:** plain text "AI unavailable: <reason>. Showing no caption." Never fake captions.
- **Footer:** privacy line: "Photos are sent to an AI provider for analysis. Eutopia keeps compressed copies in your browser, not originals."

## 6. Petals (canvas, fixed, pointer-events none)
- Faint layer behind the hero only, low opacity (0.15–0.3). Off when prefers-reduced-motion.
- Count: 18 desktop, 8 mobile. Size 8–16 px. Colour #5266eb at very low opacity.
- Same physics as before but visible only in the hero zone.

## 7. Accessibility
- Text contrast WCAG AA. Focus ring 2 px #5266eb, visible on every control.
- Alt text = AI caption; if missing, "Photo (no caption yet)".
- prefers-reduced-motion: disable all animations and transitions.
- prefers-reduced-transparency: remove backdrop-filter blur on top bar.

## 8. Reveal animations
- Sections fade in and rise 16 px once when entering viewport (IntersectionObserver).
- Disabled under prefers-reduced-motion.

## 9. Gemma output contract (JSON only, validate before use)
`caption` (≤18 words), `emotion` (joy | calm | nostalgia | pride | excitement | love), `event_type` (diwali | graduation | college | trip | family | other), `mood_words` (≤3), `suggested_title`. Invalid JSON → one retry → error state.
