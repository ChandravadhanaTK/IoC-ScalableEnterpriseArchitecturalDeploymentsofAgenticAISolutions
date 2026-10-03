# Application Generation Prompt

Build a Python Streamlit application named **Smart Emergency Incident Response System** for safety-aware emergency response coordination.

The application must accept a free-text emergency incident report and process it through a LangGraph workflow with shared typed state:

1. Extract location, incident type, severity, and people at risk.
2. In parallel, resolve the location, retrieve emergency procedures through local RAG, and assess available resources.
3. Generate an initial response decision from the incident facts, procedures, location, and resources.
4. Validate the decision for safety and flag unsafe recommendations without crashing.
5. Verify evidence and identify unsupported claims.
6. Require explicit human approval with `pending`, `approved`, or `rejected` status and reviewer comments.
7. Generate a final action plan that is never authorized unless safety, evidence, and human approval conditions pass.

Use LangGraph for orchestration, LangChain-compatible components, Groq for the LLM, Chroma and local embeddings for procedure retrieval, geopy for location lookup, and Streamlit for the interface. Keep the code modular with one module per agent plus central `state.py`, `graph.py`, and `llm.py` modules.

Implement these safety and resilience requirements:

- Parse and normalize model output before placing it in shared state.
- Use safe default coordinates when geocoding fails.
- Use a generic emergency procedure when the knowledge base is unavailable.
- Keep human approval separate from model reasoning.
- Do not authorize deployment when safety or evidence validation fails, even after approval.
- Load `GROQ_API_KEY` from `.env`; never commit secrets.
- Display the execution trace, safety result, evidence result, approval state, comments, and final action plan.
- Keep session review history and allow CSV export.

Create a README with installation, environment configuration, run instructions, architecture, workflow, limitations, and a source-file inventory. Also create a Markdown deliverables document containing:

- Architecture diagram with layers, components, trust boundaries, and integrations.
- Agent workflow design with roles, state, tools, handoffs, approvals, and failure paths.
- Deployment strategy covering runtime, scaling, resilience, environments, and release.
- Security model covering identity, authorization, secrets, privacy, guardrails, and audit.
- Monitoring dashboard design covering health, traces, quality, safety, cost, and business outcomes.

Clearly distinguish prototype behavior from production recommendations. Do not claim that external dispatch integration, persistent audit storage, or production authentication exists unless implemented.