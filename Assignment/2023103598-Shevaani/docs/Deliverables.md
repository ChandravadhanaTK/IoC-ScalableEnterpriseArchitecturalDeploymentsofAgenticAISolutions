# Deliverables.md

# Capstone Project Deliverables

## Project

**AI-Assisted Framework for Automated Software Architecture Assessment
and Code Smell Detection**

The system is an automated software architecture reviewer for Python
repositories that combines deterministic static analysis with
AI-assisted interpretation.

------------------------------------------------------------------------

## 1. Architecture Diagram

### Purpose

Show the complete application architecture, major components, data flow,
trust boundaries and external integrations.

### Components

-   React frontend
-   FastAPI backend
-   Repository ingestion service
-   Python AST parser
-   Metrics analyzer
-   NetworkX dependency graph
-   Code-smell detectors
-   SOLID analyzer
-   Security heuristics
-   Performance heuristics
-   Architecture inference engine
-   Gemini AI review service
-   In-memory analysis store
-   Report generator

### Primary Flow

``` text
User
  |
  v
React Dashboard
  |
  v
FastAPI API
  |
  +--> ZIP / GitHub Repository Ingestion
  |
  v
Python AST Parser
  |
  +--> Metrics
  +--> Dependency Graph
  +--> Code Smells
  +--> SOLID Analysis
  +--> Security / Performance Heuristics
  |
  v
Architecture Inference
  |
  +--> Mermaid Architecture
  |
  v
Structured Analysis Result
  |
  +--> Gemini AI Review
  |
  v
Dashboard / Report
```

Recovered architecture is **inferred from static evidence**, not an
authoritative runtime architecture.

------------------------------------------------------------------------

## 2. Agent Workflow Design

### Workflow

**Repository Submission:** user supplies a ZIP archive or public GitHub
URL.

**Secure Ingestion:** validate source, apply archive/file limits,
extract to a temporary workspace and never execute repository code.

**Static Parsing:** parse Python files using AST and extract modules,
classes, functions, methods, imports and source locations.

**Deterministic Analysis:** calculate metrics, build the import
dependency graph and run the five primary smell detectors.

**Extended Analysis:** run cautious SOLID, security and performance
heuristics.

**Architecture Recovery:** infer high-level components and relationships
and generate Mermaid output.

**AI Review:** if Gemini is configured, send structured deterministic
evidence for contextual interpretation, architectural impact and
recommendations.

**Dashboard:** display overview, metrics, findings, dependency
information, architecture, Mermaid diagram, AI review and performance.

### Failure Paths

Controlled failures must exist for invalid ZIPs, unsafe archives,
inaccessible repositories, parser errors, GitHub rate limits and
Gemini/API failures. Deterministic analysis should remain usable when
the AI layer is unavailable.

------------------------------------------------------------------------

## 3. Deployment Strategy

### Application Structure

``` text
Frontend: React + TypeScript + Vite
              |
              v
Backend: FastAPI + Python
              |
       +------+------+
       |             |
Static Analyzer   Gemini API
```

### Frontend

Deploy the production Vite build over HTTPS. Configure the backend API
URL through deployment environment configuration.

### Backend

Run FastAPI with an ASGI server such as Uvicorn. Configure Gemini
through deployment secrets:

``` text
GEMINI_API_KEY=<secret>
GEMINI_MODEL=<configured-model>
```

Never commit `.env` or API secrets.

### Scaling

The current version uses in-memory analysis storage and is suitable as
an academic prototype. Persistent storage and background processing can
be introduced later if production scale requires them.

### Release Flow

``` text
Code Change
    ↓
Git Repository
    ↓
Build / Test
    ↓
Deploy Frontend
    ↓
Deploy Backend
    ↓
Health Check
    ↓
Live Application
```

------------------------------------------------------------------------

## 4. Security Model

### Repository Safety

The analyzer must never execute repository code. The ingestion pipeline
should use HTTPS, validate repository URLs, enforce archive and file
limits, prevent ZIP path traversal, reject unsafe entries, use temporary
workspaces and avoid invoking Git, shells, package managers or
repository executables.

### Secret Management

Gemini credentials must be supplied through environment variables. They
must never be committed, returned in API responses, logged or placed in
frontend source.

### Input Validation

Validate upload size, repository URL, archive structure, supported files
and API payloads.

### AI Security

Repository content is untrusted data. Gemini must not follow
instructions embedded in source code, invent findings or source
locations, or override deterministic evidence.

### Data Isolation

The prototype stores analysis results in memory. Temporary repository
workspaces should be cleaned after processing.

------------------------------------------------------------------------

## 5. Monitoring Dashboard Design

### Health

Display:

-   backend status
-   AI configuration status
-   analysis status
-   parser errors
-   ingestion failures

### Analysis Performance

Display:

-   files processed
-   Python files
-   lines of code
-   total execution time
-   files/second
-   Python files/second
-   LOC/second
-   seconds/file
-   seconds/1,000 LOC
-   Python heap peak where available

### Pipeline Timings

Track:

-   repository ingestion
-   AST parsing
-   metric calculation
-   dependency graph
-   code-smell detection
-   SOLID analysis
-   security analysis
-   performance analysis
-   architecture inference
-   source-snippet extraction
-   total static analysis

### Quality Metrics

Report Accuracy, Precision, Recall and F1 for the five primary detectors
plus Macro Average. Evaluation must use explicitly labeled controlled
fixtures.

### Findings

Track total findings, category, severity, detector, source location,
evidence and AI explanation status.

### AI Review

Track AI configuration, completion status, recommendations,
false-positive candidates and API failures.

------------------------------------------------------------------------

## 6. Evaluation Deliverable

Evaluate:

1.  Long Method
2.  God Class
3.  Cyclic Dependency
4.  Long Parameter List
5.  Excessive Coupling

For each, report:

``` text
Accuracy
Precision
Recall
F1 Score
```

Also report:

``` text
Macro Average
```

Formulae:

``` text
Accuracy  = (TP + TN) / (TP + TN + FP + FN)
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2 × Precision × Recall / (Precision + Recall)
```

The evaluation set should contain multiple positive, negative, boundary
and near-miss cases rather than only one positive and one negative case.

------------------------------------------------------------------------

## 7. Final Deliverable Set

  -----------------------------------------------------------------------
  \#                      Deliverable             Description
  ----------------------- ----------------------- -----------------------
  1                       Architecture Diagram    High-level system and
                                                  component architecture

  2                       Agent Workflow Design   End-to-end workflow,
                                                  states and failure
                                                  paths

  3                       Deployment Strategy     Runtime, environments,
                                                  scaling and release
                                                  strategy

  4                       Security Model          Repository, API, secret
                                                  and AI security
                                                  controls

  5                       Monitoring Dashboard    Health, quality,
                          Design                  performance and
                                                  operational metrics

  6                       Source Code             Frontend and backend
                                                  implementation

  7                       Evaluation Results      Detector metrics and
                                                  macro average

  8                       Analysis Report         Findings, metrics,
                                                  dependencies and
                                                  inferred architecture

  9                       AI Review               Gemini explanations and
                                                  recommendations

  10                      Live Deployment         Accessible deployed
                                                  application
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 8. Academic Evidence Model

### Deterministic Evidence

Examples:

-   LOC
-   number of classes
-   dependency edges
-   fan-in/fan-out
-   threshold violations
-   dependency cycles

### Heuristic Inference

Examples:

-   potential SOLID violations
-   potential security issues
-   potential performance issues
-   candidate design patterns

### AI Interpretation

Examples:

-   explanation of findings
-   architectural impact
-   refactoring recommendations
-   false-positive considerations

Keeping these three layers separate makes the system explainable and
academically defensible.
