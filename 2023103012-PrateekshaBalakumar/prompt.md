# StudyFlow – Lovable Master Prompt

Build a complete, production-quality web application called "StudyFlow – AI Student Productivity Assistant".

The application is an agentic AI assistant for college students. Its main purpose is to help students stay organized, start assignments early, prepare for exams, avoid missed deadlines, and manage their academic workload.

IMPORTANT:
This should NOT be just a normal chatbot or static calendar application.

The core feature must be an AI agent that takes the student's academic deadlines, exams, workload and available time, reasons about them, and automatically creates a personalized study/work plan.

## Core User Experience

When a student first opens the application, guide them through onboarding.

The student can enter:
- Name
- Subjects/courses
- Exam dates
- Assignment/project deadlines
- Assignment difficulty/workload
- Estimated hours required
- Preferred study hours
- Available days/times
- Optional personal commitments

The agent analyzes these inputs and creates a realistic schedule. Work should be distributed before deadlines rather than being placed on the final day.

## Application Sections

Create:
1. Dashboard
2. AI Study Assistant
3. Calendar
4. Tasks & Assignments
5. Exams
6. Study Plan
7. Notifications
8. Agent Activity / Monitoring

Use persistent navigation and responsive design.

## Dashboard

Show:
- Today's date
- Today's planned activities
- Tasks due soon
- Upcoming exams
- Upcoming assignments
- Planned study hours
- Completed study hours
- Overall completion percentage
- Important alerts
- AI recommendations
- A "Today's Focus" section

## AI Study Assistant

Provide a conversational interface that understands requests such as:
- "Create a study plan for my exams."
- "What should I work on today?"
- "I have an assignment due next Friday. Add it."
- "I have 5 days left for my DAA exam. How should I prepare?"
- "Move my study session from Wednesday to Thursday."
- "Which deadlines are most urgent?"
- "Am I falling behind?"
- "Give me a plan for this weekend."

The assistant must behave as an AGENT, not only a chatbot.

Agent workflow:
USER REQUEST
→ UNDERSTAND INTENT
→ CHECK STUDENT DATA
→ PLAN / REASON
→ SELECT APPROPRIATE TOOL
→ EXECUTE ACTION
→ VERIFY RESULT
→ UPDATE STUDENT PLAN
→ RESPOND TO USER

When appropriate, the agent should actually perform actions rather than only suggesting them.

## Agent Tools

Implement or represent these tools/actions:
- createTask()
- updateTask()
- deleteTask()
- getTasks()
- createExam()
- getUpcomingExams()
- createStudySession()
- updateStudySession()
- deleteStudySession()
- generateStudyPlan()
- getDailySchedule()
- getUpcomingDeadlines()
- calculatePriority()
- calculateWorkload()
- rescheduleTask()
- markTaskComplete()
- createNotification()

Agent actions must be visible in Agent Activity.

## Intelligent Study Planning

The planner should consider:
- Deadline date
- Exam date
- Current date
- Assignment difficulty
- Estimated workload
- Subject importance
- Days remaining
- Existing study sessions
- Student availability
- Completed work
- Incomplete work
- Other deadlines

Distribute work across multiple days whenever possible, avoid excessive daily workload, and prioritize urgent and important work.

Example:
A 10-hour assignment due in 3 days should receive higher priority than a 1-hour assignment due in 7 days.

Explain major scheduling decisions to the student.

## Adaptive Planning

The plan must adapt when circumstances change.

If a student misses a study session, reschedule remaining work without creating excessive daily workload.

If a new deadline is added, reconsider the schedule and adjust it where necessary.

For major changes affecting more than two planned sessions, ask for confirmation before applying changes.

## Calendar

Provide:
- Monthly view
- Weekly view
- Daily view

Display:
- Exams
- Assignments
- Study sessions
- Deadlines
- Reminders

Each event should show title, subject, date, time, duration, priority and status.

The agent must be able to update the calendar through its tools.

## Tasks & Assignments

Each task should contain:
- Title
- Subject
- Description
- Due date
- Estimated hours
- Difficulty
- Priority
- Status
- Progress
- Created date

Statuses:
- Not Started
- In Progress
- Completed
- Overdue

Provide filters for All, Today, This Week, Upcoming, Completed and Overdue.

## Exams

Each exam should contain:
- Subject
- Exam date
- Syllabus/topics
- Preparation difficulty
- Preparation status
- Estimated preparation hours

Exam dates must influence the generated study plan.

## Study Plan

Show:
- Today's study plan
- Weekly study plan
- Subject-wise study hours
- Completed vs planned hours
- Upcoming preparation goals
- Progress charts

## Notifications

Provide notifications for:
- Upcoming deadlines
- Upcoming exams
- Overdue tasks
- Missed study sessions
- Important schedule changes
- AI recommendations

Avoid excessive notifications.

## Agent Activity / Monitoring

Show:
- Agent status
- Total agent actions
- Successful actions
- Failed actions
- Tool usage
- Recent agent actions
- Average response time
- Tasks automatically created
- Tasks automatically rescheduled

Persist important agent actions with user, action, tool, timestamp, status and error information.

## Failure Handling

If a tool/action fails:
1. Attempt the action.
2. Detect the failure.
3. Retry when appropriate.
4. If unsuccessful, inform the user.
5. Do not claim success.
6. Record the failure in Agent Activity.

## Human Control

The student remains in control.

For significant schedule changes, show:
"These changes affect 3 planned study sessions. Apply changes?"

Buttons:
- Apply Changes
- Cancel

Routine actions can be performed automatically.

## Authentication and Data Privacy

Use proper authentication and persistent storage.

Support:
- Sign up
- Login
- Logout
- Password reset
- Google sign-in if available

Every student's data must be isolated. Users can only access their own academic records.

The agent must operate only on the authenticated student's data.

Keep API keys and secrets out of frontend code and use secure environment variables/server-side configuration.

## Data Model

Persist:
- Users
- Subjects
- Tasks
- Assignments
- Exams
- StudySessions
- Notifications
- AgentActions
- Study progress
- Calendar events

## UI

Use a polished modern student productivity interface with:
- Dark theme
- Bright yellow, orange, pink and teal accent cards
- Rounded cards
- Clear typography
- Subtle gradients
- Responsive desktop/tablet/mobile layouts
- Dashboard cards
- Calendar
- Progress charts
- Task cards
- AI chat interface
- Notification center
- Agent activity timeline

The application should feel like a real SaaS product rather than a basic college demo.

## Demo Data

Include realistic demo academic data for demonstration.

Example subjects:
- Design and Analysis of Algorithms
- Computer Architecture
- Database Management Systems
- Internet of Things
- Full Stack Technologies

The demo account should be clearly identified as shared/demo data and must not expose private data belonging to real users.

## Demonstration Scenario

The application must support this flow:

1. Student adds DAA Exam – October 20.
2. Student adds IoT Project – October 12 – 6 hours.
3. Student adds DBMS Project – October 16 – 8 hours.
4. Student asks: "Create a study plan for me."
5. Agent analyzes deadlines.
6. Agent calculates priorities.
7. Agent distributes work.
8. Agent creates study sessions.
9. Calendar updates.
10. Dashboard shows today's tasks.
11. Agent Activity records the actions.
12. Student marks a task complete.
13. Progress updates.
14. Student says: "I couldn't complete today's IoT work."
15. Agent reschedules unfinished work and updates the calendar.

## Overall Architecture

USER
→ FRONTEND
→ AI AGENT
→ PLANNING / REASONING
→ TOOL SELECTION
→ TOOLS
→ DATABASE
→ AGENT VERIFICATION
→ USER RESPONSE

Build the application as one coherent agentic student productivity system.

The central loop is:
STUDENT INPUT
→ AI AGENT
→ ANALYZE DEADLINES
→ PRIORITIZE WORK
→ GENERATE STUDY PLAN
→ CREATE CALENDAR EVENTS
→ MONITOR PROGRESS
→ ADAPT WHEN THINGS CHANGE
→ NOTIFY STUDENT
→ HELP STUDENT STAY ON TRACK.
