# OfficeAssist — AI Workplace Assistant

## Project Deliverables

**Submitted by:** Roshni Banu S — Roll No: 2023103055

**Deployed link:** https://pixel-perfect-view-7651.lovable.app

---

## 1. Overview

OfficeAssist is an AI-powered workplace assistant that demonstrates **single-agent
tool use**. One AI agent answers employee questions, and it decides on its own
whether to call a **Workplace Knowledge Tool** (which searches a built-in company
knowledge base) or to answer directly from its general knowledge.

## 2. Deliverables in This Folder

| # | Deliverable | File |
|---|-------------|------|
| 1 | Prompt file used to generate the application | `prompt.md` |
| 2 | This document presenting the deliverables | `deliverables.md` / `deliverables.docx` |
| 3 | Complete application source code | `source-code.zip` |
| 4 | Deployed application link | https://pixel-perfect-view-7651.lovable.app |

## 3. Application Features

### 3.1 Assistant Page (Home)
- Chat interface for asking workplace questions.
- Clickable suggested questions for quick testing.
- Each answer shows whether the Workplace Knowledge Tool was used.

### 3.2 Agent Monitoring Page
- Live telemetry dashboard: total requests, tool usage, direct answers,
  average response time.
- Log of recent interactions (question, tool used or not, response time).
- Metrics are browser-local demo telemetry (no database, by design).

### 3.3 Settings Page
- Agent configuration: model, temperature, tool toggle, knowledge base info.

## 4. Architecture

- **One agent** (`src/agent/officeAssistAgent.server.ts`) — runs server-side so the
  AI API key and system prompt never reach the browser.
- **One tool** (`src/tools/workplaceKnowledgeTool.ts`) — the Workplace Knowledge Tool.
- **One knowledge base** (`src/data/workplaceKnowledgeBase.ts`) — HR policies, IT
  help, office info, leave policy, benefits, working hours.
- **Server functions** (`src/services/agent.functions.ts`) connect the UI to the agent.
- **Telemetry** (`src/services/telemetry.ts`) powers the monitoring dashboard.

## 5. Tech Stack

- React 19 + TanStack Start (full-stack framework, server functions)
- TypeScript
- Tailwind CSS v4 + shadcn/ui components
- AI via a server-side AI gateway

## 6. Test Scenarios Verified

| Question | Expected behaviour | Result |
|----------|-------------------|--------|
| What is the work-from-home policy? | Tool used → up to 2 days/week with manager approval | ✅ |
| What is an AI agent? | Answered directly, no tool call | ✅ |
| What is the leave policy? | Tool used → plan 2 working days ahead, manager approval | ✅ |
| What are the office working hours? | Tool used → 9:00 AM–6:00 PM, Mon–Fri | ✅ |
| What benefits does the company offer? | Tool used | ✅ |
| Formatting check | No leftover `**` markdown symbols in answers | ✅ |

## 7. How to Run Locally

```bash
npm install
npm run dev
```

Then open http://localhost:8080 in a browser.

## 8. Deployed Application

The application is deployed and publicly accessible at:

**https://pixel-perfect-view-7651.lovable.app**
