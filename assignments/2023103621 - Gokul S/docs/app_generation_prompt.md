# MVP App Generation Prompt

You are a senior full-stack engineer and product-minded UI designer. Build a complete, usable MVP for **PULSE**, a social workout tracker, in the current workspace. Implement the application, run its checks, fix issues caused by your work, and document how to run and deploy it. Do not stop at a plan, mockup, or code snippets.

## Product Goal

Help gym-goers log strength workouts, review progress, and share training with a small fitness community. The first screen after sign-in should be the usable app, not a marketing landing page.

## MVP Workflows

1. **Accounts and demo access**
   - Register, sign in, sign out, and restore the authenticated session.
   - Hash passwords and use secure, HTTP-only cookies for authentication.
   - Provide a one-click demo account with seeded users, exercises, and workouts.

2. **Workout logging**
   - Start, resume, and finish a workout; name it and optionally add notes.
   - Add exercises and record multiple sets with weight, reps, and Normal/Warmup/Drop set types.
   - Show the user's previous performance for the selected exercise, support editing/removing sets, and include a rest timer.
   - Preserve an unfinished workout draft in local storage and restore it after refresh.
   - Allow each completed workout to be shared or kept private.

3. **History, calendar, and progress**
   - Show the signed-in user's paginated workout history with filtering by title, notes, or exercise.
   - Open a workout detail view; support editing and deleting the user's own workouts.
   - Show a monthly training calendar, workout counts, and volume totals, with a way to inspect a day's workouts.
   - Provide per-exercise charts for max weight, volume, and estimated one-rep max when sufficient history exists.

4. **Community and profiles**
   - Show a feed of workouts shared by the signed-in user and people they follow.
   - Support likes and short comments on shared workouts.
   - Search people and exercises; follow/unfollow users.
   - Show a profile with workout count, total volume, training streak, followers/following, and recent shared workouts.
   - Respect public/private profile settings and per-workout sharing; never expose private workouts through search, profiles, or feeds.

5. **Workout Coach**
   - Add a floating, responsive chat entry point with suggested questions, loading/error states, and multi-turn conversation in the current session.
   - Use the Gemini REST API from the server only. Read `GEMINI_API_KEY` and `GEMINI_MODEL` from environment variables; default to `gemini-3.5-flash-lite`.
   - Never send the provider key to the browser, commit it, print it, or include it in error messages. Validate message count and size, authenticate requests, and rate-limit usage.
   - Give concise evidence-informed exercise and training guidance. Do not diagnose or treat injuries; direct users with pain or medical concerns to a qualified healthcare professional.
   - If the key is missing or the provider is unavailable, show a clear, honest status and allow retry. Do not fake an AI response.

## Technical Requirements

- Use a TypeScript monorepo with a React + Vite frontend and a Node.js + Express API.
- Use Tailwind CSS and Lucide icons; use Recharts for progress charts where chart data exists.
- Use Prisma with **PostgreSQL as the single database provider** for local Docker and deployment. Keep the Prisma schema, migrations, seed process, and Compose database configuration consistent.
- Validate API input with Zod. Add pagination and appropriate indexes to database queries.
- Use secure password hashing, HTTP-only cookies, production-safe cookie settings, CORS restricted to configured origins, and rate limits for authentication and AI requests.
- Keep frontend API calls behind one typed API client. In production, route `/api` to the API through a documented reverse proxy or a production web server; do not rely on Vite's development proxy.
- Keep secrets in environment variables. Commit only an `.env.example` with placeholders.
- Follow the repository's existing conventions when extending an existing project. Preserve unrelated user changes and avoid unnecessary dependencies or abstractions.

## Required Deliverables

- Complete frontend and backend source for the workflows above, with responsive layouts and usable loading, empty, success, and error states.
- Prisma schema, migration workflow, and deterministic seed data for demo access.
- `.env.example` listing every required variable, with safe placeholder values only.
- Dockerfiles for the API and web app, plus a Docker Compose setup for the web app, API, and persistent PostgreSQL database. Include service health checks and a documented migration/startup sequence.
- Tests for critical API behavior: authentication, workout ownership/privacy, workout creation/history, and AI request validation/provider error handling. Add focused frontend tests for key interactions where practical.
- A README with prerequisites, local setup, demo login, tests, environment configuration, database migrations, and production deployment steps.

## Definition of Done

- A new developer can follow the README to start the app and sign in with the demo account.
- The complete workout flow works: start, log sets, refresh and resume, finish, and find the workout in history and calendar.
- Privacy and ownership are enforced by the API, not just hidden in the UI.
- The coach works when a valid Gemini key is configured and fails gracefully when it is not.
- Frontend and API production builds pass; tests pass; Docker Compose starts a consistent database/API/web stack.
- No feature relies on hard-coded secrets, fake data presented as live results, or development-only routing in production.
- Report the commands run, their results, any remaining limitations, and the local URL when starting the dev server.
