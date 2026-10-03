# Armor Forge — Source Code

**Live Application:** `https://cosmic-sunflower-a0b649.netlify.app/`

Armor Forge is a colorful, cinematic AI-engineering workshop where learners progress through 12 mission chapters, from Python fundamentals to agentic AI.

## Features

- Cinematic Forge Protocol landing page
- 12-stage AI engineering campaign
- Interactive learning concepts
- Knowledge matching game
- In-browser Python editor and execution
- Pyodide Web Worker execution
- Test submission and result feedback
- Progress and XP tracking
- 3D armor workshop using Three.js/FBX
- Searchable AI/engineering glossary
- Mock API with replaceable HTTP API client
- OpenAPI backend contract
- Responsive and reduced-motion-aware UI

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Motion
- CodeMirror
- Pyodide
- Three.js
- Recharts
- Lucide React
- Zod
- Vitest

## Run locally

```bash
npm install
npm run dev
```

## Check the project

```bash
npm run typecheck
npm test
npm run build
```

## Environment

Copy `.env.example` to `.env` if needed.

```env
VITE_API_MODE=mock
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The default mock mode requires no backend.

For an HTTP backend:

```env
VITE_API_MODE=http
VITE_API_BASE_URL=https://your-api.example.com/api/v1
```

## Deployment

The project includes `vercel.json` with an SPA rewrite so deep routes such as `/map`, `/progress`, and `/level/1` resolve correctly after refresh.

## Security

Do not put secrets in `VITE_*` variables. Client-side UI checks are not a security boundary. Authentication, authorization, code-execution isolation, guardrails, audit logging, and LLM credentials must be enforced server-side in a production deployment.

## Submission Deliverables

- `Application_Build_Prompt.md` — application generation prompt
- `Capstone_Deliverables.md` — architecture, agent workflow, deployment, security, and monitoring deliverables
- Complete application source
- `docs/openapi.yaml` — backend contract
- `.env.example` — safe environment-variable template

## Live URL

Replace the placeholder at the top of this file with the deployed application URL before submitting.
