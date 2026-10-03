# DevPulse

DevPulse is a role-based ticket management system with a strict server-enforced workflow, comments, activity history, and admin tools.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/devpulse run dev` — run the DevPulse web app
- `pnpm --filter @workspace/api-server run seed` — add demo users and sample tickets
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: Replit-provided `DATABASE_URL` and Replit Secret `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/devpulse` — React/Vite user interface
- `artifacts/api-server` — Express API, authentication, role checks, and ticket workflow
- `artifacts/api-server/schema.sql` — PostgreSQL schema reference
- `lib/db/src/schema` — Drizzle database source of truth
- `lib/api-spec/openapi.yaml` — API source of truth; generated client and validation schemas live in `lib/api-client-react` and `lib/api-zod`

## Architecture decisions

- Uses the project's built-in PostgreSQL database (selected instead of the brief's MySQL requirement) so the app runs without an external database service.
- JWTs are stateless, expire after seven days, and are checked against the current user record on each request so role changes take effect immediately.
- Passwords use bcrypt-compatible hashing with a cost factor of 12.
- Ticket status transitions, assignment permissions, and reporter ownership are enforced by the API, not trusted to frontend visibility.

## Product

Users can register as reporters, create and track tickets, comment, and view ticket history. Developers can self-assign and advance their tickets. Admins manage assignments, priority, ticket deletion, and user roles.

## User preferences

- Keep the requested DevPulse ticket statuses, priorities, roles, and workflow transitions.

## Gotchas

- Re-run API code generation after changing `lib/api-spec/openapi.yaml`.
- After changing Drizzle schema files, run `pnpm --filter @workspace/db run push` against development.
- Seed accounts use `DEVPULSE_DEMO_PASSWORD` if set, otherwise `DevPulseDemo!2026`; seeding never resets existing account passwords.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
