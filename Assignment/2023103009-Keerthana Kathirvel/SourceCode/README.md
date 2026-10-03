# Campus Guardian AI

Build a modern enterprise-grade web application called "CampusFlow AI".

CampusFlow AI is an AI-powered campus incident management and operations platform. It allows students and staff to report campus issues and uses an AI agent to classify, prioritize, route and recommend actions for each incident.

TECH STACK:
- React
- TypeScript
- Vite
- Tailwind CSS
- Modern component-based architecture
- Use mock data initially
- Keep the architecture ready for a real backend/API integration

APPLICATION STRUCTURE:

1. DASHBOARD
Create a professional enterprise dashboard showing:
- Total incidents
- Open incidents
- Resolved incidents
- Critical incidents
- Average response time
- Resolution rate
- Department workload
- Recent incidents
- AI agent activity
- Incident trends over time

Use attractive cards, charts, tables and status indicators.

2. REPORT INCIDENT PAGE
Create a form where users can report:
- Incident title
- Detailed description
- Location
- Category
- Severity
- Reporter
- Optional attachment

After submission, show a confirmation and generate an incident ID.

3. AI TRIAGE PAGE
Create an AI agent interface that analyzes reported incidents.

The AI agent should:
- Read the incident description
- Classify the incident into categories such as IT, Infrastructure, Security, Maintenance or Academic
- Determine priority: Low, Medium, High or Critical
- Recommend a department
- Suggest recommended actions
- Provide a short reasoning summary
- Show confidence
- Indicate whether human approval is required

Create a visual agent workflow showing:
Incident Received → Validate → AI Classification → Priority Assessment → Department Routing → Human Approval (if needed) → Resolution

4. INCIDENT MANAGEMENT PAGE
Create a table containing all incidents.

Include:
- Incident ID
- Title
- Category
- Priority
- Department
- Status
- Created date
- Assigned person
- Resolution time

Allow filtering and searching.

Incident statuses:
- New
- Under Review
- Assigned
- In Progress
- Resolved
- Closed

5. INCIDENT DETAILS PAGE
When an incident is selected, display:
- Complete incident information
- AI analysis
- Recommended action
- Assigned department
- Status timeline
- Activity log
- Audit trail

6. MONITORING DASHBOARD
Create a dedicated monitoring page containing:
- System health
- AI agent success rate
- Average AI response time
- API latency
- Error rate
- Incident processing volume
- Human approval rate
- Safety/guardrail events
- Estimated operational cost
- Business outcomes

Use charts and visual indicators.

7. SECURITY PAGE
Create a security overview showing:
- Authentication status
- Role-based access control
- Active sessions
- Security events
- Audit logs
- Data protection status
- Secrets/configuration status

Define example roles:
- Student
- Staff
- Department Manager
- Administrator

8. AGENT ACTIVITY PAGE
Create a visual view of AI agent operations.

Show:
- Agent status
- Current task
- Tools used
- Recent actions
- Successful actions
- Failed actions
- Human approval requests

9. SETTINGS PAGE
Include:
- User profile
- Notification settings
- Security settings
- Application preferences

DESIGN:

Use a polished enterprise SaaS design.

Use:
- Dark navy/blue professional theme
- White cards
- Subtle gradients
- Rounded cards
- Clean typography
- Professional charts
- Responsive layout
- Sidebar navigation
- Top navigation/header

The UI should look like a real enterprise operations platform rather than a student project.

IMPORTANT UX REQUIREMENTS:

Include:
- Loading states
- Empty states
- Error states
- Success notifications
- Confirmation dialogs
- Search
- Filtering
- Responsive design

Use realistic mock data so that all dashboards and charts are populated.

Do not use lorem ipsum.

Create realistic campus incident examples such as:
- Projector failure in CS Lab
- Wi-Fi outage in hostel
- Broken laboratory equipment
- Security access card failure
- Power outage
- Classroom maintenance issue

ARCHITECTURE REQUIREMENTS:

Structure the application so that the following conceptual layers are clear:

Presentation Layer
→ Application/Agent Layer
→ Service/API Layer
→ Data Layer

Keep AI-agent logic separated from UI components.

Create reusable components and maintain clean code organization.

SECURITY REQUIREMENTS:

Demonstrate:
- Role-based access control
- Authentication concept
- Authorization checks
- Audit logging
- Input validation
- Secure handling of secrets
- Human approval for high-risk actions

Do not place real API keys or secrets in frontend code.

The final application should feel like a production-ready enterprise AI operations platform and should provide enough functionality to demonstrate architecture, agent workflow, deployment, security and monitoring.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://campusflow-ai-ops.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ecf9cfe8-62a7-499b-9b48-963cba5199da).

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
