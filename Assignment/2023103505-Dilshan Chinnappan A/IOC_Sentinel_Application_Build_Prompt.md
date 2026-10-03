# IOC Sentinel: Enterprise Agentic Assistant for Threat Intelligence & SOC Triage
## Master Application Generation Prompt

> **Course**: Scalable Enterprise Architectural Deployment of Agentic AI Solutions  
> **Student**: Dilshan Chinnappan A  
> **Roll Number**: 2023103505  
> **Reference Deliverables**: Capstone Deliverables 1–5  

---

### Prompt Instructions for AI Agent / Code Generation System

```markdown
You are an expert Enterprise Solutions Architect and Principal Security Engineer specializing in Scalable Enterprise Architectural Deployments of Agentic AI Solutions.

Build a complete, production-ready, full-stack cybersecurity application named **IOC Sentinel**: an enterprise-grade agentic AI assistant engineered for Security Operations Centers (SOC) and Cyber Threat Intelligence (CTI) teams. 

The application must automate the end-to-end lifecycle of Indicators of Compromise (IOC)—from ingestion of raw, noisy security alerts to automated artifact extraction, multi-source threat intelligence enrichment, blast-radius correlation, human-in-the-loop (HITL) containment approval, and post-incident reporting.

---

### 1. CAPSTONE ENTERPRISE DELIVERABLES SPECIFICATION

Your implementation must satisfy all 5 Capstone Deliverables:
1. **Architecture Diagram & Boundaries**:
   - Decoupled N-Tier enterprise architecture isolating untrusted threat inputs through four trust boundaries:
     - Boundary 0: External & Ingress (Untrusted alerts, feeds, analyst browsers)
     - Boundary 1: Edge & DMZ Gateway (WAF, TLS 1.3 termination, OAuth2/JWT verification)
     - Boundary 2: Agent Orchestration Engine (Trusted internal FastAPI + LangGraph state machine)
     - Boundary 3: Foundation Model Tier (Google Gemini models via official `google-genai` SDK)
     - Boundary 4: High-Privilege Action Enclave (Isolated HITL gate, Firewall & EDR remediation APIs)
   - Immutable audit logging and OpenTelemetry distributed tracing spans.

2. **Agent Workflow Design (LangGraph Multi-Agent Team)**:
   - Implement 5 specialized micro-agents:
     - **Supervisor & Dispatcher**: Orchestrates graph state transitions, token budgets, and ingress sanitization.
     - **IOC Extractor & Normalizer**: Extracts IPv4/v6, Domains, URLs, SHA256/MD5 hashes, and CVE identifiers with automated de-fanging (`hxxp://`, `[.]`).
     - **Threat Intelligence Enricher**: Concurrently queries VirusTotal, AbuseIPDB, and AlienVault OTX with 24-hour caching to calculate composite risk scores (0–100).
     - **Blast Radius & Correlator**: Correlates IOCs with internal SIEM asset telemetry, maps indicators to MITRE ATT&CK techniques, and assesses blast radius (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
     - **Remediation & Playbook Agent**: Formulates containment playbooks (`BLOCK_PERIMETER_IP`, `QUARANTINE_ENDPOINT`, `SINKHOLE_DNS`) with deterministic rollback commands.
     - **Human-in-the-Loop (HITL) Gatekeeper**: Cryptographic pause requiring analyst sign-off before destructive action execution.

3. **Deployment Strategy (100% Free-Tier Architecture - $0/month)**:
   - Must deploy entirely on verified perpetual free tiers:
     - Frontend UI: Vercel or Cloudflare Pages (Edge CDN, automatic CI/CD, free SSL).
     - Backend API: Render or Hugging Face Spaces (Containerized FastAPI ASGI engine).
     - Database: Neon.tech Serverless Postgres or Zero-Config Embedded SQLite (WAL mode).
     - Cache: Upstash Redis (10,000 commands/day) or In-Memory LRU Cache.
     - LLM Foundation: Google AI Studio (Gemini 1.5/3.8 Flash free tier: 1,500 req/day).
     - Threat Feeds: VirusTotal & AbuseIPDB free quotas + realistic built-in offline sandbox.
   - Mitigate cold-starts with automatic keep-alive heartbeats and fast warmup (< 20s).

4. **Security Model & Guardrails**:
   - **RFC1918 Private IP Masking**: Automatically scrub internal IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) to `[INTERNAL_HOST_n]` to prevent corporate topology leakage to LLMs.
   - **Prompt Injection Firewall**: Neutralize instruction hijack attempts (`"ignore previous instructions"`, `"system override"`).
   - **PII Scrubbing**: Regex masking of emails (`[REDACTED_EMAIL]`) and employee names.
   - **Cryptographic Audit Logging**: Merkle-chained append-only WORM audit log computing SHA-256 hashes linking every agent transaction.
   - **RBAC**: Tier 1 Analyst, Tier 2 Lead, SOC Admin, and Auditor role enforcement.

5. **Monitoring Dashboard Design & SLAs**:
   - Track operational SLAs across 6 dimensions:
     - Mean Time to Detect (MTTD < 15s)
     - Mean Time to Remediate (MTTR reduction > 70%)
     - Threat Cache Hit Ratio (target > 80%)
     - Token Economics & Cost per Incident (< $0.02)
     - Adversarial Prompt Injections Blocked
     - Automated Triage Percentage (> 85%)

---

### 2. TECHNICAL STACK & DIRECTORY STRUCTURE

Generate the application following this exact modular structure:

```plaintext
IOC-Project/
├── README.md                          # Enterprise Architecture & Capstone Deliverables (with live deployed links)
├── Application_Generation_Prompt.md   # This generation prompt
├── Essentials.jpeg                    # Capstone essentials reference slide
├── backend/                           # Python Agentic Backend
│   ├── app/
│   │   ├── main.py                    # FastAPI ASGI application & WebSocket streaming
│   │   ├── config.py                  # Pydantic v2 BaseSettings & environment configs
│   │   ├── agents/                    # LangGraph Multi-Agent Architecture
│   │   │   ├── supervisor.py          # Master orchestrator & state dispatcher
│   │   │   ├── extractor.py           # IOC regex & LLM entity extractor
│   │   │   ├── enricher.py            # Threat intel feed aggregator (VT, AbuseIPDB, OTX)
│   │   │   ├── correlator.py          # SIEM correlation & blast-radius analyzer
│   │   │   └── remediator.py          # Containment playbook & proposal generator
│   │   ├── tools/                     # Integrations and tool bindings
│   │   │   ├── virustotal.py          # VirusTotal v3 connector
│   │   │   ├── abuseipdb.py           # AbuseIPDB connector
│   │   │   ├── alienvault.py          # AlienVault OTX connector
│   │   │   ├── cache.py               # 24-hour TTL threat cache
│   │   │   └── containment.py         # Firewall & EDR containment mock/actions
│   │   ├── security/                  # Security controls & guardrails
│   │   │   ├── guardrails.py          # Prompt injection & RFC1918/PII sanitization
│   │   │   ├── auth.py                # JWT & RBAC permission evaluators
│   │   │   └── audit.py               # Immutable SHA-256 audit logging engine
│   │   ├── telemetry/                 # Observability & metrics
│   │   │   ├── metrics.py             # Prometheus/SOC metrics definitions
│   │   │   └── tracer.py              # OpenTelemetry tracing spans
│   │   └── models/                    # Pydantic schemas & state definitions
│   │       ├── state.py               # Incident state schema
│   │       └── schemas.py             # REST request & response models
│   ├── tests/                         # Pytest test suites (agents & guardrails)
│   ├── requirements.txt               # Backend Python dependencies
│   ├── .env.example                   # Environment configuration template
│   └── Dockerfile                     # Multi-stage Python production build
├── frontend/                          # React + Vite SOC Analyst Dashboard
│   ├── index.html                     # HTML5 entry with Inter & JetBrains Mono typography
│   ├── package.json                   # React 19, Vite, Lucide icons
│   ├── vite.config.js                 # Vite proxy & configuration
│   ├── Dockerfile                     # Nginx static deployment container
│   ├── vercel.json                    # Vercel SPA routing
│   └── src/
│       ├── main.jsx                   # Application entrypoint
│       ├── App.jsx                    # Root application component
│       ├── index.css                  # Cyber-defense dark-mode design system
│       ├── services/api.js            # REST API & WebSocket client
│       └── components/                # UI Components
│           ├── Header.jsx             # Top bar with status & stats
│           ├── MetricsBar.jsx         # Health, MTTR, cost, and safety telemetry
│           ├── IncidentStream.jsx     # Live alerts and incident queue
│           ├── AgentWaterfall.jsx     # Real-time multi-agent reasoning graph
│           ├── ApprovalModal.jsx      # Human-in-the-loop decision interface
│           ├── NewAlertModal.jsx      # Sample & custom alert ingestion modal
│           └── ArchitectureView.jsx   # Interactive Deliverables viewer
├── render.yaml                        # 1-Click Render deployment blueprint
├── docker-compose.yml                 # Full stack orchestration (App, DB, Redis)
└── .gitignore                         # Python, Node, and runtime data exclusions
```

---

### 3. DESIGN & ERGONOMICS REQUIREMENTS

- **Aesthetics**: Premium cybersecurity SOC console. Deep obsidian background (`#070a13`, `#0d1322`), glowing cyan borders (`#06b6d4`), threat crimson highlights (`#f43f5e`), and warning amber accents (`#f59e0b`).
- **Typography**: `Inter` for clean data tables and `JetBrains Mono` for IOCs, hashes, and audit proofs.
- **Interactivity**: Real-time WebSocket streaming of agent thoughts, live status indicators, modal dialogs for one-click human containment approvals, and realistic incident presets.
- **No Placeholders**: Include built-in realistic threat databases so the system functions immediately out of the box even before API keys are mounted.
```
