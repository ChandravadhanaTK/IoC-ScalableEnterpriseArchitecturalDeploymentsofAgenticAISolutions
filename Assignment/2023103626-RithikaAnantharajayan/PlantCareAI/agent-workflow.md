# Agent Workflow Design — PlantCare AI

## 1. Autonomous Agent Conceptual Model

Unlike traditional chatbots that simply generate conversational text, **PlantCare AI** operates as an autonomous agent. It follows a multi-phase cognitive loop:
1. **Perceive**: Parse incoming user intent.
2. **Contextualize**: Inspect live user plant records, upcoming tasks, and care history.
3. **Reason & Select Tools**: Select appropriate tools to fulfill the query.
4. **Execute & Validate**: Execute tool calls against data stores and validate results.
5. **Human-in-the-Loop Gate**: If an action modifies user data, pause and solicit confirmation.
6. **Commit & Respond**: Update database upon confirmation and return structured, cautious guidance.

---

## 2. Agent Workflow Diagram

```mermaid
flowchart TD
    classDef startNode fill:#e1f7e9,stroke:#298953,stroke-width:2px,color:#0a2719;
    classDef processNode fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#082f49;
    classDef toolNode fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef decisionNode fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef confirmNode fill:#fed7aa,stroke:#ea580c,stroke-width:2px,color:#7c2d12;
    classDef dataNode fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef errorNode fill:#ffe4e6,stroke:#e11d48,stroke-width:2px,color:#881337;

    Start([💬 User Request]) --> IntentParse[🔍 Intent Understanding & Natural Language Processing]
    
    IntentParse --> DataCheck{Requires Plant Context?}
    DataCheck -->|Yes| FetchData[📥 Retrieve Live Plant & Task Context\nFirestore / Cache]
    DataCheck -->|No| DirectReason[🧠 General Botanical Reasoning]

    FetchData --> ToolSelect[🛠️ Agent Tool Selection]
    DirectReason --> ToolSelect

    subgraph ToolsExecution ["Tool Execution Suite"]
        ToolSelect -->|Plants Needing Care| T1["getUserPlants()\ngetUpcomingCareTasks()"]
        ToolSelect -->|Vacation Inquiry| T2["createVacationPlan(days)"]
        ToolSelect -->|Missed Watering / Specific Plant| T3["getPlantDetails(plantId)\ngetCareHistory(plantId)"]
        ToolSelect -->|Optimization Schedule| T4["createCarePlan()"]
    end

    T1 & T2 & T3 & T4 --> ValidateResult{Tool Execution Successful?}
    
    ValidateResult -->|Failure / Invalid Arg| HandleError[⚠️ Error Handling & Graceful Degradation]
    HandleError --> TelemetryFail[📊 Log Failed Interaction Telemetry]
    TelemetryFail --> FallbackMsg[💬 Return Helpful Guidance & Clarification Prompt]
    FallbackMsg --> EndNode([🏁 Deliver Response to User])

    ValidateResult -->|Success| AnalyzeOutput[🔬 Agent Reasoning & Result Validation]
    
    AnalyzeOutput --> MutationCheck{Action Modifies Stored Data?}

    MutationCheck -->|No: Read-Only / Diagnostic| DiagnosticCheck{Is Plant Diagnostic?}
    DiagnosticCheck -->|Yes| CautiousFormat[🌿 Formulate Cautious Hypothesis\n'One possible cause...', 'Consider checking...']
    DiagnosticCheck -->|No| StandardFormat[📋 Formulate Direct Botanical Report]
    CautiousFormat --> TelemetrySuccess[📊 Log AI Interaction Telemetry]
    StandardFormat --> TelemetrySuccess
    TelemetrySuccess --> EndNode

    MutationCheck -->|Yes: Care Schedule / Vacation Tasks| PromptConfirm[✋ Present Proposed Action Card\nInteractive [Confirm] / [Cancel] Buttons]
    PromptConfirm --> UserChoice{User Confirms Action?}

    UserChoice -->|User Clicks Cancel| AbortChange[🚫 Action Cancelled\nNo Database Mutations Made]
    AbortChange --> TelemetryCancel[📊 Log Cancelled Action]
    TelemetryCancel --> EndNode

    UserChoice -->|User Clicks Confirm| CommitDB[(💾 Update Cloud Firestore\nCommit Tasks & Care Records)]
    CommitDB --> SuccessConfirm[✅ Render Confirmation Success Card]
    SuccessConfirm --> TelemetryCommit[📊 Log Confirmed Mutation Telemetry]
    TelemetryCommit --> EndNode

    class Start,EndNode startNode;
    class IntentParse,FetchData,DirectReason,AnalyzeOutput,StandardFormat processNode;
    class ToolSelect,T1,T2,T3,T4 toolNode;
    class DataCheck,ValidateResult,MutationCheck,DiagnosticCheck,UserChoice decisionNode;
    class PromptConfirm,SuccessConfirm,AbortChange confirmNode;
    class CommitDB dataNode;
    class HandleError,TelemetryFail,FallbackMsg errorNode;
```

---

## 3. Tool Suite Specifications

| Tool | Signature | Purpose | Human Approval Required? |
| :--- | :--- | :--- | :--- |
| `getUserPlants()` | `() => Plant[]` | Retrieves all registered plants for the authenticated user and calculates care urgency. | No (Read-Only) |
| `getPlantDetails(plantId)` | `(plantId: string) => Plant` | Returns in-depth botanical metadata, schedule interval, and notes for a plant. | No (Read-Only) |
| `getUpcomingCareTasks()` | `() => CareTask[]` | Retrieves all pending maintenance tasks scheduled across the user's collection. | No (Read-Only) |
| `getCareHistory(plantId)` | `(plantId?: string) => CareRecord[]` | Audits historical watering, fertilizing, and pruning logs. | No (Read-Only) |
| `createCarePlan()` | `() => Task[]` | Synthesizes an optimized schedule with pre-watering moisture assessments. | **Yes** (Human-in-the-Loop) |
| `createVacationPlan(days)` | `(days: number) => VacationPlan` | Analyzes transpiration needs across travel duration and generates preparation/return inspection tasks. | **Yes** (Human-in-the-Loop) |
| `updateCareTask(taskId, status)` | `(id: string, status: string)` | Modifies task completion status or reschedules watering cycle. | **Yes** (Human-in-the-Loop) |

---

## 4. Key Behavioral Examples

### Example 1 — Plants Needing Attention
- **Input**: *"Which of my plants need attention today?"*
- **Agent Execution**:
  1. Invokes `getUserPlants()` and `getUpcomingCareTasks()`.
  2. Compares `nextWateringDate` against local date `todayStr`.
  3. Groups plants into Overdue and Care Due.
  4. Generates an organized report with actionable check recommendations.

### Example 2 — Vacation Planning (7 Days)
- **Input**: *"I'm going on vacation for 7 days. What should I do?"*
- **Agent Execution**:
  1. Invokes `getUserPlants()`.
  2. Runs `createVacationPlan(7)`.
  3. Identifies vulnerable plants whose watering intervals fall within the 7-day absence.
  4. Details environmental preparations (relocating plants away from harsh window heat, deep soaking).
  5. Returns a structured action card: *"Add 2 automated pre-vacation preparation and return inspection tasks to your Care Planner?"* with `[Confirm Action]` and `[Cancel]`.

### Example 3 — Missed Watering Recovery
- **Input**: *"I forgot to water my Money Plant."*
- **Agent Execution**:
  1. Invokes `getPlantDetails('sample-plant-1')`.
  2. Assesses last watering date and interval (7 days).
  3. Provides restorative watering guidance (soaking until runoff, checking soil moisture first).
  4. Presents a confirmation prompt to advance the next care date from today by the plant's 7-day cycle.

### Example 4 — Cautious Plant Diagnostics
- **Input**: *"Why are my Money Plant leaves turning yellow?"*
- **Agent Execution**:
  1. Identifies botanical stress inquiry.
  2. Applies botanical diagnostics principles.
  3. Uses cautious, non-absolute terminology:
     - *"One possible cause is overwatering, leading to oxygen-deprived root tissue..."*
     - *"This can sometimes indicate insufficient indirect sunlight..."*
     - *"Consider checking whether the lower soil feels soggy..."*
  4. Explains practical verification steps without claiming false diagnostic certainty.