# 1. Architecture Diagram

## 1.1 High-Level Architecture

```mermaid
flowchart TB
    U[User / Learner]
    UI[React + TypeScript SPA]
    R[React Router]
    Q[TanStack Query]
    API[API Service Abstraction]
    MOCK[Mock API]
    HTTP[HTTP API Client]
    PY[Python Lab]
    CM[CodeMirror]
    WW[Web Worker]
    PD[Pyodide]
    LOCAL[Browser Local Storage]
    BACKEND[Production Backend /api/v1]
    AUTH[Authentication & RBAC]
    AGENT[Agent Orchestration]
    DB[(Persistent Database)]
    OBS[Observability / Metrics]
    AUDIT[Audit Log]
    GUARD[Guardrails / Approval]
    EXT[External LLM / AI Services]

    U --> UI
    UI --> R
    UI --> Q
    Q --> API
    API --> MOCK
    API --> HTTP
    HTTP --> BACKEND

    UI --> PY
    PY --> CM
    PY --> WW
    WW --> PD

    UI --> LOCAL

    BACKEND --> AUTH
    BACKEND --> AGENT
    BACKEND --> DB
    BACKEND --> OBS
    BACKEND --> AUDIT
    AGENT --> GUARD
    GUARD --> EXT
    AGENT --> OBS
    AGENT --> AUDIT
```

## 1.2 Frontend Layers

| Layer | Implementation | Responsibility |
|---|---|---|
| Presentation | React components/pages | UI and user interaction |
| Routing | React Router | SPA navigation |
| Server-state boundary | TanStack Query | Queries and mutations |
| API boundary | `src/services/api` | Mock/HTTP implementation switching |
| Schema boundary | Zod | Runtime validation |
| Local runtime state | `localStorage` | Demo progress/code persistence |
| Python execution | Web Worker + Pyodide | Isolated browser execution |
| 3D visualisation | Three.js / FBX loader | Armor workshop visual |
| Motion | Motion primitives | Mission transitions and visual feedback |

## 1.3 Main Application Components

- **Landing** — cinematic introduction and Forge Protocol entry point.
- **Map** — campaign progression through 12 systems.
- **Level** — mission briefing, concept deck, matching game, and Python lab.
- **Workshop** — 3D armor/system assembly view.
- **Progress** — XP, forged systems, missions, and current objective.
- **Glossary** — searchable AI/engineering concept index.
- **API abstraction** — central client boundary supporting mock and HTTP modes.
- **OpenAPI contract** — documented backend interface.

## 1.4 Trust Boundaries

```mermaid
flowchart LR
    A[Browser / User]
    B[Frontend Application]
    C[Backend API]
    D[Database]
    E[LLM / External AI]
    F[Admin Operations]

    A -- untrusted input --> B
    B -- authenticated API request --> C
    C -- validated data --> D
    C -- guarded agent request --> E
    F -- privileged authenticated request --> C

    C -. audit .-> G[(Audit Log)]
```

The browser is not a security boundary. In production, authentication, authorization, validation, rate limiting, guardrails, secret handling, and audit enforcement must happen server-side.

---
