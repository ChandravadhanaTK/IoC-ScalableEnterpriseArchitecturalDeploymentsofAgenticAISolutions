# Campus Copilot

## Overview
Campus Copilot is a lightweight AI-powered student assistant built in Python and Streamlit. It helps students manage daily priorities, assignments, exams, campus events, placement tasks, and study preparation in one dashboard.

## Features
- Daily priority planning from classes, deadlines, and placement tasks
- Placement tracker for OAs, interviews, and application stages
- Assignment and exam overview
- Study-progress monitoring with weak-topic recommendations
- Task creation and completion tracking
- Copilot chat interface with tool-aware reasoning
- Graceful fallback when the OpenAI API is unavailable

## Architecture
Streamlit UI and Supabase Auth
    ↓
Authenticated Supabase user ID
    ↓
Campus Copilot Agent and user-bound tools
    ↓
Supabase PostgreSQL with Row Level Security

`campus_data.json` is retained only as the source for the explicit **Load Demo Data** action. The application does not read or write it for normal workspace operations.

See [Capstone Deliverables](docs/capstone-deliverables.md) for the architecture diagram, agent workflow, deployment strategy, security model, and monitoring dashboard design.

For a live reviewer presentation, open the app with `?view=capstone` appended to its URL (for example, `http://localhost:8503/?view=capstone`). This keeps the capstone artifacts available without adding them to the student-facing navigation.

## Supabase Setup

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the required tables, signup profile trigger, grants, and RLS policies.
3. In Supabase Auth settings, configure the email confirmation behavior and allowed redirect URLs for local development and Streamlit Community Cloud.
4. Copy `.streamlit/secrets.toml.example` to `.streamlit/secrets.toml` and enter your project URL, Supabase anon/public key, and optional OpenAI key:

```toml
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-supabase-anon-key"
OPENAI_API_KEY = "your-openai-api-key"
```

Use the Supabase **anon/public** key only. Never put a service-role key in this Streamlit app. `.streamlit/secrets.toml` and `.env` are ignored by Git.

## Local Setup
```bash
python -m pip install -r requirements.txt
streamlit run app.py
```

Without valid Supabase URL/key and an applied schema, the app intentionally stays at its configuration/login screen and does not expose the old shared JSON sample records.

## Authentication and Demo Data

- Users create accounts and sign in with Supabase email/password Auth.
- Signup asks for full name, email, password, course, and semester only. Supabase Auth stores the password; a database trigger creates the profile keyed by `auth.users.id`.
- New accounts can load sample records into their own workspace or enter the existing pages and add their own records.
- All data requests use the authenticated user's session token and UUID. RLS policies enforce ownership in PostgreSQL; the service-role key is never used by the app.
- To verify isolation in a configured project, create two real test accounts, load/enter distinct records in each, and confirm account A cannot read, change, or delete account B's records. The included Python tests mock PostgREST and verify application scoping; they do not substitute for live Supabase RLS testing.

## Deployment
To deploy on Streamlit Community Cloud:

1. Push the repository to GitHub.
2. Open Streamlit Community Cloud.
3. Select the repository.
4. Choose `app.py` as the app entrypoint.
5. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` under app secrets; optionally add `OPENAI_API_KEY`.
6. Apply `supabase/schema.sql` to the Supabase project before testing sign-up.
7. Deploy the app.
8. Open the generated public URL.

## Demo
Suggested demo prompts:

```text
What should I focus on today?

What placement activities do I have coming up?

I couldn't study yesterday. Replan my next three days.

Add a task to prepare for my LoadShare OA tomorrow.
```

Run the local isolation tests with:

```bash
python -m unittest discover -s tests -v
```
