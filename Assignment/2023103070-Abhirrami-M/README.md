# ResearchMate

## Project Overview
ResearchMate is an Agentic AI Research Paper Assistant (IoC capstone). Enter a research question; six agents find, validate, rank and analyze real scholarly papers.

## Problem Statement
Finding relevant, trustworthy papers is slow, and generic chatbots often invent citations.

## Solution
A multi-agent pipeline that retrieves only real records from OpenAlex, validates and ranks them with an explainable score, and uses AI only to summarize supplied abstracts — with a deterministic fallback.

## Agentic AI Workflow
User → Planner → Search → Validation → Ranking → Analysis → Synthesis → Final Report

## Features
- Live agent status panel
- Real papers with DOI "View Paper" links
- Relevance score with breakdown
- Per-paper summary, contribution, finding, limitation
- Research Summary synthesis and comparison table
- Friendly error handling and AI fallback

## Technology Stack
React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Start (server functions), Lovable AI Gateway.

## Scholarly APIs
OpenAlex Works API (`https://api.openalex.org/works`). Crossref not implemented.

## Architecture
See `capstone-deliverables/01-ARCHITECTURE-DIAGRAM.md`.

## How to Run
```bash
bun install
bun run dev
```

## Environment Variables
- `LOVABLE_API_KEY` (server-only, optional) – enables AI analysis. Without it the app uses the deterministic fallback.

## Deployment
Published via Lovable. See `DEPLOYED-LINK.md` and `capstone-deliverables/03-DEPLOYMENT-STRATEGY.md`.

## Capstone Deliverables
`capstone-deliverables/` – 01 Architecture, 02 Agent Workflow, 03 Deployment, 04 Security, 05 Monitoring, plus combined `CAPSTONE-DELIVERABLES.md`. Master prompt: `PROMPT.md`.

## Project Structure
```text
src/
  components/SiteHeader.tsx
  lib/agents.ts               # Planner, Search, Validation, Ranking + fallbacks
  lib/analysis.functions.ts   # Analysis & Synthesis (server, AI)
  routes/index.tsx            # Research page + orchestrator
  routes/agent-workflow.tsx
  routes/capstone-deliverables.tsx
  routes/about.tsx
capstone-deliverables/
PROMPT.md  README.md  DEPLOYED-LINK.md
```

## Limitations
- Analysis relies on abstracts; many records lack them.
- Ranking is keyword-based, not semantic.
- OpenAlex public rate limits apply; no caching.

## Future Enhancements
Crossref/Semantic Scholar sources, semantic embeddings ranking, saved sessions, export to BibTeX, live monitoring dashboard.
