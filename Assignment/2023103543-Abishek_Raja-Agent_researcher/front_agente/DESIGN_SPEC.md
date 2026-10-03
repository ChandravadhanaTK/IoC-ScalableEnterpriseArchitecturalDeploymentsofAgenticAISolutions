# Agent Researcher — Frontend Design Specification

This document describes the visual design and aesthetics of the Agent Researcher frontend. Use it to replicate the look and feel in any React/TypeScript project. **This is a design-only spec — ignore all functionality, state management, and API logic.**

---

## Color System

All colors are defined as CSS custom properties on `:root`:

```css
:root {
  --bg: #0d0d0d;           /* Page background — near-black */
  --surface: #1a1a1a;       /* Cards, input boxes, user message bubbles */
  --surface-hover: #222222;  /* Hover state for interactive surfaces */
  --active-bg: #0f2a1a;     /* Active/selected state background — dark green tint */
  --border: #2a2a2a;        /* All borders — subtle dark gray */
  --text: #e8e8e8;          /* Primary text — off-white */
  --text-muted: #6b6b6b;    /* Labels, hints, secondary info */
  --text-dim: #9a9a9a;      /* Descriptions, placeholders */
  --accent: #3ddc84;        /* Primary accent — bright green (buttons, active states, logo dot) */
  --accent-dim: #2a9e5f;    /* Hover borders on suggestions */
  --orange: #f97316;        /* Highlight color — used only on the welcome heading keyword */
  --header-height: 56px;
}
```

**Theme:** Dark mode only. No light mode. No theme toggle.

---

## Typography

- **Font stack:** `'Inter', 'SF Mono', monospace`
- Load from Google Fonts: `Inter` weights `400, 500, 600, 700, 800`
- All text is `color: var(--text)` unless otherwise noted
- No italic anywhere except the orange highlight word in the welcome heading

| Element | Size | Weight | Spacing | Color |
|---|---|---|---|---|
| Logo text | 15px | 700 | 0.08em | --text |
| Nav tabs | 11px | 600 | 0.08em | --text-dim (default), --accent (active) |
| Welcome heading | clamp(36px, 5vw, 56px) | 800 | -0.02em | --text |
| Welcome heading highlight | same | same | same | --orange, italic |
| Welcome subtext | 15px | 400 | normal | --text-dim |
| Suggestion buttons | 13px | 400 | normal | --text-dim |
| Message bubble | 14px | 400 | normal | --text |
| Message label (YOU / RESEARCHER) | 11px | 600 | 0.06em | --text-muted |
| Input textarea | 14px | 400 | normal | --text |
| Input placeholder | 14px | 400 | normal | --text-muted |
| Input hint | 12px | 400 | normal | --text-muted |

---

## Layout Structure

Full viewport height (`100vh`), no scrolling on body. Flex column layout:

```
┌──────────────────────────────────────────────┐
│  HEADER (56px, fixed height)                 │
│  [logo-dot] RESEARCHER    [CHAT] [MEMORY]    │
├──────────────────────────────────────────────┤
│                                              │
│              MAIN CONTENT                    │
│         (flex: 1, scrollable)                │
│                                              │
│   Either: Welcome Screen (centered)          │
│   Or:     Message list (top-aligned, scroll) │
│   Or:     Memory panel (centered)            │
│                                              │
├──────────────────────────────────────────────┤
│  INPUT BAR (fixed at bottom, chat view only) │
└──────────────────────────────────────────────┘
```

- No sidebar. Full-width content area.
- Content is max-width `760px`, centered with `margin: 0 auto`.

---

## Component Styles

### Header

- Height: `56px`, flex row, vertically centered
- Bottom border: `1px solid var(--border)`
- Padding: `0 24px`
- **Logo:** flex row, gap 8px
  - Green dot: `10px × 10px` circle, `background: var(--accent)`, `box-shadow: 0 0 8px var(--accent)` (glow effect)
  - Text: "RESEARCHER" — 15px, weight 700, letter-spacing 0.08em
- **Nav tabs:** flex row, gap 6px, `margin-left: 24px`
  - Each tab: pill shape (`border-radius: 20px`), `padding: 6px 14px`
  - Default: `border: 1px solid var(--border)`, `color: var(--text-dim)`, transparent background
  - Hover: `border-color: var(--text-dim)`, `color: var(--text)`
  - Active: `border-color: var(--accent)`, `color: var(--accent)`, `background: var(--active-bg)`
  - Transition: `all 0.15s`

### Welcome Screen

Shown when no messages exist. Centered vertically and horizontally in the content area.

- Flex column, centered, gap `32px`, padding `40px 24px`
- **Heading:** Multi-line, center aligned
  ```
  Your
  Research Agent    ← this part is orange + italic
  is ready.
  ```
  - Uses `<br />` for line breaks
  - `.highlight` span: `color: var(--orange)`, `font-style: italic`
- **Subtext:** max-width `480px`, line-height `1.7`
- **Suggestion buttons:** flex row, wrap, gap `10px`, max-width `640px`, centered
  - Each button: transparent bg, `border: 1px solid var(--border)`, border-radius `8px`, padding `9px 16px`
  - Hover: `border-color: var(--accent-dim)`, `color: var(--text)`, `background: var(--active-bg)`
  - `white-space: nowrap`
  - Text includes an emoji prefix (e.g. "🔬 Summarize recent AI safety papers")

### Messages

- Container: flex column, gap `24px`, padding `32px 24px`, max-width `760px`, centered
- Each message (`.msg`): flex column, gap `6px`
  - **User messages:** `align-items: flex-end` (right-aligned)
    - Bubble: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px` with `border-bottom-right-radius: 4px` (flat corner)
    - Label "YOU" appears below the bubble
  - **Assistant messages:** left-aligned (default)
    - Bubble: transparent background, no border, `max-width: 100%`
    - Label "RESEARCHER" appears above the bubble
- **Bubble shared styles:** padding `12px 16px`, border-radius `12px`, font-size `14px`, line-height `1.6`, max-width `80%`
- **Label:** font-size `11px`, weight `600`, letter-spacing `0.06em`, `color: var(--text-muted)`, padding `0 4px`

### Typing Indicator

Shown as an assistant message with 3 bouncing dots instead of text:

- 3 `<span>` elements inside a `.typing` div
- Each dot: `7px × 7px` circle, `background: var(--text-muted)`
- Animation: `bounce 1.2s infinite` — translateY(0) → translateY(-6px) → translateY(0)
- Staggered: 2nd dot delayed `0.2s`, 3rd dot delayed `0.4s`

```css
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
```

### Input Bar

Fixed at the bottom of the chat view (not fixed position — flex shrink 0).

- Outer padding: `16px 24px 20px`
- Max-width `760px`, centered
- **Input box:** flex row, gap `12px`, `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, padding `14px 16px`
  - Focus-within: `border-color: #3a3a3a`
  - **Textarea:** flex 1, transparent bg, no border/outline, `resize: none`, `max-height: 160px`, line-height `1.5`, single row by default (auto-resizes on input)
  - **Send button:** `36px × 36px`, `border-radius: 8px`, `background: var(--accent)`
    - Icon: up-arrow SVG, `18px × 18px`, `color: #000`
    - Hover: `background: #2ec26e`
    - Disabled: `opacity: 0.4`, `cursor: not-allowed`
- **Hint text** below input box: `margin-top: 8px`, font-size `12px`, `color: var(--text-muted)`
  - Text: "Enter to send · Shift+Enter for new line"

### Memory Panel

Placeholder view shown when Memory tab is active. Centered in the content area.

- Flex centered, padding `40px 24px`
- Icon: `48px` emoji (🧠), `margin-bottom: 16px`
- Heading: `24px`, weight `700`, `margin-bottom: 12px`
- Description: `14px`, `color: var(--text-dim)`, line-height `1.7`, max-width `400px`

---

## Scrollbar

Custom webkit scrollbar throughout:

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
```

---

## Transitions

All interactive elements use `transition: all 0.15s` or specific property transitions at `0.15s`. Keeps the UI feeling snappy but not instant.

---

## Key Design Principles

1. **Dark, minimal, monochrome** — the only colors are green (accent) and orange (welcome highlight). Everything else is grayscale.
2. **No shadows** except the logo dot glow. Depth is conveyed through subtle border and background changes.
3. **Tight spacing** — compact UI that doesn't waste space. Small font sizes (11–15px range).
4. **No icons** except the send button arrow SVG and emoji prefixes on suggestions.
5. **No rounded avatars or profile images** — messages use text labels (YOU / RESEARCHER).
6. **Content-centered layout** — max-width 760px keeps readability comfortable.
