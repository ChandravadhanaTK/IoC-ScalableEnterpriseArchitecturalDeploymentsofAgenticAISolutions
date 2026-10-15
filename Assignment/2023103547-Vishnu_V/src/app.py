"""ResearchPilot — Streamlit Frontend.

Multi-step web UI with human-in-the-loop approval at two checkpoints,
research trace viewer, and mock-data detection banner.
"""

from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Ensure src/ is on the path
_SRC_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_SRC_DIR))

import streamlit as st

from graph.workflow import get_compiled_graph, create_initial_state
from utils.config import get_settings, UPLOADS_DIR, REPORTS_DIR
from utils.llm import LLMConfigError, check_gemini_access
from utils.trace import load_trace, format_trace_for_report
from models.schemas import PaperMeta, TraceEvent
from langgraph.types import Command


# ── Page Configuration ──────────────────────────────────────────────

st.set_page_config(
    page_title="ResearchPilot",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ──────────────────────────────────────────────────────

st.markdown("""
<style>
    .mock-banner {
        background-color: #ff4444;
        color: white;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .abstract-only-badge {
        background-color: #ff9800;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }
    .verified-badge {
        background-color: #4CAF50;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    .unverified-badge {
        background-color: #f44336;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    .partial-badge {
        background-color: #ff9800;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    .phase-indicator {
        padding: 5px 15px;
        border-radius: 20px;
        font-weight: bold;
        display: inline-block;
    }
    .relevance-high { color: #4CAF50; font-weight: bold; }
    .relevance-medium { color: #ff9800; font-weight: bold; }
    .relevance-low { color: #f44336; font-weight: bold; }
</style>
""", unsafe_allow_html=True)


# ── Session State Initialization ────────────────────────────────────


def init_session_state() -> None:
    """Initialize Streamlit session state variables."""
    defaults = {
        "thread_id": None,
        "graph": None,
        "phase": "input",
        "config": None,
        "state_snapshot": None,
        "has_mock_data": False,
        "last_error": None,
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


init_session_state()


@st.cache_data(ttl=300, show_spinner=False)
def gemini_status() -> tuple[bool, str]:
    """Cached pre-flight check of the Gemini key and model names."""
    try:
        return check_gemini_access()
    except Exception as e:  # noqa: BLE001
        return True, f"Could not verify Gemini access: {e}"


def show_last_error() -> None:
    """Show (and keep) the last workflow error - st.rerun() would otherwise wipe it."""
    err = st.session_state.get("last_error")
    if err:
        st.error(f"**Something went wrong:** {err}")


# ── Mock Data Detection ─────────────────────────────────────────────


def check_for_mock_data(state: dict) -> bool:
    """Check if any paper titles start with [MOCK].

    Args:
        state: Current graph state.

    Returns:
        True if mock data detected.
    """
    papers = state.get("candidate_papers", [])
    for p in papers:
        if isinstance(p, dict) and p.get("title", "").startswith("[MOCK]"):
            return True
    return False


def show_mock_banner() -> None:
    """Display red mock data banner if mock data is present."""
    if st.session_state.get("has_mock_data", False):
        st.markdown(
            '<div class="mock-banner">⚠️ MOCK DATA — Results contain synthetic test data</div>',
            unsafe_allow_html=True,
        )


# ── Helper Functions ────────────────────────────────────────────────


def get_or_create_graph():
    """Get or create the compiled graph."""
    if st.session_state.graph is None:
        st.session_state.graph = get_compiled_graph()
    return st.session_state.graph


def run_graph(input_state: dict) -> dict | None:
    """Run the graph and handle interrupts.

    Args:
        input_state: Input state dictionary.

    Returns:
        Final state or None if interrupted.
    """
    graph = get_or_create_graph()
    config = st.session_state.config

    st.session_state.last_error = None
    try:
        return graph.invoke(input_state, config)
    except Exception as e:  # noqa: BLE001
        st.session_state.last_error = str(e)
        return None


def resume_graph(resume_value: dict) -> dict | None:
    """Resume the graph after a human approval checkpoint.

    Args:
        resume_value: The user's response to the interrupt.

    Returns:
        Updated state or None if error.
    """
    graph = get_or_create_graph()
    config = st.session_state.config

    st.session_state.last_error = None
    try:
        return graph.invoke(Command(resume=resume_value), config)
    except Exception as e:  # noqa: BLE001
        st.session_state.last_error = str(e)
        return None


def get_current_state() -> dict:
    """Get the current state from the graph checkpointer."""
    graph = get_or_create_graph()
    config = st.session_state.config
    if config is None:
        return {}
    try:
        state = graph.get_state(config)
        if state and state.values:
            return dict(state.values)
    except Exception:
        pass
    return {}


def detect_phase_from_state(state: dict) -> str:
    """Determine the current UI phase from graph state.

    Args:
        state: Current graph state.

    Returns:
        Phase string for the UI.
    """
    # Check for interrupts
    graph = get_or_create_graph()
    config = st.session_state.config
    try:
        gs = graph.get_state(config)
        if gs and gs.next:
            next_nodes = list(gs.next)
            if "human_approval_1" in next_nodes:
                return "approval_1"
            if "human_approval_2" in next_nodes:
                return "approval_2"
            if "needs_clarification" in next_nodes:
                return "clarification"
    except Exception:
        pass

    phase = state.get("phase", "input")
    if phase == "complete":
        return "complete"
    if phase == "error":
        return "error"
    return phase


# ── Sidebar ─────────────────────────────────────────────────────────


def render_sidebar() -> None:
    """Render the sidebar with settings and trace."""
    with st.sidebar:
        st.title("🔬 ResearchPilot")
        st.markdown("---")

        # Session info
        if st.session_state.thread_id:
            st.info(f"Session: `{st.session_state.thread_id[:8]}...`")

        # Current phase
        state = get_current_state()
        if state:
            phase = state.get("phase", "unknown")
            st.markdown(f"**Phase:** `{phase}`")

            # Errors
            errors = state.get("errors", [])
            if errors:
                st.error(f"{len(errors)} error(s) occurred")
                with st.expander("View errors"):
                    for err in errors:
                        st.warning(err)

        st.markdown("---")

        # Research Trace
        if st.session_state.thread_id:
            with st.expander("📋 Research Trace", expanded=False):
                events = load_trace(st.session_state.thread_id)
                if events:
                    for ev in events:
                        status_icon = {
                            "ok": "✅", "warning": "⚠️",
                            "error": "❌", "waiting": "⏳"
                        }.get(ev.status, "ℹ️")
                        st.markdown(
                            f"{status_icon} **{ev.agent}** — {ev.action}  \n"
                            f"<small>{ev.ts.strftime('%H:%M:%S')} | {ev.detail[:60]}</small>",
                            unsafe_allow_html=True,
                        )
                else:
                    st.caption("No events yet")

        # New session button
        st.markdown("---")
        if st.button("🔄 New Session", width="stretch"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()


# ── Main Pages ──────────────────────────────────────────────────────


def render_input_page() -> None:
    """Render the initial research question input page."""
    st.title("🔬 ResearchPilot")
    st.markdown("### AI-Powered Literature Survey Assistant")
    st.markdown(
        "Enter your research question and ResearchPilot will find papers, "
        "analyze them, identify gaps, and generate a literature survey."
    )

    ok, status_msg = gemini_status()
    if not ok:
        st.error(f"**Gemini is not configured correctly.** {status_msg}")
    show_last_error()

    with st.form("research_form"):
        question = st.text_area(
            "Research Question",
            placeholder="e.g., Find recent papers about detecting diseases in rice crops using computer vision and compare their approaches.",
            height=100,
        )

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            year_from = st.number_input("From Year", min_value=2000, max_value=2026, value=2020)
        with col2:
            year_to = st.number_input("To Year", min_value=2000, max_value=2026, value=2026)
        with col3:
            num_papers = st.number_input("Max Papers", min_value=3, max_value=30, value=15)
        with col4:
            citation_style = st.selectbox("Citation Style", ["IEEE", "APA", "ACM"])

        # PDF uploads
        uploaded_files = st.file_uploader(
            "Upload PDFs (optional)",
            type=["pdf"],
            accept_multiple_files=True,
            help="Upload your own paper PDFs to include in the analysis.",
        )

        submitted = st.form_submit_button("🚀 Start Research", width="stretch")

        if submitted and not ok:
            st.error("Fix the Gemini API key / model settings above, then restart the app.")
        elif submitted and question.strip():
            # Create new session
            thread_id = str(uuid.uuid4())
            st.session_state.thread_id = thread_id
            st.session_state.config = {"configurable": {"thread_id": thread_id}}

            # Save uploaded PDFs
            uploaded_pdfs = {}
            if uploaded_files:
                for f in uploaded_files:
                    save_path = UPLOADS_DIR / f"{thread_id}_{f.name}"
                    save_path.write_bytes(f.getvalue())
                    # Will be assigned proper paper_id later
                    uploaded_pdfs[f.name] = str(save_path)

            # Create initial state
            initial = create_initial_state(
                research_question=question,
                thread_id=thread_id,
                year_from=year_from,
                year_to=year_to,
                num_papers=num_papers,
                citation_style=citation_style,
            )
            if uploaded_pdfs:
                initial["uploaded_pdfs"] = uploaded_pdfs

            st.session_state.phase = "running"

            # Run the graph
            with st.spinner("🔍 Planning research and searching for papers..."):
                result = run_graph(initial)

            if result:
                st.session_state.state_snapshot = result
                st.session_state.has_mock_data = check_for_mock_data(result)
            st.rerun()

        elif submitted:
            st.warning("Please enter a research question.")


def render_clarification_page() -> None:
    """Render the clarification question page."""
    show_mock_banner()
    st.title("❓ Clarification Needed")
    show_last_error()

    state = get_current_state()
    graph = get_or_create_graph()
    config = st.session_state.config

    # Get the interrupt value
    gs = graph.get_state(config)
    interrupt_data = {}
    if gs and gs.tasks:
        for task in gs.tasks:
            if hasattr(task, "interrupts") and task.interrupts:
                interrupt_data = task.interrupts[0].value if task.interrupts else {}
                break

    question = interrupt_data.get("message", state.get("clarification_question", "Could you clarify your research question?"))

    st.info(f"🤔 {question}")

    with st.form("clarification_form"):
        answer = st.text_area("Your answer", height=100)
        submitted = st.form_submit_button("Submit", width="stretch")

        if submitted and answer.strip():
            with st.spinner("Processing..."):
                result = resume_graph({"answer": answer})
            if result:
                st.session_state.state_snapshot = result
                st.session_state.has_mock_data = check_for_mock_data(result)
            st.rerun()


def render_approval_1_page() -> None:
    """Render Checkpoint 1: paper approval page."""
    show_mock_banner()
    st.title("📋 Checkpoint 1: Select Papers")
    st.markdown("Review the candidate papers and select which ones to include in your analysis.")

    show_last_error()
    state = get_current_state()
    candidates = state.get("candidate_papers", [])

    if not candidates:
        st.warning("No candidate papers found. The search may have failed.")
        return

    # Display candidates with selection checkboxes
    selected_ids = []

    for paper in candidates:
        pid = paper.get("paper_id", "?")
        title = paper.get("title", "Unknown")
        authors = ", ".join(paper.get("authors", [])[:3])
        if len(paper.get("authors", [])) > 3:
            authors += " et al."
        year = paper.get("year", "N/A")
        venue = paper.get("venue", "N/A")
        relevance = paper.get("relevance_label", "N/A")
        score = paper.get("relevance_score")
        source = paper.get("source_api", "unknown")
        abstract = paper.get("abstract", "")

        # Relevance color
        rel_class = {
            "High": "relevance-high",
            "Medium": "relevance-medium",
            "Low": "relevance-low",
        }.get(relevance, "")

        col1, col2 = st.columns([0.05, 0.95])
        with col1:
            checked = st.checkbox(f"Select {pid}", value=(relevance in ["High", "Medium"]),
                                  key=f"check_{st.session_state.thread_id}_{pid}", label_visibility="collapsed")
        with col2:
            with st.expander(f"**[{pid}]** {title} ({year})"):
                st.markdown(f"**Authors:** {authors}")
                st.markdown(f"**Venue:** {venue}")
                st.markdown(
                    f'**Relevance:** <span class="{rel_class}">{relevance}</span>'
                    f" ({score:.3f})" if score else f"**Relevance:** {relevance}",
                    unsafe_allow_html=True,
                )
                st.markdown(f"**Source:** {source}")
                if abstract:
                    st.markdown(f"**Abstract:** {abstract[:300]}...")
                if paper.get("doi"):
                    st.markdown(f"**DOI:** [{paper['doi']}](https://doi.org/{paper['doi']})")

        if checked:
            selected_ids.append(pid)

    st.markdown("---")
    st.markdown(f"**Selected: {len(selected_ids)} / {len(candidates)} papers**")

    # File upload for additional PDFs
    st.markdown("### Upload Additional PDFs")
    additional_pdfs = st.file_uploader(
        "Upload PDFs for selected papers",
        type=["pdf"],
        accept_multiple_files=True,
        key="approval1_pdfs",
    )
    pdf_targets: dict[str, str] = {}
    if additional_pdfs:
        ids = [p.get("paper_id") for p in candidates]
        for f in additional_pdfs:
            pdf_targets[f.name] = st.selectbox(f"Which paper is **{f.name}**?", ids, key=f"pdf_target_{f.name}")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("✅ Approve Selection", width="stretch", type="primary"):
            if not selected_ids:
                st.warning("Please select at least one paper.")
            else:
                # Save additional PDFs
                uploaded_pdfs = dict(state.get("uploaded_pdfs", {}))   # keyed by paper_id
                if additional_pdfs:
                    for f in additional_pdfs:
                        tid = st.session_state.thread_id
                        save_path = UPLOADS_DIR / f"{tid}_{f.name}"
                        save_path.write_bytes(f.getvalue())
                        uploaded_pdfs[pdf_targets[f.name]] = str(save_path)
                        if pdf_targets[f.name] not in selected_ids:
                            selected_ids.append(pdf_targets[f.name])

                with st.spinner("🔄 Processing approved papers... This may take a few minutes."):
                    result = resume_graph({
                        "approved_paper_ids": selected_ids,
                        "uploaded_pdfs": uploaded_pdfs,
                    })

                if result:
                    st.session_state.state_snapshot = result
                st.rerun()

    with col2:
        if st.button("🔄 Search Again", width="stretch"):
            st.info("Please start a new session to search again.")


def render_approval_2_page() -> None:
    """Render Checkpoint 2: survey approval page."""
    show_mock_banner()
    st.title("📝 Checkpoint 2: Review Survey")

    show_last_error()
    state = get_current_state()
    survey_text = state.get("survey_draft", "")
    revision_count = state.get("survey_revision_count", 0)

    st.markdown(f"**Revision:** {revision_count} / 3")

    if survey_text:
        with st.expander("📄 Literature Survey Draft", expanded=True):
            st.markdown(survey_text)

    # Show comparison table if available
    comp = state.get("comparison", {})
    if comp and comp.get("rows"):
        with st.expander("📊 Comparison Table"):
            import pandas as pd
            df = pd.DataFrame(comp["rows"])
            st.dataframe(df, width="stretch")

    # Show gaps if available
    gaps = state.get("gaps", [])
    if gaps:
        with st.expander(f"🔍 Research Gaps ({len(gaps)})"):
            for gap in gaps:
                kind_emoji = "📌" if gap.get("kind") == "explicit" else "💡"
                conf = gap.get("confidence", "medium")
                st.markdown(
                    f"{kind_emoji} **{gap.get('gap_id', '?')}** [{gap.get('kind', '?')} | {conf}]  \n"
                    f"{gap.get('statement', '')}"
                )

    st.markdown("---")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("✅ Approve Survey", width="stretch", type="primary"):
            with st.spinner("📄 Generating final report..."):
                result = resume_graph({"approved": True, "feedback": ""})
            if result:
                st.session_state.state_snapshot = result
            st.rerun()

    with col2:
        feedback = st.text_area(
            "Feedback for revision (optional)",
            placeholder="e.g., Please focus more on deep learning approaches...",
        )
        if st.button("🔄 Request Revision", width="stretch"):
            if revision_count >= 3:
                st.warning("Maximum revisions reached. Proceeding with current draft.")
                with st.spinner("📄 Generating final report..."):
                    result = resume_graph({"approved": True, "feedback": ""})
            else:
                with st.spinner("✏️ Revising survey..."):
                    result = resume_graph({
                        "approved": False,
                        "feedback": feedback or "Please improve the survey.",
                    })
            if result:
                st.session_state.state_snapshot = result
            st.rerun()


def render_complete_page() -> None:
    """Render the final results page."""
    show_mock_banner()
    st.title("✅ Research Complete!")

    state = get_current_state()
    report = state.get("final_report", "")

    if report:
        # Download buttons
        col1, col2 = st.columns(2)
        with col1:
            st.download_button(
                "📥 Download Report (Markdown)",
                data=report,
                file_name=f"research_report_{st.session_state.thread_id[:8]}.md",
                mime="text/markdown",
                width="stretch",
            )
        with col2:
            # Check if DOCX exists
            docx_path = REPORTS_DIR / f"{st.session_state.thread_id}.docx"
            if docx_path.exists():
                st.download_button(
                    "📥 Download Report (DOCX)",
                    data=docx_path.read_bytes(),
                    file_name=f"research_report_{st.session_state.thread_id[:8]}.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    width="stretch",
                )

        # Display report
        st.markdown("---")
        with st.expander("📄 Full Report", expanded=True):
            st.markdown(report)

    # Show extraction results
    extracted = state.get("extracted", [])
    if extracted:
        with st.expander(f"📋 Extracted Papers ({len(extracted)})"):
            for ep in extracted:
                pid = ep.get("paper_id", "?")
                depth = ep.get("source_depth", "unknown")
                badge = ""
                if depth == "abstract_only":
                    badge = ' <span class="abstract-only-badge">Abstract Only</span>'

                st.markdown(f"### [{pid}]{badge}", unsafe_allow_html=True)
                fields = [
                    "problem", "objective", "dataset", "methodology",
                    "algorithms", "tools_frameworks", "experimental_setup",
                    "metrics", "results", "limitations", "future_work",
                ]
                for field_name in fields:
                    field = ep.get(field_name, {})
                    val = field.get("value", "N/A")
                    status = field.get("status", "not_reported")
                    icon = "✅" if status == "reported" else "❌"
                    st.markdown(f"  {icon} **{field_name}:** {val}")

    # Citation checks
    checks = state.get("citation_checks", [])
    if checks:
        with st.expander(f"🔗 Citation Verification ({len(checks)})"):
            for c in checks:
                status = c.get("status", "UNVERIFIED")
                badge_class = {
                    "VERIFIED": "verified-badge",
                    "PARTIAL": "partial-badge",
                    "UNVERIFIED": "unverified-badge",
                }.get(status, "unverified-badge")
                st.markdown(
                    f'**{c.get("paper_id", "?")}**: '
                    f'<span class="{badge_class}">{status}</span> — '
                    f'Title: {c.get("title_match", 0):.0f}%, '
                    f'Authors: {c.get("authors_match", 0):.0f}%',
                    unsafe_allow_html=True,
                )

    # Research trace
    if st.session_state.thread_id:
        with st.expander("📋 Full Research Trace"):
            events = load_trace(st.session_state.thread_id)
            if events:
                trace_md = format_trace_for_report(events)
                st.markdown(trace_md)


def render_error_page() -> None:
    """Render the error page."""
    st.title("❌ Error")
    state = get_current_state()
    errors = state.get("errors", [])
    for err in errors:
        st.error(err)
    show_last_error()
    if not errors and not st.session_state.get("last_error"):
        st.error("The workflow stopped unexpectedly. Open **Research Trace** in the sidebar for details.")
    if any("API key" in e or "model" in e.lower() for e in errors):
        st.info("This is a configuration problem: edit `src/.env` (GEMINI_API_KEY / GEMINI_MODEL), restart the app, then start over.")

    if st.button("🔄 Start Over", width="stretch"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()


def render_processing_page() -> None:
    """Render the processing/waiting page."""
    show_mock_banner()
    st.title("⏳ Processing...")

    state = get_current_state()
    phase = state.get("phase", "unknown")

    phase_descriptions = {
        "planning": "🧠 Analyzing research question and creating plan...",
        "search": "🔍 Searching for papers across multiple databases...",
        "extraction": "📄 Extracting structured information from papers...",
        "analysis": "🔬 Analyzing papers and generating summaries...",
        "comparison": "📊 Building comparison table...",
        "research_gap": "🔍 Identifying research gaps...",
        "citation_verification": "🔗 Verifying citations...",
        "survey": "📝 Writing literature survey...",
        "report": "📄 Assembling final report...",
    }

    description = phase_descriptions.get(phase, f"Processing phase: {phase}")
    st.info(description)

    with st.spinner(description):
        st.markdown("Please wait while ResearchPilot processes your request.")


# ── Main Application ────────────────────────────────────────────────


def main() -> None:
    """Main application entry point."""
    render_sidebar()

    # If no thread_id, show input page
    if st.session_state.thread_id is None:
        render_input_page()
        return

    # Get current state and determine phase
    state = get_current_state()
    if not state:
        render_input_page()
        return

    phase = detect_phase_from_state(state)

    # Route to appropriate page
    if phase == "clarification":
        render_clarification_page()
    elif phase == "approval_1":
        render_approval_1_page()
    elif phase == "approval_2":
        render_approval_2_page()
    elif phase == "complete":
        render_complete_page()
    elif phase == "error":
        render_error_page()
    else:
        render_processing_page()


if __name__ == "__main__":
    main()
