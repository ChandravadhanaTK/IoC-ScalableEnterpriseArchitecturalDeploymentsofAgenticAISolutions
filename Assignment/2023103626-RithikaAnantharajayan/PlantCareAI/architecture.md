# Architecture Document — PlantCare AI

## 1. Enterprise Architecture Overview

**PlantCare AI** is an enterprise-grade, agentic plant care assistant platform engineered to provide automated botanical maintenance, proactive care scheduling, diagnostic reasoning, and multi-tenant security. The system bridges responsive client-side interactions with cloud persistence and autonomous AI function orchestration.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    classDef client fill:#f2fbf5,stroke:#298953,stroke-width:2px,color:#0a2719;
    classDef auth fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#082f49;
    classDef agent fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef tools fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef data fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef hosting fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a;

    User([👤 User / Evaluator]) -->|HTTPS / UI Interactions| Frontend[⚛️ React 19 + TypeScript SPA\nVite & Tailwind CSS]
    
    subgraph ClientLayer ["Client & State Management"]
        Frontend --> AuthContext[🔐 AuthContext & Session]
        Frontend --> PlantContext[🌿 PlantContext & Live Sync]
    end

    subgraph SecurityAuth ["Authentication Service"]
        AuthContext -->|Tokens & UID| FirebaseAuth[🔥 Firebase Authentication\nEmail/Password + Demo Auth]
    end

    subgraph AIAgentEngine ["Autonomous Agentic Core"]
        PlantContext -->|Natural Language Inquiries| AIAssistant[🤖 PlantCare AI Assistant Engine]
        AIAssistant <-->|Conversational Context & Inference| GeminiAPI[🧠 Google Gemini AI\nGemini 1.5 Flash Model]
        AIAssistant -->|Multi-Step Reasoning| AgentTools[🛠️ Agent Tool Orchestrator]
    end

    subgraph AgentToolSuite ["Agent Tool Suite"]
        AgentTools --> T1["getUserPlants()"]
        AgentTools --> T2["getPlantDetails(plantId)"]
        AgentTools --> T3["getUpcomingCareTasks()"]
        AgentTools --> T4["getCareHistory(plantId)"]
        AgentTools --> T5["createCarePlan()"]
        AgentTools --> T6["createVacationPlan(days)"]
        AgentTools --> T7["updateCareTask(taskId, status)"]
    end

    subgraph StorageLayer ["Cloud Database & Security"]
        T1 & T2 & T3 & T4 & T5 & T6 & T7 -->|Authenticated Mutex| Firestore[🗄️ Cloud Firestore\nIsolated User Tenants]
        FirebaseAuth -->|Auth UID Claim| SecurityRules["🛡️ Firestore Security Rules\nrequest.auth.uid == resource.data.userId"]
        SecurityRules -.->|Enforces Data Isolation| Firestore
    end

    subgraph ObservabilityLayer ["Observability & Monitoring"]
        AIAssistant -->|Telemetry Traces| MonitoringService[📊 Monitoring Telemetry Service]
        MonitoringService -->|Audit Log Entries| FirestoreAIInteractions[(aiInteractions Collection)]
    end

    subgraph DeploymentTarget ["Production Infrastructure"]
        Frontend -.->|Static Distribution| FirebaseHosting[🌐 Firebase Hosting / App Hosting\nEdge Global CDN]
    end

    class Frontend,AuthContext,PlantContext client;
    class FirebaseAuth auth;
    class AIAssistant,GeminiAPI,AgentTools agent;
    class T1,T2,T3,T4,T5,T6,T7 tools;
    class Firestore,SecurityRules,FirestoreAIInteractions data;
    class FirebaseHosting,MonitoringService hosting;
```

---

## 3. Component Breakdown

### 3.1 Client Presentation Layer
- **Framework**: React 19 with strict TypeScript typing.
- **Styling**: Tailwind CSS with an ecological palette (`forest-600`, `sage`, `earth`) and subtle soft shadows.
- **Routing**: `react-router-dom` handling public landing/auth routes and guarded protected application routes.
- **Icons & Visuals**: `lucide-react` modern icon library and `canvas-confetti` reward micro-interactions.

### 3.2 Authentication & State Management
- **`AuthContext`**: Wraps the application with user session persistence, token synchronization, and a 1-click Demo Account login option for frictionless evaluation.
- **`PlantContext`**: Central state coordinating live botanical collections, tasks, historical records, and caching.

### 3.3 Agentic AI Engine
- **Autonomous Reasoning Core**: Evaluates incoming natural language requests, determines missing context, selects the appropriate tool from the tool suite, and structures outputs.
- **Model Integration**: Dual-engine architecture connecting to **Google Gemini 1.5 Flash** when an API key is provided, or falling back seamlessly to an internal deterministic agent engine for zero-dependency testability.
- **Human-in-the-Loop Protocol**: All mutations (rescheduling care dates, creating vacation task suites) trigger interactive confirmation cards requiring explicit user consent (`[Confirm Action]` / `[Cancel]`).

### 3.4 Data & Security Tier
- **Cloud Firestore**: Hierarchical, document-oriented collections:
  - `/users/{userId}`: Account profiles
  - `/plants/{plantId}`: Botanical records with environmental parameters and calculated watering cycles
  - `/careTasks/{taskId}`: Scheduled maintenance tasks with temporal statuses
  - `/careRecords/{recordId}`: Permanent chronological care activity logs
  - `/aiInteractions/{interactionId}`: Telemetry logs tracking latency, tools executed, and success rates
- **Security Rules (`firestore.rules`)**: Granular authorization enforcing `request.auth.uid == resource.data.userId` across all read, write, and delete operations.

### 3.5 Monitoring & Telemetry
- Observability dashboard tracking application health (Auth, Cloud Firestore, AI Agent), KPI metrics, request latencies, and real-time interaction audit trails.