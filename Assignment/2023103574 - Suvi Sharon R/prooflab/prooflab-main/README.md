# ProofLab — From Idea to Evidence

ProofLab is a technology idea analysis agent. Enter an idea; the agent runs it through nine stages and produces a structured report.

## How the agent works
The browser orchestrates the workflow (`src/hooks/use-analysis.ts`). Each stage is a separate server call (`runStage`) that sends the idea plus the findings of earlier stages to the AI and gets structured JSON back.

1. Idea Understanding (may mark later stages as not applicable → skipped)
2. STAR Analysis
3. Pros & Cons
4. Existing Work (each item labelled *known* or *uncertain*)
5. Feasibility
6. Research Gap (phrased as *potential* gaps)
7. Simulation — the AI only proposes assumptions; numbers are computed deterministically in `src/lib/simulation.ts`
8. Architecture (Input → Processing/AI → Storage/Services → Output)
9. Final Report

Only concise findings are shown, never private reasoning. Users are reminded to verify results.

## Project structure
```
src/lib/ai.server.ts            AI gateway call (server only)
src/lib/agent/types.ts          Stage list and result types (shared)
src/lib/agent/prompts.server.ts One prompt per stage (server only)
src/lib/agent/agent.functions.ts runStage server function (input validated with zod)
src/lib/simulation.ts           Deterministic simulation (+ test)
src/lib/history.ts              History in browser localStorage
src/hooks/use-analysis.ts       Agent orchestrator
src/components/prooflab/        Timeline, report tabs, history list
src/routes/index.tsx            Main page
```

## Environment variables
- `LOVABLE_API_KEY` — server-side only, provided automatically by Lovable. Never exposed to the browser.

## Run locally
```
bun install
bun run dev
bunx vitest run
```

## Deploy
Click **Publish** in Lovable.
