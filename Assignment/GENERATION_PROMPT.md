# Enterprise Agentic AI Solution Generation Prompt

> **System Prompt Directive**: Use this specification to generate a full-stack, enterprise-grade Agentic AI Orchestration Platform capable of multi-agent collaboration, dynamic tool execution, safety guardrail enforcement, human-in-the-loop risk management, and real-time observability.

---

## 1. System Vision & Objective
Build an **Autonomous Multi-Agent Enterprise Orchestration Platform** that automates complex enterprise workflows through specialized AI agents working sequentially and concurrently. The platform must incorporate strict **Human-in-the-Loop (HITL)** approval controls for high-risk operations, real-time telemetry (tokens, cost, latency), self-healing error recovery, and robust guardrails to prevent hallucination, prompt injection, and data exfiltration.

---

## 2. Core Agent System Architecture

### Agent Personas & Specifications
1. **Supervisor Agent (Orchestrator)**:
   - **Role**: Decomposes user goal into DAG (Directed Acyclic Graph) sub-tasks, assigns tasks to worker agents, coordinates state transitions, and validates overall execution plan.
   - **Capabilities**: Plan formulation, handoff management, dynamic task re-routing on failure.

2. **Research & Intelligence Agent**:
   - **Role**: Conducts deep data gathering, web searching, document retrieval (RAG), and facts synthesis.
   - **Tools**: Web Search Engine API, Document Vector Index, Database Query Tool.

3. **Execution & Coding Agent**:
   - **Role**: Generates, validates, and runs code, scripts, or database queries in a sandboxed runtime environment.
   - **Tools**: Sandboxed Code Execution Engine, SQL Query Builder, REST API Caller.

4. **Security & Guardrail Agent**:
   - **Role**: Continuous safety inspector. Evaluates agent prompts, tool outputs, and execution payloads for PII leaks, prompt injection, malicious script payloads, and policy violations.
   - **Action**: Triggers mandatory **Human-in-the-Loop Approval** if risk score > 0.65 or if tool involves destructive operations (file writes, database modifications, external network requests).

---

## 3. Workflow & State Machine Requirements

```
[User Input] ➔ [Security Pre-Check] ➔ [Supervisor Planning]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       [Research Agent]                                              [Execution Agent]
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                   [Guardrail Risk Check]
                                                │
                      ┌─────────────────────────┴─────────────────────────┐
             (Low Risk / Approved)                               (High Risk Triggered)
                      │                                                   │
                      ▼                                                   ▼
             [Execute & Output]                               [Human Approval Modal]
                      │                                                   │
                      └─────────────────────────┬─────────────────────────┘
                                                ▼
                                     [Telemetry & Cost Audit]
```

---

## 4. Operational Requirements & Guardrails

1. **Safety & Policy Guardrails**:
   - PII Scrubbing (Regex & Named Entity Recognition for SSN, Email, Credit Cards).
   - Prompt Injection Shielding (System prompt isolation and delimiter verification).
   - Action Boundaries: Mandatory approval modal required before executing system scripts, DB writes, or external HTTP requests.

2. **Error Handling & Resilience**:
   - Max Retry Limit: 3 attempts per agent step.
   - Self-Correction: On syntax error or tool failure, feedback exception stack trace to Execution Agent for self-healing repair.
   - Fallback Strategy: Degrade gracefully to safe deterministic output if agent loop exceeds max step threshold.

3. **Observability & Metrics**:
   - Track LLM tokens per turn (Prompt tokens, Completion tokens).
   - Calculate latency (ms) per agent state transition.
   - Live cost tracking based on standard model pricing models ($0.015 per 1k tokens).

---

## 5. Technical Stack Specifications

- **Backend**: Node.js, Express.js REST API with real-time SSE / event stream updates.
- **Frontend**: React.js (Vite), Glassmorphic Dark UI Theme, Lucide Icons, Mermaid.js diagram viewer.
- **Data & State Store**: Dynamic JSON telemetry file store & memory session cache.
- **Tools Included**: Simulated Web Search, Sandboxed JS Runner, DB Query Engine, Mock API Gateway.

---

## 6. Expected Output Format
The resulting codebase must be modular, fully runnable, fully documented, and ready for deployment in production containerized environments (Docker/Kubernetes).
