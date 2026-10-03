# TaskPilot -- Agentic AI Task Planner

> A lightweight Agentic AI productivity application that converts
> high-level goals into structured, prioritized, scheduled, and
> trackable action plans.

```{=html}
<p align="center">
```
**Live Application:** <https://easy-push.lovable.app/>

```{=html}
</p>
```

------------------------------------------------------------------------

## 📌 Project Overview

**TaskPilot** is a lightweight Agentic AI Task Planner designed to help
users convert a broad objective into a practical, day-by-day action
plan.

Instead of manually deciding what to do, what to prioritize, and how to
distribute tasks, the user provides a high-level goal. TaskPilot then
processes the goal through an agentic planning workflow to generate
smaller tasks, assign priorities, create a schedule, and track progress.

### Example

**User goal:**

> Prepare for my DBMS exam in 5 days.

**TaskPilot workflow:**

``` text
User Goal
    ↓
Goal Analysis
    ↓
Task Generation
    ↓
Task Prioritization
    ↓
Schedule Generation
    ↓
Progress Tracking
    ↓
Action Plan
```

The project is intentionally lightweight and suitable for an academic
prototype and demonstration. The current implementation uses client-side
planning logic and browser Local Storage, so it does not require a
separate database or external AI API key for the basic workflow.

------------------------------------------------------------------------

# 🎯 Problem Statement

People often have a clear objective but struggle to convert it into a
structured execution plan.

For example:

-   A student knows that an examination is approaching but does not know
    what to study each day.
-   A developer knows that a project must be completed but has
    difficulty breaking it into manageable tasks.
-   A learner wants to learn a technology but needs a structured
    sequence.
-   A candidate wants to prepare for an interview but needs a
    prioritized preparation plan.

Traditional task-management applications generally require users to
manually create and organize every task.

**TaskPilot addresses this problem by transforming a high-level goal
into an actionable plan using an agentic workflow.**

------------------------------------------------------------------------

# 🎯 Objectives

The main objectives of TaskPilot are to:

-   Accept a high-level goal in natural language.
-   Analyze the user's objective.
-   Decompose the objective into smaller tasks.
-   Assign task priorities.
-   Generate a day-wise schedule.
-   Track completed and pending tasks.
-   Calculate overall progress.
-   Display agent activity.
-   Demonstrate agentic workflow concepts in a simple web application.
-   Maintain task information using browser Local Storage.
-   Provide a clean and responsive user interface.

------------------------------------------------------------------------

# 🤖 Why TaskPilot is Agentic

TaskPilot follows an agent-oriented workflow rather than simply
displaying static information.

The system:

1.  Receives a goal.
2.  Analyzes the goal.
3.  Determines the type of plan required.
4.  Generates tasks.
5.  Selects internal planning tools.
6.  Assigns priorities.
7.  Creates a schedule.
8.  Observes task progress.
9.  Updates the user's plan state.
10. Presents the resulting plan to the user.

### Agentic Workflow

``` text
                         ┌──────────────┐
                         │  User Goal   │
                         └──────┬───────┘
                                ↓
                       ┌─────────────────┐
                       │  Goal Analysis  │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │ Task Generation │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │  Prioritization │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │    Scheduling   │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │ Progress Check  │
                       └────────┬────────┘
                                ↓
                       ┌─────────────────┐
                       │  Final Action   │
                       │      Plan       │
                       └─────────────────┘
```

The application exposes only concise agent activity/status information
to the user. It does not expose hidden chain-of-thought or private
reasoning.

------------------------------------------------------------------------

# ✨ Key Features

## 1. Goal Input

Users can enter a high-level objective using natural language.

Example:

``` text
Prepare for my DBMS exam in 5 days
```

The application also provides example goals for quick demonstrations.

------------------------------------------------------------------------

## 2. Goal Analysis

The planning logic analyzes the submitted objective and determines an
appropriate task-planning approach.

Common planning contexts include:

-   Examination preparation
-   Technology learning
-   Project completion
-   Interview preparation
-   Generic personal goals

------------------------------------------------------------------------

## 3. Automatic Task Generation

The application breaks the main goal into smaller actionable tasks.

Each task can contain:

-   Title
-   Description
-   Priority
-   Estimated time
-   Scheduled day
-   Completion status

------------------------------------------------------------------------

## 4. Task Prioritization

Tasks are organized according to priority:

``` text
High
Medium
Low
```

High-priority activities can be handled earlier in the generated plan.

------------------------------------------------------------------------

## 5. Day-wise Scheduling

The system distributes generated tasks across available days.

Example:

``` text
Day 1
├── Study DBMS fundamentals
└── Review relational concepts

Day 2
├── Practice SQL
└── Solve SQL problems

Day 3
├── Study normalization
└── Practice normalization problems

Day 4
├── Study transactions
└── Revise important concepts

Day 5
├── Full revision
└── Mock questions
```

------------------------------------------------------------------------

## 6. Progress Tracking

TaskPilot calculates:

-   Total tasks
-   Completed tasks
-   Pending tasks
-   Completion percentage

Example:

``` text
Total Tasks       : 10
Completed Tasks   : 6
Pending Tasks     : 4
Progress          : 60%
```

------------------------------------------------------------------------

## 7. Agent Activity

The application provides a visible status panel showing the main agent
workflow.

Example:

``` text
✓ Goal received
✓ Goal analyzed
✓ Tasks generated
✓ Priorities assigned
✓ Schedule created
✓ Plan saved
```

This makes the agent workflow easy to demonstrate during a project
presentation or viva.

------------------------------------------------------------------------

## 8. Local Storage

TaskPilot uses browser Local Storage for the current prototype.

This allows:

-   Tasks to persist after refresh.
-   Goal information to remain available.
-   Progress information to be retained.

No separate database is required for the current version.

------------------------------------------------------------------------

## 9. Responsive Interface

The application is designed as a clean productivity dashboard and
supports common desktop and browser screen sizes.

------------------------------------------------------------------------

# 🏗️ System Architecture

``` text
┌──────────────────────────────────────────────────────┐
│                      USER                            │
│  Goal Input │ Task Completion │ Progress Tracking   │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                   │
│ Goal Input │ Agent Activity │ Task Cards │ Dashboard│
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                  AGENT CONTROL LAYER                 │
│                   Agent Controller                   │
│ Goal Analysis → Planning → Tool Selection → Observe │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                    AGENT TOOLS                       │
│ createTask()                                         │
│ prioritizeTasks()                                    │
│ generateSchedule()                                   │
│ calculateProgress()                                  │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                    DATA LAYER                        │
│                  Browser Local Storage                │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                    OUTPUT                            │
│             Action Plan + Progress Dashboard         │
└──────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 🔄 Agent Workflow

The core agent workflow is:

``` text
1. Receive Goal
       ↓
2. Analyze Goal
       ↓
3. Generate Tasks
       ↓
4. Prioritize Tasks
       ↓
5. Generate Schedule
       ↓
6. Save Plan
       ↓
7. Track Progress
       ↓
8. Display Result
```

## Agent States

The application can represent the planning lifecycle using states such
as:

``` text
IDLE
  ↓
GOAL_RECEIVED
  ↓
ANALYZING
  ↓
GENERATING_TASKS
  ↓
PRIORITIZING
  ↓
SCHEDULING
  ↓
SAVING
  ↓
COMPLETED
```

If a problem occurs:

``` text
ERROR
  ↓
Fallback / User Message
```

------------------------------------------------------------------------

# 🧰 Agent Tools

TaskPilot uses lightweight internal planning tools.

## `createTask()`

Creates a structured task.

Typical task fields:

``` text
id
title
description
priority
estimatedMinutes
day
completed
```

------------------------------------------------------------------------

## `prioritizeTasks()`

Organizes generated tasks according to their priority.

``` text
High → Medium → Low
```

------------------------------------------------------------------------

## `generateSchedule()`

Distributes tasks across available days and creates a day-wise plan.

------------------------------------------------------------------------

## `calculateProgress()`

Calculates task completion information.

``` text
Total Tasks
Completed Tasks
Pending Tasks
Completion Percentage
```

------------------------------------------------------------------------

# 🖥️ Application Modules

  Module               Description
  -------------------- ----------------------------------
  Goal Input           Accepts the user's objective
  Agent Controller     Controls the agent workflow
  Goal Analyzer        Understands the planning context
  Task Generator       Creates actionable tasks
  Priority Manager     Assigns task priorities
  Schedule Generator   Creates a day-wise plan
  Progress Tracker     Tracks task completion
  Local Storage        Stores application state
  Agent Activity       Displays workflow status
  Dashboard            Presents the final plan

------------------------------------------------------------------------

# 🛠️ Technology Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

## Application Logic

-   TypeScript / JavaScript
-   Agent Controller
-   Planning logic
-   Internal task-planning tools

## Data Persistence

-   Browser Local Storage

## Development Platform

-   Lovable

## Version Control

-   Git
-   GitHub

## Deployment

-   Live web deployment

------------------------------------------------------------------------

# 📁 Project Structure

A typical project structure is:

``` text
TaskPilot/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── GoalInput.tsx
│   │   ├── AgentActivity.tsx
│   │   ├── TaskCard.tsx
│   │   ├── ProgressCard.tsx
│   │   └── Architecture.tsx
│   │
│   ├── agent/
│   │   ├── agentController.ts
│   │   ├── planner.ts
│   │   └── tools.ts
│   │
│   ├── types/
│   │   └── task.ts
│   │
│   ├── utils/
│   │   └── storage.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── screenshots/
│   ├── architecture.png
│   ├── agent-workflow.png
│   ├── deployment.png
│   ├── security.png
│   └── monitoring.png
│
├── GENERATION_PROMPT.md
├── TaskPilot_Deliverables.md
├── Deployment_Link.md
├── README.md
├── package.json
└── vite.config.ts
```

> The exact generated source structure may vary depending on the version
> of the project generated by Lovable.

------------------------------------------------------------------------

# 🚀 Running the Project Locally

## Prerequisites

Install:

-   Node.js
-   npm
-   Git
-   VS Code (recommended)

Check Node.js:

``` bash
node --version
```

Check npm:

``` bash
npm --version
```

------------------------------------------------------------------------

## Clone the Repository

``` bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
```

Move into the project directory:

``` bash
cd TaskPilot
```

------------------------------------------------------------------------

## Install Dependencies

``` bash
npm install
```

------------------------------------------------------------------------

## Start Development Server

``` bash
npm run dev
```

The terminal will display a local URL, commonly:

``` text
http://localhost:5173
```

Open the URL in a browser.

------------------------------------------------------------------------

# 🧪 Testing the Application

## Test Case 1 -- Create a Plan

Enter:

``` text
Prepare for my DBMS exam in 5 days
```

Click:

``` text
Create Plan
```

Expected result:

-   Goal is analyzed.
-   Tasks are generated.
-   Priorities are assigned.
-   A schedule is created.
-   Agent activity is updated.
-   The action plan appears on the dashboard.

------------------------------------------------------------------------

## Test Case 2 -- Complete a Task

Select a task completion checkbox.

Expected result:

``` text
Completed Tasks ↑
Pending Tasks ↓
Progress % ↑
```

------------------------------------------------------------------------

## Test Case 3 -- Refresh

Refresh the browser.

Expected result:

-   Previously saved task information remains available through Local
    Storage.

------------------------------------------------------------------------

## Test Case 4 -- Empty Goal

Submit an empty goal.

Expected result:

-   The application displays an appropriate validation message.
-   No invalid plan is generated.

------------------------------------------------------------------------

# 🌐 Live Deployment

## Live Application

**TaskPilot -- Agentic AI Task Planner**

[Open the Live Application](https://easy-push.lovable.app/)

## Deployment Flow

``` text
Lovable
   ↓
Source Code
   ↓
GitHub
   ↓
Deployment Platform
   ↓
Production
   ↓
Live Web Application
```

The production URL used for this project is:

``` text
https://easy-push.lovable.app/
```

------------------------------------------------------------------------

# 📚 Capstone Deliverables

The project includes five architecture deliverables.

## 1. Architecture Diagram

Covers:

-   System layers
-   Components
-   Data flow
-   Trust boundaries
-   Integrations

![TaskPilot Architecture](screenshots/architecture.png)

------------------------------------------------------------------------

## 2. Agent Workflow Design

Covers:

-   Agent roles
-   Agent states
-   Internal tools
-   Tool handoffs
-   Human control
-   Approvals
-   Failure paths

![TaskPilot Agent Workflow](screenshots/agent-workflow.png)

------------------------------------------------------------------------

## 3. Deployment Strategy

Covers:

-   Runtime
-   Deployment flow
-   Environments
-   Scaling
-   Resilience
-   Release strategy

![TaskPilot Deployment Strategy](screenshots/deployment.png)

------------------------------------------------------------------------

## 4. Security Model

Covers:

-   Identity
-   Authorization
-   Secrets
-   Privacy
-   Input validation
-   Guardrails
-   Auditability

![TaskPilot Security Model](screenshots/security.png)

------------------------------------------------------------------------

## 5. Monitoring Dashboard Design

Covers:

-   Application health
-   Agent activity
-   Traceability
-   Task quality
-   Safety
-   Cost
-   User/business outcomes

![TaskPilot Monitoring Dashboard](screenshots/monitoring.png)

------------------------------------------------------------------------

# 🔐 Security Considerations

The current version is a client-side academic prototype.

## Current Security Approach

-   User input validation.
-   No hard-coded external API secrets.
-   Task data is stored locally in the browser.
-   No sensitive information should be entered into the demonstration
    application.
-   The agent does not perform irreversible external actions.
-   The user remains responsible for reviewing and executing generated
    tasks.

## Future Security Enhancements

A production version could add:

-   Authentication
-   Authorization
-   OAuth
-   Secure backend APIs
-   Encrypted database storage
-   Secret management
-   Rate limiting
-   Audit logs
-   Data retention controls
-   Privacy controls

------------------------------------------------------------------------

# 📊 Monitoring and Observability

The current application focuses on user-facing progress and agent
activity.

Important metrics include:

``` text
Total Plans
Total Tasks
Completed Tasks
Pending Tasks
Completion Percentage
Priority Distribution
Agent Activity
```

A future production version could additionally monitor:

-   Agent execution time
-   Agent failures
-   Tool failures
-   API latency
-   LLM token usage
-   Cost per plan
-   Error rate
-   User satisfaction
-   Goal completion rate

------------------------------------------------------------------------

# 🛡️ Guardrails and Human-in-the-Loop

TaskPilot is designed so that the agent assists the user rather than
replacing the user's decisions.

The user:

-   Defines the goal.
-   Reviews generated tasks.
-   Controls task completion.
-   Can modify or remove tasks.
-   Decides whether to follow the generated plan.

The current agent does not automatically execute external or
irreversible actions.

------------------------------------------------------------------------

# ⚠️ Limitations

The current version is intentionally lightweight.

-   The current implementation does not require an external LLM API.
-   Planning uses local/predefined logic.
-   Local Storage is browser-specific.
-   There is no multi-user authentication.
-   There is no cloud database.
-   The current version does not provide cross-device synchronization.
-   The current agent does not autonomously execute external tasks.

These limitations keep the project simple and suitable for an academic
capstone prototype.

------------------------------------------------------------------------

# 🔮 Future Enhancements

The project can be extended with:

## AI Enhancements

-   LLM-powered goal understanding.
-   Dynamic task generation.
-   Adaptive planning.
-   Personalized recommendations.
-   Automatic plan regeneration.
-   Multi-agent collaboration.

## Productivity Enhancements

-   Google Calendar integration.
-   Notifications.
-   Email reminders.
-   Recurring tasks.
-   Deadline tracking.
-   Voice-based goal input.

## Cloud Enhancements

-   User accounts.
-   Cloud database.
-   Cross-device synchronization.
-   Secure APIs.
-   Cloud-based agent execution.

## Advanced Agentic Features

``` text
Planner Agent
      ↓
Research Agent
      ↓
Task Agent
      ↓
Schedule Agent
      ↓
Progress Agent
      ↓
Reflection / Replanning Agent
```

This would transform TaskPilot into a more advanced multi-agent
productivity platform.

------------------------------------------------------------------------

# 📋 Deliverables Included

The project submission contains:

  -----------------------------------------------------------------------
  File                                Purpose
  ----------------------------------- -----------------------------------
  `README.md`                         Project overview, setup,
                                      architecture and usage

  `GENERATION_PROMPT.md`              Prompt used to generate the
                                      application

  `TaskPilot_Deliverables.md`         Complete capstone architecture
                                      deliverables

  `Deployment_Link.md`                Live application information

  `screenshots/`                      Architecture and project diagrams

  `src/`                              Application source code

  `public/`                           Public/static assets
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 🎓 Academic Use

This project demonstrates concepts from:

-   Agentic AI
-   Artificial Intelligence
-   Software Engineering
-   Web Development
-   Human-in-the-Loop Systems
-   Task Planning
-   State Management
-   Application Architecture
-   Deployment
-   Security
-   Monitoring and Observability

It can be demonstrated as a compact Agentic AI prototype for an academic
capstone/IoC submission.

------------------------------------------------------------------------

# 👩‍💻 Project Information

**Project Name:** TaskPilot -- Agentic AI Task Planner

**Project Type:** Agentic AI Web Application

**Development Platform:** Lovable

**Frontend:** React + TypeScript + Vite

**Styling:** Tailwind CSS

**Persistence:** Browser Local Storage

**Version Control:** GitHub

**Live Application:**\
https://easy-push.lovable.app/

------------------------------------------------------------------------

# 📌 Conclusion

TaskPilot demonstrates how agentic planning concepts can be applied to
personal productivity.

The system accepts a high-level goal and converts it into a structured
action plan through goal analysis, task generation, prioritization,
scheduling, and progress tracking.

The project intentionally uses a lightweight architecture so that the
complete workflow can be demonstrated without requiring complex backend
infrastructure.

The architecture also provides a foundation for future development into
a production-grade Agentic AI platform with LLM integration, multi-agent
collaboration, cloud storage, authentication, calendar integration,
adaptive planning, and advanced monitoring.

------------------------------------------------------------------------

## ⭐ Quick Start

``` bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd TaskPilot
npm install
npm run dev
```

Then open the local URL displayed by Vite.

### Live Demo

👉 **https://easy-push.lovable.app/**
