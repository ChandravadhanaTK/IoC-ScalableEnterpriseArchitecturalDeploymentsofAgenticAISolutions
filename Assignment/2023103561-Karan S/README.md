# 🚨 Smart Emergency Incident Response System

### Multi-Agent AI + RAG for Safety-Aware Emergency Response Coordination

An agentic AI system designed to analyze emergency incident reports, extract critical information, retrieve relevant procedures, validate safety and evidence, and generate a coordinated response plan with **human approval before deployment**.

The system combines **LangGraph, Groq, RAG, Chroma, and Streamlit** into a multi-stage emergency response workflow.

---

## 📦 Submission Deliverables

This repository contains the complete application source code and the two requested Markdown artifacts:

1. [Application generation prompt](application_prompt.md) - reusable prompt for regenerating or extending the application.
2. [Capstone deliverables](deliverables.md) - architecture diagram, agent workflow design, deployment strategy, security model, monitoring dashboard design, and source inventory.
3. Complete source code - all application modules are included in the repository root.

The deliverables document distinguishes the current prototype behavior from production recommendations.

---

## 🎯 Project Overview

Emergency response requires fast decisions while maintaining safety, evidence verification, and human oversight.

The **Smart Emergency Incident Response System** transforms an unstructured incident report into a structured and safety-aware action plan through a coordinated multi-agent workflow.

The system:

* 📝 Analyzes the incident report
* 📍 Extracts and resolves incident location
* 📚 Retrieves relevant emergency procedures using RAG
* 🚑 Evaluates available resources
* 🧠 Generates an initial response decision
* 🛡️ Performs safety validation
* 🔎 Verifies evidence and unsupported claims
* 👤 Requires human approval before deployment
* 📋 Generates the final action plan
* 📊 Tracks review history during the session

---

## 🏗️ System Architecture

```text
                         ┌───────────────────┐
                         │   User Incident   │
                         │      Report       │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Incident Agent   │
                         │ Extract & Analyze  │
                         └─────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌────────────┐ ┌─────────────┐ ┌──────────────┐
            │ Map Agent  │ │ Knowledge   │ │  Resource    │
            │            │ │ RAG Agent   │ │    Agent     │
            └─────┬──────┘ └──────┬──────┘ └───────┬──────┘
                  │               │                │
                  └───────────────┼────────────────┘
                                  ▼
                         ┌───────────────────┐
                         │  Decision Agent   │
                         │ Initial Response  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  Safety Checker   │
                         │ Safety Validation │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ Evidence Verifier │
                         │ Verify Claims     │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Human Review    │
                         │ Approval / Reject │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   Action Plan     │
                         │ Final Response    │
                         └───────────────────┘
```

---

## 🤖 Multi-Agent Workflow

### 1. Incident Agent

Analyzes the raw incident report and extracts important information such as:

* Incident type
* Location
* Severity
* People at risk
* Other relevant incident details

The extracted information becomes shared state for the downstream agents.

---

### 2. Map Agent

Processes the incident location and attempts to resolve it safely.

If geocoding fails, the system uses **safe default coordinates** instead of allowing the workflow to fail.

---

### 3. Knowledge RAG Agent

Retrieves relevant emergency procedures from the local knowledge base.

The system uses:

* **Chroma** for vector storage
* Local procedure documents
* Retrieval-Augmented Generation (RAG)

If retrieval fails, the agent falls back to a generic procedure so the workflow can continue.

Procedure documents are stored under:

```text
data/procedures/
```

The current clone does not include that directory. When it is unavailable, the agent uses its documented generic-procedure fallback so the workflow can still complete.

---

### 4. Resource Agent

Evaluates available response resources.

The current implementation uses a **local resource simulation** and does not depend on external dispatch systems.

---

### 5. Decision Agent

Combines the information collected from the previous stages and produces the initial response decision.

The decision considers:

* Incident information
* Location information
* Retrieved procedures
* Available resources

---

### 6. Safety Checker

Validates the proposed response from a safety perspective.

Instead of crashing the entire workflow when an issue is detected, the Safety Checker **flags the issue** so that it can be reviewed.

---

### 7. Evidence Verifier

Checks whether the generated decision is supported by the available incident evidence.

The UI exposes:

* Evidence verification status
* Evidence summary
* Unsupported claims

---

### 8. Human Review

Human oversight is integrated into the final response workflow.

The Streamlit interface provides:

```text
Approval Status
├── pending
├── approved
└── rejected
```

Reviewers can also provide:

```text
Review Comments
```

#### Pending

The plan requires additional review and is not authorized for deployment.

#### Approved

The plan has received human authorization and is marked as authorized for deployment.

#### Rejected

The plan has been rejected and should be revised or reviewed again.

Rejected plans are expected to include review comments, and the UI warns when comments are missing.

---

## 📋 Final Action Plan

After the workflow completes, the system generates a final action plan.

The plan includes a clear authorization status indicating whether the response is authorized for deployment.

The action plan can be downloaded directly from the Streamlit interface as a `.txt` file.

---

## 🖥️ Streamlit Dashboard

The project includes a Streamlit web interface for interacting with the system.

### Incident Input

Users can paste an emergency incident report directly into the application.

### Human Review Sidebar

The sidebar provides:

* Approval status
* Review comments
* Review run count
* Clear history button

### Verification Dashboard

After execution, the UI displays:

* 🛡️ Safety validation status
* 🔎 Evidence verification status
* 👤 Human approval status
* 📚 Evidence summary
* ⚠️ Unsupported claims
* 💬 Human review comments

### Agent Execution Trace

The application can display the execution trace produced by the workflow.

### Additional Details

The UI can expose:

* Location
* Incident type
* Severity
* People at risk
* Map information
* Resources
* Safety status
* Evidence status
* Approval status
* Review comments

---

## 📊 Review History

The application maintains a session-level review history.

Each run records:

| Field           | Description                      |
| --------------- | -------------------------------- |
| Timestamp       | Time of the review               |
| Location        | Incident location                |
| Incident Type   | Type of emergency                |
| Severity        | Incident severity                |
| People at Risk  | Number/details of people at risk |
| Safety Check    | Safety validation result         |
| Evidence Check  | Evidence verification result     |
| Approval Status | Human authorization status       |
| Review Comments | Human reviewer notes             |

The interface displays the most recent review sessions and allows the history to be exported as a `.csv` file.

The history can also be cleared from the sidebar.

---

## 🧰 Technology Stack

| Technology        | Purpose                            |
| ----------------- | ---------------------------------- |
| **Python**        | Core application language          |
| **LangGraph**     | Multi-agent workflow orchestration |
| **Groq**          | LLM reasoning                      |
| **Chroma**        | Vector database                    |
| **RAG**           | Local procedure retrieval          |
| **Streamlit**     | Web interface                      |
| **python-dotenv** | Environment configuration          |

---

## 📁 Project Structure

```text
smart-emergency-incident-response/
│
├── app.py
│   └── Streamlit UI
│
├── graph.py
│   └── LangGraph workflow wiring
│
├── state.py
│   └── Shared state for all agents
│
├── llm.py
│   └── Groq client setup
│
├── incident_agent.py, map_agent.py, knowledge_rag.py
│   └── Incident extraction, mapping, and procedure retrieval
├── resource_agent.py, decision_agent.py
│   └── Resource simulation and response decision
├── safety_checker.py, evidence_verifier.py
│   └── Safety and evidence validation
├── human_approval_agent.py, action_plan_agent.py
│   └── Human review and final plan generation
├── application_prompt.md
│   └── Prompt for regenerating the application
├── deliverables.md
│   └── Five requested architecture and design deliverables
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## ⚙️ Installation

### 1. Open the project folder

```powershell
cd <path-to>\smart-emergency-incident-response
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the virtual environment

For PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then activate again:

```powershell
.venv\Scripts\Activate.ps1
```

---

## 📦 Install Dependencies

Run this from the project folder:

```powershell
cd <path-to>\smart-emergency-incident-response
```

Then run:

```bash
pip install -r requirements.txt
```

If you see:

```text
Could not open requirements file:
[Errno 2] No such file or directory: 'requirements.txt'
```

make sure you are running the command from the project directory.

---

## 🔐 Environment Configuration

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_key_here
```

A template is provided in:

```text
.env.example
```

### Get a Groq API Key

Create your API key from the official Groq Console:

https://console.groq.com/keys

> **Important:** Never commit your `.env` file or expose your API key publicly.

---

## 🚀 Run the Application

From the project directory:

```bash
python -m streamlit run app.py
```

Then open:

```text
http://localhost:8501
```

---

## 🧪 Example Incident

You can test the system using:

```text
A large fire broke out on the third floor of a residential
building downtown. About 8 people are trapped in their
apartments and can't get out. Heavy smoke is spreading.
```

The system processes the incident through:

```text
Incident Analysis
        ↓
Location Resolution
        ↓
Procedure Retrieval
        ↓
Resource Assessment
        ↓
Initial Decision
        ↓
Safety Validation
        ↓
Evidence Verification
        ↓
Human Approval
        ↓
Final Action Plan
```

---

## 🛡️ Reliability & Safety

The system includes multiple fallback mechanisms.

### Map Agent

If geocoding fails:

```text
Geocoding Failure
       ↓
Safe Default Coordinates
```

### Knowledge RAG

If procedure retrieval fails:

```text
Retrieval Failure
       ↓
Generic Procedure Fallback
```

### Resource Agent

The current implementation does not depend on external dispatch systems.

### Safety Checker

Safety problems are flagged instead of causing the entire workflow to crash.

### Human Approval

The final plan is subject to human approval before deployment authorization.

---

## 🔄 End-to-End Workflow

```text
┌───────────────────────────────┐
│        Emergency Report       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Incident Agent         │
│ Extract incident information  │
└───────────────┬───────────────┘
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
     Map      RAG     Resource
    Agent     Agent     Agent
       │        │        │
       └────────┼────────┘
                ▼
┌───────────────────────────────┐
│        Decision Agent         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Safety Checker         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Evidence Verifier       │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│         Human Review          │
│   Pending / Approved / Reject │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Final Action Plan       │
└───────────────────────────────┘
```

---

## 🎯 Design Principles

### 🤖 Agentic AI

The system uses specialized agents for different stages of the incident response workflow instead of relying on a single LLM call.

### 📚 Retrieval-Augmented Generation

Relevant emergency procedures are retrieved from a local knowledge base before generating the response.

### 🛡️ Safety Validation

The generated response passes through a dedicated safety validation stage.

### 🔎 Evidence Verification

The system checks whether the generated decision is supported by the available evidence.

### 👤 Human-in-the-Loop

Human authorization is explicitly represented in the workflow before deployment.

---

## 📈 Future Improvements

Potential future extensions include:

* 🔌 Connect the Resource Agent to a real dispatch API
* 📚 Add more emergency procedure documents
* ⚡ Display agent execution traces live
* 👤 Expand the human-in-the-loop review process
* 🌐 Integrate real-time emergency resources
* 🗺️ Improve map and location integration
* 📊 Add analytics for historical incident reviews
* 🔎 Improve evidence retrieval and verification
* 🧠 Improve multi-agent coordination
* 🔐 Add stronger authentication and authorization for reviewers

---

## ⚠️ Disclaimer

This project is intended for **AI research, development, education, and demonstration purposes**.

It is **not a replacement for trained emergency personnel, official emergency procedures, or real-world emergency dispatch systems**.

Real-world deployment would require extensive validation, reliable data sources, security controls, human oversight, and integration with authorized emergency infrastructure.

---

## 👨‍💻 Project Summary

```text
              Smart Emergency
             Incident Response
                    │
                    ▼
              Multi-Agent AI
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
         RAG              LLM Reasoning
          │                   │
          └─────────┬─────────┘
                    ▼
             Safety Checker
                    │
                    ▼
            Evidence Verifier
                    │
                    ▼
            Human Approval
                    │
                    ▼
             Action Plan
```

### Built With

**Python • LangGraph • Groq • Chroma • RAG • Streamlit**

---

## ⭐ Key Features

* Multi-Agent AI Architecture
* LangGraph Workflow Orchestration
* Retrieval-Augmented Generation
* Local Emergency Procedure Knowledge Base
* Chroma Vector Store
* Safety Validation
* Evidence Verification
* Human-in-the-Loop Approval
* Review Comments
* Session Review History
* Action Plan Export
* Review History CSV Export
* Streamlit Dashboard
* Fallback Mechanisms for Critical Workflow Components


## Live URL: 

URL: https://smart-emergency-incident-response.streamlit.app/