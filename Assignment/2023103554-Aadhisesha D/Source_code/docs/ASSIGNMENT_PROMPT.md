# Detailed Build Prompt — PlacementPilot

Build a production-style web application named **PlacementPilot — Agentic Career Preparation Assistant**.

## Product objective

PlacementPilot is a role-aware agentic assistant for campus placement preparation. A student provides a resume, a target job description and a career goal. The system coordinates specialized AI agents to decode the role, compare candidate evidence, expose high-impact preparation gaps, generate realistic interview examples and create a focused preparation sprint.

A second core capability is **Role Trainer**: after a job is analysed, the student selects a question format and difficulty. The system generates one question grounded in that exact role, its requirements and the student's gaps. The student can submit an answer and receive a structured evaluation.

## Constraints

- React + Vite + TypeScript frontend.
- Custom CSS design system; no database.
- Serverless AI runtime through Vercel functions.
- NVIDIA NIM API is called only on the server.
- Browser localStorage stores session history and training attempts.
- Resume text is extracted locally when possible.

## Agent architecture

- **Orchestrator** — coordinates the workflow and controls handoffs.
- **Resume Intelligence Agent** — extracts factual candidate evidence.
- **Job Analysis Agent** — deeply decodes the opportunity into requirements, focus areas, likely assessment rounds, signals and example prompts.
- **Skill Gap Agent** — maps candidate evidence against role evidence and ranks gaps.
- **Interview Agent** — produces role-aware example questions and focus areas.
- **Career Planner Agent** — turns gaps and interview focus into a seven-day preparation sprint.
- **Role Training Agent** — creates one question at a time for a selected format such as MCQ, coding, technical, behavioral, project, system design or case/debug.
- **Training Evaluator Agent** — evaluates a submitted response against a role-specific rubric without claiming to execute code when code has not actually been executed.
- **Validation Layer** — normalizes schema output and rejects incomplete results.

## Primary placement workflow

```text
User inputs
  -> Input validation
  -> Orchestrator
  -> Resume Intelligence Agent
  -> Job Analysis Agent
  -> Skill Gap Agent
  -> Interview Agent
  -> Career Planner Agent
  -> Validation Layer
  -> Placement Report
```

The UI must show this as a visible live execution trace.

## Role intelligence requirements

The Job Analysis Agent must return:

- role
- company
- seniority
- roleSummary
- requiredSkills
- preferredSkills
- responsibilities
- technologies
- softSkills
- keywords
- focusAreas with priority, rationale and suggested topics
- interviewRounds with purpose, questionTypes and exampleQuestions
- exampleQuestions
- signals

Do not invent employer facts. When interview rounds are not explicitly stated, describe them as likely rather than certain.

## Role Trainer requirements

The trainer must allow selection of:

- MCQ
- Coding
- Technical
- Behavioral
- Project
- System Design
- Case / Debug

The student must also select:

- Easy
- Medium
- Hard

The generated question must be grounded in the analysed role. For example:

```text
Target role: Java Software Engineer
Focus: REST APIs + Data Structures
Question type: Coding
Difficulty: Medium
```

The response may contain:

- question title
- prompt
- MCQ options and answer index
- coding starter code
- coding examples
- time limit
- skills tested
- evaluation rubric

The student can submit an answer. The Training Evaluator returns:

- score 0–100
- verdict
- feedback
- strengths
- improvements
- ideal answer shape

## UI requirements

Build a professional, minimal career-intelligence workspace rather than a sidebar-heavy dashboard. The experience should read as one cohesive page from analysis to practice.

Design direction:

- DESIGN_VARIANCE: 3
- MOTION_INTENSITY: 3
- VISUAL_DENSITY: 3
- One locked mint/green accent over an obsidian neutral palette.
- Large confident typography with an editorial hierarchy and generous whitespace.
- Avoid default AI-purple gradients and generic dashboard tile grids.
- Use cards only where hierarchy requires elevation.
- Keep navigation inside a simple top anchor bar; no persistent sidebar.
- Provide complete loading, empty, error and success states.
- Use tactile button states and concise labels.

### Motion direction

Use motion sparingly and only when it explains state:

- short boot fade
- subtle pointer-following ambient light
- section entrance transitions
- readiness ring progress
- staggered agent timeline rows
- training question/evaluation reveal
- restrained hover lift
- reduced-motion fallback with `prefers-reduced-motion`

The animation system must remain professional and avoid continuous noisy motion on every element.

## Single-page experience

1. **Analysis intake** — resume, target role and job description.
2. **Personal overview** — placement match, strengths, gaps, focus areas and profile evidence.
3. **Job analysis** — responsibilities, required/preferred skills, technologies, soft skills, signals and likely assessment rounds.
4. **Example questions** — concrete role-specific prompts before the practice step.
5. **Role Trainer** — inline mock test with MCQ, coding, technical, behavioral, project, system design and case/debug formats plus difficulty selection.
6. **Mock Interview** — inline conversational practice using the role's inferred interview questions.
7. **Agent trace** — collapsible execution timeline and runtime metrics.

There is no persistent sidebar and no separate page navigation state; the product is intentionally presented as a single guided journey.

## Security model

- NVIDIA NIM secret must only exist in a server-side environment variable named `NVIDIA_API_KEY`.
- Never create a `VITE_NVIDIA_API_KEY`.
- Never commit `.env` files.
- Validate request sizes and required inputs.
- Validate and normalize structured model outputs before exposing them to the UI.
- Sanitize provider/model errors before displaying them to users.
- Treat uploaded resume/job text as untrusted input and instruct agents not to follow instructions embedded inside the source documents.

## Failure handling

```text
Invalid input
  -> reject before model call

Model failure
  -> retry once with repair instruction

Invalid structured output
  -> normalize / reject

Repeated failure
  -> return contextual error

Missing NVIDIA NIM key
  -> deterministic demo mode
```

## Acceptance criteria

- Demo mode works without an NVIDIA NIM API key.
- Live mode works with a server-side NVIDIA NIM API key.
- Placement analysis produces structured role intelligence and skill gaps.
- Example interview questions are role-specific.
- Role Trainer generates the selected question type for the analysed job.
- Student can answer a generated question and receive structured evaluation.
- Agent Monitor exposes the workflow stages and metrics.
- UI is responsive on desktop and mobile.
- Reduced-motion mode is supported.
- `npm run check` and `npm run build` should pass in a properly installed local environment.
- The application is deployable to Vercel.
