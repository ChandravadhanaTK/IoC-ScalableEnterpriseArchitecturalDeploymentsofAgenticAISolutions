# Capstone Enterprise Architecture Deliverables: PatchCraft AI (Streamlit)

**Project Name:** PatchCraft AI - Autonomous Vulnerability Remediation Streamlit Agent  
**Student Author:** Vishanth (Roll No: 2023103094)  
**Architectural Baseline:** Enterprise Scalable Agentic AI Solution  
**Document Status:** Complete Deliverables Presentation  

---

## Executive Summary
PatchCraft AI is an enterprise-grade autonomous agentic assistant built in Python and Streamlit designed to continuously scan repository dependency manifests, detect CVE security vulnerabilities, evaluate update risk scores, safely execute dry-run patch validations in isolated sandboxes, scrub secret tokens via guardrails, and enforce Human-in-the-Loop approval gates for high-risk or breaking dependency updates.

---

## Deliverable 1: Architecture Diagram

### 1.1 Enterprise System Topology & Trust Boundaries

```mermaid
graph TB
    subgraph ClientZone ["1. Untrusted Client & Presentation Layer"]
        UI["💻 Streamlit Web Dashboard (app.py)"]
        CLI["💻 Developer CLI / Webhook Triggers"]
    end

    subgraph TrustBoundary1 ["🔐 Trust Boundary 1: API Ingress Gateway"]
        Gateway["🛡️ API Gateway & WAF<br/>(OIDC Auth, Rate Limiter, TLS 1.3)"]
    end

    subgraph SecureAgentCore ["2. Secure Agent Execution Core (Isolated Container Runtime)"]
        Orchestrator["⚙️ Agent FSM Orchestrator<br/>(src/agent_engine.py)"]
        Memory["🧠 Redis Working Memory<br/>(State Machine Context Store)"]
        
        subgraph ToolEngine ["🔧 Autonomous Tool Execution Engine (src/tools.py)"]
            ScannerTool["🔍 CVE Scanner Tool"]
            RiskTool["📐 Vulnerability Risk Evaluator"]
            SandboxTool["🧪 Patch Sandbox Tester"]
            PRTool["📦 PR Generator Tool"]
        end

        subgraph GuardrailEngine ["🛡️ Security & Privacy Guardrail Layer (src/guardrails.py)"]
            Sanitizer["🔒 SecretSanitizerGuardrail<br/>(AWS, PAT, JWT Scrubber)"]
            ComplianceCheck["📋 CompliancePolicyGuardrail"]
        end
    end

    subgraph TrustBoundary2 ["🔐 Trust Boundary 2: External Enterprise Cloud Mesh"]
        LLMGateway["🤖 Enterprise LLM Gateway<br/>(Azure OpenAI / Anthropic)"]
        AuditLedger[("📜 Immutable Audit Ledger<br/>(SHA-256 Ledger)")]
        NVDDatabase["🌐 National Vulnerability DB<br/>(NVD CVE API)"]
        GitHubAPI["🐙 GitHub Pull Request API"]
        NotificationChannel["💬 Slack / MS Teams Webhook"]
    end

    UI --> Gateway
    CLI --> Gateway
    Gateway --> Orchestrator
    Orchestrator <--> Memory
    Orchestrator --> ToolEngine
    ToolEngine --> GuardrailEngine
    GuardrailEngine --> LLMGateway
    GuardrailEngine --> AuditLedger
    ToolEngine --> NVDDatabase
    ToolEngine --> GitHubAPI
```

### 1.2 System Layer Breakdown & Component Responsibilities

| Layer | Micro-Component | Functional Responsibility | Trust Level |
| :--- | :--- | :--- | :--- |
| **Client Layer** | Streamlit UI (`app.py`) | Renders live state machine pipeline, vulnerability radar, sandbox git diffs, and metrics. | Untrusted |
| **Ingress Gate** | API Gateway | Validates OIDC JWT tokens, enforces IP rate limits, and scrubs invalid incoming payloads. | Boundary 1 |
| **Agent Core** | Orchestrator (`src/agent_engine.py`) | Enforces state transitions, manages working memory, dispatches tools, and logs telemetry. | High Trust |
| **Toolset** | CVE Scanner Tool (`src/tools.py`) | Parses dependency manifests (`package.json`, `requirements.txt`, `pom.xml`) against live CVE databases. | High Trust |
| **Toolset** | Risk Evaluator Tool (`src/tools.py`) | Computes CVSS v3.1 scores, semver update delta (patch vs minor vs major), and risk weight. | High Trust |
| **Toolset** | Patch Sandbox Tool (`src/tools.py`) | Simulates dependency upgrades in ephemeral sandbox; executes unit & smoke test suites. | High Trust |
| **Guardrails** | Secret Sanitizer (`src/guardrails.py`) | Active regex engine scrubbing private keys, AWS tokens, and secrets prior to LLM submission. | High Trust |
| **Integrations** | GitHub / Slack APIs | Auto-generates remediation pull requests; dispatches interactive approval webhooks. | Boundary 2 |

---

## Deliverable 2: Agent Workflow Design

### 2.1 Agent State Machine & Workflow Flowchart

```mermaid
flowchart TD
    classDef startState fill:#6366f1,stroke:#4f46e5,color:#fff,font-weight:bold
    classDef processState fill:#1e293b,stroke:#06b6d4,color:#fff
    classDef decisionState fill:#312e81,stroke:#a5b4fc,color:#fff,font-weight:bold
    classDef humanState fill:#78350f,stroke:#f59e0b,color:#fff,font-weight:bold
    classDef successState fill:#064e3b,stroke:#10b981,color:#fff,font-weight:bold
    classDef failState fill:#881337,stroke:#f43f5e,color:#fff,font-weight:bold

    Start(["🚀 Trigger: Scheduled Cron / User Trigger / GitHub Webhook"]):::startState --> State1

    subgraph DiscoveryPhase ["Phase 1: Vulnerability Scan & Analysis"]
        State1["🔍 IDLE → SCANNING_CVES<br/>(Parse package.json / requirements.txt / pom.xml)"]:::processState
        State1 --> State2["📐 ANALYZING_VULNERABILITIES<br/>(Cross-reference NVD CVE Feed)"]:::processState
    end

    State2 --> CheckDrift{"CVEs Found?"}:::decisionState
    CheckDrift -- "No CVEs" --> EndSuccess["✔ COMPLETED<br/>(System Clean & In Sync)"]:::successState
    CheckDrift -- "CVEs Discovered" --> State3

    subgraph SecurityPhase ["Phase 2: Security Guardrail & Risk Gate"]
        State3["🔒 EVALUATING_RISK<br/>(Run SecretSanitizerGuardrail)"]:::processState
        State3 --> CheckRisk{"Risk Score > Threshold<br/>or Major Version?"}:::decisionState
    end

    subgraph HumanGovernance ["Phase 3: Human-in-the-Loop Governance"]
        CheckRisk -- "YES: High Risk" --> StateApproval["⚠️ AWAITING_APPROVAL<br/>(Issue Ticket & Pause FSM)"]:::humanState
        StateApproval --> HumanDecision{"Security Admin<br/>Decision?"}:::decisionState
        HumanDecision -- "REJECT" --> StateRejected["✖ REJECTED<br/>(Handoff Closed & Aborted)"]:::failState
        StateRejected --> EndSuccess
    end

    CheckRisk -- "NO: Low/Med Risk" --> State4
    HumanDecision -- "APPROVE" --> State4

    subgraph ExecutionPhase ["Phase 4: Sandbox Verification & PR Deployment"]
        State4["🧪 VERIFYING_SANDBOX<br/>(Run Ephemeral Container Tests)"]:::processState
        State4 --> TestCheck{"Sandbox Tests<br/>Passed?"}:::decisionState
        
        TestCheck -- "PASS (42/42)" --> State5["📦 GENERATING_PR<br/>(Open GitHub Remediation PR)"]:::processState
        State5 --> EndComplete["✔ COMPLETED<br/>(PR Opened & Audit Logged)"]:::successState

        TestCheck -- "FAIL (Build Error)" --> StateFail["❌ FAILED<br/>(Trigger Jittered Retry)"]:::failState
        StateFail --> RetryCheck{"Retry Count < 3?"}:::decisionState
        RetryCheck -- "Yes" --> State4
        RetryCheck -- "No (Exceeded)" --> EndFail["💥 FAILED<br/>(Alert DevOps Team)"]:::failState
    end
```

### 2.2 Roles, Tools, Handoffs & Exception Governance

#### Agent Persona & Sub-Agent Roles
| Role Name | Primary Responsibility | Input Artifacts | Output Artifacts |
| :--- | :--- | :--- | :--- |
| **Scanner Agent** | Parses project manifests and matches CVE database feeds. | `package.json`, `requirements.txt`, `pom.xml` | Raw CVE Vulnerability Inventory |
| **Risk Evaluator Agent** | Calculates CVSS v3.1 scores & semver version upgrade deltas. | CVE Vulnerability List | Breaking Risk Score (0.0 - 1.0) |
| **Remediation Agent** | Applies patches in sandboxes, verifies test suites, and opens PRs. | Approved Dependency Version | GitHub PR & SHA-256 Audit Entry |

#### Human-in-the-Loop Approval & Failure Recovery
- **Human Gate Trigger**: Pauses execution automatically whenever Risk Score > 0.5 or major breaking semver version update is detected.
- **Approval Signature**: Requires authenticated Security Admin signature via Streamlit Operations Dashboard or web approval payload.
- **Fault Recovery**: Applies jittered exponential backoff on network API timeouts; max 3 retries before alerting DevOps.

---

## Deliverable 3: Deployment Strategy

### 3.1 Target Environment Topology

```mermaid
graph LR
    subgraph Dev ["Development Environment"]
        DevPod["Single Pod Container (Streamlit)"]
        DevMock["Mock CVE DB & Mock Git"]
    end

    subgraph Staging ["Staging Environment"]
        StgCluster["Kubernetes Cluster (2 Replicas)"]
        StgDB[("Staging Database & Redis")]
    end

    subgraph Production ["Multi-AZ Production & Cloud Hosting"]
        ALB["AWS ALB / Cloudflare WAF / HF Spaces"]
        subgraph EKS ["Kubernetes Cluster / Hugging Face Spaces"]
            PodA["PatchCraft Pod - Instance 1"]
            PodB["PatchCraft Pod - Instance 2"]
        end
        ProdRedis[("Redis Enterprise Cluster")]
        ProdDB[("PostgreSQL Aurora Multi-AZ")]
    end

    Dev --> Staging
    Staging --> Production
```

### 3.2 Deployment Strategy Key Specifications
- **Runtime Environment**: Containerized Docker image (`python:3.10-slim`) running Streamlit natively or on Hugging Face Spaces / Kubernetes.
- **Horizontal Pod Autoscaling (HPA)**: Target CPU = 70%, Target Memory = 75%; autoscales from 2 to 10 pods during build spikes.
- **Resilience**: Stateless pod architecture; working memory stored in Redis; graceful fallback to cached CVE database snapshots during upstream network outages.
- **Release Strategy**: Blue-Green deployment with automated smoke test verification prior to 100% traffic cutover.

---

## Deliverable 4: Security Model

### 4.1 RBAC Identity & Authorization Matrix

| User / Role | Read Manifests | Trigger Scan | Approve Breaking Patches | Admin Audit Access |
| :--- | :---: | :---: | :---: | :---: |
| **PatchCraft Agent Core** | ✔ | ✔ | x (Requires Human Gate) | x |
| **Security Administrator** | ✔ | ✔ | ✔ | ✔ |
| **Lead Developer** | ✔ | ✔ | ✔ (Low Risk Only) | x |
| **Auditor / Observer** | ✔ | x | x | ✔ |

### 4.2 Security Guardrails & Privacy Controls
1. **Secret & PII Sanitization Guardrail**:
   - Active regex scanner (`SecretSanitizerGuardrail`) redacting AWS Access Keys (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`), private SSH keys, and passwords to `[REDACTED_SECRET_GUARDRAIL]` before LLM processing.
2. **Key Management**:
   - Zero hardcoded credentials in source code. Secrets fetched at runtime from environment variables or Key Vaults.
3. **Immutable Audit Ledger**:
   - Cryptographically hashed (SHA-256) append-only ledger logging every scan result, vulnerability evaluation, and human approval signature.

---

## Deliverable 5: Monitoring Dashboard Design

### 5.1 Telemetry Metrics & Target SLAs

| Category | Metric Name | Target Baseline SLA | Alert Condition |
| :--- | :--- | :--- | :--- |
| **Health** | System Uptime & Memory Usage | > 99.9% Uptime, < 80% RAM | RAM > 85% for > 5 mins |
| **Trace** | End-to-End Patch Latency | < 15.0 seconds per run | Latency > 35s |
| **Quality** | Sandbox Build Pass Rate | > 98% Green Builds | Regression Rate > 2% |
| **Safety** | PII & Secret Leak Interception | 100% Interception | Any un-sanitized token in prompt |
| **Cost** | LLM Token Cost / Patch Run | < 12,500 tokens / run | Cost > \$0.20 per run |
| **Outcomes** | Vulnerability Mean Time to Remediate (MTTR) | Reduced from 14 days to < 2 hours | MTTR > 24 hours |

### 5.2 Operations Dashboard Interface
The Streamlit Web Application (`app.py`) embeds an interactive telemetry dashboard displaying:
- Live FSM State Machine pipeline status and execution timer.
- Timestamped tool log streaming terminal.
- Vulnerability Radar displaying CVE severity badges (CRITICAL, HIGH, MEDIUM).
- Patch Sandbox view showing git diff previews and test suite results.
- Human-in-the-Loop interactive approval expander/form.
- Downloadable Capstone Executive Audit Report.
