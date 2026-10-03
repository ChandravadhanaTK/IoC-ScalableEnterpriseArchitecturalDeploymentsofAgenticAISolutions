# ResearchPilot

**AI-Powered Literature Survey Assistant**

ResearchPilot is a multi-agent system that helps students and researchers find papers, analyze PDFs, extract structured information, compare papers, identify research gaps, verify citations, and generate a properly cited literature survey.

## Features

- 🔍 **Multi-source Paper Search** — Searches OpenAlex, Semantic Scholar, and Crossref
- 📄 **PDF Analysis** — Extracts structured information from papers using RAG
- 📊 **Paper Comparison** — Builds comparison tables across papers
- 🔍 **Research Gap Detection** — Identifies gaps with explicit/inferred labeling
- 🔗 **Citation Verification** — Verifies every citation against external sources
- 📝 **Thematic Survey Generation** — Writes themed literature surveys (IEEE/APA/ACM)
- ✅ **Human-in-the-Loop** — Two approval checkpoints for quality control
- 📋 **Research Trace** — Full transparency with event logging

## Tech Stack

- **Frontend:** Streamlit
- **LLM:** Google Gemini via langchain-google-genai
- **Orchestration:** LangGraph (with SQLite checkpointer)
- **Vector Store:** ChromaDB
- **PDF Parsing:** PyMuPDF + pypdf
- **Validation:** Pydantic v2

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `GEMINI_API_KEY` — Your Google Gemini API key
- `OPENALEX_EMAIL` — Your email for OpenAlex polite pool

### 3. Run the Application

```bash
streamlit run app.py
```

## Usage

1. Enter a research question (e.g., "Find recent papers about detecting diseases in rice crops using computer vision")
2. Configure search parameters (year range, max papers, citation style)
3. Optionally upload PDFs
4. **Checkpoint 1:** Review and select candidate papers
5. Wait for analysis pipeline (extraction → analysis → comparison → gaps → citations → survey)
6. **Checkpoint 2:** Review the generated survey — approve or request revisions
7. Download the final report (Markdown or DOCX)

## Project Structure

```
src/
├── app.py                  # Streamlit frontend
├── agents/                 # LangGraph agent nodes (9 agents)
├── tools/                  # Tool functions (7 tools)
├── rag/                    # RAG pipeline (embeddings, vector store, retriever)
├── graph/                  # LangGraph state and workflow
├── models/                 # Pydantic v2 schemas
├── utils/                  # Config, logging, LLM, trace utilities
├── tests/                  # Unit tests
└── data/                   # Runtime data (uploads, cache, traces, reports)
```

## Integrity Rules

- No fabricated papers — every paper from API or user upload
- Missing info = "Not reported in the paper"
- Evidence required on every extracted field
- Explicit vs inferred gap labeling
- Deterministic reference formatting (no LLM)
- Unverified citations in separate section
- Citation guard on survey output
- Abstract-only analysis flagged

## License

Academic use only.
