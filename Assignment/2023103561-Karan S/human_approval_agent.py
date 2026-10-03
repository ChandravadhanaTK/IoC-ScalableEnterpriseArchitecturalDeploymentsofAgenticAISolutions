"""
Human Approval Agent

Handles the final human review stage before the action plan
is considered authorized for deployment.
"""


def human_approval_agent(state: dict) -> dict:

    trace = state.get("trace", [])

    # Read exactly what came from the UI / previous state
    raw_status = state.get("approval_status", "pending")

    print("\n========== HUMAN APPROVAL DEBUG ==========")
    print("RAW APPROVAL STATUS:", repr(raw_status))
    print("RAW REVIEW COMMENTS:", repr(state.get("review_comments", "")))

    approval_status = str(raw_status).strip().lower()

    # Validate approval status
    if approval_status not in {
        "pending",
        "approved",
        "rejected",
    }:
        approval_status = "pending"

    review_comments = str(
        state.get("review_comments", "")
    ).strip()

    # Approval is granted ONLY when explicitly approved
    approval_granted = approval_status == "approved"

    # Human approval is always required
    human_approval_required = True

    # Build approval note
    if approval_status == "approved":

        approval_note = (
            "Human approval granted. "
            "The plan is authorized for deployment."
        )

    elif approval_status == "rejected":

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

    else:

        approval_note = (
            "Human approval is pending. "
            "The plan is not authorized for deployment."
        )

    trace.append(
        f"Human Approval Agent: "
        f"status={approval_status}, "
        f"granted={approval_granted}"
    )

    print("FINAL APPROVAL STATUS:", approval_status)
    print("APPROVAL GRANTED:", approval_granted)
    print("==========================================\n")

    return {
        "approval_status": approval_status,
        "approval_granted": approval_granted,
        "human_approval_required": human_approval_required,
        "approval_note": approval_note,
        "review_comments": review_comments,
        "trace": trace,
    }
