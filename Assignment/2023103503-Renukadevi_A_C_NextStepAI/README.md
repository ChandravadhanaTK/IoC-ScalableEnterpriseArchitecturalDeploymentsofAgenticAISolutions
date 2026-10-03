# NextStep — Agentic Assistant for Students

> **Core Philosophy:** Students often know *what* they want to accomplish, but get overwhelmed and don't know *what to do next*. NextStep guides students **one single actionable step at a time** using an autonomous LangGraph agent loop.

---

## 🚀 Quick Start

### 1. Backend (FastAPI + LangGraph + Python 3.11)
```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend (React 18 + TypeScript + Vite + Tailwind CSS)
```powershell
cd client
npm run dev
```
- App URL: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `alex@student.com` | `student123` | Focus on next action, Pomodoro timer, stuck diagnosis, personal goals, activity stream |
| **🛡️ Admin** | `admin@nextstep.ai` | `admin123` | Superuser: System monitoring, global completion rates, student management (disable/enable), all goals audit, security logs |

*(You can also use the **Quick Demo Access** buttons directly on the Login page!)*

---

## 🤖 The LangGraph Agent Loop

Unlike standard chat interfaces that overwhelm users with endless walls of text, NextStep executes an autonomous state machine:

```
GOAL 
  → UNDERSTAND 
  → PLAN 
  → SELECT NEXT ACTION 
  → WAIT FOR STUDENT 
  → OBSERVE RESULT 
  → UPDATE PROGRESS 
  → REPLAN IF REQUIRED 
  → SELECT NEXT ACTION
```

### Student Actions:
1. **Mark as Done**: Observes student reflections, updates goal progress %, recalculates DAG topological order, and selects the next immediate task.
2. **I'm Stuck**: Runs the agent diagnosis node to analyze the specific roadblock and returns an immediate breakdown plus alternative pathways.
3. **Skip**: Moves past an already completed or irrelevant step without breaking dependencies.
4. **Pomodoro Timer**: Integrated 25-minute focus session right on the Next Action card.

---

## 🔄 Moving to the Next Goal (Never Stuck)

When a goal reaches 100% or all tasks are finished:
- The dashboard displays a celebratory completion banner.
- If the student has other active goals, a **one-click switcher** lets them immediately continue with their other learning paths.
- A prominent **"🚀 Start Next Goal with AI Plan"** CTA allows instant creation of a new goal with automated milestone decomposition.
- The **Goal Switcher** bar at the top of the dashboard allows toggling focus between any active goals at any time.

---

## 🛡️ Admin vs Student Differentiation

### Student Mode:
- **Private Data Isolation**: Only accesses their own goals, tasks, and reflections.
- **Zero Distractions**: Optimized UI focused entirely on the single next task.
- **403 Protected**: Any direct attempt to access administrative routes returns `403 Forbidden`.

### Admin Mode:
- **System Monitoring**: Live KPIs on registered students, total goals, task completion rates, and event velocity.
- **User Management**: View all registered accounts, roles, goal counts, and toggle account activation status.
- **All Goals Audit**: Global visibility into learning roadmaps created across all students.
- **Security & Audit Logs**: Trace of security events, timestamps, and IP telemetry.

---

## 🧪 Automated Integration Tests

Run the full end-to-end integration test suite (13 automated checks):
```powershell
cd backend
.venv\Scripts\python.exe test_integration.py
```
