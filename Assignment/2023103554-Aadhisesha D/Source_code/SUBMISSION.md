# PlacementPilot Submission Package

## Project

**PlacementPilot — Agentic Career Preparation Assistant**

## Guided single-page journey

The live UI is intentionally a single continuous page: snapshot → role intelligence → focus areas → assessment map → example questions → role training → mock interview. The sticky progress indicator shows the active chapter, and each chapter provides a Continue action plus a low-emphasis Skip path.

## Deliverables covered

1. **Architecture Diagram** — `docs/ARCHITECTURE.md`
2. **Agent Workflow Design** — `docs/ASSIGNMENT_PROMPT.md` and the live Agent Monitor
3. **Deployment Strategy** — `docs/DEPLOYMENT.md`
4. **Security Model** — server-side API key, input validation, document trust boundaries and schema validation
5. **Monitoring Dashboard Design** — agent execution trace, latency, model, token count, validation and recovery notes
6. **Role Analysis** — Role Intelligence screen with focus areas, interview rounds, signals and example questions
7. **Role Trainer** — MCQ, coding, technical, behavioral, project, system design and case/debug modes
8. **Training Evaluation** — score, verdict, strengths, improvements and ideal answer shape

## Demo sequence

1. Open the deployed application.
2. Open **Placement Run**.
3. Upload a text-based resume PDF or paste resume text.
4. Paste a realistic job description.
5. Click **Run placement intelligence**.
6. Show the live agent workflow.
7. Open **Role Intelligence**.
8. Show the focus areas and likely assessment rounds.
9. Show example interview questions.
10. Open **Role Trainer**.
11. Choose MCQ / Coding / Technical / Behavioral / Project / System Design / Case.
12. Choose difficulty.
13. Generate a question grounded in the role.
14. Submit an answer and show the evaluation.
15. Open **Preparation Sprint**.
16. Open **Agent Monitor**.

## Recommended proof points during evaluation

- Show that the Job Analysis Agent produces more than a skill list: it identifies preparation areas, signals and likely rounds.
- Change the trainer from MCQ to Coding and generate another question for the same role.
- Explain that the trainer receives the structured job profile and skill-gap output as context.
- Show the agent trace and validation layer.
- Show that the NVIDIA NIM API key is server-side and the application has no database.

## Live deployment

`https://YOUR-PROJECT.vercel.app`

## Repository

`https://github.com/YOUR-USERNAME/placementpilot`
