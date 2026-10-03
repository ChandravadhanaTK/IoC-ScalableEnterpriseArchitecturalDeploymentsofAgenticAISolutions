# AssetCareHQ — Enterprise Architecture Documentation

## 1. Executive Summary
**AssetCareHQ** is an Intelligent IT Asset Lifecycle & Operations Platform architected as an academic prototype for deterministic multi-agent orchestration. It demonstrates how autonomous agents can coordinate complex enterprise IT workflows—from asset procurement, inventory matching, and policy governance to risk evaluation, automated assignments, and lifecycle maintenance—while maintaining strict auditability and human-in-the-loop controls.

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer (Presentation & UI)"]
        UI["Modern Enterprise React Web App (Vite + TS + Tailwind)"]
        Router["Client-Side Router & Session Guard"]
        Views["12 Operational Views (Dashboard, Inventory, Workflow, Approvals, Lifecycle, etc.)"]
        UI --> Router --> Views
    end

    subgraph Auth_RBAC ["Identity & Access Governance"]
        AuthContext["Auth Context & Token Guard"]
        Roles["RBAC Engine (Employee | Manager | Asset Admin)"]
        AuthContext --> Roles
    end

    subgraph Agent_Orchestration ["Deterministic Multi-Agent Engine"]
        Orchestrator["1. Orchestrator Agent (Workflow Coordinator & State Machine)"]
        PolicyAgent["2. Policy Agent (Compliance & Entitlement Engine)"]
        InventoryAgent["3. Inventory Agent (Multi-attribute Weighted Matching)"]
        RiskAgent["4. Risk Agent (LOW / MEDIUM / HIGH Triage)"]
        LifecycleAgent["5. Lifecycle Agent (Health, MTBF & Recurring Repair Tracker)"]
        AssignmentAgent["6. Assignment Agent (State Transition & Asset Reservation)"]

        Orchestrator --> PolicyAgent
        PolicyAgent --> InventoryAgent
        InventoryAgent --> RiskAgent
        RiskAgent --> LifecycleAgent
        LifecycleAgent --> AssignmentAgent
    end

    subgraph Simulated_Tools ["Service & Tool Abstraction Layer"]
        T1["Asset Search Tool"]
        T2["Asset Details Tool"]
        T3["Policy Check Tool"]
        T4["Risk Evaluation Tool"]
        T5["Asset Assignment Tool"]
        T6["Asset Transfer Tool"]
        T7["Asset Return Tool"]
        T8["Lifecycle Analysis Tool"]
        T9["Audit Logging Tool"]
        T10["Notification Tool"]
    end

    subgraph Data_Storage ["Data & State Persistence Layer"]
        DB[(AssetCareHQ Relational Store / Local Mock Engine)]
        T_Users["profiles & user_roles"]
        T_Assets["assets & asset_assignments"]
        T_Requests["asset_requests & approvals"]
        T_Transfers["transfers & repairs"]
        T_Audit["agent_events & audit_logs"]

        DB --- T_Users
        DB --- T_Assets
        DB --- T_Requests
        DB --- T_Transfers
        DB --- T_Audit
    end

    %% Interactions
    Views --> AuthContext
    Views --> Orchestrator
    PolicyAgent -.-> T3
    InventoryAgent -.-> T1
    RiskAgent -.-> T4
    LifecycleAgent -.-> T8
    AssignmentAgent -.-> T5
    Simulated_Tools --> DB
```

---

## 3. Multi-Agent Workflow Design

The core execution path for an asset request proceeds through a strict deterministic state machine:

```mermaid
stateDiagram-v2
    [*] --> RECEIVED: Request Submitted by Employee
    RECEIVED --> ANALYZING: Orchestrator Triage
    ANALYZING --> POLICY_CHECK: Policy Agent Evaluation
    
    state Policy_Check_Decision <<choice>>
    POLICY_CHECK --> Policy_Check_Decision
    Policy_Check_Decision --> INVENTORY_MATCHING: Policy Validated
    Policy_Check_Decision --> RISK_EVALUATION: Policy Restriction Detected

    INVENTORY_MATCHING --> RISK_EVALUATION: Inventory Agent Ranks Assets
    
    state Risk_Decision <<choice>>
    RISK_EVALUATION --> Risk_Decision
    Risk_Decision --> APPROVED: LOW Risk (< ₹50,000 & Compliant)
    Risk_Decision --> APPROVAL_REQUIRED: MEDIUM Risk (>= ₹50,000)
    Risk_Decision --> APPROVAL_REQUIRED: HIGH Risk (Restricted / Policy Violation)

    APPROVED --> ASSIGNING: Automated Policy Trigger
    
    APPROVAL_REQUIRED --> ASSIGNING: Manager / Admin Approval Granted
    APPROVAL_REQUIRED --> REJECTED: Reviewer Rejection

    ASSIGNING --> COMPLETED: Asset Tag Reserved, State -> IN_USE
    REJECTED --> [*]
    COMPLETED --> [*]
```

### Deterministic Asset Matching Formula
The Inventory Agent ranks available candidates using multi-factor normalized scoring:
$$\text{Score} = (\text{RAM} \times 0.30) + (\text{Storage} \times 0.20) + (\text{CPU} \times 0.25) + (\text{Age} \times 0.15) + (\text{Location} \times 0.10)$$

### Lifecycle Health & Replacement Formula
The Lifecycle Agent calculates replacement urgency (0–100):
$$\text{Score} = \text{Age Score (25)} + \text{Warranty Expiry (20)} + \text{Repair Frequency (20)} + \text{Health Degradation (20)} + \text{Performance (15)}$$
- **0–39:** Healthy
- **40–69:** Monitor
- **70–100:** Replacement Recommended (Flags recurring repairs $\ge 3$ for identical failure modes).

---

## 4. Security & Access Governance Model

1. **Role-Based Access Control (RBAC):**
   - **Employee:** Submit requests, view personal assigned inventory, monitor workflow trace for personal tickets.
   - **Manager:** Employee privileges + review and approve/reject medium-risk tickets and inter-department asset transfers.
   - **Asset Admin:** Full supervisory access, manual asset assignments/returns/offboarding, role management, high-risk reviews, and demo scenario triggering.

2. **Auditable Event Logging:**
   - Every state transition, agent tool invocation, human approval, asset status change, and transfer is recorded with actor details, timestamps, and target resource identifiers.
   - The application interface does not provide normal users with controls to modify or purge historical audit records.
   - In a production deployment, audit records would be persisted in a server-side append-only or tamper-evident logging system.

3. **Safe Credentials & Mock Isolation:**
   - Zero hardcoded cloud secrets or private keys in the frontend source bundle.
   - Deterministic simulations eliminate runtime LLM cost, hallucination risk, and external API rate limit vulnerabilities.

---

## 5. Monitoring & Operational Metrics

The platform provides operational metrics across three analytical axes:
- **Agent Health & Execution Counts:** Run counts, success rates, and mean stage latencies (75–235ms simulation bounds).
- **Pipeline Throughput:** Open requests, pending human approvals, auto-approval ratio, and rejection rates.
- **Hardware Fleet Utilization:** Active vs. available inventory counts, warranty expiration pipeline, and proactive replacement candidates.

---

## 6. Deployment Strategy

- **Build Output:** Static, tree-shaken SPA bundle produced via Vite (`npm run build`).
- **Target Hosting:** Edge CDN platforms (Vercel, Netlify, Cloudflare Pages, or AWS S3 + CloudFront).
- **Environment Parity:** The application runs in offline/demo mode using seeded data and browser-based local persistence. The prototype is designed so that enterprise backend services such as Supabase/PostgreSQL can be integrated in a production deployment.

## 7. Prototype vs Production Architecture

AssetCareHQ is implemented as an academic prototype that demonstrates enterprise agentic workflow concepts without requiring external LLM infrastructure or enterprise systems.

### Current Prototype

- React/Vite frontend
- Deterministic simulated agents
- Browser-based persistence
- Seeded enterprise asset data
- Simulated policy, inventory, risk, lifecycle, and assignment tools
- Role-based UI access
- Human approval workflows
- Audit/event tracking
- Vercel deployment

### Production Extension

A production deployment would introduce:

- API Gateway
- Server-side agent orchestration
- Secure agent/tool gateway
- Enterprise Asset Management/CMDB integration
- PostgreSQL or enterprise database
- Centralized identity provider
- Server-side secrets management
- Append-only audit storage
- Centralized observability
- LLM-based reasoning where appropriate
- Human approval services
- Queue/event infrastructure for asynchronous workflows

The prototype therefore demonstrates the workflow and governance architecture while keeping external infrastructure dependencies intentionally limited.

### Failure & Exception Handling

The workflow supports explicit exception states:

- **No suitable asset:** Inventory matching fails and the request enters a failed state.
- **Policy violation:** The request is flagged as restricted and routed for elevated review.
- **High-risk request:** Human approval is required before assignment.
- **Approval rejection:** The requested action is stopped and the request remains auditable.
- **Workflow failure:** The workflow can enter a failed state rather than performing an uncontrolled assignment.
- **Recurring repair condition:** Repeated identical repairs trigger lifecycle replacement analysis.

## 8. Prototype Limitations

- Agents use deterministic business logic rather than live LLM reasoning.
- Enterprise systems such as CMDB, HRMS, procurement platforms, and ticketing systems are simulated rather than connected.
- Browser-based persistence is suitable for demonstration but not production-grade enterprise storage.
- Authentication and authorization in the prototype are simplified for academic demonstration.
- Production deployment would require centralized identity, server-side authorization, secure secrets management, durable audit storage, and centralized observability.
