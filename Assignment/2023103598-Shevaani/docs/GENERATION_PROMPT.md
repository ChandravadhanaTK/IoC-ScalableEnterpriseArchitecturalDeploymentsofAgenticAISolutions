# GENERATION_PROMPT.md

## Project Generation Prompt

Build a complete academic capstone project titled **"AI-Assisted
Framework for Automated Software Architecture Assessment and Code Smell
Detection"**, also referred to as an **AI-Powered Software Architecture
Reviewer**.

### Objective

Create a web-based system that accepts a Python software repository as a
ZIP upload or public GitHub repository URL and automatically evaluates
its software quality and architecture using static analysis. The system
must identify code smells, analyze dependencies, infer a high-level
architecture, and provide AI-assisted explanations and recommendations.

The system must prioritize deterministic, evidence-based static
analysis. The LLM must act as an interpretation and recommendation layer
rather than replacing the deterministic analyzer.

### Core Workflow

``` text
Repository / ZIP
      ↓
Secure Repository Ingestion
      ↓
Python AST Parsing
      ↓
Metrics Calculation
      ↓
Dependency Graph
      ↓
Code Smell Detection
      ↓
SOLID Analysis
      ↓
Security / Performance Heuristics
      ↓
Architecture Recovery
      ↓
Gemini AI Review
      ↓
Report / Web Dashboard
```

### Functional Requirements

1.  Support Python repositories.
2.  Accept ZIP uploads and public GitHub repository URLs.
3.  Never execute uploaded repository code.
4.  Parse Python source using the AST.
5.  Calculate LOC, files, classes, functions, methods and imports.
6.  Build an import-based dependency graph with dependency count,
    fan-in, fan-out and cycles.
7.  Detect Long Method, Large/God Class, Long Parameter List, Excessive
    Coupling and Circular Dependency.
8.  Perform cautious SOLID analysis for SRP, OCP, LSP, ISP and DIP.
9.  Identify potential security and performance issues using heuristic
    static analysis.
10. Infer high-level architecture from directory and dependency
    relationships.
11. Generate Mermaid architecture diagrams from deterministic analysis.
12. Integrate Google Gemini as an optional AI review layer.
13. Gemini must explain findings, assess architectural impact, recommend
    refactoring and identify possible false positives.
14. Gemini must not invent evidence or override deterministic findings.
15. Deterministic analysis must continue when Gemini is unavailable.
16. Provide REST APIs for analysis, findings, metrics, dependencies,
    architecture and reports.
17. Maintain results in memory for the initial implementation.
18. Provide a React dashboard for overview, findings, architecture, AI
    review and performance.
19. Display files processed, Python files, LOC, execution time,
    files/sec, Python files/sec, LOC/sec, seconds/file, seconds/1000 LOC
    and stage timings.

### Evaluation Requirements

Evaluate the five primary smell detectors using controlled, explicitly
labeled fixtures:

-   Long Method
-   God Class
-   Cyclic Dependency
-   Long Parameter List
-   Excessive Coupling

Calculate Accuracy, Precision, Recall, F1 and an unweighted Macro
Average.

``` text
Accuracy  = (TP + TN) / (TP + TN + FP + FN)
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1        = 2 × Precision × Recall / (Precision + Recall)
```

Do not fabricate evaluation results. Run the real production detectors
against labeled fixtures.

### Enterprise Architecture Deliverables

Produce five documentation artifacts:

1.  **Architecture Diagram** --- layers, components, trust boundaries
    and integrations.
2.  **Agent Workflow Design** --- roles, states, tools, handoffs,
    validation, approvals and failure paths.
3.  **Deployment Strategy** --- runtime, scaling, resilience,
    environments and release process.
4.  **Security Model** --- identity, authorization, secrets, privacy,
    guardrails and auditability.
5.  **Monitoring Dashboard Design** --- health, trace, quality, safety,
    cost and project outcomes.

### Technology Direction

Use a simple maintainable stack:

-   Backend: Python, FastAPI, Python AST, NetworkX, Pydantic, in-memory
    storage.
-   Frontend: React, TypeScript, Vite, Tailwind CSS.
-   AI: Google Gemini API with environment-based API key and
    configurable model.

Avoid unnecessary infrastructure such as Kubernetes, Redis, Celery,
databases, RAG or model fine-tuning unless later required.

### Security and Reliability

Use HTTPS, secure repository acquisition, archive/file limits, ZIP
path-traversal protection, temporary workspaces and strict input
validation. Never execute repository code. Never log or expose API keys.
Handle GitHub rate limits explicitly. AI failures must not break
deterministic analysis.

### Expected Outcome

Produce a complete academic prototype demonstrating automated static
analysis, architecture recovery, code-smell detection, SOLID analysis,
dependency analysis, AI-assisted interpretation, measurable performance,
explainable findings, architecture visualization and secure repository
ingestion.
