# CampusHire AI

A simple, dependency-free multi-agent AI placement assistant built for an Agentic AI enterprise architecture capstone.

## What it does

1. Resume Analysis Agent extracts skills from resume text.
2. Job Matching Agent compares the profile with a job description.
3. Preparation Agent creates a short preparation plan from skill gaps.
4. Application Tracking Agent stores application status and deadlines.
5. Reminder logic identifies upcoming/overdue applications.
6. A lightweight Orchestrator coordinates the agents and records traces.

The app works **without an API key** using deterministic local logic. If `OPENAI_API_KEY` is supplied, the optional LLM adapter can be enabled later without changing the UI.

## Why this version is easy to run

- No npm dependencies.
- Uses only Node.js built-in modules.
- No React/Vite/Tailwind version conflicts.
- JSON file storage instead of a database setup.
- Runs locally with Node 18+.

## Run

```bash
npm start
```

Open: http://localhost:3000

## Project structure

```text
campushire-ai/
├── package.json
├── README.md
├── .gitignore
├── data/
│   └── db.json
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── src/
    ├── server.js
    ├── store.js
    ├── orchestrator.js
    ├── utils.js
    └── agents/
        ├── resumeAgent.js
        ├── matchingAgent.js
        ├── preparationAgent.js
        └── trackingAgent.js
```

## Main demo flow

1. Enter resume text.
2. Enter a job description.
3. Click **Run Agent Pipeline**.
4. Review extracted skills, match score, skill gaps and preparation plan.
5. Click **Approve Plan** to create a tracked application.
6. Open **Applications** to change status.
7. Open **Monitoring** to see agent traces and metrics.
8. Open **Architecture** to show the capstone architecture.

## Important note

This is a student capstone/demo application. The local AI fallback uses transparent rule-based extraction rather than pretending that an LLM was used. This keeps the project reliable and easy to demonstrate.
