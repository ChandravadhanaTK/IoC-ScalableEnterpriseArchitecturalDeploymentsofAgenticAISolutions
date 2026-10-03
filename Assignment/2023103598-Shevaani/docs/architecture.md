# Architecture

## Pipeline (deterministic analysis first, AI reasoning second)

```
Repository
    -> Repository Ingestion
    -> Python Parser (ast / LibCST)
    -> Intermediate Representation (IR)
    -> Metrics Engine        \
    -> Dependency Graph        > all consume the IR, none re-parse source
    -> Rule Engine            /
    -> Architecture Recovery
    -> Evidence Builder
    -> LLM Reasoning Service
    -> AI Output Validator
    -> Review Aggregator
    -> Dashboard / Report
```

## Authoritative vs. interpretive layers

Deterministic (authoritative, never overridden by the LLM):
file names, classes, functions, methods, imports, inheritance, calls,
dependencies, line numbers, LOC, complexity, fan-in/out, graph
relationships, detector rule matches.

AI / LLM (interpretive only):
contextual interpretation, explanation, architectural impact,
prioritization, recommendation, refactoring suggestions, natural-language
architecture summary. If an AI claim conflicts with deterministic evidence,
the AI claim is marked `UNSUPPORTED` and the deterministic evidence stands.

## Module responsibilities

See the top-level `backend/app/analyzer/` package layout in the README and
in `docs/methodology.md` (added when Phase 4+ introduces each module's
implementation). This document is updated at the end of every phase with
that phase's concrete design decisions.

## Development phases

1. Project setup (current)
2. Repository ingestion
3. Python parser
4. Intermediate representation
5. Metrics
6. Dependency graph
7. Code smell detectors
8. SOLID analysis
9. Security analysis
10. Performance analysis
11. Architecture recovery
12. Mermaid diagrams
13. Evidence builder
14. LLM service
15. AI validation
16. Review aggregation
17. FastAPI APIs
18. React frontend
19. Report generation
20. Evaluation framework
21. Testing
22. Docker
23. Documentation
24. Final integration
