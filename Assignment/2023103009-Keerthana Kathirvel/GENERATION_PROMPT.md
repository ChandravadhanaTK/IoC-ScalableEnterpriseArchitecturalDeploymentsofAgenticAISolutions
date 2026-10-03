# CampusFlow AI - Lovable Generation Prompt

Build a production-style enterprise SaaS web application called **CampusFlow AI**, an AI-powered campus incident management and operations platform.

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Modern component-based architecture
- Responsive design for desktop and mobile
- Use clean, maintainable and modular code

## Application Purpose

CampusFlow AI allows students and staff to report campus incidents such as infrastructure issues, security concerns, electrical problems, network issues, sanitation problems and other operational incidents.

An AI-powered agent analyzes each incident, classifies it, determines its priority, identifies the responsible department, recommends an action and routes the incident to the appropriate team.

Human approval should be incorporated for important AI-generated decisions.

## Main Pages

### 1. Dashboard

Create an enterprise-style dashboard containing:

- Total incidents
- Open incidents
- Resolved incidents
- Critical incidents
- Average response time
- Resolution rate
- Department workload
- AI agent activity
- Incident trends
- Recent incidents
- Priority distribution

Use professional charts, cards and tables.

### 2. Report Incident

Create an incident reporting form containing:

- Incident title
- Description
- Location
- Category
- Severity
- Reporter
- Optional attachment

After submission, the incident should enter the AI triage workflow.

### 3. AI Triage

Create an AI triage interface showing:

- Incident classification
- Priority
- Assigned department
- Recommended action
- AI reasoning
- Confidence score
- Approval status

Include a human-in-the-loop approval mechanism.

### 4. Incident Management

Create a searchable and filterable incident table.

Include:

- Incident ID
- Title
- Category
- Priority
- Department
- Status
- Assigned team
- Created time
- Last updated time

Allow users to open individual incident details.

### 5. Incident Details

Create a detailed incident page containing:

- Incident information
- AI analysis
- Recommended action
- Assignment
- Status
- Timeline
- Audit trail
- Human approval information

### 6. Agent Activity

Create a page showing AI agent activity, including:

- Agent executions
- Tasks performed
- Decisions made
- Confidence
- Success/failure status
- Execution time
- Human approvals
- Escalations

### 7. Monitoring Dashboard

Create an enterprise monitoring dashboard containing:

- Application health
- AI success rate
- Average response time
- API latency
- Error rate
- Incident volume
- Human approval rate
- Security events
- Estimated AI cost
- Agent outcomes

Use suitable charts and visual indicators.

### 8. Security

Create a security page demonstrating role-based access control.

Roles:

- Student
- Staff
- Department Manager
- Administrator

Show:

- Authentication
- Authorization
- Role permissions
- Audit logging
- Security events
- Data protection

Do not expose secrets or API keys in frontend code.

### 9. Settings

Create a settings page for application and user preferences.

## AI Agent Architecture

Represent the conceptual architecture as:

Presentation Layer
↓
Application / Agent Layer
↓
Service / API Layer
↓
Data Layer

The AI agent should conceptually perform:

Incident Input
→ Classification
→ Priority Assessment
→ Department Routing
→ Action Recommendation
→ Human Approval
→ Incident Assignment
→ Resolution Tracking

## Security Requirements

Demonstrate:

- Role-based access control
- Authentication
- Authorization
- Audit logging
- Secure API communication
- Input validation
- Protection of sensitive information
- No hard-coded secrets
- Human approval for sensitive AI decisions

## UI / UX

Use a professional enterprise SaaS design.

Preferred visual style:

- Dark navy / blue theme
- Clean dashboard cards
- Modern tables
- Professional charts
- Clear status badges
- Responsive layouts
- Consistent spacing and typography
- Accessible UI components

The application should look like a real enterprise AI operations platform rather than a simple student CRUD application.

## Overall Goal

The application should demonstrate how an Agentic AI solution can be deployed in an enterprise environment with:

1. Architecture
2. Agent workflow
3. Deployment strategy
4. Security model
5. Monitoring and observability

The application should provide enough UI evidence to support these five capstone deliverables.