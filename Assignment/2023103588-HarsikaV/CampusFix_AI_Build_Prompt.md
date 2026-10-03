# Build the CampusFix AI — Smart Campus Maintenance Application

## 1. Tech Stack

- Framework: React 19 with Vite and TypeScript.
- Styling: Tailwind CSS.
- Backend: Python FastAPI.
- Database: SQLite for the prototype.
- AI: LLM-based agent workflow with a rule-based fallback.
- Icons: Lucide React.
- Charts: Recharts.
- Authentication: JWT-based authentication.
- API communication: REST APIs.

---

## 2. Application Overview

Build a web-based campus maintenance management application called
"CampusFix AI".

The application allows students and staff to report problems
around the campus.

Examples:

- Wi-Fi not working
- Projector not working
- Water leakage
- Broken fan
- Electrical problem
- Cleaning issue
- Classroom equipment problem

The application uses multiple AI agents to analyze each complaint,
determine its category and priority, assign it to the appropriate
maintenance team, and generate suggested resolution steps.

The system must support human approval for high-priority issues.

---

## 3. User Roles

Implement exactly four roles:

- `student`
- `staff`
- `maintenance`
- `admin`

### Student

- Submit maintenance complaints.
- View their own complaints.
- Track complaint status.
- View AI analysis.

### Staff

- Submit complaints.
- View submitted complaints.
- Track complaint status.

### Maintenance

- View assigned complaints.
- Accept a maintenance task.
- Update task status.
- Add resolution notes.

### Admin

- View all complaints.
- Review high-priority complaints.
- Approve or reject AI-generated assignments.
- Manage maintenance teams.
- View system analytics.
- View audit logs.

---

## 4. Authentication

Implement:

- Login
- Logout
- Registration
- JWT-based authentication
- Protected routes
- Role-based access control

Unauthenticated users must be redirected to the login page.

Users must only be able to access features permitted by their role.

---

## 5. Main Navigation

Create a responsive navigation system.

### Student / Staff

- Dashboard
- Report Issue
- My Tickets
- Profile

### Maintenance

- Dashboard
- Assigned Tickets
- Completed Tickets
- Profile

### Admin

- Dashboard
- All Tickets
- Approvals
- Maintenance Teams
- Analytics
- Audit Logs

---

## 6. Issue Reporting

Create a report form containing:

- Issue title
- Issue description
- Campus location
- Building
- Room number
- Optional image
- Contact information

Example:

Title:
"Projector not working"

Description:
"The projector in CS Lab 2 does not turn on."

Location:
"CS Department"

Room:
"CS Lab 2"

After submission, the complaint must be sent to the
Agent Orchestrator.

---

## 7. Agentic AI Architecture

Implement the following agents:

### 7.1 Triage Agent

Responsible for identifying the issue category.

Categories:

- Electrical
- Plumbing
- Network
- Equipment
- Cleaning
- Infrastructure
- Other

Example:

"Wi-Fi is not working in Lab 3."

Output:

Category: Network

---

### 7.2 Priority Agent

Determine the priority of the issue.

Priority levels:

- Low
- Medium
- High
- Critical

The priority decision should consider:

- Safety impact
- Number of people affected
- Academic/business impact
- Infrastructure damage
- Urgency

---

### 7.3 Assignment Agent

Select the appropriate maintenance team.

Example:

Network → IT Support

Electrical → Electrical Team

Plumbing → Plumbing Team

Cleaning → Housekeeping

Equipment → Technical Support

Infrastructure → Civil Maintenance

---

### 7.4 Resolution Agent

Generate suggested troubleshooting or resolution steps.

Example:

Issue:
"Projector not working."

Suggested steps:

1. Check power connection.
2. Check HDMI cable.
3. Check input source.
4. Test another laptop.
5. Replace damaged cable if required.

The resolution suggestion must be clearly marked as
AI-generated.

---

### 7.5 Notification Agent

Generate notifications when:

- A ticket is created.
- A ticket is assigned.
- Admin approval is required.
- A ticket is approved.
- A ticket is rejected.
- A ticket is resolved.

---

## 8. Agent Orchestrator

Create an Agent Orchestrator responsible for coordinating
the agents.

Workflow:

1. Receive complaint.
2. Validate input.
3. Invoke Triage Agent.
4. Invoke Priority Agent.
5. Invoke Assignment Agent.
6. Invoke Resolution Agent.
7. Determine whether human approval is required.
8. Create or update the maintenance ticket.
9. Notify relevant users.

The agents must not directly modify unrelated system data.

---

## 9. Human-in-the-Loop Approval

High-priority and critical complaints require administrator approval.

Workflow:

LOW / MEDIUM:

AI Analysis
    ↓
Automatic Assignment
    ↓
Maintenance Team

HIGH / CRITICAL:

AI Analysis
    ↓
Admin Approval
    ↓
Approve / Reject
    ↓
Maintenance Team

The admin must be able to see:

- Issue description
- AI category
- AI priority
- Assigned team
- AI reasoning
- Suggested resolution

---

## 10. Ticket Management

Each complaint becomes a ticket.

Ticket fields:

- Ticket ID
- Reporter
- Issue title
- Description
- Location
- Category
- Priority
- Assigned team
- Assigned maintenance member
- Status
- AI analysis
- Resolution suggestion
- Resolution notes
- Created timestamp
- Updated timestamp
- Resolved timestamp

Ticket statuses:

- Open
- AI_ANALYSIS
- WAITING_FOR_APPROVAL
- ASSIGNED
- IN_PROGRESS
- RESOLVED
- REJECTED
- FAILED

---

## 11. Dashboard

Create dashboards based on user role.

### Student / Staff Dashboard

Display:

- Total submitted tickets
- Open tickets
- In-progress tickets
- Resolved tickets
- Recent tickets

### Maintenance Dashboard

Display:

- Assigned tickets
- High-priority tickets
- In-progress tickets
- Completed tickets
- Average resolution time

### Admin Dashboard

Display:

- Total tickets
- Open tickets
- High-priority tickets
- Critical tickets
- Resolved tickets
- Average resolution time
- Tickets by category
- Tickets by priority
- AI agent success rate

Use Recharts for analytics.

---

## 12. Admin Analytics

Create charts for:

- Tickets by category
- Tickets by priority
- Tickets by status
- Tickets per day
- Average resolution time
- AI vs human decisions

Use clear labels and responsive charts.

---

## 13. Database

Create the following tables:

### users

- id
- name
- email
- password_hash
- role
- created_at

### tickets

- id
- reporter_id
- title
- description
- location
- room
- category
- priority
- assigned_team
- assigned_user
- status
- created_at
- updated_at
- resolved_at

### ai_analysis

- id
- ticket_id
- category
- priority
- assignment
- reasoning
- resolution_suggestion
- confidence
- created_at

### maintenance_teams

- id
- team_name
- category
- description

### notifications

- id
- user_id
- ticket_id
- message
- read
- created_at

### audit_logs

- id
- user_id
- action
- ticket_id
- details
- created_at

---

## 14. AI Fallback

The application must remain functional if the LLM service
is unavailable.

Implement a rule-based fallback classifier.

For example:

- "wifi", "internet", "network" → Network
- "projector", "speaker", "computer" → Equipment
- "water", "tap", "pipe", "leak" → Plumbing
- "fan", "light", "switch", "power" → Electrical
- "dirty", "cleaning", "garbage" → Cleaning

The UI must indicate whether the analysis was produced by:

- AI Agent
- Rule-Based Fallback

---

## 15. Error Handling

Handle:

- Invalid complaint
- Missing required fields
- AI service unavailable
- Database failure
- Agent timeout
- Assignment failure
- Authentication failure
- Unauthorized access

When an agent fails, the system must not lose the original
complaint.

The ticket should move to an appropriate failed or review state.

---

## 16. Security

Implement:

- JWT authentication.
- Password hashing.
- Role-based authorization.
- Input validation.
- API authorization.
- Protected admin routes.
- Protected maintenance routes.
- Environment variables for secrets.
- No hardcoded passwords or API keys.
- Audit logging for important actions.

AI-specific security:

- Validate user input before sending it to the LLM.
- Prevent prompt injection from directly controlling tools.
- Validate AI-generated category and priority values.
- Do not allow the AI to bypass authorization.
- Require human approval for high-impact decisions.

---

## 17. Audit Logging

Record:

- Login attempts
- Ticket creation
- Ticket assignment
- Priority changes
- Admin approvals
- Admin rejections
- Ticket resolution
- Unauthorized access attempts

Each audit record must contain:

- User
- Action
- Timestamp
- Ticket ID where applicable
- Additional details

---

## 18. UI Design

Create a clean modern campus-management interface.

Use:

- White/light background with blue accent colors.
- Responsive cards.
- Status badges.
- Priority badges.
- Tables for tickets.
- Dashboard cards.
- Modal dialogs for approvals.
- Toast notifications.

Priority colors:

- Low → Green
- Medium → Yellow
- High → Orange
- Critical → Red

The interface should be simple enough for students and
maintenance staff to use without training.

---

## 19. Ticket Details Page

When a user opens a ticket, display:

- Ticket information
- Current status
- Reporter
- Location
- Category
- Priority
- Assigned team
- AI analysis
- AI reasoning
- Suggested resolution
- Activity timeline
- Resolution notes

For administrators, include:

- Approve
- Reject
- Reassign

buttons where appropriate.

---

## 20. Testing

Add tests for:

- User authentication
- Role-based access
- Ticket creation
- Triage classification
- Priority classification
- Assignment
- AI fallback
- Admin approval
- Ticket status changes
- Unauthorized API access

The project must build successfully and the application
must run without console errors.

---

## 21. Deployment

The prototype must be runnable locally.

Provide:

- `requirements.txt`
- `.env.example`
- Setup instructions
- Database initialization instructions
- Application startup instructions

Do not commit:

- API keys
- Passwords
- JWT secrets
- Database credentials
- `.env` files containing secrets

The architecture should be designed so that the application
can later be containerized using Docker and deployed to
Kubernetes.

---

## 22. Project Structure

Use a modular structure similar to:

CampusFix-AI/

├── frontend/
├── backend/
│   ├── agents/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── database/
│   └── main.py
│
├── tests/
├── README.md
├── requirements.txt
└── .env.example

---

## 23. Expected User Flow

Student:

Login
↓
Report Issue
↓
Submit Complaint
↓
AI Analysis
↓
View Category + Priority
↓
Track Ticket
↓
Receive Resolution

Maintenance:

Login
↓
View Assigned Tickets
↓
Accept Ticket
↓
Start Work
↓
Add Resolution
↓
Mark Resolved

Admin:

Login
↓
View Dashboard
↓
Review High-Priority Tickets
↓
Approve / Reject
↓
Monitor Maintenance
↓
View Analytics
↓
View Audit Logs

---

## 24. Goal

Build a functional prototype of CampusFix AI that demonstrates
Agentic AI-based campus maintenance management.

The system should demonstrate:

- Multi-agent collaboration
- Agent orchestration
- Human-in-the-loop approval
- Role-based access
- Persistent ticket management
- AI fallback
- Security
- Auditability
- Monitoring and analytics
- Scalable enterprise architecture

The application should be simple, reliable, modular, and easy
to demonstrate during a project presentation.
