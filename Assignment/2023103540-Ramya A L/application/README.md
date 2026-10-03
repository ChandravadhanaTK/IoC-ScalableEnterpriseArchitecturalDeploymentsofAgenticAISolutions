# StudyPilot

StudyPilot is a responsive, offline-ready study planner with task management and a Pomodoro focus timer. It has no account, sign-in, external API, third-party service, or browser permission requirement.

## Run locally

Open `index.html` in a modern browser. The application works without a build step or package installation. Tasks and focus minutes are saved in that browser's local storage under `studypilot.tasks` and `studypilot.focusMinutes`.

## What works

- Add study tasks with a subject and due window.
- Mark tasks complete or incomplete, delete tasks, search, and filter by all, due today, or completed.
- Run, pause, resume, and reset 25-minute focus sessions; start a 5-minute break.
- Keep tasks and focus minutes on the current device between visits.
- Responsive layout for desktop and mobile screens.

## Privacy and demo notes

The app makes no network requests and asks for no access. It has no AI model connection: the current features use local application logic. Local browser storage is not encrypted or synchronized. Use fictional or non-sensitive task details.

## Publish as a static site

Upload the contents of this `application` directory to any static hosting provider. Set the site root/publish directory to this directory; leave the build command blank. The published root must contain `index.html`, `styles.css`, and `app.js`. After publishing, copy the provider's public HTTPS URL into `02-capstone-deliverables.md`.
