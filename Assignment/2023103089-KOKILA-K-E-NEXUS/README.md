# NEXUS — Multi-Agent AI Productivity Platform

---

## What is NEXUS?

Most people I know use at least 4 or 5 different apps just to stay organized — Todoist for tasks, Notion for notes, Google Calendar for events, some random app for weather, and maybe a wiki for knowledge. Every time you switch between them, you lose context and momentum.

NEXUS is my attempt to fix that. It's a single web platform where you just type what you need in plain English, and six specialized AI agents take care of the rest. One interface. One dashboard. Everything in sync.

The idea is simple — instead of building one giant AI that tries to do everything, each agent is a specialist. The Router Agent reads your intent and hands it off to whoever is best suited. It's the same reason a hospital has different doctors instead of one person doing everything.

---

## The Problem It Solves

- You waste time switching between apps that don't talk to each other
- Most productivity tools have steep learning curves or rigid workflows
- AI assistants are either too generic or locked to one domain
- There's no single place that shows you tasks, notes, events, and knowledge together

NEXUS addresses all of this by giving you a conversational interface backed by a real multi-agent system, with a live dashboard that reflects everything in one view.

---

## How It Works

When you type a command like `add task finish the report by Friday`, here's what actually happens:

1. The frontend sends your message to `POST /ai-command` on the FastAPI backend
2. The Router Agent parses the intent using rule-based matching first (fast, no API cost)
3. If it's a known command, it routes directly to the right agent — Task, Notes, Calendar, Knowledge, or Weather
4. If it's ambiguous or conversational, it falls back to Gemini 1.5 Pro for a smart response
5. The result comes back to the frontend, updates the UI, and syncs the dashboard

The frontend also has a full offline fallback — if the backend isn't reachable, everything still works using local state in the browser.

---

## The 6 Agents

| Agent | Endpoint | Responsibility |
|---|---|---|
| Router Agent | `POST /ai-command` | Parses intent, dispatches to the right specialist |
| Task Agent | `POST /add-task` | Creates, tracks, and manages tasks with priority + due date |
| Notes Agent | `POST /add-note` | Saves and organizes notes with timestamps |
| Calendar Agent | `POST /add-event` | Schedules events with date and time |
| Knowledge Agent | `POST /add-knowledge` | Stores tagged knowledge items for later retrieval |
| Weather Agent | `GET /weather` | Returns current weather data for the dashboard |

---

## Tech Stack

**Frontend**
- Vanilla HTML, CSS, JavaScript — no framework, no build step
- Three.js for the 3D animated hero section
- Google Fonts — Syne (display), Space Mono (mono), DM Sans (body)
- LocalStorage for auth and offline state persistence

**Backend**
- Python 3.11 with FastAPI
- Uvicorn as the ASGI server
- Google Generative AI SDK (`google-generativeai`) — Gemini 1.5 Pro
- Pydantic v2 for request validation
- In-memory state (easily swappable with a real database)

**Infrastructure**
- Docker for containerization
- Google Cloud Run for serverless deployment
- Environment variables for secrets management

---

## Project Structure

```
nexus-ai/
├── index.html          ← All HTML — structure and modal markup
├── style.css           ← Complete stylesheet, responsive, dark theme
├── script.js           ← Frontend logic, API calls, auth, offline fallback
├── main.py             ← FastAPI app — all 6 agent endpoints
├── requirements.txt    ← Pinned Python dependencies
├── Dockerfile          ← Production-ready container config
├── .dockerignore       ← Keeps the image lean
├── .env.example        ← Template for environment variables
├── .gitignore          ← Keeps secrets out of git
└── README.md           ← You're reading it
```

---

## Local Setup — Step by Step

### Prerequisites

Make sure you have these installed before starting:

- Python 3.10 or higher — check with `python --version`
- pip — comes with Python

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/nexus-ai.git
cd nexus-ai
```

### Step 2 — Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, the Gemini SDK, and Pydantic. Should take under a minute.

### Step 3 — Start the server

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 4 — Open the app

Go to `http://127.0.0.1:8000` in your browser. That's it.

The server serves the frontend directly, so there's no separate step to open the HTML file.

---

## Chat Commands

Once the app is open, try these in the chat:

```
add task [name]          creates a task, routed to Task Agent
add note [content]       saves a note, routed to Notes Agent
schedule [event name]    adds a calendar event
show tasks               lists all your active tasks
show notes               shows how many notes you have
weather                  pulls current weather data
help                     shows all available commands
```

Anything outside these patterns gets sent to Gemini for a natural language response.

---

## API Reference

All endpoints are available at `http://127.0.0.1:8000` when running locally.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/` | — | Serves the frontend |
| GET | `/health` | — | Server + Gemini status |
| POST | `/ai-command` | `{ "command": "..." }` | Main router — handles all natural language |
| POST | `/add-task` | `{ "name", "priority", "due" }` | Add a task directly |
| GET | `/tasks` | — | Get all tasks |
| PATCH | `/tasks/{id}/toggle` | — | Toggle task done/undone |
| DELETE | `/tasks/{id}` | — | Delete a task |
| POST | `/add-note` | `{ "title", "content" }` | Save a note |
| GET | `/notes` | — | Get all notes |
| POST | `/add-event` | `{ "title", "date", "time" }` | Add a calendar event |
| GET | `/events` | — | Get all events |
| POST | `/add-knowledge` | `{ "title", "content", "tags" }` | Store a knowledge item |
| GET | `/knowledge` | — | Get all knowledge items |
| GET | `/weather` | — | Get current weather |

---

## Deployment on Google Cloud Run

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated — [install guide](https://cloud.google.com/sdk/docs/install)
- Docker installed locally

### Step 1 — Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 2 — Enable required APIs

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Step 3 — Build and push the container

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/nexus-ai
```

### Step 4 — Deploy to Cloud Run

```bash
gcloud run deploy nexus-ai \
  --image gcr.io/YOUR_PROJECT_ID/nexus-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 5 — Get your URL

Cloud Run will print a service URL like `https://nexus-ai-abc123-uc.a.run.app`. That's your live deployment link.

---

## Auth System

NEXUS has a frontend auth system built with localStorage:

- Sign up with name, email, and password
- Email is validated against a whitelist of real providers (gmail, yahoo, outlook, icloud, protonmail, etc.)
- Passwords must be at least 6 characters
- After login, the nav shows your name and avatar initial
- Clicking the avatar logs you out
- All accounts persist in the browser's localStorage

This is a frontend-only auth system — suitable for demos and hackathons. For production, replace it with a proper backend auth system (JWT + database).

---

## Future Scope

There's a lot of room to grow this. Here's what I'd build next:

**Real database** — Right now state lives in memory and resets on server restart. Swapping in PostgreSQL or MongoDB would make it production-ready.

**Persistent auth** — Move auth to the backend with JWT tokens, bcrypt password hashing, and a proper user table.

**Agent memory** — Give each agent context about past interactions so it can say things like "you usually schedule standups at 10am" or "you have 3 overdue tasks".

**Voice input** — The Web Speech API would let you talk to the agents instead of typing, which is a natural fit for a productivity assistant.

**Mobile app** — The UI is responsive but a native mobile app with push notifications for task reminders would be genuinely useful.

**Real weather API** — Replace the mock weather data with a live call to OpenWeatherMap or WeatherAPI based on the user's location.

**Collaboration** — Multi-user workspaces where a team shares the same task board and knowledge base.

**Gemini function calling** — Instead of rule-based routing, use Gemini's native function calling to let the model decide which agent to invoke and with what parameters.

---

## License

© 2026 NEXUS AI. All rights reserved.
