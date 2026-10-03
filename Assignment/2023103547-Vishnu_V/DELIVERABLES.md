# ResearchPilot — Deliverables

## Source Code
- [x] `src/` — Complete source tree
- [x] `src/app.py` — Streamlit frontend
- [x] `src/agents/` — All 9 agent modules
- [x] `src/tools/` — All 7 tool modules
- [x] `src/rag/` — RAG pipeline (embeddings, vector store, retriever)
- [x] `src/graph/` — LangGraph state and workflow
- [x] `src/models/schemas.py` — Pydantic v2 schemas
- [x] `src/utils/` — Config, logging, LLM, trace utilities

## Configuration
- [x] `src/.env.example` — Environment variable template
- [x] `src/requirements.txt` — Pinned dependencies
- [x] `.gitignore` — Proper exclusions

## Documentation
- [x] `PROMPT.md` — Original build prompt
- [x] `DELIVERABLES.md` — This file
- [x] `src/README.md` — Setup and usage instructions

## Quality
- [x] Type hints on all functions
- [x] Docstrings on all public functions
- [x] Structured logging throughout
- [x] Pydantic validation on all data models
- [x] Unit tests with recorded fixtures

## Integrity Rules Enforced
- [x] No fabricated papers (source_api + retrieved_at on every PaperMeta)
- [x] Missing info = "Not reported in the paper"
- [x] Evidence (quote + page/chunk_id) on every extracted field
- [x] Explicit vs inferred gap labeling with confidence
- [x] Deterministic reference formatting (no LLM)
- [x] Unverified citations in separate section
- [x] Citation guard on survey output
- [x] Abstract-only analysis flagged with badge
- [x] Mock data detection with red banner
