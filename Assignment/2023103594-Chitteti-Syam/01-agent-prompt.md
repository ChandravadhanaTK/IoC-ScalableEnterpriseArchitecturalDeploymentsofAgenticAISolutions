# Master Prompt: Student Agentic Assistant

You are an AI coding assistant. Build a beginner-friendly full-stack college capstone application named **Student Agentic Assistant**. Follow the requirements below, keep the implementation simple, and do not claim or add features beyond the defined scope.

## 1. Project title and objective

**Student Agentic Assistant** is an AI-powered college assistant that lets students ask about college events and announcements and request event registrations through a chat interface. The application demonstrates an agent that can select and use a small set of backend tools. The agent registration workflow requires explicit student confirmation before creating a registration. The direct `POST /api/registrations` endpoint does not enforce the agent confirmation state and is not independently approval-protected.

## 2. Required technology stack

- **Frontend:** JavaScript, React, and Vite.
- **Backend:** JavaScript, Node.js, and Express.
- **Database:** MongoDB accessed with Mongoose.
- **AI:** Google Gemini using the official `@google/genai` JavaScript SDK and Gemini function calling. Use the Gemini model configured for the project (currently `gemini-3.5-flash-lite`).
- Do not use TypeScript, LangChain, RAG, vector databases, Redis, Kafka, Kubernetes, or additional frameworks.
- Do not add libraries unless needed to meet a requirement.

## 3. Application requirements

Create a responsive student assistant chat interface that:

- Displays the title **Student Agentic Assistant** and subtitle **AI-powered college assistant**.
- Explains that it can help find college events, announcements, and register for events.
- Shows user and assistant messages with visually distinct styling and scrolls as conversation messages grow.
- Provides a text input and send button. Enter submits the message.
- Disables sending while waiting for the backend and displays **Agent is thinking...**.
- Provides suggestion buttons: **Show upcoming events**, **Latest announcements**, and **Find AI events**.
- Displays the assistant's `reply` returned by the backend and gives a friendly error message when a request fails.
- Sends chat requests to the backend. Do not put the Gemini key in frontend code or Vite-exposed environment variables.

The assistant's application functions are limited to event search, announcement search, and event registration.

## 4. Agent behavior

Implement a concise, student-friendly agent that:

1. Understands the user's request.
2. Uses Gemini function calling to decide whether a current event or announcement lookup is required.
3. Executes only the selected, supported backend tool.
4. Returns the tool result to Gemini so it can observe the result.
5. Responds naturally using the returned application data.

The agent must not invent events, announcements, availability, or registration outcomes. It must not state a registration succeeded unless the backend registration operation succeeds. General greetings and conversational questions should receive an appropriate response without inventing application data. On provider or tool failure, return a clear failure response.

## 5. Tools

Expose exactly these application tools to the agent:

### `search_events`

- Accept optional search text.
- Search the MongoDB `Event` collection using appropriate event fields such as title, description, and location.
- Return matching event records; an empty query can list available events.

### `search_announcements`

- Accept optional search text.
- Search the MongoDB `Announcement` collection using title and content.
- Return matching announcement records; an empty query can list announcements.

### `register_for_event`

- Accept `eventId`, `studentName`, and `studentEmail`.
- Use the existing registration service to check that the event exists, registration is open, and capacity is not reached, then save a `Registration`.
- This tool must not be callable for an agent registration request until the user explicitly confirms a pending action. Enforce this in backend code; do not rely only on a prompt instruction.

Keep tool declarations and tool execution on the backend.

## 6. Registration approval workflow

The **agent registration workflow** requires explicit confirmation:

1. Find the requested event and verify that registration is open and capacity remains.
2. Collect the student's full name and email. If the event is ambiguous, ask the student to select one.
3. Store a pending registration action in backend memory keyed by a conversation/session identifier. Preserve the exact event ID, student name, and student email.
4. Clearly show which event and student details are awaiting confirmation. Ask the student to reply `yes` to proceed or `no` to cancel.
5. On explicit `yes`, execute `register_for_event` using the stored pending details; do not ask Gemini to recreate them or require the student to repeat them.
6. Recheck event validity, registration-open status, and capacity when saving. Return a success message only after MongoDB confirms the registration was created.
7. On `no`, delete the pending action and do not create a database record.
8. If the user replies `yes` or `no` without a pending registration, respond that there is no registration awaiting confirmation.
9. Prevent duplicate confirmation processing for a conversation while its pending registration is being processed.

Pending registration state is intentionally simple and in-memory. Document that it is lost on backend restart and is not shared by multiple backend instances. Do not imply that it is durable.

The direct `POST /api/registrations` REST endpoint currently validates event and student fields and checks event availability/capacity, but does not enforce the agent's pending confirmation state. It is therefore not independently approval-protected. Keep this distinction explicit in user-facing and security documentation.

## 7. MongoDB models

Use Mongoose models with these fields:

### `Event`

- `title`: String, required.
- `description`: String.
- `date`: String.
- `location`: String.
- `registrationOpen`: Boolean, default `true`.
- `capacity`: Number, default `100`.

### `Announcement`

- `title`: String, required.
- `content`: String.
- `date`: String.

### `Registration`

- `eventId`: MongoDB ObjectId referencing `Event`, required.
- `studentName`: String, required.
- `studentEmail`: String, required.
- `registeredAt`: Date, default to the current date/time.

## 8. Backend API requirements

Implement these Express routes:

| Method and path | Behavior |
|---|---|
| `GET /api/health` | Return `{ "status": "ok" }`. Do not claim this route verifies MongoDB or Gemini connectivity unless it is explicitly implemented. |
| `GET /api/events` | Return all events. |
| `GET /api/events/:id` | Return one event; return clear `400` for invalid IDs and `404` if not found. |
| `GET /api/announcements` | Return all announcements. |
| `POST /api/registrations` | Validate request fields, check event/availability/capacity, create a registration, and return a success response. This direct endpoint does not enforce the agent confirmation state. |
| `POST /api/chat` | Accept `{ "message": "..." }` and an optional `conversationId`; validate input, run the Gemini agent, and return `{ "reply": "..." }`. The frontend contract is this JSON reply shape. |

Return clear client errors for invalid input, missing events, closed registration, or full events. Handle malformed JSON and unexpected failures without reporting false success. Keep all database and Gemini access in backend code.

## 9. Frontend requirements

- Use React and Vite with JavaScript and simple CSS.
- Keep the interface responsive on desktop and mobile browsers.
- Send a JSON `POST` request to `/api/chat`; during Vite development, proxy `/api` to the Express backend.
- Render user messages and assistant `reply` values with distinct styles, preserve readable line breaks, and scroll to the latest message.
- Disable input and send/suggestion buttons while waiting for a reply.
- Show **Agent is thinking...** during the request.
- On a network, non-success HTTP, or invalid response failure, display: **Sorry, I couldn't process your request. Please try again.**
- If the frontend sends a `conversationId` to preserve pending confirmation flow, keep it opaque and do not treat it as authenticated identity.

## 10. Error handling

- If `GEMINI_API_KEY` is missing, return a clear backend configuration error; do not call Gemini.
- Log provider/API failures on the backend without logging secrets.
- Convert Gemini failures into an appropriate non-success HTTP response and a safe, useful error message for the frontend.
- Handle MongoDB and tool failures clearly. Never turn a failed tool call into a success-shaped response.
- Validate tool names, arguments, ObjectIds, required strings, and registration state before database writes.
- The frontend should show the friendly failure message above instead of exposing raw stack traces or provider details.

## 11. Environment variables and secrets

Load backend configuration using environment variables, for example with `dotenv`:

```dotenv
GEMINI_API_KEY=
MONGODB_URI=mongodb://localhost:27017/student_agentic_assistant
PORT=5000
```

- Keep the real `GEMINI_API_KEY` only in the backend's local `.env` or a production secret manager.
- Never hard-code or commit API keys, never include them in frontend bundles, and never log them.
- Provide `.env.example` with placeholders only.
- Do not read or modify a user's existing `.env` secret while implementing unrelated tasks.

## 12. Development seed data

Provide an idempotent backend seed script, such as `npm run seed`, which uses the existing Mongoose models. It must use upserts or equivalent title-based matching so repeated runs do not add duplicate sample records. It must not delete user-created data or overwrite existing matching records unnecessarily.

Include realistic, future-dated sample events:

- AI Innovation Workshop
- Tech Symposium 2026
- Web Development Bootcamp
- Cloud Computing Seminar

Each sample event must include all `Event` fields. At least two should have registration open, and at least one should have registration closed.

Include sample announcements:

- Internship Registration Announcement
- Technical Symposium Announcement
- Coding Contest Announcement

Each must include title, content, and date.

## 13. Validation requirements

- Validate chat messages as non-empty strings and bound/validate any optional conversation identifier.
- Validate event IDs as MongoDB ObjectIds before queries.
- Validate required registration fields as non-empty strings.
- Recheck registration-open status and event capacity immediately before creating a registration.
- Escape or safely construct search input so user-provided text cannot become an unintended regular expression or MongoDB query operator.
- Do not rely on model-generated values for a confirmed registration; use exact values stored in the pending action.

## 14. Security requirements

- Treat browser input, model output, and tool arguments as untrusted.
- Keep Gemini credentials and MongoDB credentials on the backend.
- Enforce explicit confirmation for registrations initiated through the agent chat. Do not claim the direct `POST /api/registrations` route enforces this approval; it currently does not.
- Return only necessary data and safe errors; do not expose secrets or stack traces to the client.
- Do not claim authentication, JWT, authorization, or role-based access exists unless it is implemented. **Authentication/JWT is not part of this application and is a future improvement.**
- Do not claim production security controls such as rate limiting, audit logging, or secret-manager integration exist unless implemented.
- For production, authenticate the direct registration endpoint and/or protect it with a server-side authorization/confirmation mechanism that it enforces.
- No RAG, vector database, LangChain, Redis, Kafka, or unrelated infrastructure is part of this project.

## 15. Project structure

Use this beginner-friendly structure and add only files needed to implement the requirements:

```text
student-agentic-assistant/
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      App.jsx
      main.jsx
      style.css
  backend/
    .env.example
    package.json
    server.js
    seed.js
    models/
      Event.js
      Announcement.js
      Registration.js
    services/
      eventService.js
      announcementService.js
      registrationService.js
      searchFilter.js
    src/
      agent/
        agent.js
        agentConfig.js
        agentTools.js
  .env.example
  README.md
```

Add or retain a capstone submission document in the root only if specifically requested. Keep backend routes thin by reusing the services and Mongoose models. Avoid unnecessary architecture layers.

## 16. Testing requirements

Provide practical validation for:

- Backend JavaScript syntax and frontend production build.
- Health, event, announcement, registration, and chat request validation.
- Search services and tool selection/dispatch where these can be tested without a live Gemini call.
- Registration rejection for invalid event IDs, missing events, closed registration, and capacity reached.
- Registration approval: missing details, details collected, explicit `yes` success using the stored values, `no` cancellation without database write, no pending action response, and duplicate processing prevention.
- Error handling for missing Gemini key, Gemini API errors, tool errors, and MongoDB failures where testable.
- Seed idempotency and preservation of unrelated database records.

Use the project's existing test tooling if present. If no test suite exists, add focused tests only when they can be implemented without disproportionate dependencies, and clearly state which checks require live MongoDB or Gemini credentials.

## Project scope and future improvements

Keep this as a simple capstone demonstration. **Authentication/JWT and production monitoring are future improvements, not current features.** Do not claim persistent general conversation memory, a production deployment pipeline, a monitoring dashboard, or multi-instance approval state unless those capabilities are actually added and tested.

When making changes to an existing project, inspect its files first, preserve working functionality, make focused changes, and report files changed and validation performed.
