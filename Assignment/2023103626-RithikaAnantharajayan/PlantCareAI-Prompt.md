# PlantCare AI — AI-Powered Agentic Plant Care Assistant

Build a complete, working, production-ready web application called **PlantCare AI**.

The application is an AI-powered plant care assistant that helps users manage their plants, track care activities, create care plans, and interact with an agentic AI assistant.

The project is for an academic enterprise-architecture capstone, so the application must be functional, visually polished, easy to demonstrate, and easy to deploy.

---

## 1. Technology Stack

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* Firebase Authentication
* Cloud Firestore
* Firebase App Hosting or another simple Firebase deployment option
* Gemini API for the AI assistant

Use a clean component-based architecture.

Keep the implementation simple. Do not introduce unnecessary libraries or external services.

Store API keys and secrets only in environment variables. Never hard-code secrets.

---

# 2. Application Goal

The application should allow a user to:

1. Create an account and log in.
2. Add and manage their plants.
3. Track watering and basic care activities.
4. See which plants need attention.
5. View upcoming care tasks.
6. Ask an AI assistant questions about their plants.
7. Generate personalized care plans.
8. Ask the agent to create a vacation care plan.
9. Replan care when the user's situation changes.
10. View basic application/AI activity metrics in an admin-style monitoring dashboard.

The AI assistant must demonstrate **agentic behavior**, not just simple question answering.

---

# 3. Main Pages

Create these pages:

## Landing Page

Include:

* PlantCare AI logo
* Short tagline:
  "Your intelligent companion for healthier, happier plants."
* Short explanation
* Key features
* Get Started button
* Login button
* Attractive plant-themed design

---

## Dashboard

Show:

### Summary cards

* Total Plants
* Plants Needing Attention
* Tasks Due Today
* Completed Tasks

### Today's Care

Show tasks such as:

* Money Plant — Check soil
* Tulsi — Water
* Aloe Vera — No action required

Allow the user to mark tasks as completed.

### My Plants

Display plant cards with:

* Plant name
* Plant type
* Indoor/Outdoor
* Last watered
* Next care date
* Status

Use statuses:

* Healthy
* Care Due
* Overdue

---

# 4. Plant Management

Create a "My Plants" page.

Users should be able to:

* Add plant
* Edit plant
* Delete plant
* View plant details

Plant fields:

* Name
* Species/type
* Indoor/outdoor
* Location
* Last watered date
* Watering frequency
* Notes

Use form validation.

---

# 5. Plant Details

For each plant show:

* Name
* Species
* Location
* Environment
* Last watered
* Next watering date
* Watering frequency
* Notes
* Care history

Actions:

* Mark as Watered
* Edit
* Delete
* Ask AI About This Plant

When the user marks a plant as watered:

1. Record the care event.
2. Update last-watered date.
3. Calculate the next watering date.
4. Update the dashboard.
5. Update the care planner.

---

# 6. Care Planner

Create a page showing upcoming tasks.

Example:

TODAY

* Money Plant — Check soil
* Tulsi — Water

TOMORROW

* Aloe Vera — Check soil

IN 3 DAYS

* Snake Plant — Water

Allow users to mark tasks as completed.

Automatically update task status when appropriate.

---

# 7. Care History

Create a page showing historical care activities.

Record:

* Plant
* Action
* Date
* Notes

Examples:

* Money Plant — Watered — Oct 2
* Tulsi — Watered — Oct 1

---

# 8. AI Plant Care Assistant

Create a dedicated AI Assistant page with a chat interface.

Name:

**PlantCare AI Assistant**

Provide suggested prompts:

* "Which of my plants need attention today?"
* "Create a care plan for my plants."
* "I'm going on vacation for 7 days. What should I do?"
* "Why are my plant's leaves turning yellow?"
* "How should I care for my Money Plant?"
* "Show me my overdue care tasks."

The assistant should use the user's stored plant data when answering relevant questions.

---

# 9. AGENTIC BEHAVIOR

This is the most important part.

The AI must behave as an agent rather than only as a chatbot.

Use this conceptual workflow:

USER REQUEST
↓
UNDERSTAND REQUEST
↓
IDENTIFY REQUIRED INFORMATION
↓
READ RELEVANT PLANT DATA
↓
ANALYZE
↓
DECIDE WHAT ACTION/RECOMMENDATION IS NEEDED
↓
GENERATE RESULT
↓
IF REQUIRED, UPDATE CARE TASKS/PLAN
↓
RETURN RESULT TO USER

Implement simple tools/functions that the AI can use.

Suggested tools:

### getUserPlants()

Returns the authenticated user's plants.

### getPlantDetails(plantId)

Returns information about a particular plant.

### getUpcomingCareTasks()

Returns current and upcoming care tasks.

### getCareHistory(plantId)

Returns care history.

### createCarePlan()

Creates a personalized care plan.

### createVacationPlan(days)

Creates a care plan for the specified vacation period.

### updateCareTask(taskId, status)

Updates a care task after user confirmation.

The agent should choose the appropriate tool/function based on the user's request.

Do not expose internal tool implementation details to the user.

---

# 10. Important Agent Examples

## Example 1 — Plants needing attention

User:

"Which of my plants need attention today?"

Agent should:

1. Retrieve user's plants.
2. Check their care schedules.
3. Identify due/overdue tasks.
4. Explain which plants need attention.
5. Provide recommended actions.

---

## Example 2 — Vacation planning

User:

"I'm going away for 7 days."

Agent should:

1. Retrieve the user's plants.
2. Check their care schedules.
3. Determine which plants may need care during the next 7 days.
4. Create a simple vacation care plan.
5. Clearly show the required actions.

Do not invent weather, soil or sensor information.

---

## Example 3 — Missed watering

User:

"I forgot to water my Money Plant."

Agent should:

1. Identify the Money Plant.
2. Read its last watering information.
3. Explain the next recommended care step.
4. Offer to update the care schedule.
5. Ask for confirmation before modifying stored data.

---

## Example 4 — Plant question

User:

"Why are my Money Plant leaves turning yellow?"

The agent should provide general possible causes and practical checks.

Do not claim to diagnose a plant with certainty.

Use cautious language such as:

* "One possible cause..."
* "This can sometimes indicate..."
* "Consider checking..."

---

# 11. Human Confirmation

The AI should not silently make important changes.

For actions that modify stored data:

1. Explain the proposed action.
2. Ask the user for confirmation.
3. Make the change only after confirmation.

For example:

"I can update your Money Plant's care schedule based on the missed watering. Would you like me to do that?"

Buttons:

[Confirm] [Cancel]

---

# 12. Authentication

Implement Firebase Authentication.

Support:

* Sign up
* Login
* Logout
* Protected application routes

Each user's plant data must belong to that authenticated user.

Users must never be able to access another user's plants or care records.

---

# 13. Firestore Data Model

Create appropriate Firestore collections.

Use a structure similar to:

users

* user profile information

plants

* id
* userId
* name
* species
* environment
* location
* lastWatered
* wateringFrequency
* notes
* createdAt

careTasks

* id
* userId
* plantId
* taskType
* dueDate
* status
* notes

careRecords

* id
* userId
* plantId
* action
* date
* notes

aiInteractions

* id
* userId
* requestType
* timestamp
* success
* duration

Use appropriate Firestore security rules.

---

# 14. Security Model

Implement basic security best practices.

Requirements:

* Firebase Authentication
* Firestore security rules
* User-specific data isolation
* No hard-coded API keys
* Environment variables for secrets
* Validate user input
* Validate AI tool/function arguments
* Do not allow the AI to access another user's data
* Require confirmation before modifying user data
* Do not expose internal errors or secrets in the UI

Use least-privilege access wherever practical.

---

# 15. Monitoring Dashboard

Create a simple Monitoring page for demonstration purposes.

It should display application-level metrics such as:

* Total registered users
* Total plants
* Total care tasks
* Completed care tasks
* AI requests
* Successful AI requests
* Failed AI requests
* Recent AI interactions

Also show:

### Application Health

* Authentication: Healthy
* Database: Healthy
* AI Assistant: Healthy

Use simple cards and charts.

If real monitoring data is unavailable, clearly label demo metrics as demo/sample metrics rather than pretending they are production telemetry.

---

# 16. UI Design

Create a polished modern interface.

Theme:

* Green/nature-inspired colors
* White/light backgrounds
* Rounded cards
* Clean typography
* Simple plant icons
* Subtle animations
* Responsive layout
* Mobile-friendly navigation

The application should look like a modern SaaS product, not a basic CRUD college project.

Use consistent components throughout the application.

---

# 17. Sample Data

For demonstration, make it easy to add sample plants such as:

* Money Plant
* Snake Plant
* Aloe Vera
* Tulsi

Do not mix sample data with real user data.

If sample data is included, clearly identify it as demo data.

---

# 18. Error Handling

Handle gracefully:

* Authentication failures
* Database failures
* AI failures
* Invalid forms
* Missing plant information
* Network failures

Show clear user-friendly messages.

Never display raw stack traces or secret information.

---

# 19. Responsive Design

The application must work on:

* Desktop
* Tablet
* Mobile

Test the main pages at different viewport sizes.

---

# 20. Testing and Verification

Before considering the project complete, test:

1. Sign up.
2. Login.
3. Logout.
4. Add plant.
5. Edit plant.
6. Delete plant.
7. Mark plant as watered.
8. Verify next watering date updates.
9. Create/complete care task.
10. Open AI Assistant.
11. Ask which plants need attention.
12. Generate a care plan.
13. Generate a vacation plan.
14. Test confirmation before data modification.
15. Refresh the page and verify persistence.
16. Verify users cannot access other users' data.
17. Test responsive UI.
18. Test AI error handling.

Fix any errors discovered during testing.

Use the browser to verify the actual running application, not just the source code.

---

# 21. Deployment

Prepare the project for simple production deployment.

Preferred deployment:

* Firebase App Hosting or another straightforward Firebase deployment option.

Set up:

* Production build
* Environment variables
* Firebase configuration
* Firestore security rules
* Authentication
* Deployment configuration

After implementation, build the application and verify that the production build succeeds.

Deploy the application and provide the final live URL.

---

# 22. Project Documentation

Create a README.md containing:

1. Project overview
2. Features
3. Technology stack
4. Architecture overview
5. Agent workflow
6. Database structure
7. Security model
8. Deployment steps
9. Environment variables required
10. Testing performed
11. Live deployment URL

Also create a `/docs` directory containing:

* architecture.md
* agent-workflow.md
* deployment.md
* security.md
* monitoring.md

These documents should correspond directly to the five capstone deliverables:

1. Architecture Diagram
2. Agent Workflow Design
3. Deployment Strategy
4. Security Model
5. Monitoring Dashboard Design

Where useful, include Mermaid diagrams in the documentation.

---

# 23. Architecture Diagram

Create a Mermaid architecture diagram showing:

User
→ React Frontend
→ Authentication
→ AI Agent
→ Agent Tools
→ Firestore Database

Also show:

* Gemini AI
* Firebase Authentication
* Firestore
* Deployment/Hosting
* Monitoring

Keep the diagram simple and readable.

---

# 24. Agent Workflow Diagram

Create a Mermaid workflow diagram showing:

User Request
→ Intent Understanding
→ Retrieve Plant Data
→ Agent Reasoning
→ Tool Selection
→ Tool Execution
→ Result Validation
→ User Confirmation if required
→ Database Update
→ Response

Include failure/error paths.

---

# 25. Deployment Diagram

Create a simple deployment diagram showing:

Developer
→ Antigravity
→ Source Code
→ Build
→ Firebase
→ Production Web Application

Also show:

* Authentication
* Firestore
* Gemini API
* Environment variables/secrets

---

# 26. Final Requirements

Do not stop at creating mockup screens.

Build a genuinely working application.

Prioritize:

1. Core functionality
2. Agentic AI workflow
3. Data persistence
4. Security
5. Testing
6. Deployment
7. Documentation
8. Visual polish

Avoid unnecessary features.

If a requested feature requires a complex external service, implement the simplest reliable version instead.

At the end, provide:

* Working source code
* README.md
* `/docs` documentation
* Architecture diagram
* Agent workflow diagram
* Deployment strategy
* Security model
* Monitoring dashboard
* Successful production build
* Deployed application URL

Before finishing, verify the application in the browser and fix any critical issues you find.
