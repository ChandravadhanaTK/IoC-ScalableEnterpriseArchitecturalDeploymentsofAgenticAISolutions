# Architecture Diagram

**Trip Planner Agent — implemented system architecture**

> This document describes the system **as actually built** in this repository.
> It complements [`DELIVERABLES.md`](DELIVERABLES.md), which contains the
> forward-looking enterprise architecture (with components such as PostgreSQL,
> Redis and cloud APIs that are *not* required for the local/offline build).

Diagrams are provided in two forms:

- **ASCII** — renders anywhere, including terminals and plain text viewers.
- **Mermaid** — renders natively on GitHub, GitLab and most Markdown viewers.

---

## 1. High-Level System Architecture

The system is a layered agent: a thin presentation layer (CLI examples or the
local web UI) drives a single orchestration agent, which delegates to four
focused service modules over a shared Pydantic data model.

### ASCII

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                 │
│                                                                           │
│   ┌─────────────────────┐    ┌──────────────────┐    ┌────────────────┐   │
│   │  Local Web UI       │    │  CLI Examples    │    │  Tests         │   │
│   │  (Flask + vanilla   │    │  basic_usage.py  │    │  pytest suite  │   │
│   │   JS, offline)      │    │  advanced_*.py   │    │                │   │
│   │  run_web.py / .bat  │    │                  │    │                │   │
│   └──────────┬──────────┘    └────────┬─────────┘    └───────┬────────┘   │
└──────────────┼────────────────────────┼──────────────────────┼────────────┘
               │  HTTP/JSON             │  Python call         │
               │  /api/plan             │                      │
               ▼                        ▼                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      AGENT ORCHESTRATION LAYER                            │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │  TripPlannerAgent                    (src/agent.py)               │   │
│   │                                                                   │   │
│   │    perceive ──► reason ──► act ──► observe  (state machine)       │   │
│   │                                                                   │   │
│   │    state: AgentState   logs: List[AgentLog]                       │   │
│   └───────┬───────────────┬───────────────┬───────────────┬───────────┘   │
│           │               │               │               │               │
└───────────┼───────────────┼───────────────┼───────────────┼───────────────┘
            │               │               │               │
            ▼               ▼               ▼               ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          SERVICE / DOMAIN LAYER                           │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ Activity     │ │ Itinerary    │ │ Itinerary    │ │ Utilities        │  │
│  │ Searcher     │ │ Optimizer    │ │ Planner      │ │                  │  │
│  │ searcher.py  │ │ optimizer.py │ │ planner.py   │ │ utils.py         │  │
│  │              │ │              │ │              │ │                  │  │
│  │ .search()    │ │ .optimize()  │ │ .generate_   │ │ generate_id()    │  │
│  │              │ │              │ │  itinerary() │ │ format_*()       │  │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ .validate_   │ │ validate_budget()│  │
│  │ │ Mock     │ │ │ │ Route    │ │ │  itinerary() │ │ rate_limit()     │  │
│  │ │ Searcher │ │ │ │ Optimizer│ │ │ .refine_     │ │ setup_logging()  │  │
│  │ │ (offline)│ │ │ │ Budget   │ │ │  itinerary() │ │                  │  │
│  │ └──────────┘ │ │ │ Optimizer│ │ │              │ │                  │  │
│  │              │ │ └──────────┘ │ │              │ │                  │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────────┘  │
│         │                │                │                               │
└─────────┼────────────────┼────────────────┼───────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          DATA MODEL LAYER   (src/models.py)               │
│                                                                           │
│   TripPreferences      Activity            ItineraryItem      Itinerary   │
│   Location             ActivityCategory    TransportationMode             │
│   AgentState           AgentLog                                           │
│                                                                           │
│                 ⚙ Pydantic v2 validation & serialization                  │
└───────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL INTEGRATION (optional)                     │
│                                                                           │
│   ┌────────────────────────┐   ┌───────────────────────────────────────┐  │
│   │  Google Places API     │   │  geopy (great-circle distance calc)   │  │
│   │  (only if API key set) │   │  local, no network                    │  │
│   └────────────────────────┘   └───────────────────────────────────────┘  │
│                                                                           │
│   ★ Offline mode: MockActivitySearcher replaces the network searcher,     │
│     so the whole stack runs with zero API keys and zero internet.         │
└───────────────────────────────────────────────────────────────────────────┘
```

### Mermaid

```mermaid
flowchart TB
    subgraph Presentation["PRESENTATION LAYER"]
        WebUI["Local Web UI<br/>Flask + vanilla JS<br/>(offline)"]
        CLI["CLI Examples<br/>basic_usage.py<br/>advanced_features.py"]
        Tests["pytest Suite"]
    end

    subgraph Orchestration["AGENT ORCHESTRATION LAYER"]
        Agent["TripPlannerAgent<br/>src/agent.py<br/>perceive → reason → act → observe"]
    end

    subgraph Services["SERVICE / DOMAIN LAYER"]
        Searcher["ActivitySearcher<br/>src/searcher.py"]
        Optimizer["ItineraryOptimizer<br/>src/optimizer.py"]
        Planner["ItineraryPlanner<br/>src/planner.py"]
        Utils["Utilities<br/>src/utils.py"]
    end

    subgraph ModelLayer["DATA MODEL LAYER"]
        Models["src/models.py<br/>Pydantic v2 models"]
    end

    subgraph External["EXTERNAL (optional)"]
        Places["Google Places API"]
        Geo["geopy distance"]
        MockSearcher["MockActivitySearcher<br/>no network"]
    end

    WebUI -->|"HTTP/JSON  /api/plan"| Agent
    CLI --> Agent
    Tests --> Agent

    Agent --> Searcher
    Agent --> Optimizer
    Agent --> Planner
    Agent --> Utils

    Searcher --> Models
    Optimizer --> Models
    Planner --> Models
    Utils --> Models

    Searcher -.->|"only if API key"| Places
    Optimizer --> Geo
    Searcher -.->|"offline substitute"| MockSearcher
```

---

## 2. Component Map

Every runtime component, where it lives, and what it owns.

| Layer | Module | Primary Class / Entry | Responsibility |
|-------|--------|-----------------------|----------------|
| Presentation | `web_app/app.py` | `Flask app` (`/api/meta`, `/api/plan`) | Serve UI + JSON API, build/validate input |
| Presentation | `web_app/static/app.js` | IIFE | Form handling, render timeline, exports |
| Presentation | `web_app/templates/index.html` | — | Single-page UI markup |
| Presentation | `run_web.py` / `run_web.bat` | `main()` | Launch local server |
| Presentation | `examples/*.py` | `main()` | CLI usage demos |
| Orchestration | `src/agent.py` | `TripPlannerAgent` | Agent loop, state machine, logging |
| Orchestration | `src/agent.py` | `create_agent()` | Factory (`use_mock`, `api_keys`) |
| Service | `src/searcher.py` | `ActivitySearcher` | Google Places search + cache + retry |
| Service | `src/searcher.py` | `MockActivitySearcher` | Offline activity generator |
| Service | `src/optimizer.py` | `ItineraryOptimizer` | Combines budget + route optimization |
| Service | `src/optimizer.py` | `RouteOptimizer` | Nearest-neighbour TSP, travel time/distance |
| Service | `src/optimizer.py` | `BudgetOptimizer` | Score & select activities within budget |
| Service | `src/planner.py` | `ItineraryPlanner` | Time-slot scheduling, validation, export |
| Service | `src/utils.py` | functions | IDs, formatting, rate limiting, logging |
| Data | `src/models.py` | Pydantic models | Validation, serialization, scoring |

---

## 3. Module Dependency Graph

```mermaid
flowchart LR
    app["web_app/app.py"] --> agent["agent.py"]
    app --> models["models.py"]

    agent --> models
    agent --> searcher["searcher.py"]
    agent --> optimizer["optimizer.py"]
    agent --> planner["planner.py"]
    agent --> utils["utils.py"]

    searcher --> models
    searcher --> utils

    optimizer --> models
    optimizer --> utils

    planner --> models
    planner --> optimizer
    planner --> utils
```

> **Import convention:** modules use *flat* imports (`from models import ...`),
> and every entry point inserts `src/` on `sys.path` before importing. There is
> no `src.` package prefix.

---

## 4. Data Model (Class Diagram)

```mermaid
classDiagram
    class TripPreferences {
        +str location
        +datetime start_date
        +int duration_days
        +Decimal budget
        +List~ActivityCategory~ interests
        +int party_size
        +TransportationMode transportation_preference
        +time start_time
        +time end_time
        +str pace
        +get_daily_budget() Decimal
        +get_available_hours() float
    }

    class Activity {
        +str id
        +str name
        +ActivityCategory category
        +Location location
        +str description
        +int duration_minutes
        +Decimal cost
        +float rating
        +int reviews_count
        +Dict operating_hours
        +is_open_at(time) bool
        +get_score(prefs) float
    }

    class Location {
        +str name
        +str address
        +float latitude
        +float longitude
        +distance_to(other) float
    }

    class ItineraryItem {
        +datetime time
        +Activity activity
        +int travel_time_to_next
        +TransportationMode travel_mode
        +str notes
        +get_end_time() datetime
        +get_total_time() int
    }

    class Itinerary {
        +str id
        +TripPreferences preferences
        +List~ItineraryItem~ items
        +Decimal total_cost
        +float total_distance_km
        +float total_duration_hours
        +List~Activity~ alternative_suggestions
        +get_summary() dict
        +to_markdown() str
        +to_json() dict
    }

    class ActivityCategory {
        <<enumeration>>
        MUSEUM
        RESTAURANT
        PARK
        LANDMARK
        OUTDOOR
        ...
    }

    class TransportationMode {
        <<enumeration>>
        WALKING
        DRIVING
        PUBLIC_TRANSIT
        RIDESHARE
        BICYCLING
    }

    Itinerary "1" --> "1" TripPreferences : uses
    Itinerary "1" --> "1..*" ItineraryItem : contains
    Itinerary "1" --> "0..*" Activity : suggestions
    ItineraryItem "1" --> "1" Activity : schedules
    Activity "1" --> "1" Location : at
    Activity --> ActivityCategory : typed by
    TripPreferences --> ActivityCategory : interests
    ItineraryItem --> TransportationMode : travel_mode
    TripPreferences --> TransportationMode : preference
```

---

## 5. Agent State Machine

`TripPlannerAgent.plan_trip()` walks through `AgentState` values. Each
transition appends an `AgentLog` entry (the *observe* step).

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> PARSING_INPUT : plan_trip(preferences)
    PARSING_INPUT --> SEARCHING_ACTIVITIES : preferences stored
    SEARCHING_ACTIVITIES --> OPTIMIZING_ROUTE : activities found
    SEARCHING_ACTIVITIES --> FAILED : no activities
    OPTIMIZING_ROUTE --> GENERATING_ITINERARY : budget + route solved
    GENERATING_ITINERARY --> FORMATTING_OUTPUT : items scheduled
    FORMATTING_OUTPUT --> COMPLETED : validation issues recorded
    COMPLETED --> [*] : Itinerary returned
    FAILED --> [*] : exception re-raised
```

### ASCII

```
   plan_trip()
        │
        ▼
  ┌──────────────┐
  │    IDLE      │
  └──────┬───────┘
         ▼
  ┌──────────────────┐   store preferences
  │ PARSING_INPUT    │────────────────────┐
  └──────────────────┘                    │
                                          ▼
                              ┌────────────────────────┐
                              │ SEARCHING_ACTIVITIES   │  searcher.search()
                              └───────┬────────────────┘
                                      │
                    activities?  ─────┤
                       no             │ yes
                        ▼             ▼
                  ┌──────────┐  ┌───────────────────┐
                  │  FAILED  │  │ OPTIMIZING_ROUTE  │ optimizer.optimize()
                  └──────────┘  └─────────┬─────────┘
                                          ▼
                              ┌────────────────────────┐
                              │ GENERATING_ITINERARY   │ planner.generate_itinerary()
                              └───────────┬────────────┘
                                          ▼
                              ┌────────────────────────┐
                              │ FORMATTING_OUTPUT      │ planner.validate_itinerary()
                              └───────────┬────────────┘
                                          ▼
                                    ┌───────────┐
                                    │ COMPLETED │  → return Itinerary
                                    └───────────┘
```

---

## 6. Request Flow

### 6a. Web request (`POST /api/plan`)

```mermaid
sequenceDiagram
    actor User
    participant Browser as Browser (app.js)
    participant Flask as Flask (web_app/app.py)
    participant Agent as TripPlannerAgent
    participant Seeker as MockActivitySearcher
    participant Optim as ItineraryOptimizer
    participant Plan as ItineraryPlanner

    User->>Browser: Fill form, click Generate
    Browser->>Flask: POST /api/plan (JSON)
    Flask->>Flask: _build_preferences() + validate
    Flask->>Agent: create_agent(use_mock=True)
    Flask->>Agent: asyncio.run(plan_trip(prefs))
    Agent->>Seeker: search(prefs)
    Seeker-->>Agent: List[Activity]
    Agent->>Optim: optimize(activities, prefs)
    Optim->>Optim: BudgetOptimizer then RouteOptimizer
    Optim-->>Agent: ordered activities
    Agent->>Plan: generate_itinerary(ordered, prefs)
    Plan->>Plan: schedule time slots + travel
    Plan-->>Agent: Itinerary
    Agent->>Plan: validate_itinerary(itinerary)
    Plan-->>Agent: issues[]
    Agent-->>Flask: Itinerary
    Flask->>Flask: _serialize_itinerary() -> JSON
    Flask-->>Browser: 200 JSON
    Browser-->>User: Render summary + timeline
```

### 6b. CLI request (`examples/basic_usage.py`)

```mermaid
sequenceDiagram
    participant Script as basic_usage.py
    participant Agent as TripPlannerAgent
    participant Modules as searcher/optimizer/planner

    Script->>Agent: create_agent(use_mock=True)
    Script->>Agent: await plan_trip(prefs)
    Agent->>Modules: search -> optimize -> generate -> validate
    Modules-->>Agent: Itinerary
    Agent-->>Script: Itinerary
    Script->>Script: itinerary.to_markdown()
    Script->>Script: print summary
```

---

## 7. Optimization Internals

```mermaid
flowchart TD
    A["All candidate activities"] --> B["BudgetOptimizer<br/>score each: category, rating, cost, reviews"]
    B --> C["Greedy selection<br/>skip if over budget or over time"]
    C --> D["RouteOptimizer<br/>nearest-neighbour ordering (TSP heuristic)"]
    D --> E["ItineraryPlanner<br/>assign times + travel + 10-min buffer"]
    E --> F["validate_itinerary<br/>budget / end-time / min-2 checks"]
```

**Scoring** (`Activity.get_score`) — max 100 points:

| Factor | Weight | Notes |
|--------|--------|-------|
| Category match | 40 | activity category ∈ interests |
| Rating | 30 | `(rating / 5) * 30` |
| Cost efficiency | 20 | cheaper relative to budget → more points |
| Review credibility | 10 | `min(10, reviews/100 * 10)` |

---

## 8. Runtime / Deployment View

The default build is a **single-process, single-machine, offline** application.

```mermaid
flowchart LR
    subgraph Machine["Your Machine (no internet required)"]
        direction TB
        Py["Python 3.x process"]
        subgraph Flask_["Flask dev server :5000"]
            API["/  /api/meta  /api/plan"]
        end
        subgraph Core["agent + services"]
            AG["TripPlannerAgent"]
        end
        Py --- Flask_
        Flask_ --> Core
    end

    Browser["Web browser"] -->|"http://127.0.0.1:5000"| API
```
- **No database** — itineraries are returned in-memory; the searcher keeps an
  in-process dict cache.
- **No message queue / cache server** — concurrency is plain `asyncio` inside a
  single process.
- **No cloud dependency** — `MockActivitySearcher` supplies activities and
  `geopy` computes distances locally.

### Ports & endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Serves `index.html` |
| `/api/meta` | GET | Valid interests, transportation modes, paces |
| `/api/plan` | POST | Plan a trip; returns serialized itinerary JSON |

---

## 9. Trust Boundaries & Safety

| Boundary | Control |
|----------|---------|
| Browser → Flask | Bound to `127.0.0.1` only (not exposed to LAN) |
| User input → model | `_build_preferences()` clamps ranges (days 1–14, party 1–20, budget ≥ 0) |
| User input → DOM | `esc()` helper escapes all interpolated strings in `app.js` |
| Missing/invalid input | `400` with a human-readable message; no stack traces to client |
| External API | Only contacted if a key is supplied; `tenacity` retry + rate limiting |
| Transport | Fully offline by default → no data leaves the machine |

---

## 10. Source Tree

```
TripPlannerAgent/
├── src/                      # Core library (flat imports)
│   ├── models.py             # Pydantic data models
│   ├── agent.py              # TripPlannerAgent orchestrator
│   ├── searcher.py           # ActivitySearcher + MockActivitySearcher
│   ├── optimizer.py          # RouteOptimizer / BudgetOptimizer / ItineraryOptimizer
│   ├── planner.py            # ItineraryPlanner
│   └── utils.py              # Helpers
├── web_app/                  # Local offline web UI
│   ├── app.py                # Flask server + JSON API
│   ├── templates/index.html  # Single-page UI
│   └── static/               # style.css, app.js
├── examples/                 # basic_usage.py, advanced_features.py
├── tests/                    # pytest suite (incl. test_web_app.py)
├── docs/                     # prompt.md, DELIVERABLES.md, ARCHITECTURE.md
├── run_web.py / run_web.bat  # Web UI launchers
└── requirements.txt / setup.py
```

---

*See also: [`DELIVERABLES.md`](DELIVERABLES.md) (enterprise/forward-looking
architecture), [`../README.md`](../README.md) (usage), and
[`prompt.md`](prompt.md) (LLM regeneration prompt).*