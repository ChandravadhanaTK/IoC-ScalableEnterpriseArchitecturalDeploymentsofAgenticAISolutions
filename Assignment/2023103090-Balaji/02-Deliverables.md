# Room Organization Assistant

## Academic Project Documentation

| Item | Details |
|---|---|
| Project | Room Organization Assistant |
| Application type | Client-side single-page web application |
| Deployment platform | Firebase Hosting |
| Firebase plan constraint | Designed for Firebase Spark (free) plan |

## 1. Project Title

**Room Organization Assistant**

## 2. Problem Statement

People faced with a cluttered room may find it difficult to decide what to organize first or how to divide the work into manageable steps. A generic checklist may not match the user's room, and it can be hard to keep track of progress while cleaning.

This project addresses that problem by letting the user describe the room and receive an AI-generated cleanup plan. The application presents tasks with priorities and estimated durations, tracks task completion, and provides an AI chat interface for questions about the current room and plan.

## 3. Objective

The objective is to provide a lightweight, browser-based assistant that:

- Converts a written room description into a structured cleanup plan using Gemini.
- Presents actionable tasks with priorities and estimated durations.
- Tracks task status and summarizes cleanup progress.
- Answers questions using the room description and current plan as context.
- Retains the room description and cleanup plan in browser LocalStorage between visits.
- Deploys as a static application on Firebase Hosting while remaining compatible with the Firebase Spark/free-tier constraint.

## 4. Solution Overview

The application is a React single-page interface built with TypeScript and Vite. Its app component coordinates the selected view, room description, cleanup plan, chat messages, and loading/error state. Dedicated components render the dashboard, room-description form, task cards, progress bar, and AI chat.

An AI service sends requests directly from the browser to the Gemini `generateContent` endpoint. A separate storage service saves and restores the room description and plan from LocalStorage. Firebase Hosting serves the Vite production build from `dist` and rewrites requests to `index.html` for the single-page application.

The application has no application server. Gemini requests are made by the client, and Firebase is used for static Hosting rather than server-side execution.

## 5. Key Features

| Feature | Implemented behavior |
|---|---|
| Dashboard | Displays completion percentage, completed and remaining task counts, remaining estimated minutes, and the next unfinished task when a plan exists. |
| Room description | Opens a form with an example placeholder, accepts multiline input, trims and validates blank descriptions, and supports editing an existing description. |
| AI cleanup plan | Requests a summary and structured tasks from Gemini, including priority and estimated minutes. The app normalizes returned task fields and rejects a response that produces no tasks. |
| Task management | Shows each task's description, priority, estimated duration, and status. A user can start a task, mark it pending, complete it, or reopen it. |
| Progress tracking | Calculates completion from completed tasks and updates dashboard figures and the plan progress bar when task status changes. |
| AI assistant | Sends the user's question, room description, and current plan to Gemini and displays the exchange in a chat-style view. |
| Local persistence | Saves and restores the room description and cleanup plan, including task statuses, using LocalStorage. |
| Start New Cleanup | Requests confirmation before clearing the current plan and description; on confirmation, resets app state and returns to the dashboard. |
| Responsive styling | Uses Tailwind CSS utility classes to lay out the interface for different screen sizes. |

Task priorities are `HIGH`, `MEDIUM`, and `LOW`. Task statuses are `NOT_STARTED`, `IN_PROGRESS`, and `COMPLETED`.

## 6. Technology Stack

| Technology | Role in the project |
|---|---|
| React | Builds the component-based user interface and manages UI state. |
| TypeScript | Defines application types and checks the frontend during production builds. |
| Vite | Provides development and production build tooling. |
| Tailwind CSS | Styles the interface using utility classes and the Vite integration. |
| Gemini API | Generates cleanup plans and provides contextual assistant responses. |
| Browser LocalStorage | Persists the room description and cleanup plan on the user's device. |
| Firebase Hosting | Hosts the static Vite production output. |
| Oxlint | Provides the configured lint command. |

## 7. System Architecture

The application runs in the browser. React components manage the user interface and app state; `aiService.ts` communicates directly with Gemini; `storageService.ts` accesses browser LocalStorage. Firebase Hosting serves the static Vite build from `dist`.

The architecture diagram and component responsibilities are documented separately in [docs/architecture.md](./docs/architecture.md).

## 8. Application Workflow

The user loads or enters a room description, requests a Gemini plan, updates task statuses, and may ask Gemini questions using the current room and plan context. Plan data persists in LocalStorage; chat history is in memory for the current session. The application workflow diagram and detailed steps are documented in [docs/application-workflow.md](./docs/application-workflow.md).

## 9. Gemini API Integration

The `src/services/aiService.ts` module calls Google's Gemini `generateContent` REST endpoint directly from the browser. The configured model in the source is `gemini-3.5-flash`. The credential is read from the `VITE_GEMINI_API_KEY` environment variable; no key value is included in this document.

For plan generation, the service asks Gemini to return JSON containing a summary, total estimated minutes, and tasks. Task priorities and statuses are normalized to the application's supported values, and task IDs and other fields receive defaults when absent. The application requires a non-empty room description and rejects a generated plan with no tasks.

For assistant replies, the service includes the room description, serialized current plan, and user question in the request. Its prompt instructs Gemini to keep advice grounded in the supplied context, consider task priority when a time limit is mentioned, and respond to reported task completion.

If the Gemini request fails, the UI reports that plan generation or the assistant response could not be completed and allows the user to try again. The application does not present a successful plan when the request fails.

## 10. LocalStorage Persistence

The `src/services/storageService.ts` module uses the following namespaced keys:

| Data | LocalStorage key |
|---|---|
| Room description | `room-organization-assistant:roomDescription` |
| Cleanup plan | `room-organization-assistant:cleanupPlan` |

The app loads these values during initialization and writes updates when the room description or plan changes. Since task statuses are part of the saved plan object, task progress is retained across page reloads on the same browser and origin. Starting a new cleanup removes both entries.

Storage operations are wrapped to avoid crashing the interface when LocalStorage access or JSON parsing fails. Unreadable JSON or a stored value without a `tasks` array is treated as no available plan; stored plan validation is structural and limited. Chat messages are held in React state and are not persisted by the storage service.

## 11. Firebase Hosting Deployment

The Firebase Hosting configuration in `firebase.json` serves the `dist` directory and rewrites requests to `/index.html`, supporting client-side single-page application navigation. The configured Firebase project ID is `room-organization-assistant`.

The documented deployment flow is:

```bash
npm install
# Configure VITE_GEMINI_API_KEY as a local environment variable in .env.
npm run dev
firebase login
firebase use <your-firebase-project-id>
npm run build
firebase deploy
```

The Hosting setup deploys static files and is designed to stay on Firebase's Spark/free tier. The application does not rely on Firebase server-side execution or other paid Firebase services. Gemini API access is external to Firebase Hosting and remains subject to the provider's own availability, credentials, and usage limits.

## 12. Project Structure

```text
Room-Organization-Assistant/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ChatAssistant.tsx
│   │   ├── CleanupTask.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── RoomInput.tsx
│   ├── services/
│   │   ├── aiService.ts
│   │   └── storageService.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .env.example
├── firebase.json
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

`App.css` and starter assets are present in the project; the main application layout and component styling are implemented primarily in `App.tsx`, the component files, and `index.css`.

## 13. Testing and Validation

The `package.json` defines these relevant scripts:

| Command | Intended validation |
|---|---|
| `npm run build` | Runs TypeScript project builds followed by the Vite production build. |
| `npm run lint` | Runs Oxlint. |
| `npm run dev` | Starts the Vite development server. |
| `npm run preview` | Serves the production build locally for preview. |

No automated test script or test suite is configured in the inspected `package.json`.

For this documentation task, validation was attempted in the project directory. `npm run build` did not complete because the required local type definitions for Vite and Node were unavailable. `npm run lint` did not run because the Oxlint executable was unavailable. These results indicate that dependencies need to be installed/restored before those checks can be completed; they are not passing build or lint results.

The configured live Hosting URL responded to an HTTP page request during documentation preparation: [https://room-organization-assistant.web.app/](https://room-organization-assistant.web.app/).

## 14. Security Considerations

- Do not commit real credentials or include them in documentation. Configure the Gemini credential locally as the `VITE_GEMINI_API_KEY` environment variable.
- Vite environment variables prefixed for client use are incorporated into browser-delivered application code. Therefore the Gemini API key is not a server-side secret and can be observed by users of a deployed client application.
- The Gemini endpoint is called directly from the browser. Protect the key through provider-side restrictions and quotas where available, and do not treat a client-side variable as confidential.
- Room descriptions, cleanup plans, and task progress are stored in the browser's LocalStorage for the current origin. They are not synchronized to a user account or shared database by this application.
- The app's AI prompts request context-grounded outputs, but generated advice can still be inaccurate and should be reviewed by the user.

## 15. Limitations

- The app requires internet access and a valid configured Gemini credential for AI plan generation and chat.
- Because the Gemini call is client-side, the environment variable does not conceal the API key from application users.
- LocalStorage is browser- and origin-specific. The app provides no cross-device synchronization, account system, or remote backup.
- Stored plan validation is limited to parsing the JSON and checking that it contains a `tasks` array; the storage service does not deeply validate every saved field.
- Chat history is maintained in memory and resets when the page is reloaded or a new cleanup is started.
- LocalStorage read/write failures are caught by the storage service without a visible notification, so persistence may fail silently in restricted browser environments.
- The inspected project does not configure automated unit, integration, or end-to-end tests.
- AI responses depend on the external Gemini service and may need user review.

## 16. Future Enhancements

The following are suggestions and are **not features of the current implementation**:

- Add automated unit and browser-level tests for plan parsing, progress calculations, persistence, and user workflows.
- Improve validation and user-visible reporting for malformed stored data and LocalStorage write failures.
- Add optional account-based synchronization and backup if an appropriate backend is introduced.
- Persist chat history if users need conversations to survive reloads.
- Introduce a protected server-side AI gateway only if deployment constraints and project requirements permit it.
- Add richer accessibility testing and usability feedback for the room-description, plan, and assistant flows.

## 17. Live Application

The configured Firebase Hosting site is available at:

[https://room-organization-assistant.web.app/](https://room-organization-assistant.web.app/)

This URL responded during documentation preparation. Availability of Gemini features depends on valid deployment configuration and Gemini API availability.

## 18. Source Code

The source code inspected for this report is in the local project folder [`Room-Organization-Assistant`](./Room-Organization-Assistant/).

The associated GitHub repository is [balajitamilselvan28/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions](https://github.com/balajitamilselvan28/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions). Ensure the latest local assignment files are pushed before using the repository as the submitted source link.

Key implementation files:

- [Application state and views](./Room-Organization-Assistant/src/App.tsx)
- [Gemini integration](./Room-Organization-Assistant/src/services/aiService.ts)
- [LocalStorage persistence](./Room-Organization-Assistant/src/services/storageService.ts)
- [Application data types](./Room-Organization-Assistant/src/types/index.ts)
- [Firebase Hosting configuration](./Room-Organization-Assistant/firebase.json)
