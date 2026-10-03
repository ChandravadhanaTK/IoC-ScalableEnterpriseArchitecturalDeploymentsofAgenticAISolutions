# Application Generation Prompt — StudyPilot

Create **StudyPilot**, a warm, calm, responsive study-planning web application for university students. The app must run entirely in the browser without an account, sign-in, external API, third-party service, browser permission, or network dependency.

## Core experience

- A student dashboard with a friendly greeting, today's date, study summary, focus timer, and saved study tasks.
- Students can add tasks with a title, subject, and due window; mark tasks complete or incomplete; delete tasks; search tasks; and filter all, due-today, and completed tasks.
- Include a Pomodoro-style timer with 25-minute focus and 5-minute break sessions, start/pause/resume/reset controls, and a visible focus-time total.
- Persist tasks and focus minutes using browser local storage. Explain that information stays on this device.
- Seed the first run with a few clearly fictional example tasks, and show a useful empty state when tasks are removed.
- All controls must work locally and give in-app feedback. Do not link to inaccessible external services or ask for access to accounts or personal data.

## Interface and accessibility

Use a polished, responsive dashboard with sidebar navigation, task list, progress cards, a focus timer, and a task-entry dialog. Use a gentle academic palette, readable type, and a clear visual hierarchy. Support mobile screens, keyboard navigation, visible focus states, meaningful labels, appropriate button semantics, and live status messages. Escape user-entered text before rendering it. Avoid external fonts, scripts, images, or other network resources.

## AI capstone framing

Describe StudyPilot as an AI-assisted study planner concept, while keeping this offline prototype honest: its implemented behavior is deterministic and local, not powered by an AI model. In the proposed production architecture, an optional study-planning assistant may suggest task breakdowns and schedules from student-approved inputs. It must not submit work, grade students, or make high-impact decisions. Clearly distinguish implemented demo behavior from proposed integrations in all documentation.

## Required capstone documentation

Create a Markdown deliverables document covering:

1. Architecture diagram with presentation, local storage, proposed API/assistant, trust boundaries, identity, data stores, and integrations.
2. Agent workflow with roles, states, tools, student confirmation, handoffs, approvals, and failure paths.
3. Deployment strategy with environments, hosting, scaling, resilience, release, and rollback.
4. Security model for identity, authorization, secrets, privacy, guardrails, and audit.
5. Monitoring dashboard design covering health, quality, safety, cost, and student outcomes.

Include a verified deployment URL only after the user actually publishes the site. Never invent a public link. Include a README with simple run and static-hosting instructions.
