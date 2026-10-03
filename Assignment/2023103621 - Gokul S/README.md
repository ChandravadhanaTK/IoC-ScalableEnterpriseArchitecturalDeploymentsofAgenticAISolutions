# Pulse - Social Gym Workout Tracker

A full-stack social gym workout logging platform modeled after Hevy. Log workouts, track trained days on a monthly calendar, view exercise progress, and share your workout achievements with followers in a social feed.

## Features

- **Auth**: Secure JWT in httpOnly cookies with bcrypt password hashing & guest instant-demo mode.
- **Log Workout**: Interactive set logging with previous numbers display, set types (Normal, Warmup, Drop), rest timer widget, and offline draft persistence via `localStorage`.
- **Calendar View**: Monthly calendar grid highlighting trained days, total monthly volume, and quick inspection of daily workouts.
- **Social Feed**: See workouts shared by users you follow with likes and comments support.
- **Exercise Progress & Analytics**: Visual charts for max weight, volume, or 1RM over time per exercise.
- **Profile & Social**: Streak counter, total volume, workout count, followers/following list, and follow/unfollow functionality.
- **Search Users & Exercises**: Fast search for built-in/custom exercises and fitness community members.
- **Privacy Controls**: Public/Private profile settings and per-workout share toggles.
- **Workout Coach**: Ask an AI assistant about training, exercise technique, programming, and recovery.

## Tech Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Lucide Icons, Recharts, TanStack Query.
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, Zod validation.
- **Database**: PostgreSQL with a persistent Docker volume.

## Quick Start

### Docker Demo / Deployment

1. If `.env` does not exist, copy `.env.example` to `.env`. Otherwise, merge its settings without overwriting existing secrets. Replace `POSTGRES_PASSWORD` and `JWT_SECRET` with strong, URL-safe values; add `GEMINI_API_KEY` to enable the Workout Coach.
2. Build and start the full stack:
```bash
docker compose up --build -d
```
The API automatically adds any missing built-in exercises without deleting existing accounts or workouts.
3. On a fresh database only, optionally add the demo account, sample workouts, and social data:
```bash
docker compose exec api npm run db:seed
```
The full demo seed script clears and recreates all database records. Do not run it after users have created data. The automatic exercise-catalog initializer is safe to run on every API start.
4. Open `http://localhost:8080`. The web container serves the frontend and proxies `/api/*` to the API; the API and database are not exposed publicly.

### Local Source Development

1. Copy `.env.example` to `.env` only if it does not already exist; otherwise, merge the PostgreSQL settings without overwriting existing secrets. Then start PostgreSQL:
```env
docker compose up -d db
```
2. Copy `apps/api/.env.example` to `apps/api/.env` only if it does not already exist; otherwise, update its settings while preserving existing secrets. Keep its database credentials aligned with the root `.env`; add the Gemini key there for local API development.
3. Install dependencies, generate Prisma Client, and seed the local database:
```bash
npm run setup
```
4. Run the API and Vite development servers:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`

## Production Deployment

The Compose stack is suitable for a VPS or host that supports Docker Compose. Put an HTTPS reverse proxy/load balancer in front of the web port for a public deployment. Configure the following values in `.env`:

- Set `CLIENT_URL` to the exact public frontend origin and `COOKIE_SECURE=true` when serving the app over HTTPS.
- Keep `VITE_API_BASE_URL=/api` for the bundled same-origin Nginx proxy. If hosting the frontend separately, set it at frontend build time to the API HTTPS origin (without `/api`) and set API `CLIENT_URL` to the frontend origin.
- For cross-site frontend/API deployments, use HTTPS and set `COOKIE_SAME_SITE=none` plus `COOKIE_SECURE=true`.
- Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.5-flash-lite` on the API service only. Never expose the Gemini key as a frontend variable.
- `DATABASE_URL` is assembled by Compose from the PostgreSQL variables. PostgreSQL data persists in the `postgres_data` volume. The API runs `prisma db push` at startup for this MVP deployment.

When environment values change, rebuild the frontend and restart the API. `VITE_API_BASE_URL` is embedded in the frontend build; API secrets are read at runtime.
