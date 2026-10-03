# PULSE Security Model

## Scope and Status

This is an MVP security review based on the checked-in code. It is not a penetration test, compliance attestation, or guarantee of security. Each row separates current behavior from remaining work.

## Assets and Trust Boundaries

- Account credentials, JWTs, profile settings, and social graph.
- Workout titles, notes, exercises, sets, weights, and training history.
- The Gemini API key and PostgreSQL/JWT configuration secrets.
- Browser-local in-progress workout draft.
- User chat text sent from the API to the external Gemini service.
- Trust boundaries: browser, public Nginx/frontend origin, Express API, PostgreSQL network, and Google Gemini API.

## Control Matrix

| Area | Implemented | Gap / recommendation |
|---|---|---|
| Password storage | Passwords are hashed with bcrypt (`10` cost in auth route). | Registration accepts a 6-character minimum; consider stronger password policy and breached-password checks. |
| Session authentication | JWT is signed for 7 days; API accepts an HTTP-only cookie or bearer token. | `auth.ts` and `middleware/auth.ts` both fall back to a hard-coded JWT secret. Fail closed in production and centralize required secret loading. |
| Cookie flags | `httpOnly`; `secure` defaults from `NODE_ENV` and can be overridden; SameSite is `lax` or `none`. | Cross-site mode requires HTTPS and `Secure`. Add CSRF defenses for cookie-authenticated state changes, especially if cross-site deployment is used. |
| Token response | Authentication sets a cookie. | Register/login also return the JWT in the JSON body. Remove the body token if no supported client requires it. |
| Authentication rate limit | Auth endpoints are limited to 30 requests per IP per 15 minutes. | This is an in-memory limiter; it is not shared across multiple API replicas. |
| Coach rate limit | Coach endpoint requires auth and limits each user to 12 requests/minute. | Add provider spend/quota alerts and a global IP/service limit; the current limiter is in-memory. |
| Input validation | Zod limits coach history to 1-16 messages and 2,000 characters per message. Other routes have route-specific schemas. | Review all API routes for consistent size, pagination, and validation limits. |
| Workout privacy | Helper checks owner, shared status, profile visibility, and follower relationship. | Add integration tests covering private profiles, private workouts, anonymous access, and all social endpoints. |
| Gemini secret | API reads `GEMINI_API_KEY`; browser sends messages only to the app API. | Ensure host configuration and build logs never print the secret. Rotate any key that has appeared in a chat or repository. |
| AI privacy | The API sends the supplied conversation turns to Gemini; it does not fetch workout records for the prompt. | Tell users chat text goes to Gemini. Avoid collecting unnecessary health details; define provider/data retention expectations before public use. |
| Prompt guardrails | Server system instruction says no diagnosis/treatment, recommends qualified professionals for concerns, and limits claims of capabilities. | Model instructions are not a deterministic safety filter. Add prompt regression tests, monitor errors/safety signals, and keep tools disabled unless separately authorized. |
| CORS | Credentials are enabled and `CLIENT_URL` is configurable. | Localhost origins are also allowed unconditionally. Restrict production origins explicitly; test CORS and cookie behavior on the deployed domains. |
| Browser draft | Active workout is stored in `localStorage`. | It is readable by same-origin JavaScript, may survive logout, and is not namespaced by account. Clear or isolate drafts on account changes and treat XSS as a data exposure risk. |
| Database | PostgreSQL is on the private Compose network and uses a persistent volume. | Do not publish the DB port publicly. Configure backup/restore, least-privilege DB credentials, retention, and reviewed migrations. |
| Audit | No dedicated audit log is present. | Add privacy-preserving audit events for auth, privacy changes, workout mutations, and administrative actions. Never log passwords, API keys, JWTs, or raw chat by default. |

## Identity and Authorization

**Implemented:** `authenticateToken` verifies JWT signature/expiry and attaches user identity. Workout routes use the authenticated user ID for ownership; privacy helpers constrain visibility of shared workouts and profiles. Auth failures return `401` for a missing token and `403` for invalid/expired tokens.

**Review requirement:** Authorization must stay in API queries/handlers, not only in UI visibility. Include negative tests for direct URL/API access to another user's private workout and profile data.

## AI Boundary and Guardrails

The API validates the incoming history, applies a server-side instruction, calls Gemini over HTTPS, and returns extracted text. The key is not sent to the frontend. The API currently does not pass database workout history, define model tools, or perform a deterministic pre/post safety classification. Chat content is still sent to Google's service, so it must not be treated as local-only data.

The assistant should not diagnose or treat injury, claim professional credentials, claim private-data/tool access, or state that it made workout changes. See `workout-coach-system-prompt.md` for the current prompt and a regression checklist.

## Priority Recommendations Before Public Use

1. Remove hard-coded JWT fallbacks and fail startup if `JWT_SECRET` is missing or weak in production.
2. Do not return the JWT in response JSON when the HTTP-only cookie is sufficient.
3. Restrict production CORS to configured origins and add CSRF protection for cross-site cookie deployments.
4. Add tests for ownership/privacy and coach request/provider failures.
5. Use reviewed Prisma migrations and define a database backup/restore process.
6. Add privacy-preserving operational logs/metrics and alerting without storing raw prompt content by default.
