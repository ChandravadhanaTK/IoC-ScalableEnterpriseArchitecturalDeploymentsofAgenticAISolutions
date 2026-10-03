# NextStep — Agentic AI Assistant for Students
## Assignment Deployment & Project Links

### Student Details
- **Student Name:** Renukadevi A C
- **Roll Number:** 2023103503
- **Course / Assignment:** IoC Scalable Enterprise Architectural Deployments of Agentic AI Solutions
- **Project Name:** NextStep — Agentic Assistant for Students
- **Submission ID:** `2023103503-Renukadevi_A_C_NextStepAI`

---

### 🌐 Live Production Deployment
- **Live Application URL:** [https://nextstep-ai-agent.onrender.com/](https://nextstep-ai-agent.onrender.com/)
- **Health Check Endpoint:** [https://nextstep-ai-agent.onrender.com/api/health](https://nextstep-ai-agent.onrender.com/api/health)
- **Interactive Capstone Deliverables UI:** [https://nextstep-ai-agent.onrender.com/deliverables](https://nextstep-ai-agent.onrender.com/deliverables)

---

### 📁 Source Code Repository
- **GitHub Repository:** [https://github.com/Renuka-de/NextStep-AI-Agent](https://github.com/Renuka-de/NextStep-AI-Agent)

---

### 🔑 Demo Login Credentials

| Role | Email | Password | Access Details |
|---|---|---|---|
| **Student** | `alex@student.com` | `student123` | Active goal workspace, Pomodoro focus session, Task unblocker with automated 15-min replanning, Activity stream |
| **Admin** | `admin@nextstep.ai` | `admin123` | System monitoring dashboard, user activation management, global goals directory, audit trails |

---

### 🛠️ Architecture & Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, React Router v6
- **Backend:** FastAPI, Python 3.11, Pydantic v2, SQLAlchemy 2.0
- **Agent Orchestration:** LangGraph (StateGraph), LangChain
- **LLM Engine:** Google Gemini API (`google-genai` SDK) with deterministic fallback service
- **Authentication & Security:** JWT (HS256), BCrypt password hashing, RBAC (Student/Admin roles)
- **Cloud Infrastructure:** Docker multi-stage build, Render.com Web Service, SQLite / PostgreSQL ready

---

### 📑 Capstone Deliverables Summary
1. **Deliverable 1 — Architecture Diagram:** Clean layered architecture (UI, Application, Agent Brain, Storage, Security)
2. **Deliverable 2 — Agent Workflow Design:** Full LangGraph cyclic loop with automated roadblock capture & replanning
3. **Deliverable 3 — Deployment Strategy:** CI/CD pipeline, containerized multi-stage Docker build, and staging/prod environments
4. **Deliverable 4 — Security Model:** Threat modeling, JWT verification, role-based access control, input sanitization
5. **Deliverable 5 — Monitoring Dashboard Design:** Real-time metrics, system health, task throughput, and agent telemetry
