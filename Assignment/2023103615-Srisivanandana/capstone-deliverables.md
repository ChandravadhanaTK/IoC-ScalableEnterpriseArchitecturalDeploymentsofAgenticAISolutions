# Campus Copilot · Capstone Deliverables

### Live Application

🌐 **[Launch Campus Copilot](https://campus-copilot-srisivanandana.streamlit.app/)**

The application is deployed using Streamlit Community Cloud and uses Supabase for authentication, PostgreSQL persistence, and Row Level Security.

### Demo Login

For quick evaluation, use the following dedicated demo account:

- **Email:** `user@gmail.com`
- **Password:** `user@123`

After signing in, the evaluator can explore the Dashboard, Copilot, Academics, Placements, Calendar, Study Progress, and Tasks modules.

**Multi-user student assistant** · Streamlit · Supabase Auth · PostgreSQL with RLS

Campus Copilot uses the authenticated student's UUID to retrieve and update only that student's campus data. `campus_data.json` is retained only as an opt-in demo seed.

## 01 · System Architecture

![Campus Copilot multi-user architecture](IOC%20Project/docs/architecture.svg)

*The OpenAI API provides optional reasoning. Campus Tools use the authenticated session, and Supabase Row Level Security enforces record ownership.*

## Deliverables at a Glance

| Artifact | What it demonstrates |
| --- | --- |
| **Architecture Diagram** | Authenticated request flow, agent reasoning, controlled tools, Supabase persistence, and the response loop. |
| **Agent Workflow Design** | Observe → retrieve → reason → prioritize → act → respond, including mutation approval and fallback behavior. |
| **Deployment Strategy** | Streamlit Community Cloud deployment with Supabase-managed authentication and PostgreSQL storage. |
| **Security Model** | Supabase Auth, user-scoped tool access, RLS policies, secret handling, and agent mutation safeguards. |
| **Monitoring Dashboard Design** | Proposed availability, latency, agent quality, safety, cost, data health, and user outcome signals. |

## 02 · Agent Workflow

| Stage | Campus Copilot behavior |
| --- | --- |
| **Observe** | Interpret the request and identify whether it asks for a read or a task change. |
| **Retrieve** | Use allowlisted tools to fetch only the authenticated user's schedule, assignments, exams, placements, study progress, tasks, and events. |
| **Reason** | Weigh deadlines, priority, exam proximity, study mastery, and available time. |
| **Fallback** | If OpenAI is unavailable, supported requests use deterministic local planning. Missing Supabase configuration/schema stops data access and shows setup guidance. |
| **Act** | Create or complete a task only when explicitly requested. The session-bound store supplies identity; the model cannot choose a user ID. |
| **Respond** | Return a concise recommendation, rationale, or confirmed task result. |

## 03 · Deployment

| Step | Action |
| --- | --- |
| **1 · Provision** | Create a Supabase project and run [`supabase/schema.sql`](../supabase/schema.sql) in its SQL Editor. |
| **2 · Configure** | Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Streamlit secrets. Add `OPENAI_API_KEY` optionally. |
| **3 · Deploy** | Deploy `app.py` on Streamlit Community Cloud; no separate application backend is required. |
| **4 · Verify** | Test sign-up, sign-in/out, user-owned CRUD, demo seeding, agent task actions, and RLS with two accounts. |

| Configuration rule | Requirement |
| --- | --- |
| **Supabase key** | Use only the anon/public key. Never expose or configure a service-role key in the app. |
| **Secret files** | Keep `.streamlit/secrets.toml` and `.env` outside source control. |
| **Demo seed** | An authenticated user with an empty workspace may explicitly load `campus_data.json`; seeded rows use that user's UUID. Normal reads and writes use Supabase only. |

## 04 · Security Model

| Control | Implementation |
| --- | --- |
| **Identity** | Supabase email/password Auth; `auth.users.id` is the workspace identity. Passwords are never copied into application tables. |
| **Profile** | Signup trigger creates `profiles.id` matching the Auth UUID and stores only name, email, course, and semester. |
| **Authorization** | RLS is enabled on `profiles`, `classes`, `assignments`, `exams`, `placements`, `study_progress`, `tasks`, and `events`. Policies require `user_id = auth.uid()`; profiles require `id = auth.uid()`. |
| **Tool boundary** | The authenticated session binds the data store. LLM tool schemas do not accept `user_id`; task mutations also require an explicit request. |
| **Secrets** | Supabase and OpenAI credentials are read from Streamlit secrets or environment variables, never hardcoded. |
| **Release check** | Before public use, apply the schema, confirm email/redirect settings, and run a live two-account RLS test. Mocked local tests do not prove deployed policies are configured correctly. |

## 05 · Monitoring Dashboard Design

| Signal | Watch for | Response |
| --- | --- | --- |
| **Availability & latency** | Health checks; p50/p95 response time | Inspect service health; enforce request timeouts. |
| **Agent quality** | Tool failures, invalid arguments, fallback rate, empty answers | Review traces and tool contracts without logging student records. |
| **Safety** | RLS denials, unauthorized mutation attempts, validation failures | Review policy configuration and authorization paths. |
| **Cost** | Request volume, token use, estimated spend | Alert on budget thresholds and anomalous traffic. |
| **Data & outcomes** | Supabase errors, task completion, accepted plans, feedback | Reconcile authorized changes; improve prioritization using privacy-reviewed aggregates. |
| **Implementation status** | Monitoring is a design only; telemetry is not collected yet. | Define alert ownership, retention, and response procedures. |

## Acceptance Checks

| Check | Expected result |
| --- | --- |
| **Configure Supabase** | Secrets are set and the schema has been applied. |
| **Two-user isolation** | Each real user can read and mutate only their own records. |
| **Demo seeding** | Seed records are copied only into the requesting user's workspace. |
| **Agent task actions** | Created/completed tasks appear immediately in that user's Tasks page. |
| **Secret and privacy review** | No service-role key, password, or private student data is committed or logged. |

| Local verification | Command |
| --- | --- |
| **Mocked ownership and schema tests** | `python -m unittest discover -s tests -v` |
