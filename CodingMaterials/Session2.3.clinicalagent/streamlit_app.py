import streamlit as st
import json
from clinical_chatbot import LlamaClinicalAgent

# Page Configuration
st.set_page_config(
    page_title="Clinical Decision-Support (CDS) Chatbot",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #0284c7;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    .badge-critical {
        background-color: #fee2e2;
        color: #b91c1c;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1px solid #f87171;
    }
    .badge-warning {
        background-color: #fef3c7;
        color: #b45309;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1px solid #fcd34d;
    }
    .badge-info {
        background-color: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        border: 1px solid #7dd3fc;
    }
    .clinical-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Agent
@st.cache_resource
def get_agent():
    return LlamaClinicalAgent()

agent = get_agent()

# Sidebar
with st.sidebar:
    st.image("https://img.icons8.com/color/96/caduceus.png", width=64)
    st.title("CDS Control Panel")
    
    # Ollama Status Check & Model Selector
    is_online = agent.is_ollama_online()
    if is_online:
        st.success("🟢 **Ollama Connected**")
        available_models = ["llama3.2:3b", "llama3.2:1b", "phi3:latest"]
        selected_model = st.selectbox("Select Model:", available_models, index=0)
        agent.model_name = selected_model
    else:
        st.error("🔴 **Ollama Offline**\nRun `ollama serve` in terminal")

    st.markdown("---")
    st.subheader("📋 Pre-Loaded Clinical Cases")
    
    sample_cases = {
        "Custom Case": "",
        "1. Suspected Pulmonary Embolism": (
            "Patient: 62-year-old female with acute severe shortness of breath, sudden pleuritic chest pain, "
            "and lightheadedness for 2 hours. Recent history: Right total knee arthroplasty 10 days ago. "
            "Vitals: BP 100/65 mmHg, HR 118 bpm, RR 26/min, SpO2 88% on room air. "
            "Exam: Right calf swollen and tender to palpation."
        ),
        "2. Acute Coronary Syndrome (ACS)": (
            "Patient: 55-year-old male presenting with heavy retrosternal pressure radiating to left arm, "
            "associated with diaphoresis and nausea for 45 minutes. History of hyperlipidemia and smoking. "
            "Vitals: BP 160/95, HR 92, SpO2 97% on room air. Current meds: Atorvastatin."
        ),
        "3. Sepsis Alert / Pyelonephritis": (
            "Patient: 74-year-old female presenting with acute confusion, rigors, right flank pain, and dysuria. "
            "Vitals: Temp 38.9°C (102.0°F), BP 88/54 mmHg, HR 122 bpm, RR 24/min. "
            "History: Recurrent UTIs, Chronic Kidney Disease Stage 3."
        )
    }

    selected_sample = st.selectbox("Select a benchmark case:", list(sample_cases.keys()))
    
    st.markdown("---")
    st.markdown("""
    **Evidence Tiering:**
    - 🏛️ Tier 1: WHO, CDC, NICE, ICMR, FDA
    - 📑 Tier 2: Systematic Reviews & Meta-Analyses
    - 🔬 Tier 3: Peer-Reviewed Clinical Studies
    """)

# Main Header
st.markdown('<div class="main-header">🩺 Clinical Decision-Support (CDS) Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Evidence-grounded, safety-first clinical reasoning assistant powered by local Llama</div>', unsafe_allow_html=True)

# Pre-populate text if sample case selected
default_text = sample_cases.get(selected_sample, "")

# Input Form
with st.form("clinical_case_form"):
    user_case_input = st.text_area(
        "Enter Patient Demographics, Vitals, Symptoms, Lab/Imaging Notes:",
        value=default_text,
        height=140,
        placeholder="e.g. 62yo female with sudden shortness of breath and right leg swelling after surgery..."
    )
    submit_button = st.form_submit_button("🔍 Run CDS Clinical Analysis", use_container_width=True)

# Execution & Display
if submit_button:
    if not user_case_input.strip():
        st.warning("Please enter patient clinical information to analyze.")
    else:
        with st.spinner(f"Analyzing clinical case through safety protocols using {agent.model_name}..."):
            result = agent.process(user_case_input)

        if "error" in result and not result.get("possible_conditions"):
            st.error(f"**Error:** {result.get('error')}")
            if "solution" in result:
                st.info(f"💡 {result.get('solution')}")
        else:
            # Display Results in Tabs
            tabs = st.tabs([
                "📊 Overview & Triage",
                "🧬 Differential Diagnosis",
                "🧪 Diagnostic Plan & Rx",
                "⚠️ Safety Flags & Gaps",
                "📚 Guidelines & Citations",
                "💻 Raw JSON Contract"
            ])

            # Tab 1: Overview & Triage
            with tabs[0]:
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.subheader("Clinical Summary")
                    summary = result.get("clinical_summary", {})
                    if isinstance(summary, dict):
                        st.markdown(f"**Timeline:** {summary.get('timeline', 'N/A')}")
                        st.markdown("**Key Clinical Findings:**")
                        for finding in summary.get("key_findings", []):
                            st.markdown(f"- {finding}")
                    else:
                        st.write(summary)

                with col2:
                    st.subheader("Triage Review")
                    review = result.get("clinician_review", {})
                    if isinstance(review, dict):
                        is_req = review.get("clinician_review_required", True)
                        if is_req:
                            st.markdown('<span class="badge-critical">🚨 Clinician Review Required</span>', unsafe_allow_html=True)
                        else:
                            st.markdown('<span class="badge-info">ℹ️ Routine Review</span>', unsafe_allow_html=True)
                        st.markdown("<br>", unsafe_allow_html=True)
                        for r in review.get("reasons", []):
                            st.markdown(f"- ⚠️ {r}")

            # Tab 2: Differential Diagnosis
            with tabs[1]:
                st.subheader("Ranked Differential Diagnoses")
                conditions = result.get("possible_conditions", [])
                if isinstance(conditions, list):
                    for idx, cond in enumerate(conditions):
                        if isinstance(cond, dict):
                            name = cond.get("condition", f"Condition #{idx+1}")
                            rank = cond.get("rank", idx + 1)
                            confidence = cond.get("confidence", 0.0)
                            
                            st.markdown(f"### #{rank} {name}")
                            st.progress(float(confidence) if isinstance(confidence, (int, float)) else 0.5)
                            st.caption(f"Confidence Score: {confidence}")

                            col_sup, col_contra = st.columns(2)
                            with col_sup:
                                st.markdown("✅ **Supporting Evidence:**")
                                for item in cond.get("supporting_evidence", []):
                                    st.markdown(f"- {item}")
                            with col_contra:
                                st.markdown("❌ **Contradicting Evidence:**")
                                contra = cond.get("contradicting_evidence", [])
                                if contra:
                                    for item in contra:
                                        st.markdown(f"- {item}")
                                else:
                                    st.markdown("*(None identified)*")
                            st.markdown("---")
                        else:
                            st.markdown(f"- **{cond}**")

            # Tab 3: Diagnostic Plan & Rx
            with tabs[2]:
                col_tests, col_rx = st.columns(2)
                with col_tests:
                    st.subheader("🧪 Recommended Diagnostic Tests")
                    tests = result.get("recommended_tests", [])
                    for test in tests:
                        if isinstance(test, dict):
                            st.markdown(f"**• {test.get('test_name', 'Test')}**")
                            st.caption(f"**Rationale:** {test.get('rationale', test.get('test_description', ''))}")
                            if test.get("guideline_support"):
                                st.caption(f"**Guideline:** {test.get('guideline_support')}")
                        else:
                            st.markdown(f"- {test}")

                with col_rx:
                    st.subheader("💊 Management & Guidelines")
                    treatments = result.get("treatment_guidelines", [])
                    for rx in treatments:
                        if isinstance(rx, dict):
                            st.markdown(f"**• {rx.get('consideration', rx.get('condition', 'Management consideration'))}**")
                            if rx.get("treatment"):
                                st.markdown(f"*{rx.get('treatment')}*")
                            if rx.get("guideline_source"):
                                st.caption(f"**Source:** {rx.get('guideline_source')}")
                            if rx.get("contraindications"):
                                st.markdown(f"⛔ **Contraindications:** {', '.join(rx.get('contraindications'))}")
                        else:
                            st.markdown(f"- {rx}")

            # Tab 4: Safety Flags & Gaps
            with tabs[3]:
                col_flags, col_miss = st.columns(2)
                with col_flags:
                    st.subheader("🚨 Safety Flags")
                    flags = result.get("safety_flags", [])
                    if flags:
                        for flag in flags:
                            if isinstance(flag, dict):
                                sev = flag.get("severity", "WARNING").upper()
                                badge_class = "badge-critical" if sev == "CRITICAL" else "badge-warning"
                                st.markdown(f'<span class="{badge_class}">{sev}</span> **{flag.get("flag", "")}**', unsafe_allow_html=True)
                                st.markdown(f"👉 **Action:** {flag.get('recommended_action', 'Clinician assessment')}")
                                st.markdown("<br>", unsafe_allow_html=True)
                            else:
                                st.warning(flag)
                    else:
                        st.success("No immediate critical safety flags detected.")

                with col_miss:
                    st.subheader("❓ Missing / Critical Gaps")
                    missing = result.get("missing_information", [])
                    if missing:
                        for item in missing:
                            if isinstance(item, dict):
                                st.markdown(f"- **{item.get('information_type', 'Info')}:** {item.get('value', 'Unknown')}")
                            else:
                                st.markdown(f"- {item}")
                    else:
                        st.info("No critical missing data flagged.")

            # Tab 5: Guidelines & Citations
            with tabs[4]:
                st.subheader("📚 Authoritative Citations")
                citations = result.get("citations", [])
                if citations:
                    for cit in citations:
                        if isinstance(cit, dict):
                            org = cit.get("organization", "Guideline")
                            title = cit.get("title", "")
                            year = cit.get("year", "")
                            url = cit.get("doi_or_url", "")
                            status = cit.get("citation_status", "VERIFIED")
                            st.markdown(f"**[{org}]** {title} ({year}) — *{status}*")
                            if url:
                                st.markdown(f"🔗 [Reference Link]({url})")
                        else:
                            st.markdown(f"- 🔗 {cit}")
                else:
                    st.write("No specific citations returned.")

            # Tab 6: Raw JSON
            with tabs[5]:
                st.subheader("Raw Output Contract (JSON)")
                st.json(result)
