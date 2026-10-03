# Student Agentic Assistant

## Project overview

A simple full-stack project for a college capstone demonstration. It includes a React chat interface, an Express backend, MongoDB data for events and announcements, and a Google Gemini agent with function calling. Authentication is not implemented.

## Technologies

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB, using Mongoose
- AI: Google Gemini API with function calling

## Folder structure

```text
student-agentic-assistant/
  frontend/
    index.html
    package.json
    src/
      App.jsx
      main.jsx
      style.css
    vite.config.js
  backend/
    models/
      Announcement.js
      Event.js
      Registration.js
    package.json
    seed.js
    services/
      announcementService.js
      eventService.js
      registrationService.js
      searchFilter.js
    src/
      agent/
        agent.js
        agentConfig.js
        agentTools.js
    server.js
  .env.example
  README.md
```

## Installation

Install [Node.js](https://nodejs.org/) and make sure MongoDB is running for the API and seed script.

In a terminal, install the frontend dependencies:

```powershell
cd student-agentic-assistant/frontend
npm install
```

In a second terminal, install the backend dependencies:

```powershell
cd student-agentic-assistant/backend
npm install
Copy-Item .env.example .env
```

If using the root `.env.example`, copy it to `backend/.env` instead. Edit `backend/.env` and set:

- `MONGODB_URI` to your MongoDB connection string, for example `mongodb://127.0.0.1:27017/student_agentic_assistant`.
- `GEMINI_API_KEY` to your Gemini API key. Keep this key in `backend/.env`; it is read by the backend only and is never sent to the frontend.

The agent uses `gemini-3.5-flash-lite` with tool calling.

## Start MongoDB on Windows

If MongoDB Community Server was installed as a Windows service, open PowerShell as Administrator and run:

```powershell
Start-Service MongoDB
```

If you installed MongoDB without a service, create a data directory and start the server in a terminal:

```powershell
New-Item -ItemType Directory -Force C:\data\db
mongod --dbpath C:\data\db
```

Leave that terminal running while using the backend.

With MongoDB running, insert or update the sample events and announcements:

```powershell
cd student-agentic-assistant/backend
npm run seed
```

## Run the frontend

From `student-agentic-assistant/frontend`, run:

```powershell
npm run dev
```

Open the local URL printed by Vite in your browser.

## Run the backend

From `student-agentic-assistant/backend`, run:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`. The frontend development server proxies `/api` requests to this backend, so run both servers while using the chat page. The health-check endpoint is `GET http://localhost:5000/api/health`; it responds with:

```json
{
  "status": "ok"
}
```

## API endpoints

The event, announcement, and registration endpoints require the backend to be connected to MongoDB. Chat requests require a valid Gemini API key; event and announcement searches and registrations also use MongoDB.

### Chat with the assistant

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/chat `
  -ContentType "application/json" `
  -Body '{"message":"What events are available?"}'
```

The response contains a `reply` string. An optional `conversationId` keeps pending registrations separate between conversations; the frontend creates one per browser tab session. For registration, provide your full name and student email when asked, then explicitly reply `yes` to confirm or `no` to cancel. Pending approvals are kept in backend memory and cleared if the backend restarts.

Example interactions:

```text
User: Hello
Assistant: Hello! I'm the Student Agentic Assistant. I can help you find events, announcements, and register for events.

User: What events are available?
Assistant: [Lists events returned by the database.]

User: Register me for AI Workshop 2026.
Assistant: AI Workshop 2026 is available. To prepare your registration, send your full name and student email address. I will ask you to confirm before registering.

User: Alex Student, alex@example.com
Assistant: [Asks Alex to explicitly confirm before registering.]

User: yes
Assistant: You are registered for AI Workshop 2026.
```

Available agent tools:

- `search_events`: search events by title, description, or location.
- `search_announcements`: search announcements by title or content.
- `register_for_event`: register for an event only after the student explicitly confirms.

### List events

```http
GET http://localhost:5000/api/events
```

### Get one event

Replace `<eventId>` with an `_id` returned by the events endpoint:

```http
GET http://localhost:5000/api/events/<eventId>
```

### List announcements

```http
GET http://localhost:5000/api/announcements
```

### Register for an event

Replace `<eventId>` with an event `_id`:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:5000/api/registrations `
  -ContentType "application/json" `
  -Body '{"eventId":"<eventId>","studentName":"Alex Student","studentEmail":"alex@example.com"}'
```

Successful registration returns HTTP `201` with a success message and the saved registration. Invalid input returns `400`; a missing event returns `404`; closed or full events return `409`.

The explicit `yes`/`no` approval flow applies to registrations requested through the agent chat. The direct `POST /api/registrations` endpoint does not enforce that pending agent confirmation and is not independently approval-protected. Authentication is not implemented; do not expose this endpoint as a production registration route without adding authentication and/or server-side authorization/confirmation checks.

You can also test the GET endpoints in a browser, or use PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/api/events
Invoke-RestMethod http://localhost:5000/api/events/<eventId>
Invoke-RestMethod http://localhost:5000/api/announcements
```
