# NexusAI — Agentic Customer Support Assistant
## Capstone Deliverables Report

**Course:** IoC — Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Application:** NexusAI — Enterprise Agentic Customer Support Assistant  
**Tech Stack:** HTML5 · CSS3 · JavaScript · Google Gemini 2.0 Flash API  
**Deployed Link:** [https://merry-dusk-080a8c.netlify.app/](https://merry-dusk-080a8c.netlify.app/)

## Deliverable 1: Architecture Diagram

### System Overview

NexusAI is a browser-native, single-page agentic AI application with a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                                 │
│  ┌───────────────────────────┐          ┌──────────────────────────────────┐   │
│  │       Sidebar Panel        │          │         Chat Interface            │   │
│  │  • Agent Status Card       │          │  • Message Feed (scrollable)      │   │
│  │  • Workflow State Tracker  │          │  • Tool Use Cards (inline JSON)   │   │
│  │  • Agent Tools Panel       │          │  • Typing Indicator               │   │
│  │  • Session Stats (live)    │          │  • Escalation Banner              │   │
│  │  • Real-time UI Updates    │          │  • Quick Prompt Shortcuts         │   │
│  └───────────────────────────┘          └──────────────────────────────────┘   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ DOM Events / UIController
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                               AGENT CORE LAYER                                  │
│                                                                                 │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐     │
│  │  AgentWorkflow   │  │  GeminiClient       │  │  ToolOrchestrator        │     │
│  │  (State Machine) │  │  (API + Demo Mode)  │  │  (Tool Execution)        │     │
│  │                  │  │                     │  │                           │     │
│  │  States:         │  │  • Multi-turn hist  │  │  Tools:                   │     │
│  │  greeting        │  │  • System prompt    │  │  • order_lookup           │     │
│  │  understanding   │  │  • Safety filters   │  │  • create_ticket          │     │
│  │  resolving       │  │  • Demo fallback    │  │  • search_knowledge_base  │     │
│  │  followup        │  │  • Intent classify  │  │  • escalate_to_human      │     │
│  │  escalation      │  │  • History trim     │  │                           │     │
│  └──────────────────┘  └────────────────────┘  └─────────────────────────┘     │
│                                                                                 │
│  ┌──────────────────┐  ┌────────────────────┐                                  │
│  │  SessionTracker  │  │  UIController       │                                  │
│  │  (Live Metrics)  │  │  (DOM Management)   │                                  │
│  └──────────────────┘  └────────────────────┘                                  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ HTTPS / REST (fetch API)
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                              INTEGRATION LAYER                                  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        Google Gemini 2.0 Flash API                        │  │
│  │  Endpoint: generativelanguage.googleapis.com/v1beta/models/...            │  │
│  │  Auth: API Key (stored in localStorage, never server-side)                │  │
│  │  Features: Multi-turn chat, system instructions, safety settings          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        Simulated Enterprise Tools                          │  │
│  │  • Order Management System (mock REST responses)                           │  │
│  │  • CRM Ticketing System (ticket creation + IDs)                            │  │
│  │  • Knowledge Base Search (FAQ article retrieval)                           │  │
│  │  • Human Escalation Queue (agent assignment + ETA)                         │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Trust Boundaries

| Boundary | Details |
|----------|---------|
| **Client ↔ Gemini API** | TLS 1.3 encrypted HTTPS. API key stored client-side in `localStorage` (acceptable for demo; in production use server-side proxy) |
| **User ↔ Application** | No authentication required (public demo). Production would add OAuth/SSO |
| **Agent ↔ Tools** | Tool calls are simulated in-browser. Production would call real microservice APIs via a backend proxy |
| **Conversation History** | Stored in memory only (JavaScript array). Cleared on page refresh |

### Key Components

| Component | Technology | Responsibility |
|-----------|-----------|---------------|
| `UIController` | Vanilla JS class | DOM rendering, message display, event handling |
| `AgentWorkflow` | State machine | Tracks agent conversation phase |
| `GeminiClient` | Fetch API | Sends prompts to Gemini, manages history |
| `ToolOrchestrator` | Async JS | Simulates tool invocation with delays |
| `SessionTracker` | Interval timers | Live metrics: messages, tools, time, confidence |

---

## Deliverable 2: Agent Workflow Design

### Agent Roles

| Role | Description |
|------|-------------|
| **NexusAI Agent** | Primary customer-facing AI. Handles greeting, classification, tool invocation, and resolution |
| **Tool Executor** | Sub-system that executes tool calls (order lookup, ticket creation, KB search, escalation) |
| **Human Specialist** | Fallback role when AI cannot resolve (billing disputes, complex refunds, legal) |

### Workflow State Diagram

```
                        ┌──────────┐
                        │  START   │ (User sends first message)
                        └────┬─────┘
                             │
                             ▼
                     ┌───────────────┐
                     │   GREETING    │ Agent introduces itself, sets context
                     └───────┬───────┘
                             │ Message received
                             ▼
                    ┌─────────────────┐
                    │  UNDERSTANDING  │ Intent classification (regex + Gemini)
                    └────────┬────────┘
                             │
               ┌─────────────┼──────────────┐
               │             │              │
               ▼             ▼              ▼
        [Order/Refund]  [Account/Policy] [Billing]
               │             │              │
               ▼             ▼              ▼
     order_lookup()    search_kb()    escalate_to_human()
     create_ticket()               
               │             │              │
               └─────────────┤              │
                             ▼              ▼
                      ┌───────────┐   ┌────────────┐
                      │ RESOLVING │   │ ESCALATION │ ──▶ Human Agent
                      └─────┬─────┘   └────────────┘
                            │ Tool result received
                            ▼
                     ┌────────────┐
                     │  FOLLOW-UP │ Confirm resolution, ask if anything else
                     └─────┬──────┘
                           │ Satisfied        │ New issue
                           ▼                  ▼
                     ┌──────────┐      Back to UNDERSTANDING
                     │   END    │
                     └──────────┘
```

### Tool Definitions

#### `order_lookup(order_id: string)`
- **Trigger:** User mentions order number or asks about delivery
- **Input:** Extracted order ID from conversation
- **Output:** `{ order_id, status, carrier, tracking, estimated_delivery, items, last_update }`
- **Failure:** Returns "order not found" → agent offers to create a ticket

#### `create_ticket(issue_type, description, priority)`
- **Trigger:** Issue requires backend action (refund, complaint, cancellation)
- **Priority levels:** `LOW | MEDIUM | HIGH | CRITICAL`
- **Output:** `{ ticket_id, status, sla, assigned_to }`
- **Handoff:** Ticket ID given to user; email confirmation simulated

#### `search_knowledge_base(query: string)`
- **Trigger:** Policy questions, how-to queries, account troubleshooting
- **Output:** Array of `{ title, relevance (0-1), solution/policy }` articles
- **Fallback:** If no articles found, agent uses its own knowledge

#### `escalate_to_human(reason, urgency)`
- **Trigger:** Confidence LOW + issue unresolved after 2 turns, OR billing/legal issue
- **Output:** `{ escalation_id, human_agent, wait_time, channel }`
- **Handoff protocol:** Full conversation history transferred to human agent

### Approval & Failure Paths

| Scenario | Agent Action |
|----------|-------------|
| Tool returns error | Retry once, then offer human escalation |
| Confidence LOW after 2 attempts | Auto-escalate with `urgency: HIGH` |
| User explicitly requests human | Immediately escalate, no retry |
| API timeout (>10s) | Fall back to demo mode, notify user |
| Safety filter triggered | Politely decline, log incident |

---

## Deliverable 3: Deployment Strategy

### Runtime Environment

| Aspect | Specification |
|--------|--------------|
| **Type** | Static web application (zero server-side runtime) |
| **Browser Support** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **Dependencies** | None (zero npm packages) |
| **API Calls** | Client-side `fetch()` to Gemini API over HTTPS |

### Deployment Environments

```
Development  ─────────────────────────────────────────────
  Local file system: open index.html in browser
  Demo mode: no API key needed
  Hot reload: not applicable (static files)

Staging  ─────────────────────────────────────────────────
  GitHub Pages (preview branch)
  URL: https://<username>.github.io/<repo>/Assignment/<folder>/app/
  Trigger: Push to `staging` branch

Production  ──────────────────────────────────────────────
  GitHub Pages or Netlify (main branch)
  URL: Custom domain or github.io URL
  Trigger: Merge PR to main + tag release
```

### Deployment Steps (GitHub Pages)

```bash
# Step 1: Ensure app/ folder is committed
git add Assignment/YourRollNo-YourName/
git commit -m "feat: add NexusAI agentic support agent"
git push origin main

# Step 2: Enable GitHub Pages
# Go to: Settings → Pages → Source: Deploy from branch
# Branch: main  |  Folder: /root  →  Save

# Step 3: Access URL
# https://<username>.github.io/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions/Assignment/YourRollNo-YourName/app/
```

### Alternative: Netlify (Drag & Drop — 30 seconds)
1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `app/` folder into the browser
3. Copy the generated URL (e.g., `https://nexusai-abc123.netlify.app`)

### Scaling Strategy

Since the app is fully client-side:

| Layer | Strategy |
|-------|---------|
| **CDN** | GitHub Pages / Netlify uses a global CDN by default |
| **AI Scaling** | Gemini API handles scaling; rate limits apply per API key |
| **Multi-user** | Each browser tab = independent session (no shared state) |
| **Cost** | $0 for static hosting; Gemini free tier = 60 req/min |

### Resilience

- **No API key?** App auto-switches to Demo Mode with pre-built responses
- **API timeout?** Graceful error with retry suggestion
- **Offline?** Static assets cached by browser; Gemini calls fail gracefully
- **Safety violations?** Gemini safety filters applied, polite decline shown

### Release Process

```
1. Feature branch  →  PR review  →  Merge to main
2. GitHub Actions (optional): validate HTML/CSS lint
3. Auto-deploy via GitHub Pages
4. Smoke test: open URL, send test message, verify tool UI
```

---

## Deliverable 4: Security Model

### Identity & Authorization

| Component | Current (Demo) | Production Recommendation |
|-----------|----------------|--------------------------|
| **User Identity** | Anonymous (no auth) | OAuth 2.0 / Google Sign-In |
| **API Key** | Client-side localStorage | Server-side proxy (never expose to client) |
| **Session** | In-memory JS array | JWT-authenticated backend session |
| **Role-Based Access** | N/A | `customer`, `agent`, `admin` roles |

### API Key Security

```
CURRENT ARCHITECTURE (Demo/Prototype):
  Browser → localStorage.getItem('nexusai_key') → Gemini API
  ⚠️ Risk: Key visible in DevTools, can be extracted

PRODUCTION ARCHITECTURE (Recommended):
  Browser → POST /api/chat (no key exposed) → Backend Proxy → Gemini API
  ✅ Key stored as environment variable on server
  ✅ Rate limiting applied at proxy layer
  ✅ User authentication required before proxy accepts requests
```

### Input Guardrails

| Guardrail | Implementation |
|-----------|---------------|
| **Length limit** | `maxlength="2000"` on textarea; enforced client-side |
| **XSS Prevention** | User input is HTML-escaped before DOM insertion; never used as `innerHTML` raw |
| **Content Safety** | Gemini safety filters: `BLOCK_MEDIUM_AND_ABOVE` for harassment and hate speech |
| **Rate Limiting** | Gemini API enforces 60 req/min on free tier |
| **Injection** | No SQL, no eval(), no dynamic script loading |

### Privacy

| Data | Handling |
|------|---------|
| **Conversation history** | In-memory only; cleared on page refresh; never persisted to server |
| **API key** | Stored in `localStorage`; user can clear via browser settings |
| **User PII** | Never collected; no analytics, no tracking pixels |
| **Gemini API** | Conversations may be used by Google to improve models per their ToS |

### Audit Trail

In the current prototype:
- Tool calls logged to browser console with timestamps
- Export feature creates downloadable conversation `.txt`

In production:
- All tool invocations logged to centralized audit service
- Escalations recorded with full conversation context
- PII masking applied before logs are stored

### Threat Model Summary

| Threat | Mitigation |
|--------|-----------|
| API key theft | Move to server-side proxy in production |
| Prompt injection | System prompt instructions + Gemini safety filters |
| XSS via user input | DOM text insertion (not innerHTML) for user content |
| Data leakage | No persistent storage of conversations |
| Abuse/spam | Rate limiting at Gemini API layer; add CAPTCHA in production |

---

## Deliverable 5: Monitoring Dashboard Design

### Dashboard Concept

The NexusAI application includes a **live in-app monitoring panel** (the sidebar) that tracks real-time session metrics. For enterprise deployment, an external monitoring dashboard is designed below.

### In-App Real-Time Metrics (Implemented)

| Metric | Location | Update Frequency |
|--------|---------|-----------------|
| **Agent State** | Status card (colored dot + label) | On every state transition |
| **Message Count** | Session stats grid | On every message |
| **Tool Call Count** | Session stats grid | On every tool invocation |
| **Session Duration** | Session stats grid | Every 1 second (setInterval) |
| **AI Confidence** | Session stats grid | On each agent response |
| **Active Workflow Step** | Workflow tracker (highlighted) | On state transition |
| **Tool Activity** | Sliding activity feed | During tool execution |

### Enterprise Monitoring Design (Proposed for Production)

```
┌─────────────────────────────────────────────────────────────────────┐
│              NexusAI Operations Dashboard                           │
├───────────────────┬──────────────────┬─────────────────────────────┤
│  HEALTH           │  TRACES          │  QUALITY                    │
│                   │                  │                             │
│  🟢 API Status    │  Avg Resp Time   │  Resolution Rate: 87%       │
│  Active Sessions  │  Tool Exec P95   │  Escalation Rate: 13%       │
│  Error Rate: 0.2% │  Intent Accuracy │  CSAT Score: 4.6/5          │
│  Uptime: 99.97%   │  Gemini Latency  │  First Contact Res: 73%     │
├───────────────────┴──────────────────┴─────────────────────────────┤
│  SAFETY / GUARDRAILS           │  COST                            │
│                                │                                  │
│  Safety Blocks (24h): 3        │  Gemini API calls today: 1,842  │
│  Prompt injection attempts: 0  │  Estimated cost: $0.18           │
│  Escalation reasons breakdown  │  Tokens used: 924,000            │
│  [Order] [Billing] [Other]     │  Avg tokens/session: 501         │
├────────────────────────────────┴──────────────────────────────────-┤
│  BUSINESS OUTCOMES                                                  │
│                                                                     │
│  ████████████░░░░ Orders resolved without human: 87%               │
│  ██░░░░░░░░░░░░░░ Escalated to human: 13%                          │
│  ████████████████ Customer satisfaction (last 30 days): 94%        │
│  Top issue types: [Shipping 42%] [Returns 28%] [Account 18%]       │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Metrics to Track

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|----------------|
| **Health** | API availability | 99.9% | < 99% |
| **Health** | Gemini response time | < 2s | > 5s |
| **Traces** | Tool execution time | < 1.5s | > 4s |
| **Traces** | Intent classification accuracy | > 90% | < 75% |
| **Quality** | First-contact resolution rate | > 80% | < 60% |
| **Quality** | Escalation rate | < 15% | > 30% |
| **Safety** | Safety filter triggers | < 0.1% | > 1% |
| **Safety** | Prompt injection attempts | 0 | Any |
| **Cost** | Daily API spend | < $5 | > $20 |
| **Business** | CSAT score | > 4.5/5 | < 4.0 |

### Recommended Monitoring Stack (Production)

| Tool | Purpose |
|------|---------|
| **Google Cloud Monitoring** | API health, uptime, latency |
| **Vertex AI Model Monitoring** | Gemini response quality, drift detection |
| **Firebase Analytics** | User session tracking, funnel analysis |
| **PagerDuty** | Alerting on threshold breaches |
| **Looker Studio** | Business outcome dashboards |

---

## Summary

NexusAI demonstrates all five capstone pillars:

| Deliverable | Status |
|-------------|--------|
| ✅ Architecture Diagram | 3-layer client architecture with trust boundaries documented |
| ✅ Agent Workflow Design | Full state machine with 5 states, 4 tools, approval & failure paths |
| ✅ Deployment Strategy | Zero-dependency static app; GitHub Pages + Netlify options; scaling plan |
| ✅ Security Model | Input sanitization, API key guidance, privacy model, threat analysis |
| ✅ Monitoring Dashboard | In-app live metrics implemented; enterprise dashboard designed |

---

*Submitted for IoC Capstone — Scalable Enterprise Architectural Deployments of Agentic AI Solutions*
