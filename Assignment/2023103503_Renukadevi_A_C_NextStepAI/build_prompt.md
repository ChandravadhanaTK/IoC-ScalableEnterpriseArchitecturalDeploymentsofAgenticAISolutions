# NextStep — Agentic AI Assistant for Students
## Product Specification & Build Prompt

Build a production-quality full-stack web application called **NextStep**.

## PRODUCT

NextStep is an agentic assistant for students.

The core problem:
Students often know WHAT they want to accomplish but don't know WHAT TO DO NEXT.

Examples:
- "I want to build a MERN project."
- "I need to prepare for my ML exam."
- "I want to learn DSA and solve 100 problems."
- "I need to complete my final-year project."
- "I want to prepare for an internship."

Instead of behaving like a normal chatbot, NextStep should act as an agent:

GOAL → PLAN → NEXT ACTION → STUDENT ACTION → OBSERVE → REPLAN → NEXT ACTION

The agent should always focus on giving the student ONE clear, actionable next step rather than overwhelming them with a huge plan.

Example:

Student:
"I want to build a MERN expense tracker."

Agent:
"Great. Your first step is to define the database schema."

Student:
"Done."

Agent:
"Next, create the User model with name, email and password fields."

Student:
"I'm stuck. I don't know how to structure it."

Agent:
"Let's solve that first. Here's a simple schema..."

The system must remember progress and dynamically adapt the plan.

---

# DESIGN

Create a modern, premium student productivity interface.

Visual direction:
- Dark navy / deep blue background
- Electric blue, purple, cyan and green accents
- Clean glassmorphism cards
- Rounded corners
- Subtle gradients
- Minimal but polished
- Modern SaaS / AI-product aesthetic
- Smooth animations
- Responsive on desktop and mobile

Do NOT make it look like a generic ChatGPT clone.

The application should feel like an autonomous AI workspace.

Use clear visual hierarchy and generous spacing.

---

# MAIN APP STRUCTURE

Create these pages:

1. Landing / Home
2. Dashboard
3. Create Goal
4. Goal Workspace
5. Agent Workflow
6. Progress / Memory
7. Security
8. Monitoring
9. Settings

Use a persistent sidebar on desktop.

Sidebar:

- Dashboard
- My Goals
- Create Goal
- Agent Activity
- Progress
- Security
- Monitoring
- Settings

---

# 1. LANDING PAGE

Hero:

"Stop asking AI what to do.
Let AI decide your next step."

Subtitle:

"NextStep turns your goals into adaptive, actionable plans — and continuously replans as you make progress."

CTA buttons:

"Start a Goal"
"See How It Works"

Show a visual agent workflow:

GOAL
↓
UNDERSTAND
↓
PLAN
↓
NEXT ACTION
↓
OBSERVE
↓
REPLAN

Add example cards:

"Prepare for ML exam"
"Build MERN project"
"Learn DSA"
"Prepare for internship"

---

# 2. DASHBOARD

Dashboard should immediately answer:

"What should I do right now?"

Top section:

GOOD MORNING, STUDENT

"Your next step"

Large highlighted card:

CURRENT GOAL:
Build MERN Expense Tracker

NEXT ACTION:
Create the MongoDB User schema

Estimated time:
25 minutes

Buttons:
[Start]
[I'm Stuck]
[Done]

Below this:

## Active Goals

Each goal card should show:

- Goal name
- Progress %
- Current milestone
- Next action
- Estimated completion
- Status

Example:

MERN Expense Tracker
████████░░ 72%

Current milestone:
Backend API

Next:
Implement /expenses endpoint

---

## TODAY

Show a small action timeline:

09:00 — Create User model ✓
10:00 — Configure MongoDB ✓
11:00 — Implement authentication → CURRENT
12:00 — Break
14:00 — Create expense API

The UI should emphasize the CURRENT action.

---

# 3. CREATE GOAL PAGE

Create a simple conversational goal setup.

Ask:

"What do you want to accomplish?"

Large input:

"I want to build a MERN project for managing college resources."

Optional fields:

Deadline
Available hours per day
Current skill level
Constraints
Preferred technologies

Button:

"Let NextStep Plan It"

When submitted:

Show an animated agent processing state:

Understanding goal...
Breaking goal into milestones...
Estimating effort...
Identifying dependencies...
Creating adaptive plan...

Then generate:

Goal
Milestones
Tasks
Dependencies
First recommended action

IMPORTANT:

Do not expose raw chain-of-thought.

Instead show concise agent activity such as:

✓ Goal understood
✓ Milestones identified
✓ Dependencies checked
✓ Plan generated
✓ Next action selected

---

# 4. GOAL WORKSPACE

This is the main product page.

Header:

MERN Expense Tracker

72% Complete

Sections:

## Current Mission

Large card:

"Implement authentication API"

Why this matters:
"This unlocks protected expense routes."

Estimated time:
45 minutes

Prerequisites:
✓ MongoDB connection
✓ User model

Buttons:

[Start]
[Done]
[I'm Stuck]
[Skip]

---

## Milestone Roadmap

Example:

1. Project Setup ✓
2. Database ✓
3. Authentication → CURRENT
4. Expense Management
5. Frontend
6. Testing
7. Deployment

Clicking a milestone opens its tasks.

---

## Agent Decision

Show a transparent but concise explanation:

"Why this step?"

"This is the highest-priority unfinished dependency for your current milestone."

Do NOT reveal hidden chain-of-thought.
Only show a short decision rationale.

---

## If I'm Stuck

Clicking "I'm Stuck" opens:

"What are you stuck on?"

Options:

- I don't understand the concept
- I don't know how to start
- I'm getting an error
- This task is too difficult
- I want to skip this

The agent should react differently depending on the selection.

Example:

If "I don't know how to start":
→ break the task into a smaller action.

If "I'm getting an error":
→ open troubleshooting flow.

If "This task is too difficult":
→ reduce task difficulty / create prerequisite.

If "I want to skip":
→ evaluate dependencies and replan.

---

# 5. AGENT WORKFLOW PAGE

Create a visual representation of the agent architecture.

Show:

STUDENT
↓
GOAL INTERPRETER
↓
PLANNER
↓
TASK SELECTOR
↓
TOOL EXECUTOR
↓
PROGRESS OBSERVER
↓
REPLANNER
↓
STUDENT

Use animated nodes / connections.

Each node should be clickable.

Show:

Role
Input
Output
Tools
Failure handling

Example:

TASK SELECTOR

Input:
Current goal + progress + dependencies

Output:
Recommended next action

---

## Agent states

Display:

IDLE
UNDERSTANDING
PLANNING
WAITING_FOR_USER
EXECUTING
OBSERVING
REPLANNING
COMPLETED
BLOCKED

Use clear status indicators.

---

# 6. AGENT ACTIVITY

Create a timeline showing what the agent has done.

Example:

10:32
Goal created

10:33
Agent decomposed goal into 6 milestones

10:33
Dependency graph generated

10:34
Recommended "Create database schema"

10:57
Student marked task completed

10:58
Agent detected next dependency

10:58
New next action:
"Create authentication middleware"

This demonstrates the agentic behavior.

---

# 7. MEMORY / PROGRESS

Create a student progress page.

Show:

## Student Profile

Goals completed
Current goals
Tasks completed
Average task duration
Blocked tasks
Learning areas

---

## Agent Memory

Show structured memory:

GOAL MEMORY
- MERN project
- ML exam preparation

PREFERENCE MEMORY
- Prefers smaller tasks
- Usually studies 2 hours/day

PROGRESS MEMORY
- MongoDB ✓
- REST APIs ✓
- JWT → learning

Do not store sensitive personal information unnecessarily.

Allow the user to clear memory.

---

# 8. SECURITY MODEL

Create a dedicated Security page that visually demonstrates enterprise security.

Sections:

## Identity

- Authentication
- Session management
- Role-based access

Roles:

Student
Admin

---

## Authorization

Show permissions:

Student:
✓ Create goals
✓ Manage own tasks
✓ View own progress
✓ Manage own memory

Admin:
✓ System monitoring
✓ User management
✓ Audit logs

---

## Privacy

Important:

Student data should be private by default.

Never expose one student's goals or memory to another student.

---

## AI Guardrails

Show:

✓ Prompt validation
✓ Tool authorization
✓ Input validation
✓ Rate limiting
✓ Sensitive data filtering
✓ Human approval for consequential actions

The AI agent should NOT be allowed to execute arbitrary tools.

Use an explicit tool allowlist.

---

## Audit Log

Example:

10:31 Goal created
10:33 Plan generated
10:58 Task updated
11:02 Memory updated

---

# 9. MONITORING DASHBOARD

Create a monitoring dashboard suitable for an enterprise architecture review.

Show metrics:

## System Health

Agent uptime
API latency
Error rate
Active sessions

## Agent Quality

Task completion rate
Replanning frequency
Blocked task rate
Average steps per goal
Agent success rate

## Safety

Blocked tool calls
Guardrail triggers
Unauthorized requests
Failed authentication attempts

## Cost

LLM calls
Tokens used
Estimated AI cost

Use charts and metric cards.

Include:

Agent execution trace

Example:

Request
→ Goal Parser
→ Planner
→ Task Selector
→ Database
→ Response

Each stage should show:

Latency
Status
Token usage

---

# 10. DEPLOYMENT STRATEGY PAGE

Create a visual deployment architecture.

Show:

USER
↓
Frontend
↓
API Gateway
↓
Agent Orchestrator
↓
Agent Services
├── Planner
├── Task Selector
├── Progress Observer
└── Replanner
↓
Database
↓
Vector / Memory Store

External services:

LLM Provider
Authentication
Monitoring

Clearly show trust boundaries.

Include environment separation:

Development
Staging
Production

Show:

Horizontal scaling
Stateless API
Database backups
Health checks
Retry handling
Rate limiting
Secrets management

---

# BACKEND ARCHITECTURE

Build a real backend rather than a purely static frontend.

Recommended:

Frontend:
React + TypeScript

Backend:
Node.js + Express OR Supabase backend

Database:
PostgreSQL

Authentication:
Supabase Auth

Agent:
Implement an agent orchestration service with clearly separated components.

Use these logical modules:

Goal Analyzer
Planner
Task Selector
Progress Observer
Replanner
Memory Manager
Guardrail Manager

---

# AGENT LOGIC

Implement a simple deterministic agent loop.

Pseudo behavior:

1. Receive student goal.
2. Analyse the goal.
3. Generate milestones.
4. Generate tasks.
5. Identify dependencies.
6. Select the highest-value next task.
7. Wait for student action.
8. Receive student status.
9. Update progress.
10. Check whether the current plan is still valid.
11. If needed, replan.
12. Select the next action.

The agent must NOT simply generate a giant plan and stop.

The core feature is dynamic replanning.

---

# DATA MODEL

Create database tables/models for:

users
goals
milestones
tasks
task_dependencies
agent_runs
agent_events
student_memory
audit_logs

Relationships:

User
 → Goals
 → Goals → Milestones
 → Milestones → Tasks
 → Tasks → Dependencies

Agent runs should reference the goal and record agent state transitions.

---

# DEMO DATA

Prepopulate the application with realistic demo data.

Example student:

Goal:
"Build a MERN College Resource Reservation System"

Milestones:

1. Requirements ✓
2. Database Design ✓
3. Backend API → CURRENT
4. Authentication
5. Frontend
6. Testing
7. Deployment

Current task:

"Implement POST /reservations endpoint"

Previous completed tasks:

✓ MongoDB setup
✓ Resource schema
✓ User schema
✓ Express server

Next dependency:

Authentication middleware

---

# IMPORTANT UX REQUIREMENT

The most important screen is the "Next Action" card.

It should always answer:

## "What should I do now?"

With:

WHAT:
"Implement POST /reservations"

WHY:
"Your resource and user models are ready, so this is the next dependency."

TIME:
"~30 min"

ACTION:
[Start]

If the user says:

"Done"

the agent should update the task and determine the next task.

If the user says:

"I'm stuck"

the agent should adapt.

This interaction is the core demo.

---

# CAPSTONE DELIVERABLES

The application must clearly support these five deliverables:

1. ARCHITECTURE DIAGRAM
Show:
Layers, components, trust boundaries, integrations.

2. AGENT WORKFLOW DESIGN
Show:
Roles, states, tools, handoffs, approvals and failure paths.

3. DEPLOYMENT STRATEGY
Show:
Runtime, scaling, resilience, environments and release strategy.

4. SECURITY MODEL
Show:
Identity, authorization, secrets, privacy, guardrails and audit.

5. MONITORING DASHBOARD
Show:
Health, traces, quality, safety, cost and business outcomes.

Create UI pages for each so they can be demonstrated during the capstone presentation.

---

# DEMO FLOW

Make the entire application optimized for this demo:

1. Student creates:
"I want to build a MERN project."

2. Agent analyses the goal.

3. Agent creates milestones.

4. Agent selects:
"Set up project structure."

5. Student clicks:
"Done"

6. Agent automatically selects:
"Create MongoDB schema."

7. Student clicks:
"I'm stuck"

8. Agent asks what is wrong.

9. Student selects:
"I don't know how to design it."

10. Agent breaks the task into a smaller action.

11. Student completes it.

12. Agent replans.

13. Dashboard updates.

14. Agent Activity page shows the entire execution trace.

This should visibly demonstrate:

PERCEPTION → PLANNING → ACTION → OBSERVATION → REPLANNING

---

# IMPLEMENTATION PRIORITY

Build the working MVP first.

Priority 1:
Authentication
Dashboard
Create Goal
Goal Workspace
Next Action
Done / Stuck interactions
Dynamic replanning

Priority 2:
Agent Activity
Memory
Progress tracking

Priority 3:
Security page
Deployment architecture page
Monitoring dashboard

Priority 4:
Animations and visual polish.

Do NOT build unnecessary features before the core agent loop works.

Use mock/demo data where external integrations are unnecessary, but structure the code so real integrations can be added later.

Make the application fully responsive and polished.

The final result should feel like a real **agentic AI product**, not a static dashboard or chatbot.
