# ResearchPilot — Master Build Prompt

This file contains the original specification prompt used to build ResearchPilot.

## Product Summary

ResearchPilot is a web-based, multi-agent system that helps students and researchers:
- Find papers via scholarly APIs (OpenAlex, Semantic Scholar, Crossref)
- Analyze PDFs and extract structured information
- Compare papers and identify research gaps
- Verify citations against external metadata
- Generate a properly cited thematic literature survey

The system enforces strict integrity rules: no fabricated papers, evidence-backed extraction,
explicit vs inferred gap labeling, deterministic reference formatting, and citation guards.

## Key Features
1. Multi-agent LangGraph workflow with human-in-the-loop approval at two checkpoints
2. RAG-based paper analysis using ChromaDB and Gemini embeddings
3. Thematic literature survey generation (not paper-by-paper)
4. Citation verification against Crossref/OpenAlex
5. IEEE, APA, ACM reference formatting
6. Full research trace for transparency

## Tech Stack
- Frontend: Streamlit
- LLM: Gemini API via langchain-google-genai
- Orchestration: LangGraph
- Paper APIs: OpenAlex, Semantic Scholar, Crossref
- PDF: PyMuPDF + pypdf
- Vector Store: ChromaDB
- Validation: Pydantic v2
