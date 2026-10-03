# Project: PathFinder

## Details
- **Student ID:** 2023103049
- **Name:** Suhasri S
- **Project:** PathFinder

## Project Description / Prompt
<!-- Describe the problem statement, prompt, or objective of the project here -->
# PATHFINDER — COMPLETE APPLICATION BUILD + TEST + FIX

## 1. PRODUCT

Build a production-quality web application called **PATHFINDER — Adaptive AI Career Roadmap Agent**.

The application helps a user:

* Enter their career goal
* Enter their current skills and experience
* Analyze their skill gaps
* Generate a personalized career roadmap
* Track learning progress
* Take assessments
* Analyze weaknesses
* Dynamically adapt the roadmap
* Approve or reject major roadmap changes
* Chat with an AI Career Mentor that understands their current career state

This is an **agentic AI application**, not simply a chatbot.

The system must demonstrate a genuine agentic workflow involving:

```text
User Profile
      ↓
Career Goal
      ↓
Career Analysis Agent
      ↓
Skill Gap Analysis
      ↓
Roadmap Planning Agent
      ↓
Personalized Roadmap
      ↓
User Progress
      ↓
Progress Analysis Agent
      ↓
Adaptive Planning Agent
      ↓
Human Approval
      ↓
Updated Roadmap
      ↓
AI Career Mentor
```

---

# 2. FIRST: INSPECT THE EXISTING PROJECT

Before making changes:

1. Inspect the complete existing codebase.
2. Understand the current architecture.
3. Identify the existing frontend framework.
4. Identify the existing backend/API structure.
5. Identify the database configuration.
6. Identify existing authentication.
7. Identify existing AI integrations.
8. Identify existing routes and pages.
9. Identify existing reusable components.
10. Identify incomplete or broken functionality.

Do **not** unnecessarily rebuild working functionality.

Preserve useful existing components and improve them where appropriate.

The final application must be fully functional rather than just visually complete.

---

# 3. REQUIRED APPLICATION FLOW

The application must support this complete flow:

```text
Landing Page
      ↓
Authentication
      ↓
Career Assessment
      ↓
Career Analysis
      ↓
Skill Gap Dashboard
      ↓
Roadmap Generation
      ↓
Personalized Roadmap
      ↓
Progress Tracking
      ↓
Assessments
      ↓
Progress Analysis
      ↓
Adaptive Roadmap Proposal
      ↓
Human Approval / Rejection
      ↓
Updated Roadmap
      ↓
AI Career Mentor
```

A user must be able to complete the entire journey without encountering broken pages, dead buttons, missing data, or runtime errors.

---

# 4. ROUTING — ZERO 404 ERRORS

Implement all required routes.

At minimum:

```text
/
 /login
 /signup
 /assessment
 /dashboard
 /skill-gap
 /roadmap
 /progress
 /assessments
 /mentor
 /profile
 /settings
```

Requirements:

* Every navigation link must work.
* Every button leading to another page must work.
* Browser refresh must work on every route.
* Direct URL navigation must work.
* Deep links must not produce unexpected 404 errors.
* Protected pages must require authentication.
* Unauthenticated users must be redirected appropriately.

---

# 5. AUTHENTICATION

Implement authentication using the project's configured authentication/database system.

Required:

* Sign up
* Login
* Logout
* Session persistence
* Protected routes
* User profile
* Basic user information

Handle:

* Invalid credentials
* Existing account
* Missing fields
* Loading states
* Authentication errors

Never expose API keys or secrets in frontend code.

---

# 6. CAREER ASSESSMENT

Create a polished career assessment form.

Collect information such as:

* Target career / role
* Current education
* Experience level
* Current technical skills
* Current tools/technologies
* Areas of interest
* Current strengths
* Current weaknesses
* Hours available per week
* Target timeline
* Preferred learning style
* Current projects
* Career goals

Example:

```text
Target Role: Data Scientist
Experience: Beginner
Current Skills:
- Python
- Basic SQL
- Basic Statistics

Time Available: 10 hours/week
Target Timeline: 6 months
```

The form must validate input.

On submission:

1. Save the profile.
2. Trigger the Career Analysis Agent.
3. Generate the skill-gap analysis.
4. Navigate to the Skill Gap page.

---

# 7. CAREER ANALYSIS AGENT

Implement a **Career Analysis Agent**.

Responsibilities:

1. Understand the target role.
2. Identify relevant skills required for that role.
3. Compare required skills against the user's current skills.
4. Identify strengths.
5. Identify missing skills.
6. Identify weak skills.
7. Categorize skills by importance.
8. Consider the user's experience level and timeline.

Output structured information such as:

```text
Required Skill
Current Level
Required Level
Gap
Priority
Reason
```

Example:

```text
Python
Current: Intermediate
Required: Advanced
Gap: Medium
Priority: High
```

The result must be stored and displayed in the UI.

---

# 8. SKILL GAP PAGE

Create a dedicated Skill Gap Dashboard.

Display:

* Overall readiness
* Strong skills
* Moderate skills
* Weak skills
* Missing skills
* Skill priority
* Required vs current proficiency
* Recommended learning areas

Use visual elements such as:

* Progress bars
* Cards
* Charts
* Skill badges
* Priority indicators

Do not use meaningless placeholder percentages.

Values should come from the user's actual assessment/AI analysis.

---

# 9. ROADMAP PLANNING AGENT

Implement a **Roadmap Planning Agent**.

The agent must convert the skill-gap analysis into a structured learning roadmap.

Consider:

* Current skill level
* Target role
* Skill gaps
* Skill dependencies
* Available hours/week
* Target timeline
* Learning priorities
* Projects
* Assessments

Generate phases/milestones such as:

```text
Phase 1 — Foundations
Phase 2 — Core Skills
Phase 3 — Machine Learning
Phase 4 — Advanced Skills
Phase 5 — Projects
Phase 6 — Interview / Job Readiness
```

Each phase should contain:

* Objective
* Skills
* Tasks
* Estimated duration
* Priority
* Prerequisites
* Completion criteria

---

# 10. ROADMAP PAGE

Create a highly usable roadmap interface.

Display:

* Current phase
* Upcoming phases
* Completed phases
* Tasks
* Progress
* Estimated time
* Dependencies
* Deadlines

Users must be able to:

* Mark tasks complete
* Undo completion
* View task details
* Track phase progress

The roadmap must be generated from the user's actual profile.

---

# 11. PROGRESS ANALYSIS AGENT

Implement a **Progress Analysis Agent**.

This agent periodically analyzes:

* Completed tasks
* Incomplete tasks
* Assessment scores
* Weak areas
* Learning pace
* Missed deadlines
* Recent performance

It should identify patterns such as:

```text
SQL Window Functions score: 40%

Detected weakness:
Window Functions

Recommendation:
Move Window Functions revision ahead of the next ML module.
```

The agent should produce structured recommendations.

---

# 12. ASSESSMENTS

Create an assessment system.

Users should be able to take assessments related to roadmap skills.

Each assessment can include:

* Questions
* Multiple-choice answers
* Short answers where appropriate
* Score
* Skill/category
* Completion status

After submission:

1. Calculate the score.
2. Store the result.
3. Update progress.
4. Trigger progress analysis when appropriate.
5. Identify weak areas.

Example:

```text
SQL Assessment
Score: 40%

Weak Areas:
- Window Functions
- Complex Joins

Recommended:
Revision + additional practice
```

---

# 13. ADAPTIVE PLANNING AGENT

Implement an **Adaptive Planning Agent**.

This is one of the most important agentic features.

The agent receives:

* Existing roadmap
* User progress
* Assessment results
* Skill gaps
* Time availability
* Progress analysis

It determines whether the roadmap should change.

Possible changes:

* Reorder tasks
* Add revision tasks
* Add practice
* Extend a phase
* Delay another phase
* Increase/decrease workload
* Introduce prerequisite material
* Remove unnecessary tasks

The agent must generate a proposal rather than silently changing the roadmap.

Example:

```text
Adaptive Recommendation

Reason:
Your SQL assessment score was 40%, indicating difficulty
with Window Functions.

Proposed Changes:

1. Add "SQL Window Functions Revision"
2. Add 5 practice exercises
3. Move Window Functions before Machine Learning
4. Delay Machine Learning by 3 days
```

---

# 14. HUMAN-IN-THE-LOOP

Major roadmap changes must require user approval.

Display:

```text
AI Roadmap Update Proposed

Reason:
Your recent assessment indicates a weakness in SQL.

Changes:
+ Add SQL revision
+ Add practice exercises
↔ Reorder upcoming tasks

[ Accept Changes ]
[ Keep Current Roadmap ]
```

If accepted:

* Update the actual roadmap.

If rejected:

* Keep the current roadmap.

Store the decision.

This human approval mechanism must be clearly visible as part of the agentic workflow.

---

# 15. AI CAREER MENTOR

Create an **AI Career Mentor**.

The mentor must understand the user's actual:

* Career goal
* Current skills
* Skill gaps
* Roadmap
* Current progress
* Assessment results
* Recent recommendations

The mentor should answer questions such as:

```text
What should I study today?

Why was my roadmap changed?

Am I behind schedule?

What should I focus on this week?

Should I learn SQL before ML?

What project should I build next?
```

The mentor must use the user's stored context rather than behaving like a generic chatbot.

Include:

* Chat interface
* Conversation history
* Loading state
* Error handling
* Clear AI responses

---

# 16. DATABASE

Use the project's configured database.

Create appropriate tables/entities for:

* Users
* Profiles
* Career goals
* Skills
* Skill gaps
* Roadmaps
* Roadmap phases
* Roadmap tasks
* Progress
* Assessments
* Assessment results
* AI analysis
* Adaptive proposals
* Human decisions
* Mentor conversations
* Agent logs

Use proper relationships.

Users must only be able to access their own private data.

Implement appropriate authorization/security rules.

---

# 17. AI / API SECURITY

Never expose private AI/API keys in client-side code.

Use secure server-side/API functions where required.

Ensure:

* Secrets are stored securely.
* API keys are not committed to GitHub.
* Environment variables are used.
* AI requests are validated.
* Errors do not expose sensitive information.

---

# 18. AGENT LOGGING

Create an agent execution/logging mechanism.

Track useful information such as:

```text
Agent
Execution Time
Input Context
Action
Output
Status
Error
```

Example:

```text
Career Analysis Agent
Status: Completed

Roadmap Planning Agent
Status: Completed

Progress Analysis Agent
Status: Completed

Adaptive Planning Agent
Status: Completed
```

The purpose is to make the agentic workflow observable and debuggable.

---

# 19. DASHBOARD

Create a central dashboard.

Show:

* Target career
* Overall roadmap progress
* Current phase
* Skills mastered
* Skills requiring attention
* Upcoming tasks
* Recent assessment results
* Latest AI recommendation
* Adaptive roadmap status

Example:

```text
Data Scientist

Roadmap Progress
████████░░ 78%

Current Phase
Machine Learning

Focus Areas
• Feature Engineering
• Model Evaluation
• SQL Window Functions

Next Task
Cross Validation

Latest AI Recommendation
Practice SQL Window Functions before starting the next ML module.
```

---

# 20. PROFILE / SETTINGS

Create Profile and Settings pages.

Allow users to view/update:

* Name
* Education
* Experience
* Skills
* Target role
* Hours/week
* Timeline
* Learning preferences

Include account actions such as logout.

Changes should persist.

---

# 21. LANDING PAGE

Create a professional landing page for PATHFINDER.

Clearly explain:

### What it does

Personalized AI-powered career roadmaps that continuously adapt to your progress.

### Core features

* AI Career Analysis
* Skill Gap Detection
* Personalized Roadmaps
* Progress Tracking
* Adaptive Planning
* AI Career Mentor
* Human-in-the-loop decisions

Include a clear CTA:

```text
Build My Career Roadmap
```

The design should look like a real modern SaaS product.

---

# 22. UI QUALITY

The application must have a polished, consistent UI.

Requirements:

* Responsive design
* Desktop support
* Mobile-friendly layout
* Consistent typography
* Consistent spacing
* Clear hierarchy
* Professional dashboard
* Accessible buttons
* Proper forms
* Useful visualizations
* Meaningful empty states

Avoid:

* Excessive gradients
* Random animations
* Clutter
* Huge unnecessary text
* Generic AI-looking interfaces
* Broken layouts

Use a cohesive design system.

---

# 23. LOADING STATES

Every asynchronous operation must have a loading state.

Examples:

```text
Analyzing Career...
Generating Skill Gap...
Building Roadmap...
Analyzing Progress...
Generating Adaptive Recommendation...
Saving Changes...
```

Disable relevant buttons during operations where necessary.

Prevent duplicate submissions.

---

# 24. ERROR HANDLING

Handle failures gracefully.

Examples:

* AI API failure
* Database failure
* Authentication failure
* Invalid input
* Network failure
* Missing profile
* Empty roadmap
* Assessment submission failure

Display useful user-friendly messages.

Never leave the interface stuck indefinitely.

---

# 25. NO DEAD BUTTONS

Every visible button must perform a real action.

Do not leave:

* Fake buttons
* Placeholder buttons
* Non-functional navigation
* Empty dropdowns
* Fake charts
* Fake AI actions

If a feature is displayed, it must work.

---

# 26. NO PLACEHOLDER DATA

Do not use hardcoded fake user information in the final application.

The application must use:

* Authenticated user data
* Database data
* User-generated assessment data
* AI-generated analysis
* Actual progress

Demo/sample data may only be used where clearly necessary for empty-state examples and must not interfere with real users.

---

# 27. 404 / REFRESH / DEEP-LINK TESTING

Test all major routes.

For every route:

1. Navigate normally.
2. Refresh the page.
3. Open the route directly.
4. Verify authentication behavior.
5. Verify data loading.

There must be no unexpected:

```text
404
Blank screen
Infinite loading
Broken navigation
Missing component
```

---

# 28. CONSOLE / BUILD CLEANUP

Before finalizing:

* Run the production build.
* Fix compilation errors.
* Fix TypeScript errors.
* Fix lint errors where applicable.
* Remove unnecessary warnings.
* Remove unused imports.
* Fix runtime exceptions.
* Fix broken API calls.
* Fix database errors.

The application must build successfully.

---

# 29. DATABASE TESTING

Verify:

* User creation
* Profile creation
* Profile updates
* Skill-gap storage
* Roadmap creation
* Task updates
* Progress updates
* Assessment storage
* Assessment results
* Adaptive proposals
* Approval/rejection
* Mentor conversation storage

Verify that users cannot access another user's private data.

---

# 30. END-TO-END TEST

Perform a complete end-to-end test using a real test account.

Test:

```text
Signup
↓
Login
↓
Career Assessment
↓
Career Analysis
↓
Skill Gap
↓
Roadmap Generation
↓
Roadmap Viewing
↓
Task Completion
↓
Assessment
↓
Progress Analysis
↓
Adaptive Proposal
↓
Accept/Reject
↓
Roadmap Update
↓
AI Mentor
↓
Logout
↓
Login Again
↓
Verify Data Persistence
```

Fix every issue discovered during testing.

---

# 31. DEPLOYMENT

Prepare the application for deployment.

Ensure:

* Production build works.
* Environment variables are documented.
* Database configuration works in production.
* AI/API configuration works securely.
* Routes work in production.
* Refreshing routes does not produce 404 errors.

Deploy the final application.

The final deployed URL must be functional.

---

# 32. README

Create/update the README with:

## Project

PATHFINDER — Adaptive AI Career Roadmap Agent

## Description

Short explanation of the project.

## Features

List the major features.

## Agent Architecture

Explain:

```text
Career Analysis Agent
        ↓
Roadmap Planning Agent
        ↓
Progress Analysis Agent
        ↓
Adaptive Planning Agent
        ↓
Human Approval
        ↓
AI Career Mentor
```

## Technology Stack

Document:

* Frontend
* Backend
* Database
* AI models/APIs
* Authentication
* Deployment
* Other important technologies

## Setup

Provide installation instructions.

## Environment Variables

Document required environment variables without exposing secret values.

## Running Locally

Provide commands required to run the project.

## Deployment

Explain how the application is deployed.

## Live Demo

Include the deployed application URL.

---

# 33. ASSIGNMENT DOCUMENTATION

Create a documentation file explaining the completed project.

Include:

## 1. Problem Statement

What problem PATHFINDER solves.

## 2. Solution

How the application solves it.

## 3. Agentic Architecture

Explain each agent.

## 4. Application Workflow

Explain the complete user journey.

## 5. Human-in-the-loop

Explain why roadmap changes require user approval.

## 6. Technology Stack

List technologies used.

## 7. Database Design

Explain major entities and relationships.

## 8. AI Integration

Explain how AI is used.

## 9. Screenshots

Include important application screenshots where appropriate.

## 10. Deployment

Include the live deployed URL.

## 11. GitHub Repository

Include the repository URL.

---

# 34. FINAL QUALITY GATE

Before declaring the project complete, verify all of the following:

### Functionality

* [ ] Signup works
* [ ] Login works
* [ ] Logout works
* [ ] Career assessment works
* [ ] Career analysis works
* [ ] Skill gap works
* [ ] Roadmap generation works
* [ ] Roadmap tasks work
* [ ] Progress tracking works
* [ ] Assessments work
* [ ] Progress analysis works
* [ ] Adaptive planning works
* [ ] Human approval works
* [ ] Human rejection works
* [ ] AI mentor works
* [ ] Profile works
* [ ] Settings work

### Technical

* [ ] Production build succeeds
* [ ] No major console errors
* [ ] No runtime crashes
* [ ] No broken API calls
* [ ] No exposed secrets
* [ ] Database operations work
* [ ] Authentication works
* [ ] Authorization works

### Navigation

* [ ] All routes work
* [ ] Refresh works
* [ ] Direct URL navigation works
* [ ] No unexpected 404s
* [ ] No dead buttons
* [ ] No broken links

### Agentic Workflow

* [ ] Career Analysis Agent works
* [ ] Roadmap Planning Agent works
* [ ] Progress Analysis Agent works
* [ ] Adaptive Planning Agent works
* [ ] Human-in-the-loop works
* [ ] AI Career Mentor understands user context

### Deployment

* [ ] Production URL works
* [ ] Production database works
* [ ] Production AI integration works
* [ ] Production routes work
* [ ] README is complete
* [ ] Assignment documentation is complete

---

# 35. FINAL INSTRUCTION

Do not stop at generating UI.

The final application must be a **fully functional agentic AI career planning system**.

A user must be able to:

1. Enter their career information.
2. Receive an AI-generated personalized roadmap.
3. Make progress.
4. Take assessments.
5. Trigger AI analysis.
6. Receive an adaptive roadmap proposal.
7. Approve or reject the proposal.
8. See the actual roadmap change accordingly.
9. Interact with an AI mentor that understands their current state.

All of this must happen without:

* Broken routes
* 404 errors
* Dead buttons
* Missing data
* Runtime errors
* Exposed secrets
* Fake functionality
* Unnecessary placeholder content

**Inspect → Build → Integrate → Test → Fix → Deploy.**

Do not consider the project complete until the complete end-to-end workflow works.

## Prompts & Interactions Log
<!-- Record prompts and interactions used during development here -->
