# AI Interview Preparation Platform

An enterprise-grade, agentic AI-powered interview preparation platform designed and implemented as an academic capstone demonstration for:

> **Course:** Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
> **Live Deployed Application:** [https://ardent-prep.lovable.app](https://ardent-prep.lovable.app)  
> **Source Repository:** [https://github.com/bakia-adithyan-s/ardent-prep](https://github.com/bakia-adithyan-s/ardent-prep)  
> **Cloud Editor:** [Lovable Project Workspace](https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457)  

The platform prepares students and job seekers for rigorous technical and behavioral interviews through personalized question synthesis, sequential mock interviews, strict rubric-based AI answer grading, longitudinal coaching, and real-time execution telemetry.

---

## Architecture & End-to-End Workflow

Unlike standard chatbots or static UI mockups, the platform orchestrates a multi-step, human-in-the-loop agentic workflow:

```text
Candidate Profile + Target Role + Job Description
                      │
                      ▼
         [ 1. Interview Planning Agent ]
       (Generates tailored questions & rubric)
                      │
                      ▼
          [ Human Approval Gate ]
    (Candidate reviews, edits, prunes, approves)
                      │
                      ▼
            [ Mock Interview Session ]
         (Questions answered sequentially)
                      │
                      ▼
        [ 2. Interview Evaluation Agent ]
      (Strict scoring 0-10, strengths, gaps)
                      │
                      ▼
           [ Final Interview Report ]
                      │
                      ▼
        [ 3. Coaching & Progress Agent ]
   (Synthesizes history into targeted study plans)
```

---

## Live Links & Quick Access

- **Live Deployed Application:** [https://ardent-prep.lovable.app](https://ardent-prep.lovable.app)
- **Architecture & Capstone Deliverables:** [`Deliverables.md`](file:///d:/Study%20materials/sem7/IOC/2023103057_Bakia-Adithyan-s/Deliverables.md)
- **Original Project Specification:** [`Prompt.md`](file:///d:/Study%20materials/sem7/IOC/2023103057_Bakia-Adithyan-s/Prompt.md)

---

## Core Product Capabilities

### 1. Dashboard (`/dashboard`)
- Real-time summary of completed interview sessions, total practice count, and rolling average score.
- Dynamic greeting and date display.
- Category mastery breakdown (Technical, Coding, System Design, Behavioral).
- Historical score trend visualization.
- Quick link to resume pending or approved interviews.

### 2. Candidate Profile (`/profile`)
- Candidate portfolio management: education, graduation year, experience level.
- Technical taxonomy: skills, programming languages, technologies, and project descriptions.
- Raw resume text input used as foundational grounding data for interview synthesis.
- Server-side persistence via Supabase PostgreSQL.

### 3. Interview Creation (`/interviews/new`)
- Target role and complete job description input.
- Selection of interview format: Technical, Coding, System Design, Behavioral, or Mixed.
- Difficulty calibration (Easy, Medium, Hard) and question volume configuration.
- Real-time agent state visualization: `PROCESSING` → `VALIDATING` → `AWAITING_APPROVAL`.

### 4. Human-in-the-Loop Approval Gate (`/interviews/:id/plan`)
- Candidates inspect all generated questions, difficulty levels, categories, and expected concept rubrics before answering.
- Full editing capability: modify question phrasing, change categories, or remove irrelevant questions.
- One-click regeneration if the initial plan does not align with user goals.
- Explicit approval gate: mock interview sessions cannot be started without candidate sign-off.

### 5. Interactive Mock Interview (`/interviews/:id/session`)
- Clean, focused interface presenting one question at a time.
- Displays category, difficulty, and expected concept benchmarks.
- Markdown and multi-paragraph answer editor with character count validation.
- Real-time answer submission with server-side AI evaluation.

### 6. Comprehensive Interview Report (`/interviews/:id/report`)
- Aggregated session score and performance breakdown.
- Detailed question-by-question review displaying submitted answers, scores, strengths, weaknesses, and targeted feedback.
- Instant routing to coaching recommendations.

### 7. Longitudinal Coaching & Telemetry (`/progress`)
- Synthesizes evaluation history across multiple interviews.
- Highlights persistent strong areas, recurring weak areas, and prescribed study topics.
- Built-in agent telemetry table showing execution traces, agent identity, duration, outcome, and timestamps.
- Explicit **No Fabrication Rule**: displays `"No data yet"` until real evaluations are recorded.

### 8. Notifications & Practice Reminders (`/notifications`)
- In-app onboarding alerts and practice reminders triggered when candidates have been inactive for over 3 days.

---

## Tri-Agent Architecture

The system features **three specialized agents** coordinated by a deterministic backend orchestrator:

```text
+--------------------------------------------------------------------------+
|                        BACKEND ORCHESTRATOR                              |
|   (Manages state, DB transactions, trace IDs, and agent handoffs)        |
+---------------------+--------------------+-------------------------------+
                      |                    |
        +-------------+      +-------------+      +-------------+
        |                    |                    |             |
        v                    v                    v             v
+---------------+    +---------------+    +---------------+  +----------+
| Agent 1       |    | Human Gate    |    | Agent 2       |  | Agent 3  |
| Interview     |───>| Review, Edit, |───>| Interview     |─>| Coaching |
| Planning      |    | & Approve     |    | Evaluation    |  | Progress |
+---------------+    +---------------+    +---------------+  +----------+
```

### Agent 1 — Interview Planning Agent (`interview_planning`)
- **Responsibility:** Ingests candidate profile and job description to construct an interview curriculum.
- **Grounding Rule:** Never hallucinates or invents experiences/companies not present in the candidate profile.
- **Output:** Validated JSON array of questions with categories, difficulty ratings, and expected concepts.

### Agent 2 — Interview Evaluation Agent (`interview_evaluation`)
- **Responsibility:** Grades candidate submissions against expected conceptual rubrics.
- **Scoring:** Strict 0–10 scale with concrete strengths, weaknesses, and corrective feedback.
- **Safety:** Automatically scores meta-prompts and prompt injection attempts as 0.

### Agent 3 — Coaching & Progress Agent (`coaching_progress`)
- **Responsibility:** Identifies systemic patterns across past interview performances.
- **Output:** Categorized summary of strengths, deficiencies, study topics, and practice regimens.
- **Integrity:** Never displays synthetic or placeholder progress data.

### The Backend Orchestrator (`orchestrator.server.ts`)
- Coordinates the lifecycle between agents, database records, and UI views.
- Generates a UUID `trace_id` for each workflow run.
- Persists telemetry records to `agent_runs` with sub-millisecond execution timestamps.
- *Note:* The Orchestrator is a control plane component, **not a fourth agent**.

---

## Security Model & AI Safety

1. **Server-Side AI Isolation:** All LLM invocations occur in server functions (`agents.server.ts`, `llm.server.ts`). API keys are never bundled into client-side code.
2. **Prompt Injection Defense:** User-supplied resumes, job descriptions, and answers are sanitized and enclosed in `<untrusted name="...">` boundary envelopes accompanied by strict system guardrails.
3. **Database Row Level Security (RLS):** PostgreSQL tables enforce per-user isolation:
   ```sql
   CREATE POLICY "own interviews" ON public.interviews
     FOR ALL TO authenticated
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());
   ```
4. **Structured Output Validation:** AI responses are parsed and verified using strict Zod schemas before being accepted or stored.

---

## Database Schema

Managed through Supabase PostgreSQL and Drizzle migrations:

- `profiles` — Candidate demographics, skills, languages, projects, and resume text.
- `interviews` — Interview sessions, target role, job description, status, and overall score.
- `interview_questions` — Approved questions, categories, difficulties, and expected concepts.
- `answers` — Candidate answer submissions.
- `evaluations` — AI evaluation records, scores (0–10), strengths, and feedback.
- `recommendations` — Coaching summaries, weak areas, and recommended study topics.
- `notifications` — In-app alerts and practice reminders.
- `agent_runs` — Observability audit log with `trace_id`, `agent`, `state`, `duration_ms`, and `success`.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Web Frontend** | React 19, TanStack Router, TanStack Query, Tailwind CSS, Lucide Icons, Sonner Toasts |
| **Backend & SSR** | TanStack Start, Nitro Server runtime, Node.js v22 |
| **AI & LLM Gateway** | Vercel AI SDK, Lovable AI Gateway (OpenAI GPT models), Zod Schemas |
| **Database & Auth** | PostgreSQL on Supabase, Row Level Security (RLS), Supabase Auth |
| **Hosting & CI/CD** | Lovable Cloud Edge CDN, GitHub |

---

## Getting Started Locally

### Prerequisites
- Node.js v20+ or v22+
- npm or bun

### 1. Clone the Repository
```bash
git clone https://github.com/bakia-adithyan-s/ardent-prep.git
cd ardent-prep
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL="https://isyuwpgfzgvzfmvbmxuc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_aeSJHRRxetht2q-C--_weg_B-NZ0BkQ"
SUPABASE_URL="https://isyuwpgfzgvzfmvbmxuc.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_aeSJHRRxetht2q-C--_weg_B-NZ0BkQ"
SUPABASE_PROJECT_ID="isyuwpgfzgvzfmvbmxuc"
LOVABLE_API_KEY="your-server-side-api-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## Capstone Deliverables Summary

Detailed documentation for all five academic deliverables is provided in [`Deliverables.md`](file:///d:/Study%20materials/sem7/IOC/2023103057_Bakia-Adithyan-s/Deliverables.md):

1. **Architecture Diagram** — Seven-layer system architecture, major component matrix, and trust boundaries.
2. **Agent Workflow Design** — Tri-agent lifecycle, Human-in-the-Loop gate, handoffs, and recovery mechanisms.
3. **Deployment Strategy** — Continuous deployment pipeline, edge hosting architecture, and resilience model.
4. **Security Model** — Supabase Auth, Row Level Security policies, prompt injection sanitization, and auditability.
5. **Monitoring Dashboard Design** — Health, trace correlation, quality indicators, safety checks, and the `agent_runs` telemetry model.

---

## Academic Scope & Ethical Boundaries

This platform is developed strictly as an educational and preparation tool for candidates. It is **not** a hiring decision engine, does not rank candidates for employers, and does not make automated employment determinations.
