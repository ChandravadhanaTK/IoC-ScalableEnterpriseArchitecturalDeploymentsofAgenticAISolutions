# AI Interview Preparation Platform (Ardent Prep)

An enterprise-grade, agentic AI interview preparation platform designed to simulate rigorous technical and behavioral interviews. The platform features a three-agent architecture that orchestrates personalized question generation, human-in-the-loop approval, interactive mock interviews, strict rubric-based evaluation, and longitudinal coaching.

**Live Deployed Application:** [https://ardent-prep.lovable.app](https://ardent-prep.lovable.app)
**Source Repository:** [https://github.com/bakia-adithyan-s/ardent-prep](https://github.com/bakia-adithyan-s/ardent-prep)
**Lovable Project Workspace:** [https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457](https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457)

## 🚀 Live Application Links

- **Main Application:** [https://ardent-prep.lovable.app](https://ardent-prep.lovable.app)
- **Project Workspace:** [https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457](https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457)

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Core Capabilities](#-core-capabilities)
3. [Architecture](#-architecture)
4. [Agentic Workflow](#-agentic-workflow)
5. [Tri-Agent Architecture](#-tri-agent-architecture)
6. [Technical Features](#-technical-features)
7. [User Experience (UX) Flows](#-user-experience-ux-flows)
8. [Data Model](#-data-model)
9. [Deployment](#-deployment)
10. [Project Milestones](#-project-milestones)
11. [Getting Started](#-getting-started)

---

## 🎯 System Overview

Ardent Prep is a comprehensive interview preparation ecosystem built with:

- **Frontend:** Next.js 14 with App Router
- **Styling:** Tailwind CSS (configured via `tailwind-merge`)
- **Database:** Supabase PostgreSQL
- **AI:** OpenAI API

The platform addresses the critical gap between theoretical knowledge and interview performance by providing:

✅ **Personalized question generation** based on specific roles and resumes
✅ **Human-in-the-loop approval** to ensure question relevance
✅ **Structured mock interviews** with real-time evaluation
✅ **Strict rubric-based scoring** (0-10 scale) with detailed feedback
✅ **Longitudinal coaching** to track progress over time

---

## 🌟 Core Capabilities

### 1. Dashboard (`/dashboard`)
- Real-time interview analytics
- Weekly practice streaks and rolling averages
- Category mastery visualization
- Quick access to pending and completed interviews

### 2. Candidate Profile (`/profile`)
- Education and experience management
- Skills and technology taxonomy
- Resume text input for AI grounding
- Professional portfolio presentation

### 3. Interview Creation (`/interviews/new`)
- Target role and job description input
- Interview type selection (Technical, Coding, System Design, Behavioral, Mixed)
- Difficulty calibration (Easy, Medium, Hard)
- Question volume control (1-20 questions)
- Real-time agent state visualization

### 4. Human-in-the-Loop Approval (`/interviews/:id/plan`)
- Candidate reviews AI-generated questions before interviews
- Full editing capability: modify, delete, or regenerate questions
- One-click regeneration if initial plan is unsatisfactory
- Explicit approval gate before interview can begin

### 5. Interactive Mock Interview (`/interviews/:id/session`)
- Sequential question presentation
- Category, difficulty, and concept benchmarks displayed
- Markdown-supported answer editor
- Character count validation (min 50, max 5000 characters)
- Instant AI evaluation upon submission

### 6. Interview Report (`/interviews/:id/report`)
- Aggregated session score (0-100)
- Detailed question-by-question analysis:
  - Submitted answer review
  - AI score (0-10)
  - Strengths identified
  - Weaknesses identified
  - Targeted feedback and suggestions
- Category-wise performance breakdown

### 7. Longitudinal Coaching (`/progress`)
- Synthesizes evaluation history across all interviews
- Tracks persistent strong areas and recurring weak areas
- Prescribed study topics based on performance patterns
- **No Fabrication Rule**: explicitly shows no data until real evaluations are recorded

### 8. Notifications & Practice Reminders (`/notifications`)
- Automated alerts for inactive users (3+ days)
- Onboarding checklist and progress tracking

---

## 🏛️ Architecture

### Full Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND ORCHESTRATOR                              │
│    (Manages state, DB transactions, trace IDs, agent handoffs)        │
└─────────────────────┬─────────────────────┬─────────────────────────────┘
                      │                     │
        +-------------+                     +-------------+
        │                                                 │
        v                                                 v
+---------------+    +---------------+    +---------------+  +----------+
| Agent 1       |    | Human Gate    |    | Agent 2       |  | Agent 3  |
| Interview     |───>| Review, Edit, |───>| Interview     |─>| Coaching |
| Planner       |    | Approve/Reject|    | Evaluator     |  | Agent    |
+---------------+    +---------------+    +---------------+  +----------+
        │                     │                     │               │
        └─────────────────────┼─────────────────────┘               │
                              │                                     │
                              ▼                                     ▼
                  ┌──────────────────────────────────────────────┐
                  │              DATA PERSISTENCE              │
                  │      (PostgreSQL via Supabase SDK)           │
                  │  Rows: users, candidates, interviews, results  │
                  └──────────────────────────────────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────────┐
                     │           FRONTEND (Next.js)         │
                     │  Views: Dashboard, Profile, New Interview │
                     │  Session, Report, Progress             │
                     └──────────────────────────────────────┘
```

### 📦 Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS (v4 alpha), CSS Modules
- **State Management:** React Context API
- **AI Services:** OpenAI API (gpt-4o-mini)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (simulated via JWT in cookies)
- **APIs:** Express.js (backend), Supabase SDK (database)
- **Deployment:** Lovable.dev

---

## ⚙️ Tri-Agent Architecture

The system features **three specialized agents** coordinated by the backend orchestrator:

### Agent 1: Interview Planning Agent

**Purpose:** Analyzes the candidate's profile and target job description to generate relevant interview questions.

**Inputs:**
- Candidate profile (skills, experience, education)
- Job description (text from job posting)
- Interview parameters (type, difficulty, question count)

**Process:**
1. Extracts key requirements from job description
2. Identifies core concepts to test
3. Maps candidate's skills to requirements
4. Generates questions with difficulty levels and expected rubrics

**Output:**
- List of questions with metadata
- Difficulty levels (easy, medium, hard)
- Expected concept rubrics for each question

### 📋 Human-in-the-Loop Approval Gate

**Purpose:** Ensures question quality and relevance before interviews begin.

**Capabilities:**
- Review generated questions
- Edit question text or category
- Delete irrelevant questions
- Regenerate entire question set
- Approve or reject interview plan

**Constraint:** Mock interview cannot start without explicit approval

### Agent 2: Interview Evaluation Agent

**Purpose:** Evaluates candidate answers based

**Live app**: https://ardent-prep.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/17fb1739-cdbb-4d20-bf8f-5e095404a457).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
