# KnowFlow Architecture Deliverables

## Project Summary
KnowFlow is a TanStack Start/React personal knowledge application with Supabase Auth/Postgres persistence, a seeded demo corpus, and browser-side deterministic retrieval/answer composition. This index documents the checked-in implementation, not an intended or deployed production architecture.

**Live app:** [pixel-perfect-render-7188.lovable.app](https://pixel-perfect-render-7188.lovable.app/app)

## Documents

| Deliverable | Contents |
|---|---|
| [01-architecture-diagram.md](01-architecture-diagram.md) | Layers, frontend components, trust boundaries, integrations, upload and RAG sequences, decisions and risks |
| [02-agent-workflow-design.md](02-agent-workflow-design.md) | Logical agent catalog, implemented workflows, state diagrams, handoffs, failure paths and guardrails |
| [03-deployment-strategy.md](03-deployment-strategy.md) | Runtime topology, environments, configuration, build/migrations, scaling and deploy checklist |
| [04-security-model.md](04-security-model.md) | Identity, table policies, secrets inventory, data lifecycle, STRIDE threats and prioritized fixes |
| [05-monitoring-dashboard-design.md](05-monitoring-dashboard-design.md) | Metric availability, proposed dashboard layouts, instrumentation, alerts, runbooks and SQL sketches |

## Rendering Mermaid
Open a Markdown file in VS Code Markdown Preview with Mermaid support enabled, or paste the fenced diagram source into [mermaid.live](https://mermaid.live). Diagrams are descriptive architecture sketches; they are not deployment manifests.

## Assumptions and Evidence Boundaries
- Inventory is based on the repository files available in this workspace, including `package.json`, `src/routes/`, `src/services/`, `src/hooks/`, `src/lib/`, `src/integrations/`, `src/data/seed.ts`, `drizzle/migrations/`, `supabase/config.toml`, and `vite.config.ts`.
- No `.env*` values were read. Environment variable names are listed from source references only; actual deployment values, secret stores, and active environment settings were not inspected.
- `drizzle/schema.ts` is intentionally blank; the SQL migrations are treated as the authoritative schema evidence. A repo migration runner or deployed DB was not available for verification.
- `vite.config.ts` documents a Cloudflare default Nitro target via the Lovable config package; this is not proof of the currently active hosting provider.
- No storage bucket or edge-function implementation, live LLM, external embedding provider, persistent vector index, or central analytics deployment was found in the checked-in workspace.
- Fixed demo/admin credentials exist in the application source and auth UI. Their values are intentionally not reproduced in these docs.
- “Available today” metrics are available as raw application state or per-conversation records, not necessarily aggregated, complete, or production-monitored.
- Recommendations are labeled **Not implemented — recommended** and are not presented as current capabilities.

## Discovery Inventory

1. **Tech stack and versions:** TypeScript `^5.8.3`, React `^19.2.0`, TanStack Start `1.168.60`, TanStack Router `1.170.41`, TanStack Query `^5.101.1`, Vite `8.1.5`, Nitro `3.0.260603-beta`, Supabase JS `^2.117.2`, Tailwind `^4.2.0`, Drizzle Kit `^0.31.11`, Vitest `^4.1.10`. Versions are package declarations, not a lockfile/runtime verification.
2. **Pages/routes:** `/` home/index; `/auth`; `/reset-password`; authenticated `/app` dashboard; `/app/documents`, `/app/documents/$id` library/reader; `/app/collections`, `/app/collections/$id`; `/app/upload`; `/app/notes`; `/app/assistant`; `/app/search`; `/app/graph`; `/app/compare`. There are no dedicated insight, summarization, or study-question routes.
3. **Backend/data:** Supabase Postgres tables `profiles`, `user_roles`, `collections`, `conversations`, `notes`, `favorites`, `activity`, `user_documents`; migrations enable RLS with per-user policies. Seed content is static TS. Uploaded text is stored in `user_documents.sections` JSONB. No configured storage bucket or vector table/index. Server functions include `ensureDemoAccount`; auth middleware and cron-auth helpers exist, but no app edge function or wired cron route was found.
4. **AI:** `AIProvider` defaults to `MockAIProvider`; query intent/compare detection is regex/title matching; retrieval is BM25-like keyword scoring blended 50/50 with 384-dimensional hashed-token pseudo-vector cosine. No real LLM, API embeddings, or persistent vector search. Low-score results are refused; answer citations link to source chunks. Comparison uses fixed aspects. No dedicated summarization, insights, or study generation.
5. **Auth and roles:** Supabase email/password and Google OAuth via Lovable; sessions persisted in browser; client route gate plus RLS. Roles are `admin` and `user` in `user_roles`; the app only displays an Admin label and has no admin-only surface. The public demo-account server function provisions fixed demo accounts, including an admin demo.
6. **Logging/telemetry:** Server/client errors reach `console.error`; `src/lib/error-capture.ts` captures error details; root error boundary optionally calls Lovable preview reporting. `activity` tracks selected user actions (views, notes, favorites, uploads, asks) but is not operational monitoring or an audit log. No structured metrics, alert rules, or model usage data.
7. **Environment/deployment:** Names found: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_DB_MIGRATION_URL`, `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS`. `vite.config.ts` wraps Lovable's TanStack/Nitro config with Cloudflare as its documented default. Production hosting, CI/CD, secret store values, and migration execution settings are not defined in this workspace.

## Top Findings
1. The public demo provisioning function and UI expose a fixed admin demo path; it must not be treated as production authentication or administration.
2. AI is deterministic mock logic, not a live LLM; the in-app “AI” language overstates generation capability if read literally.
3. Upload “Embed/Index” stages are simulated; no persistent embeddings/vector index are stored.
4. Upload content is read in the browser and saved to Postgres JSONB with no file-size cap, rate limit, or background worker.
5. Client-side route protection does not replace database authorization; server functions need explicit identity/role checks for sensitive work.
6. `has_role` is `SECURITY DEFINER` but accepts any user id rather than enforcing the caller's own id.
7. Drizzle migration configuration points at a blank `drizzle/schema.ts`; no migration command is provided in package scripts.
8. No original-file storage bucket, upload object retention, or restore flow is configured.
9. Operational telemetry is sparse; `activity` is best-effort product history, while errors are primarily console logged.
10. No account-wide data export/delete, conversation deletion, or documented retention policy is present.
