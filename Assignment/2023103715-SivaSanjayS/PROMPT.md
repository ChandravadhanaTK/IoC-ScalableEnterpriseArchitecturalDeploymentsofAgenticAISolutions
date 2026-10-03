# NexusAI — Agentic Customer Support Assistant
## Build Prompt (Prompt Engineering Document)

> **Purpose:** This prompt can be used verbatim to regenerate the NexusAI application from scratch using any AI coding assistant (e.g., Google Antigravity, GitHub Copilot, Claude, or Gemini).

---

## Application Overview

Build **NexusAI** — an enterprise-grade, browser-based **Agentic Customer Support Assistant** that demonstrates the full agentic AI loop: planning → tool selection → tool execution → response generation → state transition.

---

## 1. Tech Stack

- **Language:** Vanilla HTML5 + CSS3 + JavaScript (ES2022, no frameworks, no build tools)
- **AI Backend:** Google Gemini API (`gemini-1.5-flash` model, REST via `fetch`)
- **Fonts:** Google Fonts — Inter (UI), JetBrains Mono (code/tool output)
- **No dependencies:** Zero npm packages — runs directly in browser by opening `index.html`

---

## 2. Design System

### Color Palette
- **Background Primary:** `#080612` (near-black with deep violet tint)
- **Background Secondary:** `#0f0c1f`
- **Card Background:** `rgba(255, 255, 255, 0.04)` with glassmorphism blur
- **Accent Violet:** `#a78bfa` (primary brand color)
- **Accent Cyan:** `#38bdf8` (secondary, used for tool calls)
- **Accent Emerald:** `#34d399` (success states, "Ready" badges)
- **Accent Amber:** `#fbbf24` (warning, "Running" badge)
- **Accent Rose:** `#fb7185` (escalation, error states)
- **Text Primary:** `#f0edff`
- **Text Secondary:** `#9b97b8`
- **Text Muted:** `#5a5678`

### Visual Effects
- **Animated orb background:** 3 large radial gradient blobs floating with CSS keyframes (`orbFloat`)
- **Grid overlay:** Subtle `60px × 60px` CSS grid lines at 1.5% opacity
- **Glassmorphism:** All cards use `backdrop-filter: blur(20px)` with semi-transparent backgrounds
- **Gradient text:** Brand name and stats use `-webkit-background-clip: text` with `linear-gradient(135deg, #a78bfa, #38bdf8)`

### Typography
- Headings: Inter 700–800 weight
- Body: Inter 400–500 weight
- Tool output / code: JetBrains Mono
- Font sizes: Use `rem` units, base 16px

### Animations
- `orbFloat`: Floating background orbs, 20s ease-in-out infinite
- `messageIn`: Chat message entrance, `cubic-bezier(0.34, 1.56, 0.64, 1)` spring
- `fadeInUp`: Welcome screen entrance
- `typingBounce`: 3-dot typing indicator, staggered 0.2s delays
- `stepBounce`: Workflow step activation bounce
- `badgePulse`: Tool badge pulse when running
- `escalationGlow`: Escalation banner glow breathing effect
- `pulse`: Status dot pulse ring
- `spin`: Tool spinner
- `floatIcon`: Welcome icon floating

---

## 3. Application Layout (Two-Panel)

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Shell                               │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │       SIDEBAR        │  │          CHAT MAIN               │ │
│  │  ─────────────────   │  │  ┌─────────────────────────────┐ │ │
│  │  Brand + Logo        │  │  │         Chat Header          │ │ │
│  │  Agent Status Card   │  │  └─────────────────────────────┘ │ │
│  │  Workflow Tracker    │  │  ┌─────────────────────────────┐ │ │
│  │   └─ 5 State Steps   │  │  │     Messages Container      │ │ │
│  │  Agent Tools Panel   │  │  │   (Welcome Screen or        │ │ │
│  │   └─ 4 Tool Items    │  │  │    scrollable messages)     │ │ │
│  │  Session Stats Grid  │  │  └─────────────────────────────┘ │ │
│  │   └─ 2×2 stats grid  │  │  ┌─────────────────────────────┐ │ │
│  └──────────────────────┘  │  │    Tool Activity Feed        │ │ │
│                             │  └─────────────────────────────┘ │ │
│                             │  ┌─────────────────────────────┐ │ │
│                             │  │       Input Area             │ │ │
│                             │  └─────────────────────────────┘ │ │
│                             └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Sidebar Components

### 4.1 Brand Header
- Logo SVG (circle + checkmark, gradient stroke)
- Brand name "NexusAI" with gradient text clip
- Sub-label "Support Agent" uppercase muted

### 4.2 Agent Status Card
- Green status dot (`.status-dot`) — changes color based on state
  - `idle`: emerald green, `thinking`: amber, `escalated`: rose with stronger glow
- Status label + current state value (e.g., "Processing...", "Escalated")
- Animated pulse ring on the dot

### 4.3 Workflow State Tracker
Five vertically stacked steps with connectors:
1. 👋 Greeting
2. 🔍 Understanding
3. ⚙️ Resolving
4. ✅ Follow-Up
5. 🚨 Escalation

Active step: violet background card, higher opacity, `stepBounce` animation on icon  
Completed step: 70% opacity, no background  
Inactive: 35% opacity  

### 4.4 Agent Tools Panel
Four tool items:
- 📦 Order Lookup → `order_lookup(order_id)`
- 🎫 Ticket Creator → `create_ticket(issue_type, description, priority)`
- 📚 Knowledge Base → `search_knowledge_base(query)`
- 🔺 Escalate → `escalate_to_human(reason, urgency)`

Each shows a badge: **Ready** (emerald) → **Running** (amber, pulsing) → **Done** (violet) → back to **Ready** after 3s

### 4.5 Session Stats (2×2 grid)
- Messages count
- Tool Calls count
- Session duration (live timer, `MM:SS`)
- Confidence score (`HIGH` / `MEDIUM` / `LOW` color-coded)

---

## 5. Chat Header
- Hamburger button (mobile only, toggles sidebar)
- Agent avatar (SVG robot icon in gradient card)
- Agent name "NexusAI Support Agent" + descriptor line
- Clear chat button (SVG reset icon)
- Export button (SVG download icon)
- Gemini badge pill (gradient border)

---

## 6. Messages & Conversation System

### Welcome Screen
Shown when no messages exist. Contains:
- Floating SVG robot icon
- Gradient title "Hello! I'm NexusAI"
- Subtitle description
- 6 Quick Prompt buttons in a 2-column grid

### Message Bubbles
**User messages:**
- Aligned right (`flex-direction: row-reverse`)
- Gradient purple-blue background with border
- Avatar: `👤` emoji in emerald-blue gradient card

**Agent messages:**
- Aligned left
- Semi-transparent white background with subtle border
- Avatar: `🤖` emoji in violet-cyan gradient card
- Can include a **Tool Use Card** above the text bubble

### Tool Use Card
Appears inside agent messages when a tool was invoked:
- Cyan border + background tint
- Header: `⚡ Tool Used: [tool_name]`
- Body: JSON result formatted in monospace

### Typing Indicator
Three colored dots with staggered bounce animation (violet, cyan, emerald)

### Escalation Banner
Special `rose`-tinted card with glow animation showing:
- Human agent name
- Escalation ID
- Estimated wait time
- Channel (Live Chat)

---

## 7. Tool Activity Feed
Slides in below messages during tool execution (max-height transition):
- Spinning loader
- Text: `Executing: toolName({...input...})`
- Disappears after tool completes

---

## 8. Input Area
- Auto-resizing `<textarea>` (max height 140px)
- Character counter (`0 / 2000`)
- Gradient circular send button (disabled when empty or processing)
- Keyboard shortcuts: `Enter` = send, `Shift+Enter` = new line
- Footer hint + "Secured by enterprise guardrails" label

---

## 9. Agent State Machine

```javascript
states = ['greeting', 'understanding', 'resolving', 'followup', 'escalation']
```

Transitions:
- Any first message → `understanding`
- Tool found + executed successfully → `resolving` → `followup`
- `escalate_to_human` tool → `escalation`
- Unknown intent → stays `understanding`
- Clear chat → reset to `greeting`

---

## 10. Intent Classification (Demo Mode)

Map user input to flows using regex:

| Intent | Keywords | Tool Used |
|--------|----------|-----------|
| `order` | order, track, deliver, ship, package | `order_lookup` |
| `refund` | damage, broken, refund, replacement, return | `create_ticket` (HIGH priority) |
| `account` | login, password, sign in, account access | `search_knowledge_base` |
| `policy` | return policy, timeline, process | `search_knowledge_base` |
| `cancel` | cancel, subscription, unsubscribe | `create_ticket` (MEDIUM priority) |
| `billing` | charge, payment, paid twice, duplicate | `escalate_to_human` (HIGH urgency) |
| `unknown` | anything else | generic clarification |

---

## 11. Gemini API Integration

### Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

### Request Body
```json
{
  "system_instruction": { "parts": [{ "text": "SYSTEM_PROMPT" }] },
  "contents": [ ...conversationHistory ],
  "generationConfig": {
    "temperature": 0.7,
    "topP": 0.95,
    "maxOutputTokens": 1024
  },
  "safetySettings": [...]
}
```

### System Prompt
The agent is instructed to:
- Operate as a customer support agent for an e-commerce company
- Use tools proactively (don't ask for info that can be looked up)
- Follow the workflow states
- Rate confidence as HIGH / MEDIUM / LOW
- Keep responses under 150 words unless explaining policy
- End resolved interactions with "Is there anything else I can help you with today?"

### Demo Mode
When no API key is provided:
- App runs fully offline
- Intent classifier maps to pre-built response flows
- Simulates tool execution with configurable delays
- Realistic tool results hardcoded in `DEMO_FLOWS`

### API Key Storage
- Stored in `localStorage` with key `nexusai_key`
- Model preference stored as `nexusai_model`
- Config modal opens automatically on first visit if no key found

---

## 12. Config Modal

On first load (no saved API key):
- Modal appears with backdrop blur overlay
- Fields: API Key (password input), Model selector
- "Use Demo Mode" button (skips API, goes fully demo)
- "Save & Connect" button (validates + saves to localStorage)
- Link to Google AI Studio to get a free key
- Click outside modal to close

---

## 13. Additional Features

- **Export:** Downloads conversation as `.txt` file with timestamps
- **Clear Chat:** Resets all state, restores welcome screen, resets session tracker
- **Toast Notifications:** Slide-up pill at bottom center for user feedback
- **Mobile Responsive:** Sidebar becomes off-canvas drawer at ≤768px
- **Accessibility:** ARIA labels, `role="log"`, `aria-live`, keyboard navigation

---

## 14. File Structure

```
app/
├── index.html    # Main HTML shell with all semantic structure
├── style.css     # Complete CSS with design tokens, animations, responsive
└── app.js        # All application logic (5 modules in one file)
```

---

## 15. Deployment Requirements

The app is a **zero-dependency static web app**. Deployment options:
- **GitHub Pages:** Push `app/` folder, enable Pages from repo settings
- **Netlify:** Drag-and-drop the `app/` folder to netlify.com/drop
- **Vercel:** `vercel --cwd app/`
- **Local:** Double-click `index.html` in any modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

No server, no build step, no npm required.

---

