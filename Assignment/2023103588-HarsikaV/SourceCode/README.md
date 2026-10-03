# CampusFix AI

CampusFix AI is a smart campus maintenance application for reporting, tracking, and resolving facilities issues across a university or campus. It includes multi-agent AI triage, role-based access control, maintenance assignment, and an approval workflow for high-risk tickets.

## Features

- Student and staff issue reporting.
- AI-assisted categorization, prioritization, assignment, and resolution suggestions.
- Rule-based fallback when no LLM key is available.
- JWT-based authentication and role authorization.
- SQLite-backed ticketing and audit records.
- Maintenance dashboards for assigned work and resolution notes.
- Admin analytics, approvals, team management, and audit log visibility.
- Frontend built with React, Vite, TypeScript, and Tailwind CSS.

## Architecture overview

- FastAPI backend handles authentication, tickets, admin approvals, analytics, and notifications.
- SQLAlchemy models drive storage in SQLite.
- Agent workflow: Triage → Priority → Assignment → Resolution → Notification.
- Optional LLM service checks `OPENAI_API_KEY` and falls back automatically on failure.

## Tech stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite, JWT, Pydantic
- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide icons
- AI: rule-based deterministic engine with optional OpenAI-compatible LLM path

## Project structure

```text
SourceCode/
├── backend/
│   ├── agents/
│   ├── api/
│   ├── database/
│   ├── models/
│   ├── services/
│   └── main.py
├── frontend/
├── tests/
├── .env.example
├── requirements.txt
├── README.md
├── .gitignore
└── campusfix.db  (generated locally)
```

## Setup

1. Navigate to the SourceCode folder.
2. Create a virtual environment if desired.
3. Install backend dependencies:

```bash
pip install -r requirements.txt
```

4. Copy the sample environment file:

```bash
copy .env.example .env
```

5. Update the environment variables if needed.

## Run backend

```bash
cd SourceCode
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Run frontend

```bash
cd SourceCode/frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Environment variables

```env
DATABASE_URL=sqlite:///./campusfix.db
JWT_SECRET_KEY=change-this-in-production
OPENAI_API_KEY=
```

## Demo users

The app seeds demo accounts automatically on startup.

- admin / Admin123! 
- maintenance / Maintenance123!
- staff / Staff123!
- student / Student123!

## Example workflow

1. A student reports a Wi-Fi problem in a lab.
2. The triage agent identifies the issue as Network.
3. The priority agent rates it as Medium or High depending on impact.
4. The assignment agent selects the IT Support team.
5. The resolution agent suggests troubleshooting steps.
6. If the ticket is High or Critical, it waits for admin approval before final assignment.
7. The notification agent creates updates for the relevant users.

## How the agent system works

The orchestrator runs a deterministic multi-step pipeline:

- Triage: classify the issue using keyword scoring.
- Priority: evaluate safety, impact, urgency, and disruption.
- Assignment: map the category to a maintenance team.
- Resolution: generate actionable steps.
- Notification: send status updates to ticket participants.

## How the fallback works

If no `OPENAI_API_KEY` is present, or if the LLM call fails, the app automatically uses rule-based logic. This ensures it still works with deterministic, explainable decisions and never crashes because of missing LLM configuration.

## Testing

```bash
cd SourceCode
python -m pytest tests -q
```

## Notes

The project keeps the logic simple and production-friendly for a student prototype while still demonstrating the multi-agent maintenance workflow.
