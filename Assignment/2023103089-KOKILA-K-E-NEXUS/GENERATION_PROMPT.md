# NEXUS – Project Generation Prompt

## Project Title
NEXUS – Multi-Agent AI Productivity Platform

## Prompt
Build a modern, responsive web application called **NEXUS – Multi-Agent AI Productivity Platform**.

The goal is to create one productivity workspace that combines task management, notes, calendar events, knowledge storage, weather information, and intelligent command routing in a single interface.

### Core Requirements
1. Create a dark, futuristic, professional UI with a responsive layout.
2. Create a landing/home page with the NEXUS branding and a clear introduction.
3. Provide an AI Assistant page with a chat-style interface.
4. Implement six specialized agents:
   - Task Agent – create, track, prioritize, and complete tasks.
   - Notes Agent – create and display notes.
   - Calendar Agent – schedule and display events.
   - Knowledge Agent – store tagged knowledge items.
   - Weather Agent – display current weather information.
   - Router Agent – interpret commands and route them to the appropriate agent.
5. Add a Dashboard showing:
   - Active tasks
   - Stored notes
   - Upcoming calendar events
   - Weather
   - Knowledge-base item count
6. Add dedicated Tasks, Notes, and Knowledge pages.
7. Provide simple natural-language commands such as:
   - `add task [name]`
   - `add note [text]`
   - `schedule [event]`
   - `weather`
   - `show tasks`
   - `show notes`
8. Build the backend with Python FastAPI and expose REST endpoints for the agents.
9. Serve the frontend from the FastAPI application.
10. Use in-memory storage for the current implementation.
11. Add Docker support using a Dockerfile.
12. Keep secrets and environment files out of version control.
13. Include a README with setup, API, project structure, and deployment information.

### Technology
- Frontend: HTML, CSS, JavaScript
- Backend: Python 3.11, FastAPI, Uvicorn, Pydantic
- Deployment-ready: Docker / Google Cloud Run
