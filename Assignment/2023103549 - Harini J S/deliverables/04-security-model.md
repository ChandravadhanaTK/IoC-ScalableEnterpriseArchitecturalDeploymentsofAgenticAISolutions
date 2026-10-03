# Security Model

## As Built

### Identity
- `src/routes/auth.tsx` supports email/password sign-in, sign-up, reset-email request, and Google OAuth through `lovable.auth.signInWithOAuth`.
- Password reset completes through `src/routes/reset-password.tsx` and Supabase `updateUser`; client input requires at least eight characters.
- `src/integrations/supabase/client.ts` persists and refreshes the Supabase browser session. `src/routes/_authenticated/route.tsx` uses `getUser()` and redirects unauthenticated users to `/auth`.
- `profiles` and `user_roles` are created by the `handle_new_user` trigger in `drizzle/migrations/0000_migration.sql`. The role enum is `admin`/`user`; new users receive `user`.
- `useIsAdmin()` calls `has_role`; `app.tsx` displays an Admin label. No admin-only route or protected admin surface was found.

### Authorization and Database Policies

| Table | RLS/policy in migrations | Client use | Notes |
|---|---|---|---|
| `profiles` | Enabled; own select/update/insert by `auth.uid() = id` | No direct app-page query found | Service role has all privileges. |
| `user_roles` | Enabled; own-row select only | `useIsAdmin()` calls `has_role` RPC | Client grants select only; role writes are service-role side. |
| `collections` | Enabled; all operations constrained to own `user_id` | `useCollections`, collection mutations | `doc_ids` is an unconstrained text array; no FK integrity. |
| `conversations` | Enabled; all operations constrained to own `user_id` | Assistant history/messages | Messages and full answer traces are stored as JSONB. |
| `notes` | Enabled; all operations constrained to own `user_id` | Reader and notes page | No FK to document/chunk. |
| `favorites` | Enabled; all operations constrained to own `user_id` | Reader | Composite PK `(user_id, doc_id)`. |
| `activity` | Enabled; all operations constrained to own `user_id` | User activity writes/reads | It is user activity, not a security audit log. |
| `user_documents` | Enabled; all operations constrained to own `user_id` | Upload, delete, and loading | `sections` JSONB stores extracted text; no binary storage. |
| Supabase Storage | No bucket or storage policy in checked-in config/migrations | No `supabase.storage` use found | Not implemented — recommended only if original files must be retained. |

All listed application tables have RLS enabled in the two SQL migrations. Actual deployed database state should still be checked against these files. `has_role(_user_id, _role)` is SQL `SECURITY DEFINER` and takes a caller-supplied user id; the client uses the current id, but the function does not itself bind the argument to `auth.uid()`.

### Server and Route Controls
- `src/start.ts` registers `attachSupabaseAuth` for server functions and CSRF middleware filtered to server functions.
- `requireSupabaseAuth` exists in `src/integrations/supabase/auth-middleware.ts`, but no use in the product server function was found. `authenticateCronRequest` is a helper with no route use found.
- `src/integrations/supabase/client.server.ts` contains the service-role client and is documented as server-only. `ensureDemoAccount` dynamically imports it within a server-function handler.
- `ensureDemoAccount` is callable from the public auth view without `requireSupabaseAuth`; it can create fixed demo users, upsert the admin role, and returns fixed credentials. The UI also renders those credentials. Treat this as an intentional demo-only exposure, not a production admin design.

### Secrets

| Name | Code location/use | Browser exposure assessment |
|---|---|---|
| `VITE_SUPABASE_URL` | `client.ts` | Public endpoint value. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts` | Deliberately browser-visible publishable key; RLS must protect data. |
| `SUPABASE_URL` | `client.ts`, `client.server.ts`, `auth-middleware.ts` | Public endpoint value; fallback behavior depends on runtime. |
| `SUPABASE_PUBLISHABLE_KEY` | Client and auth middleware | Publishable, not a privileged secret. |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` | Server-only privileged secret; not referenced by browser client module. Verify production bundling and hosting secrets. |
| `LOVABLE_DB_MIGRATION_URL` | `drizzle.config.ts` | Migration-only database connection string; must remain in operator/CI secret store. |
| `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS` | `cron-auth.ts` | Server-only values; helper is not used by an application route in checked-in code. |

This inventory is based on references in code/config. No `.env*` file was opened. A source search found no service-role key reference in ordinary UI modules, but deployment bundle scanning remains a release requirement.

### Privacy and Data Lifecycle
- Supabase stores profile name, roles, collections, notes, favorites, activity, uploaded document metadata plus extracted sections, and conversations including prompts, answers, citations, retrieval traces, and scope.
- Seed documents/concepts/relations ship in `src/data/seed.ts` and are not user uploads.
- No LLM, embedding API, or external AI provider is called; prompts and extracted content are used locally by browser TypeScript and are persisted in conversations/documents when those features run.
- Upload delete, note delete, collection delete, and favorite removal exist. No account-wide export/delete flow or conversation-delete UI was found. Retention and backup expiration are not defined in this repo.

### Input, Upload, Rendering, and Guardrails
- Upload accepts `.txt`, `.md`, and `.markdown`; text shorter than 40 characters is marked failed. No file-size cap, MIME verification, rate limit, or server-side revalidation was found. `File.text()` runs in the browser.
- `AnswerText` renders a small Markdown subset using React text nodes and citation components; it does not inject raw HTML. No general user-controlled Markdown/HTML renderer was found.
- RAG limits scope and refuses when there are no results or top score is below `0.12`; citations point to retrieved chunk ids. This is a heuristic grounding check, not claim-level verification.
- No prompt-injection detector, model safety filter, abuse rate limiter, or request quota is implemented. There is no external model today.
- Server error capture writes to `console.error`; `reportLovableError` forwards optional errors to editor-provided hooks. No structured audit/security-event pipeline is present.

### Threat Model (STRIDE)

| Threat | Asset | Mitigation in code | Residual risk | Recommendation |
|---|---|---|---|---|
| Spoofing | User identity | Supabase Auth session and `getUser()` route gate | Client route is not a security boundary; OAuth config is external | Keep DB RLS and test forged/expired sessions. |
| Tampering | User rows | Per-user RLS policies | Verify deployed policies; several app relations use unchecked string ids | Add DB constraints and RLS integration tests. |
| Repudiation | User/admin actions | `activity` logs selected user actions | No immutable admin/security audit stream; writes are user-controlled | Add server-validated security audit events. |
| Information disclosure | User data and credentials | RLS; service key is server-side by design | Public demo function exposes fixed admin account path; conversations contain prompts/content | Remove demo admin provisioning/credential disclosure from production. |
| Denial of service | Browser, DB, server function | No meaningful quota/size cap found | Large uploads and repeated calls can consume memory/DB; public demo endpoint can be abused | Enforce request/file limits and per-account/IP rate limits. |
| Elevation of privilege | Admin role | `user_roles` client select-only; service role writes | Public `ensureDemoAccount` can provision/admin-upsert fixed admin; `has_role` accepts arbitrary id | Remove public admin path; restrict and bind role RPC to caller. |

## Findings & Risks: Prioritized Fixes

| Priority | Finding | Action |
|---|---|---|
| High | Public demo server function provisions a fixed admin account and returns credentials; auth screen displays them. | Disable demo-admin path in production or remove it; require explicit server-side authorization for role assignment and rotate any exposed demo credentials. |
| High | Client route guards do not replace server/database authorization; an unused `requireSupabaseAuth` helper is not applied to `ensureDemoAccount`. | Require identity/role checks on sensitive server functions and test RLS across users. |
| High | Uploads have no size limit or rate limit and are read wholly in browser memory before storing extracted text. | Enforce server-side byte limits, quotas, and validation; consider background ingestion. |
| Medium | `has_role` is `SECURITY DEFINER` and does not bind `_user_id` to `auth.uid()`. | Restrict execute grants and/or validate the caller id in the function. |
| Medium | No account export/delete or conversation-delete workflow; retention policy is absent. | Define retention and add account data export/deletion lifecycle. |
| Medium | `notes`, `collections.doc_ids`, and activity/document ids have no relational FK constraints. | Add validated constraints where compatible and cleanup behavior. |
| Low | `activity` records selected product actions but is not a tamper-resistant audit log. | Separate product analytics from security audit records. |

## Recommended Improvements
- **Not implemented — recommended:** Add server-side authorization, file validation/limits, rate limiting, and security tests before production scale.
- **Not implemented — recommended:** Document data retention, export, deletion, backup, and external AI disclosure policies before adding any LLM provider.
