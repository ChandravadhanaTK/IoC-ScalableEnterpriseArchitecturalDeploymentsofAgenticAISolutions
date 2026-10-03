# 2023103519-Manikandan | Capstone Agentic AI Submission

**Student Name**: Manikandan  
**Roll Number**: 2023103519  
**Course**: Scalable Enterprise Architectural Deployments of Agentic AI Solutions  
**Date**: October 2026  

---

## 📂 Submission Directory Contents

This folder (`2023103519-Manikandan`) satisfies all capstone pull request requirements:

1. **`PROMPT.md`**: The complete prompt specification file that can be used to generate the full-stack agentic application.
2. **`CAPSTONE_DELIVERABLES.md`**: Markdown presentation of all 5 enterprise architecture deliverables:
   - Deliverable 1: Enterprise Architecture Diagram & Layer Descriptions
   - Deliverable 2: Agent Workflow Design, State Transitions & Failure Healing Matrix
   - Deliverable 3: Kubernetes Deployment Strategy & Blue/Green Release Topology
   - Deliverable 4: Security Model, RBAC, PII Scrubbing & HITL Controls
   - Deliverable 5: Monitoring Dashboard Layout, KPIs & OpenTelemetry SLAs
3. **`CAPSTONE_DELIVERABLES.docx`**: Word document version of the architectural deliverables.
4. **`application/`**: Complete, production-ready application source code.
   - `backend/`: Express.js + Node.js Agentic Orchestration Core, Guardrail Engine, Tools, & Telemetry Store.
   - `frontend/`: React + Vite Glassmorphic Dashboard with live DAG Agent Visualizer, HITL Modal, & Telemetry Analytics.

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm

### Running the Application

```bash
# Navigate to application directory
cd application

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Launch full-stack platform (runs backend on :5000 & frontend on :3000)
node start.js
```

Open your browser and navigate to `http://localhost:3000` to interact with the platform.
