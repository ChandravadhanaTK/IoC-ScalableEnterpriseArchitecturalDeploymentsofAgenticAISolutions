# BillPilot

BillPilot is a subscription and bill management application with authenticated bill/subscription tracking, upload workflows, alerts, and agent workflow visibility.

**Live:** https://cuddly-connect-app.lovable.app

## Stack
React 19, TypeScript, TanStack Start/Router, Supabase Auth/Postgres/RLS, and Lovable AI gateway. The deployed implementation uses TanStack Start server functions and Supabase; it does not have a separate FastAPI service.

## Local setup
Requires Bun and a configured Supabase project. Copy `.env.example` to `.env`, provide your own project values, run `bun install`, then `bun run dev`. Apply migrations under `supabase/migrations/`. Use `bun run build` for a production build. Never commit `.env` or expose server-only credentials in browser variables.

## Layout
- `src/routes/`: landing, auth, dashboard, bills, subscriptions, alerts, upload, and workflow pages
- `src/lib/agents.ts`: agent definitions
- `src/lib/workflow.*`: orchestration and server functions
- `src/integrations/supabase/`: auth and database integration
- `supabase/migrations/`: schema and policies
