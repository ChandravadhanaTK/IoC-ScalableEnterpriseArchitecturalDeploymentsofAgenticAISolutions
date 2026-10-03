Build a complete, simple, polished Agentic AI web application called "TaskPilot – Agentic AI Task Planner".

IMPORTANT:
- Keep the project small and simple.
- Generate the complete application in one pass.
- Do NOT add unnecessary features, pages, authentication, payment systems, external databases, Docker, or complex infrastructure.
- Avoid unnecessary dependencies.
- Use browser localStorage instead of a database.
- The application must be easy to run locally.
- Make the UI professional enough for a final-year CSE project demonstration.

TECH STACK:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React icons
- No backend unless absolutely required.
- Use a clean component-based architecture.

PROJECT PURPOSE:
Create an Agentic AI Task Planner where a user gives a natural-language goal and the AI agent converts it into an actionable plan.

Example:
User enters:
"Prepare for my DBMS exam in 5 days."

The agent should analyze the goal and create:
- Main goal
- Subtasks
- Priority
- Estimated time
- Suggested schedule
- Progress

AGENTIC AI CONCEPT:
Implement a lightweight agent workflow:

USER GOAL
    ↓
GOAL ANALYZER
    ↓
TASK PLANNER
    ↓
TOOL SELECTION
    ↓
TOOL EXECUTION
    ↓
OBSERVATION
    ↓
PLAN UPDATE
    ↓
FINAL ACTION PLAN

Create a visible "Agent Activity" panel showing steps such as:

1. Understanding user goal
2. Identifying required tasks
3. Prioritizing tasks
4. Generating schedule
5. Saving the plan
6. Plan completed

Do NOT expose chain-of-thought or hidden reasoning. Only display short action/status messages.

AGENT TOOLS:
Create simple internal tool functions:

1. createTask(title, description, priority, estimatedMinutes)
2. prioritizeTasks(tasks)
3. generateSchedule(tasks, availableDays)
4. calculateProgress(tasks)

The agent should decide which tool to use based on the user's request.

Use a lightweight deterministic/local agent implementation by default so the project works without requiring a paid API.

If an AI API environment variable is available, structure the code so an LLM can later be connected, but the application must work without an API key.

MAIN FEATURES:

1. DASHBOARD
Create a clean dashboard containing:

- Header: "TaskPilot"
- Subtitle: "Your lightweight Agentic AI Task Planner"
- Goal input box
- "Create Plan" button
- Today's tasks
- Overall progress
- Priority summary
- Agent status

2. GOAL INPUT

Provide a large textarea:

"What do you want to accomplish?"

Example placeholder:
"Prepare for my DBMS exam in 5 days"

Add example goal buttons:
- Prepare for an exam
- Learn React
- Complete a project
- Prepare for an interview

3. AGENT PROCESS

When the user clicks "Create Plan":

Show an animated but lightweight agent process:

Analyzing Goal
→ Creating Tasks
→ Prioritizing
→ Scheduling
→ Saving Plan

Show each step as completed.

Do not make unnecessary API calls.

4. GENERATED PLAN

Display generated tasks as cards.

Each task should contain:
- Task title
- Description
- Priority
- Estimated time
- Day
- Completion checkbox

Example:

Day 1
✓ Study DBMS fundamentals
Priority: High
Estimated time: 90 minutes

Day 2
Practice SQL queries
Priority: High
Estimated time: 120 minutes

5. TASK MANAGEMENT

Allow users to:
- Mark task complete
- Delete task
- Change priority
- View progress

Use localStorage so tasks remain after refreshing the page.

6. PROGRESS

Display:
- Total tasks
- Completed tasks
- Pending tasks
- Completion percentage

Use a simple progress bar.

7. AGENT ACTIVITY PANEL

Create a panel called:

"Agent Activity"

Example:

✓ Goal received
✓ Goal analyzed
✓ Tasks generated
✓ Priorities assigned
✓ Schedule created
✓ Plan saved

Use small icons and timestamps.

8. ARCHITECTURE PAGE/SECTION

Add a simple "How It Works" section showing:

User Goal
↓
Agent Controller
↓
Task Analyzer
↓
Tool Selection
↓
Task Planner
↓
Local Storage
↓
Dashboard

Explain briefly that the agent chooses actions/tools based on the user's goal.

9. DEMO MODE

Include 3 predefined examples:

"Prepare for my DBMS exam in 5 days"
"Learn React fundamentals in 7 days"
"Prepare for a software engineering interview"

When clicked, automatically populate the goal input.

10. UI DESIGN

Use a modern SaaS dashboard style.

Requirements:
- Responsive design
- Clean typography
- Rounded cards
- Subtle shadows
- Professional blue/indigo accent
- Light background
- Clear spacing
- Minimal animations
- No excessive gradients
- No unnecessary decorative elements

11. PROJECT STRUCTURE

Use a clean structure similar to:

src/
  components/
    Header.tsx
    GoalInput.tsx
    AgentActivity.tsx
    TaskCard.tsx
    ProgressCard.tsx
    Architecture.tsx

  agent/
    agentController.ts
    tools.ts
    planner.ts

  types/
    task.ts

  utils/
    storage.ts

  App.tsx
  main.tsx
  index.css

12. AGENT IMPLEMENTATION

Create a simple agent controller:

agentController(goal)

The controller should:

- Analyze the goal
- Extract a topic/project type
- Generate appropriate tasks
- Prioritize tasks
- Create a schedule
- Save tasks
- Return the generated plan

Use predefined planning logic/templates for common goals such as:
- exams
- learning a technology
- project completion
- interview preparation

For unknown goals, generate a generic 5-step plan.

Make the implementation deterministic and lightweight.

13. DATA MODEL

Use a Task interface:

Task {
  id: string
  title: string
  description: string
  priority: "High" | "Medium" | "Low"
  estimatedMinutes: number
  day: number
  completed: boolean
}

14. LOCAL STORAGE

Create utility functions:

saveTasks()
loadTasks()
clearTasks()

Persist:
- tasks
- current goal
- progress

15. ERROR HANDLING

Handle:
- Empty goal
- No generated tasks
- localStorage failure
- Invalid input

Show friendly error messages.

16. README

Create a README explaining:

- Project title
- Problem statement
- Objective
- Features
- Agentic AI workflow
- Tools used
- Architecture
- How to run
- How the agent works
- Future enhancements

Include a simple architecture diagram using Mermaid if appropriate.

17. IMPORTANT FINAL REQUIREMENTS

The application must compile successfully.

Do not leave placeholder components.

Do not use fake buttons that do nothing.

All major buttons must work.

Make the application demo-ready.

Do not add authentication.

Do not add a database.

Do not add payment.

Do not add unnecessary APIs.

Do not require an API key for the basic demo.

After implementation, verify that:
- npm install works
- npm run dev works
- TypeScript has no errors
- all components are connected
- task creation works
- task completion works
- localStorage works
- progress calculation works
- agent activity updates correctly

The final result should look like a small but complete Agentic AI project suitable for a college final-year CSE demonstration.