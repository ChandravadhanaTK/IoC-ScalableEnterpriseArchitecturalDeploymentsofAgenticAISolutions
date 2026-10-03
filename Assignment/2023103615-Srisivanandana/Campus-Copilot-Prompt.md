# Build the Campus Copilot — Intelligent Student Campus Assistant

Build a production-ready MVP called **Campus Copilot**, a multi-user agentic AI assistant designed to help university students manage academics, placements, schedules, study progress, tasks, and campus activities.

The application should provide a personalized student workspace where users can ask natural-language questions and receive recommendations based on their own campus data.

The AI agent must be capable of:

- Understanding natural-language student requests
- Selecting appropriate tools
- Retrieving user-specific information
- Reasoning over retrieved information
- Prioritizing relevant information
- Generating personalized recommendations
- Performing actions when explicitly requested
- Persisting changes to the user's database
- Returning the result to the student

The final application must be a genuine multi-user agentic application rather than a static dashboard or simple chatbot.

---

# 1. TECH STACK

Use the following technologies:

- Frontend/UI: Streamlit
- Programming Language: Python 3.11+
- AI/LLM: OpenAI API
- Backend/Auth/Database: Supabase
- Authentication: Supabase Auth
- Database: PostgreSQL through Supabase
- Database Security: PostgreSQL Row Level Security (RLS)
- Supabase Python Client: `supabase-py`
- Configuration: Streamlit Secrets
- Demo seed data: JSON
- Version Control: GitHub
- Deployment: Streamlit Community Cloud

Do NOT introduce unnecessary frameworks such as:

- React
- Next.js
- FastAPI
- Firebase
- Node.js
- Vector databases
- RAG pipelines
- Microservices
- Multiple autonomous agents

Keep the architecture simple, modular, reliable, and appropriate for a deployable MVP.

---

# 2. PRODUCT GOAL

Campus Copilot should function as an intelligent personal campus companion for university students.

The application should help students:

- View their academic information
- Track assignments and deadlines
- View upcoming examinations
- Track placement opportunities and deadlines
- View their daily schedule
- Monitor study progress
- Manage personal tasks
- View campus events
- Ask the AI Copilot for personalized recommendations
- Ask the Copilot to create or complete tasks
- Receive recommendations based on their own data

The application must support multiple authenticated users.

Each user's data must remain isolated from every other user's data.

---

# 3. GLOBAL DESIGN SYSTEM

Create a modern premium SaaS-style student dashboard.

Visual direction:

- Overall background: near-black / dark
- Primary accent: neon/lime green
- Secondary accent: purple
- Cards: dark charcoal
- Primary text: white
- Secondary text: muted gray
- Borders: subtle dark/green borders
- Rounded cards
- Modern spacing
- Soft hover effects
- Clean typography
- Minimal visual clutter
- Consistent visual language across all pages

The application should feel like a modern AI productivity platform rather than a default Streamlit application.

Use custom CSS where appropriate to improve the Streamlit UI.

---

# 4. AUTHENTICATION AND USER ACCOUNTS

Implement multi-user authentication using Supabase Auth.

Authentication requirements:

- Email/password signup
- Email/password login
- Logout
- Session handling
- Protected application pages
- Authenticated user identification
- User-specific database queries

Signup should collect only essential information:

- Full name
- Email
- Password
- Course
- Semester

Do not require students to manually enter all academic, placement, task, or study information during signup.

After authentication, the user should enter their personal Campus Copilot workspace.

Each authenticated user must have a unique Supabase Auth user ID.

Never manually store passwords in PostgreSQL tables.

Never allow the LLM to provide or choose a `user_id`.

The authenticated user's ID must always be obtained from the active Supabase authentication session.

---

# 5. USER PROFILE

Create a `profiles` table associated with:

`auth.users(id)`

Profile information should include:

- id
- full_name
- email
- course
- semester
- created_at
- updated_at

The profile ID should correspond to the authenticated Supabase user ID.

Automatically create a profile when a new user signs up.

Signup metadata may be used to initialize:

- full_name
- course
- semester

Do not collect unnecessary personal information.

---

# 6. MULTI-USER DATA ISOLATION

Campus Copilot must be a true multi-user application.

Every user-owned table must contain:

`user_id`

referencing:

`auth.users(id)`

Users must only be able to access their own records.

Enable Row Level Security on all user-owned tables.

Policies should enforce:

`user_id = auth.uid()`

For the `profiles` table:

`id = auth.uid()`

Users should be able to:

- Read their own data
- Create their own records
- Update their own records
- Delete their own records where appropriate

Users must never be able to access another user's:

- Academic information
- Assignments
- Exams
- Placement information
- Study progress
- Tasks
- Events

---

# 7. DATABASE SCHEMA

Create the following main tables in Supabase PostgreSQL.

## 7.1 profiles

Stores authenticated student profile information.

Fields:

- id
- full_name
- email
- course
- semester
- created_at
- updated_at

---

## 7.2 classes

Stores the student's classes and schedule.

Example fields:

- id
- user_id
- subject
- instructor
- date
- start_time
- end_time
- room
- created_at

---

## 7.3 assignments

Stores academic assignments.

Fields should support:

- id
- user_id
- title
- subject
- description
- deadline
- priority
- status
- created_at
- updated_at

---

## 7.4 exams

Stores upcoming examinations.

Fields should support:

- id
- user_id
- subject
- exam_name
- exam_date
- exam_time
- venue
- priority
- status

---

## 7.5 placements

Stores placement opportunities and deadlines relevant to the student.

Fields should support:

- id
- user_id
- company
- role
- application_deadline
- assessment_date
- status
- description
- created_at

Do not invent placement opportunities or deadlines.

The agent must only use placement information available in the database or explicitly provided by the user.

---

## 7.6 study_progress

Stores study progress.

Fields should support:

- id
- user_id
- subject
- progress_percentage
- hours_studied
- target_hours
- last_studied
- updated_at

---

## 7.7 tasks

Stores personal tasks created by the student or Campus Copilot.

Fields:

- id
- user_id
- title
- deadline
- priority
- status
- source
- created_at
- updated_at

The `source` field should distinguish between manually created tasks and agent-created tasks.

Example values:

- `manual`
- `agent`

In the UI, display agent-created tasks naturally as:

**Added by Campus Copilot**

Do not expose unnecessary internal implementation terminology to normal students.

---

## 7.8 events

Stores campus events relevant to the authenticated student.

Fields should support:

- id
- user_id
- title
- description
- event_date
- event_time
- venue
- status

---

# 8. DEMO DATA

Maintain a `campus_data.json` file only as a source of sample/demo data.

It must NOT be treated as the production database.

The production database is Supabase PostgreSQL.

Provide a:

**Load Demo Data**

feature for convenient demonstrations.

When the authenticated user selects:

**Load Demo Data**

the application should copy sample data from `campus_data.json` into that authenticated user's Supabase records.

Demo data must be inserted with the current authenticated user's ID.

Do not create a shared global demo dataset visible to all users.

Clearly identify demo data as sample data.

The demo-data feature must not overwrite or delete a user's existing real data unless the user explicitly confirms such an action.

---

# 9. MAIN APPLICATION NAVIGATION

Create a fixed left sidebar with modern dark styling.

Main navigation:

- Dashboard
- Copilot
- Academics
- Placements
- Calendar
- Study Progress
- Tasks

The navigation should be consistent across the application.

Do not expose internal implementation pages such as database administration or development utilities to normal students.

---

# 10. DASHBOARD

Create a personalized student dashboard.

## Greeting

Example:

> Good morning, Srisivanandana 👋

Use the authenticated user's name.

## Overview Cards

Show useful student metrics such as:

- Pending assignments
- Upcoming exams
- Placement deadlines
- Study progress

## Today's Priorities

Show the most relevant things the student should focus on today.

## Upcoming

Display relevant:

- Assignments
- Exams
- Placement deadlines
- Events

## Recommended Plan

Include a section titled:

**Your recommended plan**

This should be based on actual user data.

Do not hard-code recommendations that ignore the student's database state.

---

# 11. COPILOT PAGE

Create the main AI assistant interface.

The Copilot should allow natural-language student requests such as:

- "What should I focus on today?"
- "What placement-related things do I have coming up?"
- "What should I study tonight?"
- "I couldn't study yesterday. Replan my next three days."
- "Add a task to prepare for my LoadShare OA tomorrow."
- "I finished my AI assignment."

The UI should clearly distinguish:

- Student messages
- Copilot responses
- Tool activity
- Actions performed

Include a polished chat experience.

---

# 12. AGENTIC AI ARCHITECTURE

Campus Copilot must implement a genuine agentic workflow rather than simply sending every message to an LLM.

The agent should follow this conceptual loop:

Observe
↓
Understand request
↓
Retrieve relevant data
↓
Reason and prioritize
↓
Recommend
↓
Act when explicitly requested
↓
Update database
↓
Respond to student

The Agent Orchestrator should:

1. Understand the user's request.
2. Determine whether campus data is required.
3. Select appropriate tools.
4. Retrieve relevant user-specific data.
5. Reason over the retrieved information.
6. Prioritize relevant information.
7. Generate a personalized recommendation.
8. Perform an action only when the student explicitly requests it.
9. Update Supabase when an action changes user data.
10. Return the result to the student.

---

# 13. AGENT TOOLS

Implement controlled tools for the agent.

Required tools:

- `get_today_schedule()`
- `get_pending_assignments()`
- `get_upcoming_exams()`
- `get_placement_deadlines()`
- `get_study_progress()`
- `get_tasks()`
- `create_task(title, deadline, priority)`
- `complete_task(task_id)`

Tools may also include appropriate event retrieval functionality.

Every tool must automatically operate on the authenticated user's data.

The LLM must never be trusted to supply an arbitrary user ID.

The current authenticated user ID must come from the Supabase session.

---

# 14. TOOL SELECTION

The agent should choose tools based on the user's request.

## Example 1

User:

> What should I focus on today?

Agent should consider:

- Today's schedule
- Pending assignments
- Upcoming exams
- Placement deadlines
- Study progress
- Existing tasks

Then reason over the results.

---

## Example 2

User:

> What placement-related things do I have coming up?

Agent should retrieve:

`get_placement_deadlines()`

and summarize relevant deadlines.

---

## Example 3

User:

> What should I study tonight?

Agent should retrieve relevant:

- Assignments
- Exams
- Study progress

and provide a prioritized study recommendation.

---

## Example 4

User:

> Add a task to prepare for my LoadShare OA tomorrow.

Agent should:

1. Understand the request.
2. Create the task.
3. Store it in Supabase.
4. Confirm the action.

---

# 15. AGENT ACTIVITY

Provide an expandable:

**Agent Activity**

section.

It should show concise, human-readable activity such as:

- ✓ Checked pending assignments
- ✓ Checked upcoming exams
- ✓ Checked placement deadlines
- ✓ Compared study progress
- ✓ Created task

Do not expose:

- API keys
- Authentication tokens
- Database credentials
- Raw secret information
- Unnecessary internal implementation details

---

# 16. AGENT REASONING EXPLANATION

When appropriate, explain:

**Why this is a priority**

The explanation should be based on retrieved student data.

Possible reasons include:

- Approaching deadline
- Upcoming exam
- Low study progress
- Placement assessment deadline
- Unfinished task

Do not fabricate reasons or deadlines.

---

# 17. DETERMINISTIC FALLBACK

Implement a local deterministic fallback for supported requests when the OpenAI API is unavailable or cannot be used.

The fallback should:

- Use the student's retrieved data
- Apply simple rule-based prioritization
- Generate useful recommendations
- Never pretend that an LLM was used

Example prioritization factors:

1. Immediate deadlines
2. Upcoming exams
3. Placement deadlines
4. Incomplete assignments
5. Low study progress
6. Existing tasks

Keep the fallback simple and reliable.

Do not introduce another AI model unless necessary.

---

# 18. ACADEMICS PAGE

Create an academic dashboard.

## Classes

Show:

- Subject
- Instructor
- Date
- Time
- Room

## Assignments

Show:

- Assignment
- Subject
- Deadline
- Priority
- Status

Use visual indicators for approaching deadlines.

## Exams

Show:

- Subject
- Exam
- Date
- Time
- Venue
- Status

All information must come from the authenticated user's Supabase data.

---

# 19. PLACEMENTS PAGE

Create a dedicated placement dashboard.

Show:

- Company
- Role
- Application deadline
- Assessment date
- Status

Highlight upcoming deadlines.

Do not scrape or invent external placement information in the MVP.

The application should only display placement data stored for the authenticated student.

---

# 20. CALENDAR PAGE

Create a calendar-style view combining relevant user information:

- Classes
- Assignments
- Exams
- Placement deadlines
- Campus events
- Personal tasks

Use clear visual distinctions between categories.

---

# 21. STUDY PROGRESS PAGE

Show personalized study progress.

Include:

- Overall study progress
- Subject-wise progress
- Hours studied
- Target hours
- Last studied date

Use clean progress bars or charts where useful.

The Copilot should be able to use this information when making study recommendations.

---

# 22. TASKS PAGE

Create a task management interface.

Each task should display:

- Title
- Deadline
- Priority
- Status
- Source

Support:

- Create task
- Complete task
- View pending tasks
- View completed tasks

Agent-created tasks should be clearly identified as:

**Added by Campus Copilot**

The agent should be able to create and complete tasks through controlled tools.

---

# 23. UI QUICK ACTIONS

Provide useful quick prompts on the Copilot page.

Examples:

- What should I focus on today?
- What should I study tonight?
- Show my placement deadlines
- Plan my next 3 days
- Show my pending tasks

Quick prompt buttons must be fully functional.

---

# 24. LOADING AND ERROR STATES

Provide clear states for:

- Loading
- Authentication failure
- Database connection failure
- OpenAI API failure
- Empty data
- Tool failure
- Invalid request

Errors should be understandable to students.

Do not expose stack traces or secret information to normal users.

---

# 25. SECURITY REQUIREMENTS

Security is a core requirement.

Never expose:

- Supabase secret/service-role keys
- Database passwords
- OpenAI API keys
- User passwords
- Authentication tokens

Use only the Supabase publishable/anon key for normal application access.

Use RLS for database protection.

Never use the Supabase service-role key for ordinary user-scoped operations.

Never allow an LLM-generated `user_id` to determine database access.

Always derive the user identity from the authenticated Supabase session.

---

# 26. SUPABASE RLS

Enable Row Level Security on every user-owned table.

Policies must enforce authenticated user ownership.

Examples:

`user_id = auth.uid()`

For profiles:

`id = auth.uid()`

Test that:

- User A cannot read User B's assignments.
- User A cannot modify User B's tasks.
- User A cannot read User B's placement information.
- User A cannot read User B's study progress.
- User A cannot modify User B's records.

---

# 27. DATABASE TRIGGER

Create an appropriate Supabase database trigger to automatically create a profile after a new user signs up.

Signup metadata may populate:

- full_name
- course
- semester

The trigger must not expose sensitive information.

---

# 28. DEMO EXPERIENCE

Provide a simple first-use experience.

After signup/login, allow the user to choose:

**✨ Load Demo Data**

or:

**+ Add My Campus Data**

The demo option should immediately populate the authenticated user's workspace with sample data.

The production application must not require users to manually enter every piece of academic information just to explore the application.

For deployment, retain the ability for real users to add their own information.

---

# 29. EMPTY STATE EXPERIENCE

For a new user with no data, show useful empty states.

Examples:

> No assignments yet.

> No upcoming exams.

> No placement deadlines added.

> Your study progress will appear here once you start tracking it.

Provide appropriate actions such as:

- Add assignment
- Add exam
- Add task
- Load Demo Data

---

# 30. DEPLOYMENT

Deploy the application using:

**Streamlit Community Cloud**

The application should run from GitHub.

Required deployment secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Do not commit actual secrets to GitHub.

Provide:

`.streamlit/secrets.toml.example`

with placeholder values.

The actual:

`.streamlit/secrets.toml`

must be excluded using `.gitignore`.

Use Python 3.11+ and ensure the selected Streamlit Cloud Python version is compatible with all dependencies.

### Live Application

🌐 **[Launch Campus Copilot](https://campus-copilot-srisivanandana.streamlit.app/)**

The application is deployed using Streamlit Community Cloud and uses Supabase for authentication, PostgreSQL persistence, and Row Level Security.

### Demo Login

For quick evaluation, use the following dedicated demo account:

- **Email:** `user@gmail.com`
- **Password:** `user@123`

After signing in, the evaluator can explore the Dashboard, Copilot, Academics, Placements, Calendar, Study Progress, and Tasks modules.

---

# 31. GITHUB PROJECT STRUCTURE

The project should be organized as:

RollNum-Name/
│
├── Campus-Copilot/
│   ├── app.py
│   ├── agent.py
│   ├── tools.py
│   ├── supabase_store.py
│   ├── campus_data.json
│   ├── requirements.txt
│   ├── README.md
│   │
│   ├── .streamlit/
│   │   └── secrets.toml.example
│   │
│   ├── supabase/
│   │   └── schema.sql
│   │
│   └── docs/
│       └── architecture.svg
│
├── Campus-Copilot-Prompt.md
│
└── Campus-Copilot-Deliverables.md

Never commit:

- `.streamlit/secrets.toml`
- `.env`
- `__pycache__/`
- `*.pyc`
- API keys
- Database passwords
- Authentication secrets

---

# 32. SYSTEM ARCHITECTURE

The architecture should represent:

Student
↓
Streamlit UI
↓
Agent Orchestrator
├── OpenAI API
├── Deterministic Fallback
↓
Campus Tools
↓
Supabase
├── Supabase Auth
├── PostgreSQL
├── Row Level Security
└── User-scoped data

The return flow should be:

Supabase
↓
Campus Tools
↓
Agent Orchestrator
↓
Personalized recommendation / action result
↓
Streamlit UI
↓
Student

The architecture should clearly communicate that Supabase is the production persistence and authentication layer.

`campus_data.json` is only optional demo seed data and must not be represented as the production database.

---

# 33. AGENTIC BEHAVIOR REQUIREMENTS

The system should demonstrate the major characteristics of an agentic application.

## Perception

Understand the student's natural-language request.

## Planning

Determine what information is required.

## Tool Selection

Select appropriate campus tools.

## Retrieval

Retrieve relevant user-specific information from Supabase.

## Reasoning

Compare and prioritize retrieved information.

## Recommendation

Generate a personalized recommendation.

## Action

Perform an action when explicitly requested.

## State / Memory

Persist user changes in Supabase.

## Feedback

Return the result of the action to the student.

The agent should not merely answer questions from a static prompt.

---

# 34. EXAMPLE AGENT SCENARIOS

## Scenario 1 — Daily Prioritization

Student:

> What should I focus on today?

Copilot should:

- Check today's schedule
- Check pending assignments
- Check upcoming exams
- Check placement deadlines
- Check study progress
- Check tasks
- Prioritize the student's work
- Explain why the priorities were selected

---

## Scenario 2 — Placement Planning

Student:

> What placement-related things do I have coming up?

Copilot should:

- Retrieve placement deadlines
- Identify upcoming assessments
- Summarize relevant items
- Suggest preparation actions when appropriate

---

## Scenario 3 — Study Planning

Student:

> What should I study tonight?

Copilot should:

- Check upcoming exams
- Check pending assignments
- Check study progress
- Prioritize subjects
- Produce a practical study plan

---

## Scenario 4 — Replanning

Student:

> I couldn't study yesterday. Replan my next three days.

Copilot should:

- Check current academic workload
- Check upcoming deadlines
- Check study progress
- Reorganize the plan
- Provide a realistic three-day plan

---

## Scenario 5 — Agent Action

Student:

> Add a task to prepare for my LoadShare OA tomorrow.

Copilot should:

- Understand the request
- Create the task in Supabase
- Associate it with the authenticated user
- Set the requested deadline
- Confirm that the task was created

---

## Scenario 6 — Completing Work

Student:

> I finished my AI assignment.

Copilot should:

- Identify the relevant task or assignment
- Update the appropriate status when unambiguous
- Confirm the update

If the request is ambiguous, ask the student for clarification rather than modifying the wrong record.

---

# 35. DATA INTEGRITY REQUIREMENTS

Never invent:

- Assignment deadlines
- Exam dates
- Placement deadlines
- Companies
- Events
- Student progress
- Tasks
- Academic information

When information is unavailable, explicitly state that it is unavailable.

Recommendations must be based on retrieved user data.

---

# 36. TESTING

Test the following.

## Authentication

- Signup
- Login
- Logout
- Invalid credentials
- Existing account
- Session persistence

## Database

- Profile creation
- User-specific data creation
- User-specific reads
- User-specific updates
- RLS isolation

## Agent

- Tool selection
- Tool execution
- Personalized recommendations
- Task creation
- Task completion
- Fallback behavior
- Error handling

## Multi-user Isolation

Create at least two test users.

Verify:

User A → only User A data

User B → only User B data

No cross-user data must be visible.

---

# 37. CODE QUALITY

Keep the application modular.

Suggested responsibilities:

`app.py`

Streamlit UI and page routing.

`agent.py`

Agent orchestration and LLM interaction.

`tools.py`

Campus tools and controlled actions.

`supabase_store.py`

Supabase database operations.

`campus_data.json`

Demo seed data.

`supabase/schema.sql`

Database schema and RLS policies.

Avoid placing the entire application in one Python file.

Use clear function names and comments where appropriate.

---

# 38. DOCUMENTATION

Provide a README containing:

- Project overview
- Problem statement
- Proposed solution
- Features
- Architecture
- Technology stack
- Authentication
- Database design
- RLS/security
- Agent workflow
- Agent tools
- Demo data
- Setup instructions
- Secrets configuration
- Supabase setup
- Running locally
- Loading demo data
- Deployment instructions
- Testing
- Security considerations

---

# 39. FINAL ACCEPTANCE CRITERIA

The application is complete when all of the following work:

- Student can sign up.
- Student can log in.
- Student receives a personal profile.
- Student can log out.
- Student can load demo data.
- Demo data is copied into the authenticated user's Supabase records.
- Student can view the dashboard.
- Student can view assignments.
- Student can view exams.
- Student can view placements.
- Student can view calendar information.
- Student can view study progress.
- Student can manage tasks.
- Student can use the AI Copilot.
- Copilot can retrieve user-specific information.
- Copilot can select appropriate tools.
- Copilot can reason over retrieved information.
- Copilot can provide personalized recommendations.
- Copilot can create tasks when explicitly requested.
- Copilot can complete tasks when explicitly requested.
- Agent Activity is visible.
- Deterministic fallback works for supported requests.
- Supabase RLS prevents cross-user data access.
- No secrets are committed to GitHub.
- Application runs successfully on Streamlit Community Cloud.
- Two different users can use the application independently.

---

# 40. FINAL PRODUCT GOAL

Produce a polished, deployable, multi-user **Campus Copilot** that combines:

- Student productivity
- Academic planning
- Placement preparation
- Study progress tracking
- Task management
- Personalized recommendations
- Agentic AI
- Supabase authentication
- PostgreSQL persistence
- Row Level Security
- Streamlit UI
- OpenAI-powered reasoning
- Deterministic fallback planning

The final product should feel like a genuine intelligent student companion rather than a static dashboard or simple chatbot.

The key differentiator is the agentic workflow:

**Understand → Retrieve → Reason → Prioritize → Recommend → Act → Update → Respond**

The system must preserve user privacy, maintain strict user-level data isolation, and never fabricate campus information.