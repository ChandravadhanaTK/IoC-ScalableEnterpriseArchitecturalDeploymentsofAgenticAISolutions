
"""
app.py
======

Streamlit UI for the Smart Emergency Incident Response System.

The incident pipeline runs when the user clicks "Generate Plan".
Human approval is handled separately after the plan is generated.

Run:
    python -m streamlit run app.py
"""

import streamlit as st
from datetime import datetime
import csv
import io
import time


# =========================================================
# Page configuration
# =========================================================

st.set_page_config(
    page_title="Emergency Incident Response System",
    layout="centered",
    initial_sidebar_state="expanded",
)


# =========================================================
# Imports
# =========================================================

from graph import run_incident_pipeline


# =========================================================
# Session State
# =========================================================

if "run_history" not in st.session_state:
    st.session_state["run_history"] = []

if "result" not in st.session_state:
    st.session_state["result"] = None

if "report_text" not in st.session_state:
    st.session_state["report_text"] = ""

if "approval_status" not in st.session_state:
    st.session_state["approval_status"] = "pending"

if "review_comments" not in st.session_state:
    st.session_state["review_comments"] = ""


# =========================================================
# Constants
# =========================================================

example_report = (
    "A large fire broke out on the third floor of a residential building "
    "downtown. About 8 people are trapped in their apartments and can't "
    "get out. Heavy smoke is spreading."
)


# =========================================================
# Helper: Build updated action plan
# =========================================================

def update_action_plan(result: dict) -> dict:
    """
    Update the final action plan using the current human approval state.

    Important:
    This does NOT rerun the LLM/RAG/agent pipeline.
    It only updates the human-review portion of the existing result.
    """

    approval_status = str(
        result.get("approval_status", "pending")
    ).strip().lower()

    review_comments = str(
        result.get("review_comments", "")
    ).strip()

    # -----------------------------------------------------
    # Validate approval status
    # -----------------------------------------------------

    if approval_status not in {
        "pending",
        "approved",
        "rejected",
    }:
        approval_status = "pending"

    # -----------------------------------------------------
    # Approval logic
    # -----------------------------------------------------

    if approval_status == "approved":

        approval_granted = True

        approval_note = (
            "Human approval granted. "
            "The plan is authorized for deployment."
        )

        status_icon = "🟢"

        authorization_status = (
            "AUTHORIZED for deployment."
        )

    elif approval_status == "rejected":

        approval_granted = False

        if review_comments:

            approval_note = (
                "Human approval rejected. "
                "Review comments were provided."
            )

        else:

            approval_note = (
                "Human approval rejected; "
                "review comments are required."
            )

        status_icon = "🔴"

        authorization_status = (
            "NOT AUTHORIZED. Human approval was rejected."
        )

    else:

        approval_granted = False

        approval_note = (
            "Human approval is pending. "
            "The plan is not authorized for deployment."
        )

        status_icon = "🟡"

        authorization_status = (
            "NOT AUTHORIZED until human approval is granted."
        )

    # -----------------------------------------------------
    # Safety / evidence status
    # -----------------------------------------------------

    safety_ok = bool(
        result.get("safety_ok", False)
    )

    evidence_ok = bool(
        result.get("evidence_check_ok", False)
    )

    # -----------------------------------------------------
    # Safety-aware authorization
    #
    # Approved alone does not override failed safety/evidence.
    # -----------------------------------------------------

    if approval_status == "approved":

        if not safety_ok or not evidence_ok:

            approval_granted = False

            status_icon = "🔴"

            authorization_status = (
                "NOT AUTHORIZED because safety or evidence "
                "validation did not pass."
            )

            approval_note = (
                "Human approval was provided, but the plan "
                "cannot be authorized because safety/evidence "
                "validation did not pass."
            )

    # -----------------------------------------------------
    # Build final action plan
    # -----------------------------------------------------

    plan = f"""
{status_icon} Incident Action Plan
{'=' * 40}

Location: {result.get('location')}
Incident type: {result.get('incident_type')}
Severity: {result.get('severity')}
People at risk: {result.get('people_at_risk')}

Dispatched resources: {result.get('resources')}

Executive decision:
{result.get('decision')}

Safety check status:
{result.get('safety_notes')}

Evidence verification:
{result.get('evidence_summary')}

Unsupported claims:
{result.get('unsupported_claims') or 'None detected.'}

Evidence note:
{result.get('evidence_notes')}

Human approval status:
{approval_status}

Approval note:
{approval_note}

Review comments:
{review_comments or 'No comments provided.'}

Authorization:
{authorization_status}
""".strip()

    # -----------------------------------------------------
    # Update result
    # -----------------------------------------------------

    result["approval_status"] = approval_status
    result["approval_granted"] = approval_granted
    result["human_approval_required"] = True
    result["approval_note"] = approval_note
    result["review_comments"] = review_comments
    result["action_plan"] = plan

    return result


# =========================================================
# UI Header
# =========================================================

st.title(
    "Smart Emergency Incident Response System"
)

st.caption(
    "Multi-Agent workflow with RAG, safety validation, "
    "evidence verification, and human approval"
)

st.markdown("---")

st.markdown(
    "This system converts an emergency incident report into "
    "a structured response plan while keeping human authorization "
    "as a separate review step."
)


# =========================================================
# How to use
# =========================================================

with st.expander(
    "How to use",
    expanded=True,
):

    st.markdown(
        """
1. Enter an incident report.
2. Click **Generate Plan**.
3. Review the generated plan.
4. Change the human approval status.
5. Click **Apply Review**.
6. The approval status and final authorization update without rerunning the agents.
"""
    )


# =========================================================
# Incident Report
# =========================================================

st.subheader(
    "Incident Report"
)

report_text = st.text_area(
    "Paste the incident report",
    value=st.session_state["report_text"],
    placeholder=example_report,
    height=180,
)

st.session_state["report_text"] = report_text


# =========================================================
# Sidebar - Human Review
# =========================================================

with st.sidebar:

    st.title("Human Review")

    st.markdown(
        "Review the generated plan before deployment."
    )

    approval_status = st.radio(
        "Approval status",
        options=[
            "pending",
            "approved",
            "rejected",
        ],
        index=[
            "pending",
            "approved",
            "rejected",
        ].index(
            st.session_state["approval_status"]
        ),
        key="approval_selector",
        help=(
            "approved = fully supported and safe, "
            "rejected = issue found, "
            "pending = further review required."
        ),
    )

    review_comments = st.text_area(
        "Review comments",
        value=st.session_state["review_comments"],
        placeholder=(
            "Add review notes. "
            "Comments are required when rejecting a plan."
        ),
        height=140,
        key="review_comments_input",
    )

    st.divider()

    st.markdown("### Approval rules")

    st.markdown(
        """
- `approved` only if the plan is fully supported and safe.
- `rejected` should include a comment explaining the issue.
- `pending` means the plan needs further review.
"""
    )

    st.divider()

    st.metric(
        "Review runs",
        len(st.session_state["run_history"]),
    )

    if st.button(
        "Clear review history",
        use_container_width=True,
    ):

        st.session_state["run_history"] = []

        st.success(
            "Review history cleared."
        )

        st.rerun()


# =========================================================
# Main Controls
# =========================================================

col1, col2 = st.columns(2)


with col1:

    generate_button = st.button(
        "Generate Plan",
        type="primary",
        use_container_width=True,
    )


with col2:

    example_button = st.button(
        "Use Example",
        use_container_width=True,
    )


# =========================================================
# Example button
# =========================================================

if example_button:

    st.session_state["report_text"] = example_report

    st.rerun()


# =========================================================
# Generate Pipeline
# =========================================================

if generate_button:

    if not report_text.strip():

        st.warning(
            "Please enter an incident report first."
        )

    else:

        progress = st.progress(0)

        status_text = st.empty()

        try:

            # -------------------------------------------------
            # Progress UI
            # -------------------------------------------------

            for pct, message in [
                (10, "Analyzing incident report..."),
                (35, "Running Map, RAG, and Resource agents..."),
                (60, "Generating and validating decision..."),
                (85, "Running safety and evidence verification..."),
            ]:

                status_text.text(message)

                progress.progress(pct)

                time.sleep(0.15)

            # -------------------------------------------------
            # IMPORTANT:
            # Generate the plan initially as PENDING.
            #
            # Human approval happens AFTER generation.
            # -------------------------------------------------

            result = run_incident_pipeline(
                report_text,
                approval_status="pending",
                review_comments="",
            )

            # -------------------------------------------------
            # Save result
            # -------------------------------------------------

            result = update_action_plan(result)

            st.session_state["result"] = result

            st.session_state["approval_status"] = "pending"

            st.session_state["review_comments"] = ""

            progress.progress(100)

            status_text.text(
                "Plan generation complete."
            )

            st.success(
                "Action plan generated. Human review is now required."
            )

        except Exception as e:

            st.error(
                f"An error occurred during execution: {e}"
            )

            st.stop()


# =========================================================
# Apply Human Review
# =========================================================

apply_review_button = st.button(
    "Apply Review",
    type="primary",
    use_container_width=True,
    disabled=(
        st.session_state["result"] is None
    ),
)


if apply_review_button:

    result = st.session_state["result"]

    selected_status = approval_status

    selected_comments = review_comments.strip()

    # -----------------------------------------------------
    # Rejected requires a comment
    # -----------------------------------------------------

    if (
        selected_status == "rejected"
        and not selected_comments
    ):

        st.error(
            "Rejected plans must include review comments explaining the issue."
        )

    else:

        # -------------------------------------------------
        # Update only human-review fields.
        # The agent pipeline is NOT rerun.
        # -------------------------------------------------

        result["approval_status"] = selected_status

        result["review_comments"] = selected_comments

        result = update_action_plan(
            result
        )

        st.session_state["result"] = result

        st.session_state["approval_status"] = selected_status

        st.session_state["review_comments"] = selected_comments

        # -------------------------------------------------
        # Add review history
        # -------------------------------------------------

        st.session_state["run_history"].insert(
            0,
            {
                "timestamp": datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "location": result.get(
                    "location"
                ),
                "incident_type": result.get(
                    "incident_type"
                ),
                "severity": result.get(
                    "severity"
                ),
                "people_at_risk": result.get(
                    "people_at_risk"
                ),
                "safety_ok": result.get(
                    "safety_ok"
                ),
                "evidence_ok": result.get(
                    "evidence_check_ok"
                ),
                "approval_status": result.get(
                    "approval_status"
                ),
                "review_comments": result.get(
                    "review_comments"
                ),
            },
        )

        if selected_status == "approved":

            if result.get("approval_granted"):

                st.success(
                    "Human approval granted. "
                    "The plan is authorized for deployment."
                )

            else:

                st.error(
                    "Approval was selected, but the plan is NOT authorized "
                    "because safety or evidence validation did not pass."
                )

        elif selected_status == "rejected":

            st.error(
                "Human approval rejected."
            )

        else:

            st.warning(
                "Human approval is pending. "
                "The plan is not authorized for deployment."
            )


# =========================================================
# Display Current Result
# =========================================================

result = st.session_state["result"]


if result is not None:

    # -----------------------------------------------------
    # Current status
    # -----------------------------------------------------

    safety_ok = bool(
        result.get(
            "safety_ok",
            False,
        )
    )

    evidence_ok = bool(
        result.get(
            "evidence_check_ok",
            False,
        )
    )

    current_approval = result.get(
        "approval_status",
        "pending",
    )

    approval_granted = bool(
        result.get(
            "approval_granted",
            False,
        )
    )

    # -----------------------------------------------------
    # Status metrics
    # -----------------------------------------------------

    col1, col2, col3 = st.columns(3)

    with col1:

        st.metric(
            "Safety Check",
            "Passed" if safety_ok else "Failed",
        )

    with col2:

        st.metric(
            "Evidence Check",
            "Supported" if evidence_ok else "Unsupported",
        )

    with col3:

        st.metric(
            "Approval",
            current_approval.capitalize(),
        )

    # -----------------------------------------------------
    # Authorization banner
    # -----------------------------------------------------

    if (
        current_approval == "approved"
        and approval_granted
    ):

        st.success(
            "🟢 AUTHORIZED FOR DEPLOYMENT"
        )

    elif current_approval == "rejected":

        st.error(
            "🔴 NOT AUTHORIZED — PLAN REJECTED"
        )

    else:

        st.warning(
            "🟡 NOT AUTHORIZED — HUMAN REVIEW PENDING"
        )

    # =====================================================
    # Tabs
    # =====================================================

    plan_tab, verification_tab, history_tab = st.tabs(
        [
            "Plan",
            "Verification",
            "History",
        ]
    )

    # =====================================================
    # PLAN TAB
    # =====================================================

    with plan_tab:

        st.subheader(
            "Final Action Plan"
        )

        st.code(
            result.get(
                "action_plan",
                "No plan generated.",
            ),
            language=None,
        )

        st.download_button(
            "Download Action Plan",
            data=result.get(
                "action_plan",
                "",
            ),
            file_name=(
                "action_plan_"
                + datetime.now().strftime(
                    "%Y%m%d_%H%M%S"
                )
                + ".txt"
            ),
            mime="text/plain",
            use_container_width=True,
        )

    # =====================================================
    # VERIFICATION TAB
    # =====================================================

    with verification_tab:

        st.subheader(
            "Verification Summary"
        )

        st.info(
            result.get(
                "evidence_summary",
                "No evidence summary available.",
            )
        )

        unsupported_claims = result.get(
            "unsupported_claims"
        )

        if unsupported_claims:

            st.warning(
                f"Unsupported claims: {unsupported_claims}"
            )

        st.markdown(
            f"""
**Location:** {result.get('location')}

**Incident type:** {result.get('incident_type')}

**Severity:** {result.get('severity')}

**People at risk:** {result.get('people_at_risk')}
"""
        )

        st.markdown(
            "### Resources"
        )

        st.json(
            result.get(
                "resources"
            )
        )

        st.markdown(
            "### Human Review"
        )

        st.write(
            f"**Status:** {result.get('approval_status')}"
        )

        st.write(
            f"**Approval granted:** {result.get('approval_granted')}"
        )

        st.write(
            f"**Approval note:** {result.get('approval_note')}"
        )

        st.write(
            f"**Comments:** "
            f"{result.get('review_comments') or 'No comments provided.'}"
        )

        # -------------------------------------------------
        # Trace
        # -------------------------------------------------

        with st.expander(
            "Agent Execution Trace",
            expanded=False,
        ):

            for step in result.get(
                "trace",
                [],
            ):

                st.write(step)

        # -------------------------------------------------
        # Additional details
        # -------------------------------------------------

        with st.expander(
            "Additional Details",
            expanded=False,
        ):

            st.json(
                {
                    "location": result.get(
                        "location"
                    ),
                    "incident_type": result.get(
                        "incident_type"
                    ),
                    "severity": result.get(
                        "severity"
                    ),
                    "people_at_risk": result.get(
                        "people_at_risk"
                    ),
                    "map_info": result.get(
                        "map_info"
                    ),
                    "resources": result.get(
                        "resources"
                    ),
                    "safety_ok": result.get(
                        "safety_ok"
                    ),
                    "evidence_check_ok": result.get(
                        "evidence_check_ok"
                    ),
                    "evidence_summary": result.get(
                        "evidence_summary"
                    ),
                    "unsupported_claims": result.get(
                        "unsupported_claims"
                    ),
                    "approval_status": result.get(
                        "approval_status"
                    ),
                    "approval_granted": result.get(
                        "approval_granted"
                    ),
                    "approval_note": result.get(
                        "approval_note"
                    ),
                    "review_comments": result.get(
                        "review_comments"
                    ),
                }
            )

    # =====================================================
    # HISTORY TAB
    # =====================================================

    with history_tab:

        st.subheader(
            "Review History"
        )

        history = st.session_state[
            "run_history"
        ]

        if history:

            st.dataframe(
                history[:10],
                use_container_width=True,
            )

            # -------------------------------------------------
            # CSV export
            # -------------------------------------------------

            output = io.StringIO()

            if history:

                writer = csv.DictWriter(
                    output,
                    fieldnames=[
                        "timestamp",
                        "location",
                        "incident_type",
                        "severity",
                        "people_at_risk",
                        "safety_ok",
                        "evidence_ok",
                        "approval_status",
                        "review_comments",
                    ],
                )

                writer.writeheader()

                writer.writerows(
                    history
                )

            st.download_button(
                "Download Review History",
                data=output.getvalue(),
                file_name=(
                    "review_history_"
                    + datetime.now().strftime(
                        "%Y%m%d_%H%M%S"
                    )
                    + ".csv"
                ),
                mime="text/csv",
                use_container_width=True,
            )

        else:

            st.info(
                "No review history yet."
            )


# =========================================================
# Footer
# =========================================================

st.markdown("---")

st.caption(
    "Incident Agent → Map Agent + Knowledge RAG + Resource Agent "
    "→ Decision → Safety Checker → Evidence Verifier "
    "→ Human Approval → Action Plan"
)
