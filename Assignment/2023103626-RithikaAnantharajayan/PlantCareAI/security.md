# Security Model & Data Isolation — PlantCare AI

## 1. Security Architecture Overview

**PlantCare AI** is built on a **Zero-Trust Client-Isolation Model**. In multi-tenant botanical management environments, data privacy and preventing cross-tenant leakage are paramount. The security architecture enforces user boundaries at multiple defense layers:

```mermaid
graph TD
    classDef client fill:#f8fafc,stroke:#334155,stroke-width:2px,color:#0f172a;
    classDef gate fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef rules fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#082f49;
    classDef safe fill:#f2fbf5,stroke:#298953,stroke-width:2px,color:#0a2719;

    Request[🌐 Client HTTP / Firestore Request] --> Gate1[🛡️ Layer 1: Firebase Auth JWT Verification]
    
    Gate1 -->|Valid Bearer Token| Gate2[🛡️ Layer 2: Client Service User ID Scoping]
    Gate1 -->|Unauthenticated| Reject1[❌ 401 Unauthorized Rejection]

    Gate2 -->|Scoped userId| Gate3[🛡️ Layer 3: Cloud Firestore Security Rules Engine]
    Gate2 -->|Mismatched UID| Reject2[❌ Context Isolation Guard Rejection]

    Gate3 -->|request.auth.uid == resource.data.userId| DBWrite[💾 Cloud Firestore Read / Write]
    Gate3 -->|Cross-User Access Attempt| Reject3[❌ Permission Denied / Security Violation]

    subgraph AgentBoundary ["🤖 Agentic AI Security Boundary"]
        Agent[Agent Reasoning Engine] --> ToolFilter[Input Sanitizer & Context Scoper]
        ToolFilter -->|Only Authenticated User Plants| ScopedQuery[context.userId Isolated Query]
        ScopedQuery --> HumanInTheLoop[✋ Human Confirmation Gate\n[Confirm] / [Cancel]]
        HumanInTheLoop -->|Explicit User Consent| MutateStore[(Firestore Mutation)]
    end

    class Request,Agent client;
    class Gate1,Gate2,Gate3,ToolFilter,HumanInTheLoop gate;
    class Reject1,Reject2,Reject3 rules;
    class DBWrite,MutateStore safe;
```

---

## 2. Granular Firestore Security Rules

The security rules define explicit data ownership semantics:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User Profile isolation
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Plants collection - strict user ownership
    match /plants/{plantId} {
      allow read, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
    }

    // Care Tasks collection - strict user ownership
    match /careTasks/{taskId} {
      allow read, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
    }

    // Care Records collection - strict user ownership
    match /careRecords/{recordId} {
      allow read, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
    }

    // AI Interactions Audit collection - strict user telemetry isolation
    match /aiInteractions/{interactionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false; // immutable audit logs
    }
  }
}
```

---

## 3. Defense-in-Depth Implementation

### 3.1 Strict Client-Side Scoping
All query calls explicitly filter records by the authenticated session's `userId`. User A's queries cannot list or retrieve User B's documents under any circumstances.

### 3.2 Secret Protection & Environment Isolation
- No API keys, service account JSON files, or client secrets are committed to version control.
- Secrets are consumed strictly via `import.meta.env.VITE_*` environment variables.
- The repository provides `.env.example` templates and ignores live `.env` files via `.gitignore`.

### 3.3 AI Tool Argument & Execution Validation
- Before invoking tools such as `getPlantDetails(plantId)` or `createVacationPlan(days)`, input types and values are validated.
- `vacationDays` is bounded between 1 and 90 days.
- Target plant IDs are validated against the authenticated user's plant collection before any diagnostic or schedule logic executes.

### 3.4 Human-in-the-Loop Confirmation Gate
- The AI agent is prohibited from autonomously mutating user databases.
- If a recommended action alters care tasks or resets watering intervals, an interactive confirmation card is rendered in the chat UI.
- The mutation is dispatched to Cloud Firestore only after the user clicks `[Confirm Action]`.

### 3.5 Error Shielding
- Raw database error stack traces and internal Firebase error codes are trapped and mapped to clean, human-readable UI notices.
- Secret keys and internal configuration details are never exposed to the client or log console.