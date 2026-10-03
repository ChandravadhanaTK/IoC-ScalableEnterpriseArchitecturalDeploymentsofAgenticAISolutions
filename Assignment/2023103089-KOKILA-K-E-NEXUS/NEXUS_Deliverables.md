# NEXUS – Project Deliverables

## Student Details
- **Name:** Kokila K E
- **Roll Number:** 2023103089
- **Project:** NEXUS – Multi-Agent AI Productivity Platform

## 1. Application
A web-based productivity platform that combines multiple productivity functions into one interface.

## 2. Six Specialized Agents
| Agent | Function |
|---|---|
| Task Agent | Adds, lists, toggles, and deletes tasks |
| Notes Agent | Stores and retrieves notes |
| Calendar Agent | Creates and lists calendar events |
| Knowledge Agent | Stores and retrieves tagged knowledge |
| Weather Agent | Provides weather information |
| Router Agent | Routes supported user commands to the correct agent |

## 3. Main Pages
- Home / Landing page
- AI Chat
- Dashboard
- Tasks
- Notes
- Knowledge
- Features

## 4. Backend API
The FastAPI backend provides endpoints including:
- `GET /`
- `GET /health`
- `POST /ai-command`
- `POST /add-task`
- `GET /tasks`
- `PATCH /tasks/{id}/toggle`
- `DELETE /tasks/{id}`
- `POST /add-note`
- `GET /notes`
- `DELETE /notes/{id}`
- `POST /add-event`
- `GET /events`
- `POST /add-knowledge`
- `GET /knowledge`
- `DELETE /knowledge/{id}`
- `GET /weather`

## 5. Technology Stack
- HTML
- CSS
- JavaScript
- Python
- FastAPI
- Uvicorn
- Pydantic
- Docker

## 6. Local Verification Completed
The application was successfully started locally using:

`python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`

Local URL:

`http://127.0.0.1:8000`

The following were verified through the UI:
- Task creation
- Task completion
- Note creation
- Calendar event creation
- Weather display
- Knowledge storage
- Dashboard
- Features page
- Task listing through AI Chat

## 7. Source Files
- `index.html`
- `style.css`
- `script.js`
- `main.py`
- `requirements.txt`
- `Dockerfile`
- `.dockerignore`
- `.gitignore`
- `README.md`

## 8. Documentation
- `GENERATION_PROMPT.md`
- `NEXUS_Deliverables.md`
- `Deployment_Link.md`
- `README.md`

## 9. Future Enhancement
A future version can connect the Router Agent to a hosted LLM/API for more flexible natural-language queries and replace in-memory storage with a persistent database.
