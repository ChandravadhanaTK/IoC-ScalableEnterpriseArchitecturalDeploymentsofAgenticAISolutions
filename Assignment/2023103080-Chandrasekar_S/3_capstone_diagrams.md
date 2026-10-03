# Capstone Deliverables: Support-Desk Agent

Five artifacts that demonstrate enterprise architecture completeness.
Each diagram matches the code in `1_agentic_support_desk.py`.

---

## 1. Architecture Diagram
*Layers, components, trust boundaries and integrations*

```mermaid
flowchart TB
    subgraph UNTRUSTED["Untrusted zone"]
        U["Customer<br/>web chat / email"]
    end

    subgraph EDGE["Trust boundary 1: Gateway"]
        AUTH["Authentication<br/>and rate limit"]
        IG["Input guardrail<br/>PII redaction"]
    end

    subgraph AGENTS["Trust boundary 2: Agent layer"]
        ORCH["Orchestrator"]
        TRI["Triage agent<br/>no tools"]
        RES["Resolver agent<br/>allow-listed tools"]
        OG["Output guardrail"]
    end

    subgraph TOOLS["Trust boundary 3: Business systems"]
        T1["Order lookup API"]
        T2["Refund policy service"]
        T3["Refund API"]
    end

    subgraph OBS["Governance and observability"]
        AUD["Audit log"]
        MET["Metrics store"]
    end

    LLM["Claude API<br/>external model"]
    HUM["Human approver"]

    U --> AUTH --> IG --> ORCH
    ORCH --> TRI
    ORCH --> RES
    TRI <--> LLM
    RES <--> LLM
    RES --> T1
    RES --> T2
    RES --> T3
    T3 -. "amount over limit" .-> HUM
    RES --> OG --> U
    ORCH -.-> AUD
    RES -.-> AUD
    ORCH -.-> MET
```

**Reading it:** requests only cross three boundaries in one direction, each with
a check (identity, redaction, tool allow-list). Logs and metrics are written on
the side, so they never block the main flow.

---

## 2. Agent Workflow Design
*Roles, states, tools, handoffs, approvals and failure paths*

```mermaid
stateDiagram-v2
    [*] --> Received
    Received --> Triage: redact PII
    Triage --> Resolving: refund or order_status
    Triage --> Escalated: other or unreadable output

    Resolving --> ToolCall: model requests tool
    ToolCall --> Resolving: result returned
    ToolCall --> AwaitApproval: refund over limit
    AwaitApproval --> ToolCall: approved
    AwaitApproval --> Denied: rejected
    ToolCall --> Escalated: tool crash

    Resolving --> Resolved: final answer
    Resolving --> Escalated: max steps reached

    Resolved --> [*]
    Denied --> [*]
    Escalated --> [*]
```

| Role | Allowed tools | Handoff |
|---|---|---|
| Triage agent | none | passes `refund` / `order_status` to Resolver, everything else to a human |
| Resolver agent | `lookup_order`, `check_refund_policy`, `issue_refund` | asks the human approver for refunds above the limit |
| Human approver | n/a | approves or denies |

**Failure paths:** bad triage JSON, tool exception, API outage (3 retries),
step limit, and approver rejection. All end in a safe state, never a crash.

---

## 3. Deployment Strategy
*Runtime, scaling, resilience, environments and release*

```mermaid
flowchart LR
    DEV["Dev<br/>local, human prompts"] --> CI["CI pipeline<br/>lint, unit tests,<br/>mock-model tests"]
    CI --> STG["Staging<br/>real model, test data,<br/>approvals auto-denied"]
    STG --> GATE{"Release<br/>approval"}
    GATE -->|pass| CAN["Canary<br/>5 percent traffic"]
    CAN -->|healthy| PROD["Production<br/>100 percent"]
    CAN -->|error spike| RB["Automatic rollback"]

    subgraph RUNTIME["Production runtime"]
        LB["Load balancer"] --> C1["Container replica 1"]
        LB --> C2["Container replica 2"]
        LB --> C3["Container replica N<br/>autoscaled on queue depth"]
        C1 --> SEC["Secrets manager"]
        C1 --> Q["Request queue"]
    end

    PROD --> LB
```

**Resilience:** stateless containers, retries with backoff, step limit, request
timeouts, and a fallback to human escalation if the model is unavailable.
Configuration comes from environment variables (`APP_ENV`, `MODEL`, limits).

---

## 4. Security Model
*Identity, authorization, secrets, privacy, guardrails and audit*

```mermaid
flowchart LR
    ID["Identity<br/>SSO / API tokens"] --> AZ["Authorization<br/>role to tool allow-list"]
    AZ --> SE["Secrets<br/>env vars / vault,<br/>never in code"]
    SE --> PV["Privacy<br/>redact email and phone<br/>in and out"]
    PV --> GR["Guardrails<br/>refund limit, step limit,<br/>human approval"]
    GR --> AU["Audit<br/>append-only log<br/>with trace ID"]
```

| Control | Where in the code |
|---|---|
| Least privilege | `ROLE_TOOLS` and `run_tool()` block tools a role should not use |
| Privacy | `redact()` on user input and on the final answer |
| Business guardrails | refund limit and approval enforced inside `issue_refund()`, not in the prompt |
| Secrets | `ANTHROPIC_API_KEY` read from the environment |
| Audit | `audit()` writes every request, tool call, approval and escalation |

---

## 5. Monitoring Dashboard Design
*Health, trace, quality, safety, cost and business outcomes*

```mermaid
flowchart TB
    SRC["Telemetry sources<br/>audit.jsonl and metrics.jsonl"] --> DASH["Dashboard"]

    DASH --> H["HEALTH<br/>uptime, error rate,<br/>p95 latency"]
    DASH --> T["TRACE<br/>per-request steps,<br/>tool calls, trace ID search"]
    DASH --> Q["QUALITY<br/>resolution rate,<br/>triage accuracy"]
    DASH --> S["SAFETY<br/>PII hits, blocked tools,<br/>denied approvals"]
    DASH --> C["COST<br/>tokens per request,<br/>dollars per ticket"]
    DASH --> B["BUSINESS OUTCOMES<br/>tickets solved without human,<br/>time saved, customer satisfaction"]

    H -.-> AL["Alerts<br/>error rate, cost spike,<br/>escalation spike"]
    S -.-> AL
    C -.-> AL
```

**Alert examples:** error rate above 5 percent for 10 minutes, daily cost more
than 2x average, escalation rate above 40 percent, any blocked-tool event.
