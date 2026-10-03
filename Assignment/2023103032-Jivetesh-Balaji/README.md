# Enterprise Agentic IT Service Assistant

A university capstone implementation demonstrating an enterprise-style agentic assistant with tools, authorization, approvals, audit logs and monitoring.

## Requirements

- Python 3.11+
- Optional Docker Desktop

## Run locally

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start:

```bash
uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

## Run with Docker

```bash
docker compose up --build
```

Open:

```text
http://127.0.0.1:8000
```

## Demo roles

The UI provides three demonstration roles:

- EMPLOYEE
- IT_SUPPORT
- ADMIN

These are demo identities only. Production authentication should use enterprise SSO/OAuth/OIDC.

## Important project files

```text
app/orchestrator.py       Agent planning and execution
app/policy.py             Tool authorization
app/tools.py              Enterprise tools
app/knowledge.py          Knowledge retrieval
app/approvals.py          Approval workflow
app/database.py           SQLite persistence
app/main.py               FastAPI application
static/index.html         Web interface
deliverables.md           Five capstone deliverables
prompt.md                 Prompt for generating/extending the application
```

## Example requests

- "How do I connect to company Wi-Fi?"
- "Create a ticket for my overheating laptop."
- "Show my asset information."
- "Show another employee's asset information."
- "Reset the password for U1002." (IT_SUPPORT/ADMIN; approval required)

## Security note

This is a capstone demonstration. The included services use local demo data. Before production use, integrate real identity, secrets management, databases, enterprise APIs and a properly secured approval service.
