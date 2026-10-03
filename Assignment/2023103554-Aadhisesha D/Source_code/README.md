# PlacementPilot

PlacementPilot is a stateless, multi-agent AI assistant for campus placement preparation with a guided, single-page placement journey.

## What it does

Give it:
- a resume
- a target job description
- a career goal

It orchestrates specialized agents to produce:
- structured resume intelligence
- target-role analysis
- skill-gap analysis
- interview questions
- a seven-day preparation plan
- a transparent agent execution trace

## Why it is stateless

There is intentionally no database. The serverless runtime is ephemeral, while the browser keeps session history in localStorage. This reduces infrastructure and makes deployment simple for a course assignment.

## Stack

- React + Vite + TypeScript
- Custom CSS design system
- Vercel serverless functions
- Gemini API (`gemini-2.5-flash` by default)
- pdfjs-dist for local PDF text extraction
- localStorage for session persistence

## Run locally

```bash
npm install
cp .env.example .env
npm run dev:full
```

On Windows PowerShell:

```powershell
npm run dev:full
```

Set `GEMINI_API_KEY` in the server-side `.env` file. All placement analysis, question generation and answer evaluation requests are sent to Gemini.
Run `npm run test:gemini` for the live Gemini integration and end-to-end workflow check.

## Build

```bash
npm run build
```

## Deploy

Push to GitHub, import into Vercel, and add `GEMINI_API_KEY` as a server-side environment variable. See `docs/DEPLOYMENT.md`.

## Frontend design direction

The UI was redesigned using the Taste Skill direction: a high-motion, dark-tech workspace with strong typography, asymmetric hero composition, one locked accent color, intentional motion, and complete interactive states. See `.agents/skills/design-taste-frontend/README.md`.

## UI direction

The current build is a single-page, minimal career intelligence workspace. The user moves from role analysis → personal analytics → role analysis → mock test → mock interview → agent trace without a sidebar. Motion is restrained and used to communicate state.

Taste Skill reference: `design-taste-frontend` from Leonxlnx/taste-skill. Official install command:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

## Assignment documents

- `docs/ASSIGNMENT_PROMPT.md` — detailed build prompt
- `docs/ARCHITECTURE.md` — architecture and agent design
- `docs/DEPLOYMENT.md` — local and Vercel deployment
- `SUBMISSION.md` — submission/demo checklist


## UX model

The main application uses a single continuous page instead of a persistent sidebar. The flow is intentionally sequential: placement snapshot → role intelligence → preparation priorities → assessment map → example questions → role training → mock interview. A compact sticky progress bar tracks the current chapter, while each chapter includes Continue and Skip actions so students can move through the experience without manually searching for the next step.

The visual system uses a restrained light palette with section-specific accent families, editorial spacing, subtle borders, and motion only where it communicates hierarchy, progress, navigation, or state.
