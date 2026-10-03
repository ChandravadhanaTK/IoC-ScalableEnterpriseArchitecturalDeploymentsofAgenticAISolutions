---
title: PatchCraft AI - Autonomous Vulnerability Remediation Agent
emoji: 🛡️
colorFrom: blue
colorTo: green
sdk: streamlit
sdk_version: 1.30.0
app_file: app.py
pinned: false
license: mit
---

# 🛡️ PatchCraft AI - Streamlit Agentic Assistant

**Student Author:** Vishanth (Roll No: 2023103094)  
**Course:** Industry Oriented Course (IoC) - *Scalable Enterprise Architectural Deployments of Agentic AI Solutions* (Anna University R2023)  
**Course Instructors:** Chandravadhana T.K. (Senior AI/ML Architect) & Dr. K. Saravanan (CEG, Guindy)  

---

## 🤖 What Does PatchCraft AI Actually Do?

PatchCraft AI is an enterprise-grade autonomous agentic assistant built in Python and Streamlit. It automates end-to-end software dependency security patch governance through a 6-phase autonomous agent loop:

1. **🔍 Continuous CVE Vulnerability Detection**:
   - Parses repository manifest files (`package.json`, `requirements.txt`, `pom.xml`).
   - Scans and correlates dependencies against live National Vulnerability Database (NVD) advisories and CVE security feeds.

2. **📐 CVSS Risk & Breaking Change Assessment**:
   - Calculates a normalized **Breaking Risk Score (0.0 to 1.0)** based on CVSS v3.1 severity metrics and semver upgrade deltas (`patch` vs `minor` vs `major` breaking updates).

3. **🔒 Secret & PII Sanitization Guardrail**:
   - Intercepts all prompt payloads before sending context to LLMs.
   - Automatically redacts AWS Access Keys (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`), JWT tokens, and private SSH keys to `[REDACTED_SECRET_GUARDRAIL]`.

4. **🧪 Dry-Run Sandbox Test Verification**:
   - Spins up an ephemeral, isolated container sandbox.
   - Applies the dependency upgrade, compiles the codebase, and runs full unit/integration test suites to guarantee 100% green builds before opening any PRs.

5. **⚠️ Human-in-the-Loop Approval Governance**:
   - Automatically pauses autonomous execution whenever a major version upgrade or high-risk CVE (Risk Score > 0.5) is detected.
   - Issues a cryptographically signed approval ticket to the Streamlit Operations Dashboard, requiring explicit Security Admin signature.

6. **📦 Automated Pull Requests & Immutable Audit Logging**:
   - Auto-generates GitHub Pull Requests with syntax-highlighted git diff previews and CVE changelogs.
   - Records every tool invocation, security decision, and admin approval signature in an immutable, append-only SHA-256 ledger.

---

## 📁 Repository & Project Structure

```
2023103094-Vishanth-PatchCraft_AI/
├── app.py                     # Main Streamlit Web Application Entrypoint (HF Spaces Compatible)
├── requirements.txt           # Python dependency specifications (streamlit, pandas, plotly)
├── Dockerfile                 # Containerized Docker & Hugging Face Docker Space config
├── DEPLOYMENT.md              # Complete Hugging Face & Cloud deployment guide
├── DELIVERABLES.md            # Enterprise Capstone Architectural Documentation (All 5 Deliverables)
├── PROMPT.md                  # Master AI Prompt used to generate PatchCraft AI
├── README.md                  # Master README with Hugging Face metadata frontmatter
└── src/                       # Source Code Directory
    ├── __init__.py
    ├── agent_engine.py        # Core Agent FSM Engine & Orchestrator
    ├── tools.py               # Autonomous tools (CVE Scanner, Risk Evaluator, Sandbox, PR Generator)
    ├── guardrails.py          # Security guardrails (Secret Sanitizer & Compliance Evaluator)
    └── utils.py               # Telemetry logging, hashing, & downloadable report generation
```

---

## 🏆 Capstone Deliverables Summary (`DELIVERABLES.md`)

1. **Deliverable 1: Architecture Diagram**: 3-tier enterprise architecture mapping Client Streamlit UI Layer, Ingress Gateway (Trust Boundary 1), Secure Agent Core Layer, Tool Execution Engine, Security Guardrail Layer, and Enterprise Cloud Mesh (Trust Boundary 2).
2. **Deliverable 2: Agent Workflow Design**: Finite State Machine lifecycle, agent roles, tool execution schemas, human-in-the-loop approval handoffs, and error recovery paths.
3. **Deliverable 3: Deployment Strategy**: Docker/Kubernetes pod runtime, Horizontal Pod Autoscaler (HPA), resilience patterns, multi-environment setup, and Blue-Green release strategy.
4. **Deliverable 4: Security Model**: RBAC identity matrix, Vault secret management, `SecretSanitizerGuardrail` PII & token scrubber, and SHA-256 immutable audit ledger.
5. **Deliverable 5: Monitoring Dashboard Design**: Telemetry matrix for system health, execution trace latencies, sandbox build pass rates, guardrail block triggers, LLM token costs, and developer SLA outcomes.

---

## 🚀 How to Run the Application Locally

1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Launch the Streamlit web application:
   ```bash
   streamlit run app.py
   ```

3. Open your browser to `http://localhost:8501`.

---

## 🌐 How to Deploy to Hugging Face Spaces

Refer to [DEPLOYMENT.md](file:///e:/visha/Documents/IOC/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions/Assignment/2023103094-Vishanth-PatchCraft_AI/DEPLOYMENT.md) for full 3-step instructions on deploying this app to Hugging Face Spaces for free and sharing the live link with your course guide.
