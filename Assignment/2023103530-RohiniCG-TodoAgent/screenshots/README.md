# Enterprise Application Screenshots & UI Visualizations

This directory contains visual exports and architecture diagrams representing every page, view, and deliverable in the **TodoAgent** platform.

---

## 📸 Screen Catalog

1. **`01_project_dashboard_tasks.svg`**  
   *Main Task Repository Dashboard*: Active enterprise tasks, multi-role assignees, P0-P3 classifications, impact/urgency score tags, search & multi-dropdown filters, and "AI Auto-Prioritize" & "New Task" actions.

2. **`02_eisenhower_matrix_view.svg`**  
   *Eisenhower 2x2 Priority Matrix View*: Categorized quadrants (Q1: Do First, Q2: Schedule, Q3: Delegate, Q4: Backlog) with active task cards, SLA countdowns, and quick execution triggers.

3. **`03_capstone_overview.svg`**  
   *Capstone Deliverables Executive Hub*: Direct visualization of all 5 artifacts numbered 1 to 5 with status badges, completeness indicators, and exploration links.

4. **`04_architecture_diagram.svg`** (also `architecture_diagram.svg`)  
   *Deliverable 1 - System Architecture Blueprint*: 5-tier architecture topology, trust boundaries A through E, isolated Firecracker microVM sandboxes, and CMEK data plane.

5. **`05_agent_workflow.svg`** (also `agent_workflow.svg`)  
   *Deliverable 2 - Agent Workflow & State Machine*: 7-stage deterministic execution pipeline, NeMo safety scanning, LangGraph DAG decomposition, and Human-In-The-Loop gate.

6. **`06_deployment_strategy.svg`** (also `deployment_strategy.svg`)  
   *Deliverable 3 - Kubernetes Runtime & Autoscaling*: Multi-node cluster architecture, KEDA event-driven scaling, multi-region active-passive disaster recovery, and GitOps canary releases.

7. **`07_security_model_rbac.svg`**  
   *Deliverable 4 - Security Model & Governance*: RBAC permission matrix, live Presidio PII data privacy sanitizer testbed, and cryptographically verified SHA-256 audit chaining.

8. **`08_monitoring_dashboard.svg`**  
   *Deliverable 5 - Observability & Telemetry*: The 6 core observability pillars (Health, Traces, Quality, Safety, Cost, Outcomes) and OpenTelemetry distributed trace waterfall.

9. **`09_agent_execution_modal.svg`**  
   *Autonomous Agent Execution Runner*: Real-time step-by-step agent runner console with tool execution, token usage tracking, and HITL authorization prompts.

10. **`10_audit_trail_ledger.svg`**  
    *Cryptographic Audit Trail Ledger*: Sequential SHA-256 hash-chained compliance ledger recording all task creations, updates, automated prioritizations, and HITL sign-offs.
