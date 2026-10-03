# Deployment Strategy

## Current deployment
- App: https://cuddly-connect-app.lovable.app
- Runtime/hosting: Lovable-hosted TanStack Start application
- Identity and data: Supabase
- Agent AI: Lovable AI gateway, server-side

## Release steps
1. Install locked dependencies with Bun.
2. Configure Supabase and AI values in hosting secrets.
3. Apply SQL migrations in `SourceCode/supabase/migrations/`.
4. Build using `bun run build` and deploy through Lovable or a compatible TanStack Start host.
5. Smoke-check landing, authentication, dashboard, records, upload, alerts, and workflow status.
6. Verify RLS coverage and server-only AI configuration in production.

Keep a previous healthy deployment for rollback. Apply reviewed migrations and back up data before destructive changes. If AI is unavailable, retain user data and surface retryable errors. `.env.example` lists variable names only; production values belong in hosting settings.
