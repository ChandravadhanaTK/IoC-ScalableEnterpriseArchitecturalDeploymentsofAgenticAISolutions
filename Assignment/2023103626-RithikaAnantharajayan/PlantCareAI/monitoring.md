# Monitoring Dashboard Design & Observability — PlantCare AI

## 1. Observability Architecture

**PlantCare AI** incorporates an integrated telemetry and monitoring pipeline designed for operational visibility during academic enterprise-architecture demonstrations.

```mermaid
graph TD
    classDef comp fill:#f8fafc,stroke:#334155,stroke-width:2px,color:#0f172a;
    classDef metric fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#082f49;
    classDef health fill:#f2fbf5,stroke:#298953,stroke-width:2px,color:#0a2719;
    classDef dash fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;

    subgraph Producers ["Telemetry Producers"]
        Auth[Firebase Auth Service] --> HealthCheck[Health Check Probe]
        Firestore[Cloud Firestore DB] --> HealthCheck
        AI[Agentic Reasoning Engine] --> TraceLog[AI Interaction Logger]
    end

    subgraph MetricsCollector ["Metrics & Telemetry Aggregator"]
        HealthCheck --> HealthState{Latency & Status Analyzer}
        TraceLog --> InteractionStore[(aiInteractions Document Store)]
        InteractionStore --> Aggregator[Real-Time KPI Aggregator]
    end

    subgraph DashboardView ["Monitoring Dashboard UI (/monitoring)"]
        HealthState --> H1["Authentication: Healthy"]
        HealthState --> H2["Cloud Database: Healthy"]
        HealthState --> H3["AI Assistant Engine: Healthy"]

        Aggregator --> M1["Total Plants Monitored"]
        Aggregator --> M2["Total Care Tasks"]
        Aggregator --> M3["Completed Tasks Rate"]
        Aggregator --> M4["AI Request Success Rate"]
        Aggregator --> M5["Average Agent Latency (ms)"]

        Aggregator --> AuditTable["Recent AI Interaction Audit Trail\nTimestamp | Intent | Tools | Latency | Status"]
    end

    class Auth,Firestore,AI comp;
    class HealthCheck,TraceLog,HealthState,Aggregator metric;
    class H1,H2,H3 health;
    class M1,M2,M3,M4,M5,AuditTable dash;
```

---

## 2. Key Performance Indicators (KPIs)

| Metric | Source | Description | Demonstration Baseline |
| :--- | :--- | :--- | :--- |
| **Total Registered Users** | Auth / Synthetic | Total accounts managed across the cluster | `142` (Demo Aggregate) |
| **Total Plants Monitored** | Cloud Firestore | Live botanical records in the user's active tenant | Real-Time Live Count |
| **Total Care Tasks** | Cloud Firestore | Scheduled maintenance tasks across all timelines | Real-Time Live Count |
| **Care Task Completion %** | Cloud Firestore | Ratio of completed vs scheduled tasks | Real-Time Live % |
| **Total AI Requests** | `aiInteractions` | Volume of natural language agent inquiries processed | Real-Time Live Count |
| **AI Success Rate %** | `aiInteractions` | Ratio of successful tool inferences to total requests | Real-Time Live % |
| **Average Agent Latency** | Performance API | Mean roundtrip duration for reasoning + tool execution | Real-Time (~45ms - 250ms) |

---

## 3. Application Health Probes

The system continuously probes 3 core infrastructure vectors:
1. **Authentication Service**: Verified by session state responsiveness. Status: `Healthy`.
2. **Database Connectivity**: Verified by Cloud Firestore read latency. Status: `Healthy`.
3. **AI Assistant Engine**: Verified by Gemini client initialization or local reasoning engine availability. Status: `Healthy`.

---

## 4. Interaction Audit Trail Logging

Every invocation of the AI assistant logs a structured trace containing:
- `id`: Unique trace identifier
- `userId`: Tenant identifier
- `requestType`: Intent classification (`plants_needing_attention`, `vacation_planning`, `missed_watering_adjustment`, `plant_diagnostic`, `care_plan_generation`)
- `promptSummary`: User query snippet
- `toolsUsed`: Array of tool signatures executed (`getUserPlants`, `createVacationPlan`, etc.)
- `durationMs`: End-to-end execution time in milliseconds
- `success`: Boolean execution status
- `timestamp`: ISO timestamp

All entries are displayed chronologically in the **Recent AI Interactions Audit Trail** table on the `/monitoring` dashboard.