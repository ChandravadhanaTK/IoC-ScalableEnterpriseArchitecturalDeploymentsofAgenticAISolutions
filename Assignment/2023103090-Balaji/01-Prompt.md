# Reusable Build Prompt: Room Organization Assistant

You are an expert frontend engineer. Build a complete, polished, responsive **Room Organization Assistant** web application. Follow the product requirements and implementation constraints below. If working in an existing repository, inspect it first, preserve useful existing patterns, and make the application build and deploy successfully.

## Project title

**Room Organization Assistant**

## Problem statement

When a room is messy, it can be difficult to decide where to begin and how to make progress. Users need a practical, personalized sequence of cleanup tasks, a simple way to track each task, and advice that reflects their current room and plan.

## Objective

Create a single-page React application that lets a user describe their room, generates a concise AI cleanup plan, tracks task status and overall progress, and provides an AI assistant that answers questions in the context of that room and its current plan. Persist the room description and cleanup plan locally so they remain available after a reload.

## Required technology

- React with functional components and hooks.
- TypeScript with explicit, reusable types for cleanup plans, tasks, priorities, task statuses, and chat messages.
- Vite for development and production builds.
- Tailwind CSS for responsive styling.
- The Gemini API for AI-generated cleanup plans and assistant replies.
- Browser LocalStorage for persisting the room description and cleanup plan.
- Firebase Hosting for static deployment, compatible with the Firebase Spark (free) plan.

Keep the application frontend-only and suitable for static Firebase Hosting on the Spark/free tier.

## Required features

### 1. Dashboard and navigation

- Give the application a clean, welcoming room-organization identity and a responsive layout that works on desktop and mobile.
- Provide navigation for **Dashboard**, **Cleanup Plan**, and **Ask AI**, plus a **Start New Cleanup** action.
- Disable plan and assistant navigation when there is no active cleanup plan.
- The dashboard should show overall completion percentage, completed and remaining task counts, estimated remaining time, and the next unfinished task with its priority, description, and estimated duration.
- Provide clear actions to describe the room, view the plan, and open the assistant.
- Display a helpful empty state when the user has not generated a plan.

### 2. Room description input

- Provide a modal or similarly focused input flow titled **Describe Your Room**.
- Include a multiline text field with an example placeholder that helps the user describe visible clutter and room areas.
- When editing an existing plan, prefill the input with the saved room description.
- Trim and validate the description; do not request a plan for blank input. Show a clear validation message.
- Disable duplicate submission while a plan is being generated and show a loading label such as **Generating...**.
- Allow the user to cancel or close the input flow.

### 3. AI-generated cleanup plan

- Generate a concise summary and a practical, ordered list of actionable cleanup tasks grounded only in the user's room description.
- Each task must include a stable ID, title, description, estimated minutes, priority, and initial status.
- Use only these priority values: `HIGH`, `MEDIUM`, and `LOW`.
- Use only these task status values: `NOT_STARTED`, `IN_PROGRESS`, and `COMPLETED`.
- Include at least three useful tasks where the room description supports them. Do not invent objects or clutter that the user did not mention or clearly imply.
- Estimate task durations realistically and make the plan's total estimated time equal to the sum of task estimates.
- Ask Gemini for machine-readable JSON with a defined shape. Parse and validate/normalize the response before using it; handle missing, malformed, or empty model output as an error rather than silently showing a success-shaped invalid plan.
- Use the Gemini `generateContent` API from the frontend with the model `gemini-3.5-flash`. Read the credential only from the `VITE_GEMINI_API_KEY` environment variable. Do not hard-code, print, or commit any real API key or other secret.
- If the environment variable is missing or the request fails, explain the problem clearly in the UI and let the user retry. Do not silently substitute a generic plan after an AI failure.

### 4. Cleanup tasks, priority, status, and progress

- Render the plan as readable task cards showing the title, description, estimated minutes, priority badge, and current status.
- Visually distinguish the three priority levels and three statuses.
- Let a user start a task, return it to pending, mark it complete, and reopen a completed task.
- Keep all status changes in application state and persist them with the plan.
- Calculate progress from completed tasks divided by total tasks; show zero progress when there are no tasks.
- Update completed/remaining counts and remaining estimated minutes as task states change.
- Identify the next task as the first task that is not completed.
- Show an overall progress indicator and a useful plan summary.

### 5. AI assistant

- Provide an **Ask AI** view with a chat-style conversation, room context, and a multiline question input.
- Allow questions only when a cleanup plan exists; prevent blank messages and duplicate submission while a reply is loading.
- Send the user's question, room description, and current plan to Gemini.
- Instruct the assistant to answer briefly and supportively using only that context, avoid inventing room items or tasks, recommend high-priority tasks when the user gives a time limit, and acknowledge completed tasks when relevant.
- Display user and assistant messages distinctly, show a thinking/loading state, and present a recoverable error message if the AI request fails.
- Chat history may remain in component state for the current session; the required LocalStorage persistence applies to the room description and cleanup plan.

### 6. LocalStorage persistence

- Save the trimmed room description and the complete current cleanup plan, including task statuses, in LocalStorage.
- Restore the saved description and plan when the application starts so a reload does not lose cleanup progress.
- Use namespaced, stable LocalStorage keys.
- Validate stored plan data before treating it as a valid plan. Handle unavailable LocalStorage and invalid stored JSON safely and transparently; do not crash the app.
- Clear the saved description and plan when a new cleanup is confirmed.

### 7. Start New Cleanup

- Make **Start New Cleanup** available from the main navigation.
- Before deleting the current work, ask the user to confirm that the current cleanup plan and description will be removed.
- If the user cancels, preserve the active plan and remain in the current state.
- If confirmed, clear the relevant in-memory and LocalStorage data, reset the conversation to its initial welcome state, clear visible generation errors, and return to the dashboard.

## Error handling and quality

- Handle blank input, missing `VITE_GEMINI_API_KEY`, Gemini HTTP/API errors, network failures, invalid JSON, empty model responses, and invalid persisted data.
- Present actionable, user-friendly errors in the relevant view. Do not leave the user with a blank screen or silently claim success when generation or chat fails.
- Keep loading states consistent and restore them in `finally` blocks or equivalent safe cleanup.
- Keep API and persistence logic out of presentation components where practical, and use typed service boundaries.
- Use accessible labels, semantic buttons and headings, keyboard-usable controls, visible focus states, and sufficient contrast.
- Avoid adding unnecessary packages or features. Preserve a straightforward component structure, such as an app shell, dashboard, room input, cleanup task card, progress indicator, and chat assistant.
- Ensure no credentials are committed. A sample environment file may show the variable name with a clearly fake placeholder only.

## Firebase Hosting and deployment requirements

- Configure Firebase Hosting to serve the Vite production output from `dist`.
- Configure a single-page-app rewrite so application routes resolve to `index.html`.
- Build using the project's package scripts, including TypeScript checking and the Vite production build.
- Provide clear setup and deployment instructions: install dependencies, create a local `.env` file and set `VITE_GEMINI_API_KEY`, run the Vite development server, authenticate with Firebase CLI, select the Firebase project, build, and deploy to Hosting.
- Keep the deployment compatible with the Firebase Spark/free tier: static Firebase Hosting only, with no paid-plan dependency and no backend service.
- Explain in the setup/security notes that a Vite-prefixed environment variable is included in the browser bundle and therefore is not a server-side secret. Do not claim it is protected from users.

## Completion criteria

Deliver the working application and its relevant configuration/documentation. Verify that the TypeScript/Vite production build succeeds, that linting succeeds when configured, and that the Firebase Hosting configuration points to `dist` with the SPA rewrite. Do not report validation as successful unless it was actually run.
