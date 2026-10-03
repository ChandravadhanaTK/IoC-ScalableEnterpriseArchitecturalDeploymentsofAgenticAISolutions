Build a polished, responsive, full-stack web application called **AI Meeting Action Tracker**, an enterprise-oriented agentic AI system that turns meeting transcripts into approved, tracked tasks with deadline reminders. It is an academic demonstration for "IoC - Scalable Enterprise Architectural Deployments of Agentic AI Solutions".

**OBJECTIVE:** Meeting Transcript → AI Action Extraction → Validation → Human Approval → Task Creation → Deadline Monitoring → In-App Notifications. This is NOT a chatbot.

**USER FEATURES:** Dashboard (total meetings, action items, pending/completed/overdue tasks, upcoming deadlines); Meetings list with search/filter; Create Meeting (title, date, participants, transcript, Analyze button, optional "Load sample transcript" button); Meeting Details (original transcript, extracted action items, agent status, Approve/Reject controls, created tasks); Tasks table/list with status, owner, deadline, priority, filters, status updates and editing; Notifications with bell icon and read/unread state; Profile.

**AGENTS:** Exactly three agents, clearly separated in UI and architecture, coordinated by a backend Orchestrator:
1. **Meeting Analysis Agent:** Uses a real server-side LLM API to extract action item, owner, deadline, priority (only if reasonably inferable), context and source text. It must never invent information absent from the transcript.
2. **Task Management Agent:** After approval, converts items into tasks (title, description, owner, deadline, priority, status, meeting, created/updated dates). States: TODO, IN_PROGRESS, COMPLETED, OVERDUE.
3. **Reminder Agent:** Checks deadlines, flags approaching and overdue tasks, creates in-app notifications and avoids duplicates. No email, SMS or WhatsApp.

**WORKFLOW:** Transcript → AI extraction → Validation → AWAITING_APPROVAL → User approves/rejects → Task creation → Reminders → Notifications. Tasks must never be created before approval. Show agent states visibly in the UI: IDLE, PROCESSING, VALIDATING, AWAITING_APPROVAL, COMPLETED, FAILED.

**ARCHITECTURE PAGES:** Professionally designed (diagrams, cards, not plain text) pages at `/architecture`, `/architecture/agents`, `/architecture/deployment`, `/architecture/security`, `/monitoring`, `/monitoring/traces`.
- **Architecture:** Layered diagram (Presentation, API, Orchestration, Agent, AI/LLM, Data, Observability) showing React frontend, API backend, Orchestrator, three agents, LLM API, database, notification service, monitoring, with trust boundaries and data flows.
- **Agent workflow:** Visual flow with role, input, output, tools, state and failure path per agent, plus retry/error handling.
- **Deployment:** Dev → Test → Staging → Production, covering CI/CD, containers, environment config, secrets management, horizontal scaling, health checks, logging and zero-downtime deployment.
- **Security:** Authentication, authorization, RBAC (USER, ADMIN), input validation, prompt-injection protection, PII protection, secrets management, audit logging.
- All pages must reflect the actual implemented design.

**SECURITY / AI SAFETY:** Treat transcripts as untrusted input; embedded instructions must never override system instructions. Detect suspicious prompt-injection patterns and record them as security events. The LLM cannot execute tools or commands. Users access only their own meetings and tasks. Never expose the LLM API key in frontend code.

**MONITORING:** Dashboard with six categories: Health, Trace, Quality, Safety, Cost/Usage, Business Outcomes. List agent executions with trace ID, agent, state, execution time, success/failure, token usage (when available) and timestamp. Trace detail page shows the full path: Orchestrator → Meeting Analysis → Validation → Human Approval → Task Management → Reminder. Use only real telemetry; when no data exists, display "No data yet". Never fabricate metrics.

**DATA:** Persistent storage for Users, Meetings, Tasks, Notifications, Agent Runs, Audit Logs. Relationships: User → Meetings, Meeting → Tasks, User → Tasks, User → Notifications, Agent Run → Meeting, Agent Run → Trace.

**DESIGN:** Clean, modern, minimal enterprise SaaS look using cards, tables, badges, tabs, status indicators, workflow diagrams and dashboards. Responsive, clear information hierarchy, no futuristic AI visuals. It should look like a real agentic-AI platform, not a chatbot.

**QUALITY:** Functional working application, not a static prototype. Typed data models, validated inputs and API responses, loading/error states, reusable components, and a clear README stating which features are functional and which need configuration (e.g. LLM API key).
