import os
from datetime import datetime, timedelta

import streamlit as st
from supabase import create_client

from agent import agent_response
from tools import (
    complete_task,
    create_task,
    get_all_data,
    build_focus_sprint,
    get_pending_assignments,
    get_placement_deadlines,
    get_student,
    get_study_progress,
    get_tasks,
    get_today_schedule,
    get_upcoming_exams,
    set_current_store,
    add_record,
    update_record,
    delete_record,
)

st.set_page_config(page_title="Campus Copilot", page_icon="🎓", layout="wide")


def apply_theme():
    st.markdown(
        """
        <style>
        :root {
            --bg: #080808;
            --card: #121212;
            --card-alt: #1a1a1a;
            --primary: #8BC000;
            --text: #FFFFFF;
            --secondary: #A0A0A0;
            --border: rgba(139, 192, 0, 0.24);
        }
        .stApp {
            background: var(--bg);
            color: var(--text);
        }
        [data-testid="stSidebar"] {
            background: #0f0f0f;
            border-right: 1px solid var(--border);
        }
        .main .block-container {
            padding-top: 1.5rem;
            padding-bottom: 3rem;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1rem 1.05rem;
            margin-bottom: 1rem;
            box-shadow: 0 10px 20px rgba(0,0,0,0.08);
        }
        .kpi-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1rem 1.1rem;
            min-height: 120px;
        }
        .kpi-label {
            color: var(--secondary);
            font-size: 0.82rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .kpi-value {
            color: var(--primary);
            font-size: 2rem;
            font-weight: 700;
            margin-top: 0.5rem;
        }
        .badge {
            display: inline-block;
            padding: 0.35rem 0.65rem;
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 700;
        }
        .priority-high { background: rgba(255, 99, 71, 0.15); color: #ff8c7a; }
        .priority-medium { background: rgba(255, 190, 92, 0.15); color: #f9d46b; }
        .priority-low { background: rgba(139, 192, 0, 0.15); color: var(--primary); }
        .status-pending { background: rgba(255, 190, 92, 0.15); color: #f9d46b; }
        .status-in_progress { background: rgba(64, 128, 255, 0.15); color: #7bb3ff; }
        .status-completed { background: rgba(139, 192, 0, 0.15); color: var(--primary); }
        h1, h2, h3, h4, p, label {
            color: var(--text);
        }
        .small-muted {
            color: var(--secondary);
            font-size: 0.8rem;
        }
        .section-title {
            margin-top: 1rem;
            margin-bottom: 0.75rem;
            font-size: 1.2rem;
            font-weight: 700;
        }
        .stButton > button {
            background: var(--primary);
            color: #0f0f0f !important;
            border-radius: 10px;
            border: none;
            font-weight: 700;
        }
        .stButton > button p {
            color: inherit !important;
        }
        [data-testid="stFormSubmitButton"] > button {
            background: var(--primary) !important;
            color: #101010 !important;
            border: 1px solid var(--primary) !important;
            opacity: 1 !important;
        }
        [data-testid="stFormSubmitButton"] > button p {
            color: #101010 !important;
        }
        [data-testid="stFormSubmitButton"] > button:hover,
        [data-testid="stFormSubmitButton"] > button:focus {
            background: #a3d51b !important;
            color: #101010 !important;
            border-color: #a3d51b !important;
        }
        .stChatMessage {
            background: transparent;
            max-width: 880px;
        }
        .stDataFrame {
            background: var(--card);
        }
        .stTabs [role="tablist"] {
            gap: 0.5rem;
        }
        .stTabs [role="tab"] {
            color: var(--secondary);
        }
        .stTabs [role="tab"][aria-selected="true"] {
            color: var(--primary);
            border-bottom: 2px solid var(--primary);
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


apply_theme()


def app_config(name):
    try:
        value = st.secrets.get(name)
        if value:
            return str(value)
    except Exception:
        pass
    return os.getenv(name)


def configured_supabase():
    url = app_config("SUPABASE_URL")
    anon_key = app_config("SUPABASE_ANON_KEY")
    if not url or not anon_key:
        return None
    return create_client(url, anon_key)


def authenticated_client(access_token):
    client = configured_supabase()
    if not client:
        return None
    client.postgrest.auth(access_token)
    return client


def sign_out_supabase(auth_session):
    client = configured_supabase()
    if not client:
        return
    client.auth.set_session(auth_session.get("access_token", ""), auth_session.get("refresh_token", ""))
    client.auth.sign_out()


def clear_user_session_state():
    set_current_store(None)
    widget_keys = {"navigation", "student_signout", "capstone_signout", "open_capstone_showcase"}
    for key in list(st.session_state.keys()):
        if key not in widget_keys:
            del st.session_state[key]


def render_auth_page():
    client = configured_supabase()
    st.markdown("<div style='max-width:560px;margin:8vh auto 0;'>", unsafe_allow_html=True)
    st.title("🎓 CAMPUS COPILOT")
    st.caption("Your intelligent campus companion")
    if not client:
        st.error("Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to `.streamlit/secrets.toml`.")
        st.markdown("Apply the schema in `supabase/schema.sql` to your Supabase project, then restart the app.")
        st.markdown("</div>", unsafe_allow_html=True)
        return

    requested_auth_mode = st.session_state.pop("requested_auth_mode", None)
    if requested_auth_mode in {"Sign In", "Create Account"}:
        st.session_state.auth_mode_widget = requested_auth_mode
    mode = st.radio("Account", ["Sign In", "Create Account"], key="auth_mode_widget", horizontal=True, label_visibility="collapsed")
    auth_notice = st.session_state.pop("auth_notice", None)
    if auth_notice:
        st.info(auth_notice)
    if mode == "Sign In":
        with st.form("signin_form"):
            email = st.text_input("Email", key="signin_email")
            password = st.text_input("Password", type="password", key="signin_password")
            submitted = st.form_submit_button("Sign In", width="stretch")
        if submitted:
            try:
                response = client.auth.sign_in_with_password({"email": email.strip(), "password": password})
                session = response.session
                user = response.user
                if session and user:
                    st.session_state.auth_session = {
                        "access_token": session.access_token,
                        "refresh_token": session.refresh_token,
                        "user_id": str(user.id),
                        "email": user.email,
                    }
                    st.rerun()
            except Exception as exc:
                st.error(f"Sign in failed: {exc}")
        st.caption("Don't have an account?")
        if st.button("Create Account", key="switch_signup"):
            st.session_state.requested_auth_mode = "Create Account"
            st.rerun()
    else:
        with st.form("signup_form"):
            full_name = st.text_input("Full Name")
            email = st.text_input("Email", key="signup_email")
            password = st.text_input("Password", type="password", key="signup_password")
            course = st.text_input("Course")
            semester = st.number_input("Semester", min_value=1, max_value=20, value=1, step=1)
            submitted = st.form_submit_button("Create Account", width="stretch")
        if submitted:
            if not full_name.strip() or not email.strip() or not password or not course.strip():
                st.error("Please complete all fields.")
            else:
                try:
                    response = client.auth.sign_up({
                        "email": email.strip(),
                        "password": password,
                        "options": {"data": {
                            "full_name": full_name.strip(),
                            "course": course.strip(),
                            "semester": int(semester),
                        }},
                    })
                    if response.session and response.user:
                        st.session_state.auth_session = {
                            "access_token": response.session.access_token,
                            "refresh_token": response.session.refresh_token,
                            "user_id": str(response.user.id),
                            "email": response.user.email,
                        }
                        st.rerun()
                    st.session_state.auth_notice = "Account created. Check your email to confirm your address, then sign in."
                    st.session_state.requested_auth_mode = "Sign In"
                    st.rerun()
                except Exception as exc:
                    st.error(f"Account creation failed: {exc}")
    st.markdown("</div>", unsafe_allow_html=True)


def render_first_login(store):
    st.title("Welcome to Campus Copilot 👋")
    st.write("Your personal campus assistant is ready.")
    st.markdown("### How would you like to start?")
    left, right = st.columns(2)
    with left:
        if st.button("✨ Load Demo Data", width="stretch", type="primary"):
            try:
                inserted = store.load_demo_data()
                st.success(f"Loaded {inserted} sample records into your private workspace.")
                st.rerun()
            except Exception as exc:
                st.error(f"Demo data could not be loaded: {exc}")
    with right:
        if st.button("＋ Add My Campus Data", width="stretch"):
            st.session_state.onboarding_add_data = True
            st.session_state.requested_navigation = "📚 Academics"
            st.rerun()
    if st.session_state.get("onboarding_add_data"):
        st.info("Your workspace is ready. Choose Academics, Placements, Study Progress, or Tasks from the navigation to start adding your own records.")


def require_authenticated_workspace():
    auth_session = st.session_state.get("auth_session")
    if not auth_session:
        return None
    client = authenticated_client(auth_session.get("access_token", ""))
    if not client:
        st.session_state.pop("auth_session", None)
        return None
    try:
        user_response = client.auth.get_user(auth_session["access_token"])
        user = user_response.user
        if not user or str(user.id) != str(auth_session.get("user_id")):
            st.session_state.pop("auth_session", None)
            return None
    except Exception:
        try:
            refreshed = client.auth.refresh_session(auth_session.get("refresh_token"))
            if not refreshed.session or not refreshed.user:
                raise RuntimeError("No refreshable Supabase session")
            auth_session = {
                "access_token": refreshed.session.access_token,
                "refresh_token": refreshed.session.refresh_token,
                "user_id": str(refreshed.user.id),
                "email": refreshed.user.email,
            }
            st.session_state.auth_session = auth_session
            client = authenticated_client(auth_session["access_token"])
            user = refreshed.user
        except Exception:
            st.session_state.pop("auth_session", None)
            return None
    from supabase_store import CampusStore
    return auth_session, CampusStore(client, str(user.id))


def format_date(date_value):
    if not date_value:
        return "—"
    try:
        return datetime.strptime(date_value, "%Y-%m-%d").strftime("%b %d, %Y")
    except ValueError:
        return date_value


def badge_html(label, kind):
    return f'<span class="badge {kind}">{label}</span>'


def relative_due_label(date_value):
    try:
        due_date = datetime.strptime(date_value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return "Upcoming"
    days = (due_date - datetime.now().date()).days
    if days < 0:
        return f"Overdue by {abs(days)} day(s)"
    if days == 0:
        return "Due today"
    if days == 1:
        return "Due tomorrow"
    return f"Due in {days} days"


def placement_next_action(placement):
    stage = str(placement.get("stage", "")).lower()
    status = str(placement.get("status", "")).lower()
    if status in {"offer", "rejected", "withdrawn", "completed"}:
        return "No action pending"
    if "online assessment" in stage:
        return "Prepare for OA"
    if "technical interview" in stage:
        return "Prepare for technical interview"
    if "hr interview" in stage:
        return "Prepare for HR interview"
    if "application" in stage:
        return "Follow up on application"
    return "Review placement status"


def get_placement_actions(data=None):
    data = data or get_all_data()
    return [
        {**item, "next_action": placement_next_action(item)}
        for item in data.get("placements", [])
        if placement_next_action(item) != "No action pending"
    ]


def get_dashboard_priorities():
    data = get_all_data()
    items = []
    for assignment in data.get("assignments", []):
        if assignment.get("status") == "pending":
            items.append(
                {
                    "priority": assignment.get("priority", "Medium"),
                    "task": assignment.get("title", "Assignment"),
                    "deadline": assignment.get("deadline", ""),
                    "source": f"Academic • ~{assignment.get('estimated_hours', 1)} hrs",
                    "kind": "Academic",
                    "sort_date": assignment.get("deadline", "9999-12-31"),
                    "sort_tie": 1,
                }
            )
    for placement in get_placement_actions(data):
        deadline = placement.get("oa_date") or placement.get("interview_date") or "9999-12-31"
        items.append(
            {
                "priority": "High",
                "task": f"{placement.get('next_action')} · {placement.get('company', 'Placement')}",
                "deadline": deadline,
                "source": "Placement",
                "kind": "Placement",
                "sort_date": deadline,
                "sort_tie": 0,
            }
        )
    for exam in data.get("exams", []):
        items.append(
            {
                "priority": "Medium",
                "task": f"Revise {exam.get('subject', 'exam')}",
                "deadline": exam.get("date", "Soon"),
                "source": "Academic • Exam",
                "kind": "Exam",
                "sort_date": exam.get("date", "9999-12-31"),
                "sort_tie": 2,
            }
        )
    priority_order = {"High": 0, "Medium": 1, "Low": 2}
    items.sort(key=lambda item: (item["sort_date"], priority_order.get(item["priority"], 3), item["sort_tie"]))
    return items[:5]


def build_agent_activity(prompt_text):
    prompt_lower = (prompt_text or "").lower()
    data = get_all_data()
    pending = [item for item in data.get("assignments", []) if item.get("status") != "completed"]
    weak_topics = sorted(data.get("study_progress", []), key=lambda item: item.get("mastery", 100))[:2]
    placement = data.get("placements", [])[0] if data.get("placements") else {}

    intent = "Daily planning"
    if "placement" in prompt_lower:
        intent = "Placement review"
    elif "study" in prompt_lower or "tonight" in prompt_lower:
        intent = "Study planning"
    elif "plan" in prompt_lower or "three days" in prompt_lower:
        intent = "Replanning"

    activity = [
        f"Intent detected: {intent}",
        "✓ Checked assignments",
        "✓ Checked placement deadlines",
        "✓ Checked study progress",
    ]

    if pending:
        first_item = sorted(pending, key=lambda item: item.get("deadline", "9999-12-31"))[0]
        activity.append(f"Priority decision: {first_item.get('title')} is due soonest")
    if weak_topics:
        weak_names = ", ".join(item.get("topic", "study topic") for item in weak_topics)
        activity.append(f"Weakness focus: {weak_names}")
    if placement:
        activity.append(f"Placement signal: {placement.get('company')} {placement.get('stage')}")
    return activity


def build_agent_plan():
    data = get_all_data()
    urgent_assignment = sorted(
        [item for item in data.get("assignments", []) if item.get("status") != "completed"],
        key=lambda item: item.get("deadline", "9999-12-31"),
    )[:2]
    weak_topic = sorted(data.get("study_progress", []), key=lambda item: item.get("mastery", 100))[:2]
    placement = data.get("placements", [])[0] if data.get("placements") else {}
    exam = data.get("exams", [])[0] if data.get("exams") else {}

    return {
        "today": [
            f"Complete {urgent_assignment[0].get('title')}" if urgent_assignment else "Review your top pending task",
            f"Revise {weak_topic[0].get('topic')} ({weak_topic[0].get('subject')})" if weak_topic else "Continue revision",
            f"Prepare for {placement.get('company', 'placement')} {placement.get('stage', 'activity')}" if placement else "Keep placement prep moving",
        ],
        "tomorrow": [
            f"Finish {urgent_assignment[1].get('title')}" if len(urgent_assignment) > 1 else "Continue the next high-priority task",
            f"Practice {exam.get('subject', 'your next subject')} revision" if exam else "Stay on track with core subjects",
            "Review your weakest topic before the next class",
        ],
        "week": [
            "Tie up any remaining assignment work before the deadline window closes.",
            "Focus on weak mastery areas and concept recall before your next exam.",
            "Keep placement prep active without losing study momentum.",
        ],
    }


def render_dashboard():
    student = get_student()
    data = get_all_data()
    pending_tasks = [task for task in data.get("tasks", []) if task.get("status") != "completed"]
    pending_assignments = [task for task in data.get("assignments", []) if task.get("status") != "completed"]
    placement_actions = get_placement_actions(data)
    classes_today = get_today_schedule().get("classes", [])
    deadlines = [a.get("deadline") for a in pending_assignments if a.get("deadline")]

    st.markdown(f"## Good morning, {student.get('name', 'Student')} 👋")
    st.caption("Here's what needs your attention today.")

    metric_cols = st.columns(4)
    metrics = [
        ("📚 Classes Today", str(len(classes_today))),
        ("📝 Pending Tasks", str(len(pending_tasks))),
        ("💼 Placement Actions", str(len(placement_actions))),
        ("⏰ Upcoming Deadlines", str(len(deadlines))),
    ]

    for col, (label, value) in zip(metric_cols, metrics):
        with col:
            st.markdown(f'<div class="kpi-card"><div class="kpi-label">{label}</div><div class="kpi-value">{value}</div></div>', unsafe_allow_html=True)

    st.markdown('<div class="section-title">🎯 Today\'s Priorities</div>', unsafe_allow_html=True)
    priorities = get_dashboard_priorities()
    for item in priorities:
        priority_label = item["priority"].upper()
        marker = "🔴" if priority_label == "HIGH" else "🟡" if priority_label == "MEDIUM" else "🟢"
        with st.container(border=True):
            detail_col, action_col = st.columns([5, 1])
            with detail_col:
                st.markdown(f"{marker} **{priority_label}**")
                st.markdown(f"**{item['task']}**")
                st.caption(f"{relative_due_label(item['deadline'])} · {item['source']}")
            with action_col:
                if st.button("View task", key=f"priority_{item['kind']}_{item['task']}"):
                    st.session_state.requested_navigation = "✅ Tasks" if item["kind"] != "Placement" else "💼 Placements"
                    st.rerun()

    st.markdown('<div class="section-title">🗓️ Upcoming</div>', unsafe_allow_html=True)
    upcoming_cols = st.columns(2)

    with upcoming_cols[0]:
        st.markdown("### Assignments")
        for assignment in pending_assignments[:3]:
            st.markdown(
                f"- {assignment.get('title')} — {badge_html(assignment.get('priority', 'Medium'), 'priority-' + str(assignment.get('priority', 'Medium')).lower())} — {format_date(assignment.get('deadline'))}",
                unsafe_allow_html=True,
            )

        st.markdown("### Exams")
        for exam in data.get("exams", [])[:3]:
            st.markdown(f"- {exam.get('subject')} — {format_date(exam.get('date'))}")

    with upcoming_cols[1]:
        st.markdown("### Placements")
        for placement in data.get("placements", [])[:3]:
            oa_date = placement.get("oa_date") or "—"
            interview = placement.get("interview_date") or "—"
            st.markdown(f"- {placement.get('company')} — {placement.get('stage')} — OA: {oa_date} | Interview: {interview}")

        st.markdown("### Events")
        for event in data.get("events", [])[:3]:
            st.markdown(f"- {event.get('name')} — {format_date(event.get('date'))} — {event.get('time')}")

    st.markdown('<div class="section-title">🤖 Copilot Insight</div>', unsafe_allow_html=True)
    high_priority = [item for item in pending_assignments if item.get("priority", "").lower() == "high"]
    if high_priority:
        recommended = high_priority[0].get("title", "your top assignment")
        insight = f"You have {len(high_priority)} high-priority items within the next 48 hours.\n\nI recommend completing {recommended} before starting the next study block."
    else:
        insight = "Your current workload is manageable. Use the next session to strengthen the weakest study topics while keeping placement prep on schedule."
    st.info(insight)

    st.markdown('<div class="section-title">🧠 Agent Workflow</div>', unsafe_allow_html=True)
    activity = build_agent_activity("What should I focus on today?")
    for item in activity[:5]:
        st.markdown(f"- {item}")

    st.markdown('<div class="section-title">💡 Why this recommendation?</div>', unsafe_allow_html=True)
    st.write("The assistant prioritizes the nearest deadline, the most urgent placement milestone, and the weakest study area to keep your effort balanced and realistic.")

    st.markdown('<div class="section-title">📆 Recommended plan</div>', unsafe_allow_html=True)
    plan = build_agent_plan()
    plan_map = {
        "Today": plan["today"],
        "Tomorrow": plan["tomorrow"],
        "This Week": plan["week"],
    }
    plan_cols = st.columns(3)
    for column, section in zip(plan_cols, ["Today", "Tomorrow", "This Week"]):
        with column:
            st.markdown(f"### {section}")
            for item in plan_map.get(section, plan["today"]):
                st.markdown(f"• {item}")


def render_focus_sprint():
    st.markdown("### Focus Sprint")
    st.caption("Turn your current workload into a realistic, calendar-aware session.")

    controls = st.columns(3)
    with controls[0]:
        duration = st.select_slider("Time available", options=[25, 45, 60, 90, 120], value=60, format_func=lambda minutes: f"{minutes} min")
    with controls[1]:
        energy = st.radio("Energy level", ["Low", "Steady", "High"], index=1, horizontal=True)
    with controls[2]:
        start_at = st.time_input("Start time", value=datetime.now().time().replace(second=0, microsecond=0))

    plan_signature = (datetime.now().date().isoformat(), duration, energy, start_at.strftime("%H:%M"))
    if st.session_state.get("focus_sprint_signature") != plan_signature:
        st.session_state.focus_sprint_plan = build_focus_sprint(duration, energy, start_at)
        st.session_state.focus_sprint_signature = plan_signature
        st.session_state.focus_sprint_task = None

    plan = st.session_state.get("focus_sprint_plan")
    if not plan or plan.get("date") != datetime.now().date().isoformat():
        return

    next_commitment = plan.get("next_commitment")
    if next_commitment and plan["available_minutes"] < plan["requested_minutes"]:
        st.info(
            f"Your {plan['requested_minutes']}-minute request was shortened to "
            f"{plan['available_minutes']} minutes to finish before {next_commitment['name']} at {next_commitment['time']}."
        )

    recommendation = plan["recommendation"]
    st.markdown(f"**Lead move · {recommendation['kind']}**")
    st.write(recommendation["title"])
    st.caption("Why it won: " + " · ".join(recommendation["reasons"]))
    if energy == "Low":
        st.caption("Energy adjustment: the ranking favors a manageable study-recall block.")
    elif energy == "High":
        st.caption("Energy adjustment: the ranking favors deadline-heavy assignment or placement work.")

    if not plan["segments"]:
        st.warning("There is not enough free time before your next calendar commitment for a focused block.")
        return

    focus_minutes = sum(block["minutes"] for block in plan["segments"] if block["type"] == "Focus")
    recovery_minutes = plan["available_minutes"] - focus_minutes
    st.markdown(
        f"**{plan['available_minutes']}-minute sprint** · {focus_minutes} minutes focused work · "
        f"{recovery_minutes} minutes for reset and wrap-up"
    )

    for block in plan["segments"]:
        with st.container(border=True):
            time_col, task_col = st.columns([1, 4])
            with time_col:
                st.markdown(f"**{block['start']}–{block['end']}**")
                st.caption(f"{block['minutes']} min · {block['type']}")
            with task_col:
                st.write(block["title"])

    alternatives = plan.get("alternatives", [])[:2]
    if alternatives:
        st.caption("Also considered: " + " · ".join(item["title"] for item in alternatives))

    added_task = st.session_state.get("focus_sprint_task")
    if added_task:
        st.success(f"Added to Tasks: {added_task['title']}")
    elif st.button("Add lead block to Tasks", key="commit_focus_sprint", disabled=not plan["segments"]):
        focus_block = next((block for block in plan["segments"] if block["type"] == "Focus"), None)
        if focus_block:
            task = create_task(
                f"Focus sprint: {recommendation['title']} ({focus_block['minutes']} min)",
                plan["date"],
                recommendation["priority"],
                "focus-sprint",
            )
            st.session_state.focus_sprint_task = task
            st.rerun()


def build_copilot_insight(prompt):
    data = get_all_data()
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    prompt_lower = prompt.lower()
    study_request = "study" in prompt_lower or "tonight" in prompt_lower

    upcoming_exams = sorted(
        [exam for exam in data.get("exams", []) if exam.get("date", "") >= today.isoformat()],
        key=lambda exam: exam.get("date", "9999-12-31"),
    )
    next_exam = upcoming_exams[0] if upcoming_exams else None
    topics = data.get("study_progress", [])
    if next_exam:
        exam_topics = [topic for topic in topics if topic.get("subject") == next_exam.get("subject")]
    else:
        exam_topics = []
    focus_topic = min(exam_topics or topics, key=lambda topic: topic.get("mastery", 100), default=None)

    assignments = sorted(
        [item for item in data.get("assignments", []) if item.get("status") != "completed"],
        key=lambda item: item.get("deadline", "9999-12-31"),
    )
    placement_actions = sorted(
        get_placement_actions(data),
        key=lambda item: item.get("oa_date") or item.get("interview_date") or "9999-12-31",
    )
    urgent_placement = placement_actions[0] if placement_actions else None
    urgent_assignment = assignments[0] if assignments else None

    if study_request:
        related_exam = next_exam if focus_topic and next_exam and focus_topic.get("subject") == next_exam.get("subject") else None
        if focus_topic:
            why = (
                f"{focus_topic.get('topic')} needs attention: mastery is {focus_topic.get('mastery')}%."
                + (f" Your {related_exam.get('subject')} exam is {relative_due_label(related_exam.get('date')).lower()} "
                   f"({format_date(related_exam.get('date'))})." if related_exam else "")
            )
            today_tasks = [f"Active recall: {focus_topic.get('topic')}", "Review practice questions for the next exam"]
        else:
            why = "I couldn't find a study topic with a mastery score, so I'd start with your next upcoming exam."
            today_tasks = [f"Review core topics for {next_exam.get('subject')}" if next_exam else "Choose one topic and do a short recall session"]
        recommendation = None
    else:
        why_parts = []
        if urgent_placement:
            due = urgent_placement.get("oa_date") or urgent_placement.get("interview_date")
            why_parts.append(f"{urgent_placement.get('company')} milestone is {relative_due_label(due).lower()}")
        if urgent_assignment:
            why_parts.append(f"{urgent_assignment.get('title')} is {relative_due_label(urgent_assignment.get('deadline')).lower()}")
        why = " and ".join(why_parts[:2]) + ", so I'd prioritize these first." if why_parts else "Your current workload is manageable; I'd use this time for a short study review."
        today_tasks = []
        if urgent_placement:
            today_tasks.append(placement_next_action(urgent_placement) + f" · {urgent_placement.get('company')}")
        if urgent_assignment:
            today_tasks.append(urgent_assignment.get("title"))
        if not today_tasks and focus_topic:
            today_tasks.append(f"Active recall: {focus_topic.get('topic')}")

        if urgent_placement and (urgent_placement.get("oa_date") or ""):
            rec_title = f"Prepare for {urgent_placement.get('company')} OA"
            rec_deadline = urgent_placement.get("oa_date")
            rec_priority = "High"
        elif urgent_assignment:
            rec_title = urgent_assignment.get("title")
            rec_deadline = urgent_assignment.get("deadline", "")
            rec_priority = urgent_assignment.get("priority", "Medium")
        else:
            rec_title = None
            rec_deadline = ""
            rec_priority = "Medium"
        task_title = rec_title
        if rec_title and urgent_placement and urgent_placement.get("company") in rec_title:
            already_tracked = any(
                task.get("status") != "completed"
                and task.get("title", "").strip().casefold() == rec_title.casefold()
                for task in data.get("tasks", [])
            )
            if already_tracked:
                task_title = f"Complete a timed practice set for {urgent_placement.get('company')} OA"
        recommendation = {
            "title": rec_title,
            "task_title": task_title,
            "deadline": rec_deadline,
            "priority": rec_priority,
        } if rec_title else None

    now = datetime.now()
    start = max(now, datetime.combine(today, datetime.strptime("18:00", "%H:%M").time()))
    start = start.replace(second=0, microsecond=0)
    remainder = start.minute % 15
    if remainder:
        start += timedelta(minutes=15 - remainder)
    today_blocks = []
    for index, title in enumerate(today_tasks[:2]):
        block_start = start + timedelta(minutes=index * 75)
        block_end = block_start + timedelta(hours=1)
        today_blocks.append({"time": f"{block_start.strftime('%I:%M').lstrip('0')} – {block_end.strftime('%I:%M').lstrip('0')} {block_end.strftime('%p')}", "title": title})

    tomorrow_tasks = []
    if not study_request and urgent_placement and (urgent_placement.get("oa_date") or "") == tomorrow.isoformat():
        tomorrow_tasks.append({"time": "4:00 – 5:00 PM", "title": "Final OA revision"})
    if next_exam:
        exam_topic = min(
            [topic for topic in topics if topic.get("subject") == next_exam.get("subject")],
            key=lambda topic: topic.get("mastery", 100),
            default=None,
        )
        tomorrow_tasks.append({"time": "7:00 – 8:00 PM", "title": f"{exam_topic.get('subject')} revision" if exam_topic else f"{next_exam.get('subject')} revision"})

    return {
        "study_request": study_request,
        "why": why,
        "today": today_blocks,
        "tomorrow": tomorrow_tasks[:2],
        "recommendation": recommendation,
        "sources": ["Assignments", "Placement deadlines", "Exams", "Study progress"],
    }


def render_copilot_message(message, message_index):
    if message.get("insight"):
        insight = message["insight"]
        st.markdown("**🤖 COPILOT INSIGHT**")
        st.markdown("**I checked:** Assignments · Placement deadlines · Exams · Study progress")
        st.divider()
        st.markdown("**WHY THIS PLAN?**")
        st.write(insight["why"])
        st.divider()
        for section_name, section_key in (("📅 TODAY", "today"), ("📅 TOMORROW", "tomorrow")):
            blocks = insight.get(section_key, [])
            if blocks:
                st.markdown(f"**{section_name}**")
                for block in blocks:
                    st.markdown(f"**{block['time']}**  \n{block['title']}")
        recommendation = insight.get("recommendation")
        if recommendation:
            st.caption(f"Why? {recommendation['title']} is next by deadline and priority.")
            task_title = recommendation.get("task_title", recommendation["title"])
            existing = next(
                (
                    task for task in get_tasks()
                    if task.get("status") != "completed"
                    and task.get("title", "").strip().casefold() == task_title.casefold()
                ),
                None,
            )
            if message.get("task_result"):
                task_result = message["task_result"]
                if task_result.get("created"):
                    st.success(f"✓ Task created\n\n{task_result['task']['title']}\nDeadline: {relative_due_label(task_result['task'].get('deadline'))}\nPriority: {task_result['task'].get('priority')}")
                else:
                    st.info(f"✓ Already in Tasks: {task_result['task']['title']}")
            elif existing:
                st.caption("Already on your Tasks list.")
            elif st.button("＋ Add to Tasks", key=f"approve_recommendation_{message_index}"):
                task = create_task(
                    task_title,
                    recommendation["deadline"],
                    recommendation["priority"],
                    "agent",
                )
                message["task_result"] = {"created": True, "task": task}
                st.rerun()
        return

    st.markdown("**🤖 COPILOT INSIGHT**")
    st.write(message.get("content", ""))
    task = message.get("task")
    if task:
        if message.get("task_created"):
            st.success(f"✓ Added to Tasks\n\n{task.get('title')}\nDeadline: {relative_due_label(task.get('deadline'))}\nPriority: {task.get('priority')}")
        else:
            st.info(f"✓ Already in Tasks: {task.get('title')}")


def render_copilot(store):
    st.title("🤖 Campus Copilot")
    st.caption("Your intelligent academic and campus assistant.")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []
    if "agent_activity" not in st.session_state:
        st.session_state.agent_activity = [
            "Checked assignments",
            "Checked placement deadlines",
            "Checked exams and study progress",
            "Prioritized next actions",
        ]

    with st.expander("⏱️ Focus Sprint", expanded=False):
        render_focus_sprint()

    pending_prompt = None
    if not st.session_state.chat_history:
        st.markdown("### 🤖 What can I help with?")
        suggestions = [
            ("🎯 Plan my day", "What should I focus on today?"),
            ("📚 Study", "What should I study tonight?"),
            ("💼 Placements", "What placement activities are coming up?"),
            ("📅 Plan ahead", "Plan my next three days."),
        ]
        suggestion_cols = st.columns(2)
        for index, (title, question) in enumerate(suggestions):
            with suggestion_cols[index % 2]:
                with st.container(border=True):
                    st.markdown(f"**{title}**")
                    st.caption(question)
                    if st.button("Ask Copilot", key=f"suggestion_{index}", width="stretch"):
                        pending_prompt = question

    for index, message in enumerate(st.session_state.chat_history):
        if message["role"] == "user":
            with st.chat_message("user"):
                st.write(message["content"])
        else:
            with st.chat_message("assistant"):
                render_copilot_message(message, index)

    prompt = st.chat_input("Ask Campus Copilot...")
    pending_prompt = prompt or pending_prompt
    if pending_prompt:
        st.session_state.chat_history.append({"role": "user", "content": pending_prompt})
        with st.spinner("Checking assignments, placements, exams, and study progress..."):
            result = agent_response(pending_prompt, store)
        st.session_state.agent_activity = [
            "Checked assignments",
            "Checked placement deadlines",
            "Checked exams",
            "Compared study progress and prioritized tasks",
        ]
        assistant_message = {
            "role": "assistant",
            "content": result.get("answer", "I couldn't build a response from the available campus information."),
        }
        if result.get("task"):
            assistant_message["task"] = result["task"]
            assistant_message["task_created"] = result.get("task_created", False)
        else:
            assistant_message["insight"] = build_copilot_insight(pending_prompt)
        st.session_state.chat_history.append(assistant_message)
        st.rerun()

    if st.session_state.chat_history:
        with st.expander(f"🔍 Agent activity · {len(st.session_state.agent_activity)} steps", expanded=False):
            for item in st.session_state.agent_activity:
                st.write(f"✓ {item}")


def render_academics():
    data = get_all_data()
    st.title("📚 Academics")

    with st.expander("＋ Add a class", expanded=False):
        with st.form("add_class_form"):
            class_subject = st.text_input("Subject", key="class_subject")
            class_date = st.date_input("Class date", key="class_date")
            class_start = st.time_input("Start time", key="class_start")
            class_end = st.time_input("End time", key="class_end")
            class_room = st.text_input("Room", key="class_room")
            if st.form_submit_button("Add class") and class_subject.strip():
                add_record("classes", {
                    "subject": class_subject.strip(),
                    "date": class_date.isoformat(),
                    "start_time": class_start.isoformat(),
                    "end_time": class_end.isoformat(),
                    "room": class_room.strip(),
                })
                st.success("Class added to your workspace.")
                st.rerun()

    st.markdown("### Classes")
    classes = data.get("classes", [])
    st.dataframe([
        {"Subject": row.get("subject"), "Date": row.get("date"), "Start": row.get("start_time"), "End": row.get("end_time"), "Room": row.get("room")}
        for row in classes
    ], hide_index=True, width="stretch")

    if classes:
        with st.expander("Edit or delete a class", expanded=False):
            class_options = {f"{row.get('subject')} · {row.get('date')} · {row.get('start_time')}": row for row in classes}
            selected_class = st.selectbox("Class", list(class_options), key="edit_class_select")
            selected = class_options[selected_class]
            with st.form("edit_class_form"):
                edit_subject = st.text_input("Subject", value=selected.get("subject", ""))
                edit_class_date = st.date_input("Class date", value=datetime.strptime(selected["date"], "%Y-%m-%d").date() if selected.get("date") else None)
                edit_class_start = st.time_input("Start time", value=datetime.strptime((selected.get("start_time") or "09:00")[:5], "%H:%M").time())
                edit_class_end = st.time_input("End time", value=datetime.strptime((selected.get("end_time") or "10:00")[:5], "%H:%M").time())
                edit_room = st.text_input("Room", value=selected.get("room", ""))
                save_class = st.form_submit_button("Save class")
            if save_class:
                update_record("classes", selected["id"], {
                    "subject": edit_subject.strip(),
                    "date": edit_class_date.isoformat(),
                    "start_time": edit_class_start.isoformat(),
                    "end_time": edit_class_end.isoformat(),
                    "room": edit_room.strip(),
                })
                st.success("Class updated.")
                st.rerun()
            if st.button("Delete class", key="delete_class"):
                delete_record("classes", selected["id"])
                st.success("Class deleted.")
                st.rerun()

    st.markdown("### Assignments")
    assignments = data.get("assignments", [])
    assignment_df = [
        {
            "Assignment": item.get("title"),
            "Subject": item.get("subject"),
            "Deadline": format_date(item.get("deadline")),
            "Priority": item.get("priority"),
            "Status": item.get("status"),
        }
        for item in assignments
    ]
    st.dataframe(assignment_df, use_container_width=True, hide_index=True)

    with st.expander("＋ Add an assignment", expanded=False):
        with st.form("add_assignment_form"):
            assignment_title = st.text_input("Title", key="assignment_title")
            assignment_subject = st.text_input("Subject", key="assignment_subject")
            assignment_deadline = st.date_input("Deadline", key="assignment_deadline")
            assignment_priority = st.selectbox("Priority", ["High", "Medium", "Low"], key="assignment_priority")
            assignment_hours = st.number_input("Estimated hours", min_value=0.0, value=1.0, step=0.5, key="assignment_hours")
            if st.form_submit_button("Add assignment") and assignment_title.strip():
                add_record("assignments", {
                    "title": assignment_title.strip(),
                    "subject": assignment_subject.strip(),
                    "deadline": datetime.combine(assignment_deadline, datetime.min.time()).isoformat(),
                    "priority": assignment_priority,
                    "status": "pending",
                    "estimated_hours": assignment_hours,
                })
                st.success("Assignment added to your workspace.")
                st.rerun()

    if assignments:
        with st.expander("Edit or delete an assignment", expanded=False):
            assignment_options = {f"{row.get('title')} · {row.get('deadline')}": row for row in assignments}
            selected_assignment = st.selectbox("Assignment", list(assignment_options), key="edit_assignment_select")
            selected = assignment_options[selected_assignment]
            with st.form("edit_assignment_form"):
                edit_title = st.text_input("Title", value=selected.get("title", ""))
                edit_subject = st.text_input("Subject", value=selected.get("subject", ""))
                edit_deadline = st.date_input("Deadline", value=datetime.strptime(selected["deadline"], "%Y-%m-%d").date() if selected.get("deadline") else None)
                edit_priority = st.selectbox("Priority", ["High", "Medium", "Low"], index=["High", "Medium", "Low"].index(selected.get("priority", "Medium")))
                edit_status = st.selectbox("Status", ["pending", "in_progress", "completed"], index=["pending", "in_progress", "completed"].index(selected.get("status", "pending")))
                edit_hours = st.number_input("Estimated hours", min_value=0.0, value=float(selected.get("estimated_hours") or 0), step=0.5)
                save_assignment = st.form_submit_button("Save assignment")
            if save_assignment:
                update_record("assignments", selected["id"], {
                    "title": edit_title.strip(),
                    "subject": edit_subject.strip(),
                    "deadline": datetime.combine(edit_deadline, datetime.min.time()).isoformat(),
                    "priority": edit_priority,
                    "status": edit_status,
                    "estimated_hours": edit_hours,
                })
                st.success("Assignment updated.")
                st.rerun()
            if st.button("Delete assignment", key="delete_assignment"):
                delete_record("assignments", selected["id"])
                st.success("Assignment deleted.")
                st.rerun()

    st.markdown("### Exams")
    exam_df = [
        {
            "Subject": item.get("subject"),
            "Date": format_date(item.get("date")),
            "Topics": ", ".join(item.get("topics", [])),
        }
        for item in data.get("exams", [])
    ]
    st.dataframe(exam_df, use_container_width=True, hide_index=True)

    with st.expander("＋ Add an exam", expanded=False):
        with st.form("add_exam_form"):
            exam_subject = st.text_input("Subject", key="exam_subject")
            exam_date = st.date_input("Exam date", key="exam_date")
            exam_topics = st.text_area("Topics (one per line)", key="exam_topics")
            if st.form_submit_button("Add exam") and exam_subject.strip():
                add_record("exams", {"subject": exam_subject.strip(), "exam_date": exam_date.isoformat(), "topics": exam_topics.strip()})
                st.success("Exam added to your workspace.")
                st.rerun()

    exams = data.get("exams", [])
    if exams:
        with st.expander("Edit or delete an exam", expanded=False):
            exam_options = {f"{row.get('subject')} · {row.get('date')}": row for row in exams}
            selected_label = st.selectbox("Exam", list(exam_options), key="edit_exam_select")
            selected = exam_options[selected_label]
            with st.form("edit_exam_form"):
                edit_exam_subject = st.text_input("Subject", value=selected.get("subject", ""))
                edit_exam_date = st.date_input("Exam date", value=datetime.strptime(selected["date"], "%Y-%m-%d").date() if selected.get("date") else None)
                edit_exam_topics = st.text_area("Topics (one per line)", value="\n".join(selected.get("topics", [])))
                save_exam = st.form_submit_button("Save exam")
            if save_exam:
                update_record("exams", selected["id"], {"subject": edit_exam_subject.strip(), "exam_date": edit_exam_date.isoformat(), "topics": edit_exam_topics.strip()})
                st.success("Exam updated.")
                st.rerun()
            if st.button("Delete exam", key="delete_exam"):
                delete_record("exams", selected["id"])
                st.success("Exam deleted.")
                st.rerun()

    st.markdown("### Study Progress")
    for topic in get_study_progress():
        mastery = int(topic.get("mastery", 0))
        st.markdown(f"**{topic.get('topic')}** ({topic.get('subject')})")
        st.progress(mastery / 100)
        st.caption(f"Mastery: {mastery}% | Last studied: {topic.get('last_studied')}")


def render_placements():
    data = get_all_data()
    st.title("💼 Placements")
    placements = data.get("placements", [])
    summary = {
        "Applications": sum(1 for item in placements if item.get("stage") == "Application"),
        "OAs": sum(1 for item in placements if item.get("stage") == "Online Assessment"),
        "Interviews": sum(1 for item in placements if "Interview" in str(item.get("stage", ""))),
        "Offers": sum(1 for item in placements if item.get("status") == "Offer"),
    }

    cols = st.columns(4)
    labels = ["Applications", "OAs", "Interviews", "Offers"]
    for col, label in zip(cols, labels):
        with col:
            st.markdown(f'<div class="kpi-card"><div class="kpi-label">{label}</div><div class="kpi-value">{summary[label]}</div></div>', unsafe_allow_html=True)

    df = [
        {
            "Company": item.get("company"),
            "Role": item.get("role"),
            "Stage": item.get("stage"),
            "Next Action": placement_next_action(item),
            "OA Date": format_date(item.get("oa_date")),
            "Interview Date": format_date(item.get("interview_date")),
            "Status": item.get("status"),
        }
        for item in placements
    ]
    st.dataframe(df, use_container_width=True, hide_index=True)

    with st.expander("＋ Add a placement", expanded=False):
        with st.form("add_placement_form"):
            company = st.text_input("Company")
            role = st.text_input("Role")
            stage = st.text_input("Stage")
            oa_date = st.date_input("OA date", value=None)
            interview_date = st.date_input("Interview date", value=None)
            status = st.selectbox("Status", ["Upcoming", "In Progress", "Scheduled", "Offer", "Completed"])
            if st.form_submit_button("Add placement") and company.strip():
                add_record("placements", {
                    "company": company.strip(),
                    "role": role.strip(),
                    "stage": stage.strip(),
                    "oa_date": datetime.combine(oa_date, datetime.min.time()).isoformat() if oa_date else None,
                    "interview_date": datetime.combine(interview_date, datetime.min.time()).isoformat() if interview_date else None,
                    "status": status,
                })
                st.success("Placement added to your workspace.")
                st.rerun()

    if placements:
        with st.expander("Edit or delete a placement", expanded=False):
            placement_options = {f"{row.get('company')} · {row.get('role')}": row for row in placements}
            selected_label = st.selectbox("Placement", list(placement_options), key="edit_placement_select")
            selected = placement_options[selected_label]
            with st.form("edit_placement_form"):
                edit_company = st.text_input("Company", value=selected.get("company", ""))
                edit_role = st.text_input("Role", value=selected.get("role", ""))
                edit_stage = st.text_input("Stage", value=selected.get("stage", ""))
                edit_oa_date = st.date_input("OA date", value=datetime.strptime(selected["oa_date"], "%Y-%m-%d").date() if selected.get("oa_date") else None)
                edit_interview_date = st.date_input("Interview date", value=datetime.strptime(selected["interview_date"], "%Y-%m-%d").date() if selected.get("interview_date") else None)
                edit_status = st.text_input("Status", value=selected.get("status", ""))
                save_placement = st.form_submit_button("Save placement")
            if save_placement:
                update_record("placements", selected["id"], {
                    "company": edit_company.strip(),
                    "role": edit_role.strip(),
                    "stage": edit_stage.strip(),
                    "oa_date": datetime.combine(edit_oa_date, datetime.min.time()).isoformat() if edit_oa_date else None,
                    "interview_date": datetime.combine(edit_interview_date, datetime.min.time()).isoformat() if edit_interview_date else None,
                    "status": edit_status.strip(),
                })
                st.success("Placement updated.")
                st.rerun()
            if st.button("Delete placement", key="delete_placement"):
                delete_record("placements", selected["id"])
                st.success("Placement deleted.")
                st.rerun()


def render_calendar():
    data = get_all_data()
    st.title("📅 Calendar")

    with st.expander("＋ Add an event", expanded=False):
        with st.form("add_event_form"):
            event_name = st.text_input("Event name")
            event_date = st.date_input("Date", key="event_date")
            event_time = st.time_input("Time", key="event_time")
            event_venue = st.text_input("Venue")
            event_category = st.text_input("Category")
            if st.form_submit_button("Add event") and event_name.strip():
                add_record("events", {
                    "name": event_name.strip(),
                    "date": event_date.isoformat(),
                    "time": event_time.isoformat(),
                    "venue": event_venue.strip(),
                    "category": event_category.strip(),
                })
                st.success("Event added to your workspace.")
                st.rerun()

    combined = []
    for item in data.get("classes", []):
        combined.append({
            "date": item.get("date"),
            "kind": "Class",
            "title": f"{item.get('subject')} ({item.get('start_time')} - {item.get('end_time')})",
            "detail": item.get("room"),
        })
    for item in data.get("exams", []):
        combined.append({
            "date": item.get("date"),
            "kind": "Exam",
            "title": item.get("subject"),
            "detail": ", ".join(item.get("topics", [])),
        })
    for item in data.get("assignments", []):
        combined.append({
            "date": item.get("deadline"),
            "kind": "Assignment",
            "title": item.get("title"),
            "detail": item.get("subject"),
        })
    for item in data.get("events", []):
        combined.append({
            "date": item.get("date"),
            "kind": "Event",
            "title": item.get("name"),
            "detail": f"{item.get('time')} | {item.get('venue')}",
        })
    for item in data.get("placements", []):
        for field in ["oa_date", "interview_date"]:
            date_value = item.get(field)
            if date_value:
                combined.append({
                    "date": date_value,
                    "kind": "Placement",
                    "title": f"{item.get('company')} — {item.get('stage')}",
                    "detail": item.get("role"),
                })

    grouped = {}
    for item in combined:
        grouped.setdefault(item["date"], []).append(item)

    for date_key in sorted(grouped):
        st.markdown(f"### {format_date(date_key)}")
        for item in sorted(grouped[date_key], key=lambda value: value["kind"]):
            st.markdown(f"**{item['kind']}** — {item['title']}\n{item['detail']}")

    events = data.get("events", [])
    if events:
        with st.expander("Edit or delete an event", expanded=False):
            event_options = {f"{row.get('name')} · {row.get('date')}": row for row in events}
            selected_label = st.selectbox("Event", list(event_options), key="edit_event_select")
            selected = event_options[selected_label]
            with st.form("edit_event_form"):
                edit_name = st.text_input("Event name", value=selected.get("name", ""))
                edit_event_date = st.date_input("Date", value=datetime.strptime(selected["date"], "%Y-%m-%d").date() if selected.get("date") else None)
                edit_event_time = st.time_input("Time", value=datetime.strptime((selected.get("time") or "12:00")[:5], "%H:%M").time())
                edit_venue = st.text_input("Venue", value=selected.get("venue", ""))
                edit_category = st.text_input("Category", value=selected.get("category", ""))
                save_event = st.form_submit_button("Save event")
            if save_event:
                update_record("events", selected["id"], {
                    "name": edit_name.strip(),
                    "date": edit_event_date.isoformat(),
                    "time": edit_event_time.isoformat(),
                    "venue": edit_venue.strip(),
                    "category": edit_category.strip(),
                })
                st.success("Event updated.")
                st.rerun()
            if st.button("Delete event", key="delete_event"):
                delete_record("events", selected["id"])
                st.success("Event deleted.")
                st.rerun()


def render_study_progress():
    data = get_all_data()
    topics = data.get("study_progress", [])
    average_mastery = sum(item.get("mastery", 0) for item in topics) / len(topics) if topics else 0
    exams_by_subject = {}
    for exam in sorted(data.get("exams", []), key=lambda row: row.get("date", "9999-12-31")):
        exams_by_subject.setdefault(exam.get("subject"), exam)

    st.title("🎯 Study Progress")
    st.markdown(f"### Overall Mastery: {average_mastery:.1f}%")
    st.progress(average_mastery / 100)

    st.markdown("### Topic mastery and exam context")
    study_rows = [
        {
            "Topic": item.get("topic"),
            "Subject": item.get("subject"),
            "Mastery": f"{item.get('mastery', 0)}%",
            "Upcoming Exam": exams_by_subject.get(item.get("subject"), {}).get("date", "No exam scheduled"),
        }
        for item in sorted(topics, key=lambda row: row.get("mastery", 100))
    ]
    st.dataframe(study_rows, hide_index=True, width="stretch")

    with st.expander("＋ Add a study topic", expanded=False):
        with st.form("add_study_topic_form"):
            topic = st.text_input("Topic")
            subject = st.text_input("Subject")
            mastery = st.slider("Mastery", min_value=0, max_value=100, value=50)
            last_studied = st.date_input("Last studied", value=None)
            if st.form_submit_button("Add study topic") and topic.strip():
                add_record("study_progress", {
                    "topic": topic.strip(),
                    "subject": subject.strip(),
                    "mastery": mastery,
                    "last_studied": last_studied.isoformat() if last_studied else None,
                })
                st.success("Study topic added to your workspace.")
                st.rerun()

    if topics:
        with st.expander("Edit or delete a study topic", expanded=False):
            topic_options = {f"{row.get('topic')} · {row.get('subject')}": row for row in topics}
            selected_label = st.selectbox("Study topic", list(topic_options), key="edit_study_topic_select")
            selected = topic_options[selected_label]
            with st.form("edit_study_topic_form"):
                edit_topic = st.text_input("Topic", value=selected.get("topic", ""))
                edit_subject = st.text_input("Subject", value=selected.get("subject", ""))
                edit_mastery = st.slider("Mastery", min_value=0, max_value=100, value=int(selected.get("mastery", 0)))
                edit_last_studied = st.date_input("Last studied", value=datetime.strptime(selected["last_studied"], "%Y-%m-%d").date() if selected.get("last_studied") else None)
                save_topic = st.form_submit_button("Save topic")
            if save_topic:
                update_record("study_progress", selected["id"], {
                    "topic": edit_topic.strip(),
                    "subject": edit_subject.strip(),
                    "mastery": edit_mastery,
                    "last_studied": edit_last_studied.isoformat() if edit_last_studied else None,
                })
                st.success("Study topic updated.")
                st.rerun()
            if st.button("Delete study topic", key="delete_study_topic"):
                delete_record("study_progress", selected["id"])
                st.success("Study topic deleted.")
                st.rerun()

    weakest = min(topics, key=lambda item: item.get("mastery", 100), default=None)
    if weakest:
        exam = exams_by_subject.get(weakest.get("subject"))
        if exam:
            st.info(
                f"I recommend starting with **{weakest.get('topic')}**: mastery is "
                f"{weakest.get('mastery')}%, and your {exam.get('subject')} exam is "
                f"{relative_due_label(exam.get('date')).lower()}."
            )

    st.markdown("### Recently Studied")
    for item in sorted(topics, key=lambda row: row.get("last_studied", ""), reverse=True)[:5]:
        st.markdown(f"- {item.get('topic')} — {item.get('last_studied')} — {item.get('mastery')}% mastery")


def render_tasks():
    st.title("✅ Tasks")
    tasks = get_tasks()

    with st.form("add_task"):
        col1, col2, col3 = st.columns(3)
        with col1:
            title = st.text_input("Task title")
        with col2:
            deadline = st.date_input("Deadline")
        with col3:
            priority = st.selectbox("Priority", ["High", "Medium", "Low"])
        source = st.text_input("Source", value="manual")
        submitted = st.form_submit_button("Add task")
        if submitted and title:
            created = create_task(title, str(deadline), priority, source)
            st.success(f"Task added: {created.get('title')}")
            st.rerun()

    if not tasks:
        st.info("No tasks available right now.")
        return

    with st.expander("Edit or delete a task", expanded=False):
        task_options = {f"{task.get('title')} · {task.get('status')}": task for task in tasks}
        selected_label = st.selectbox("Task", list(task_options), key="edit_task_select")
        selected = task_options[selected_label]
        with st.form("edit_task_form"):
            edit_title = st.text_input("Title", value=selected.get("title", ""))
            edit_deadline = st.date_input("Deadline", value=datetime.strptime(selected["deadline"], "%Y-%m-%d").date() if selected.get("deadline") else None)
            edit_priority = st.selectbox("Priority", ["High", "Medium", "Low"], index=["High", "Medium", "Low"].index(selected.get("priority", "Medium")))
            edit_status = st.selectbox("Status", ["pending", "in_progress", "completed"], index=["pending", "in_progress", "completed"].index(selected.get("status", "pending")))
            edit_source = st.text_input("Source", value=selected.get("source", "manual"))
            save_task = st.form_submit_button("Save task")
        if save_task:
            update_record("tasks", selected["id"], {
                "title": edit_title.strip(),
                "deadline": datetime.combine(edit_deadline, datetime.min.time()).isoformat() if edit_deadline else None,
                "priority": edit_priority,
                "status": edit_status,
                "source": edit_source.strip(),
            })
            st.success("Task updated.")
            st.rerun()
        if st.button("Delete task", key="delete_task"):
            delete_record("tasks", selected["id"])
            st.success("Task deleted.")
            st.rerun()

    for task in tasks:
        status = task.get("status", "pending")
        priority = task.get("priority", "Medium")
        priority_class = "priority-" + str(priority).lower()
        status_class = "status-" + str(status).replace(" ", "_")
        cols = st.columns([4, 1, 1, 1])
        with cols[0]:
            st.markdown(f"**{task.get('title')}**")
            source_label = "Added by Campus Copilot" if task.get("source") == "agent" else task.get("source", "manual")
            st.caption(f"Deadline: {format_date(task.get('deadline'))} • {source_label}")
        with cols[1]:
            st.markdown(badge_html(priority, priority_class), unsafe_allow_html=True)
        with cols[2]:
            st.markdown(badge_html(status, status_class), unsafe_allow_html=True)
        with cols[3]:
            if status != "completed" and st.button("Complete", key=f"complete_{task.get('id')}"):
                done = complete_task(task.get("id"))
                if done:
                    st.success(f"Completed: {done.get('title')}")
                    st.rerun()
        st.markdown("<hr style='border:0; border-top:1px solid rgba(255,255,255,0.08); margin:0.8rem 0;' />", unsafe_allow_html=True)


def render_capstone_deliverables():
    st.title("Capstone Deliverables")
    st.caption("Five artifacts for reviewing Campus Copilot architecture and operational readiness.")
    st.info("Campus Copilot now uses Supabase Auth and user-scoped PostgreSQL access. Configure a Supabase project and apply the schema before enabling sign-up.")

    architecture_tab, workflow_tab, deployment_tab, security_tab, monitoring_tab = st.tabs(
        ["Architecture Diagram", "Agent Workflow Design", "Deployment Strategy", "Security Model", "Monitoring Dashboard Design"]
    )

    with architecture_tab:
        st.subheader("Architecture Diagram")
        st.caption("Supabase authentication, user-scoped request paths, optional reasoning, and RLS-protected data access.")
        st.markdown(
                        """
                        <style>
                        .arch { max-width: 1040px; margin: 0 auto; color: #edf3ff; font: 14px/1.45 sans-serif; }
                        .arch-forward { max-width: 760px; margin: 0 auto; text-align: center; }
                        .arch-main-node { width: min(100%, 600px); margin: 0 auto; text-align: left; }
                        .arch-node { padding: 14px 16px; border: 1px solid #426b9c; border-radius: 8px; background: #142d45; }
                        .arch-node strong { display: block; color: #fff; font-size: 15px; }
                        .arch-node span { display: block; margin-top: 4px; color: #c1cee0; font-size: 12px; }
                        .arch-student { border-color: #3478d4; background: #142d55; }
                        .arch-agent { border-color: #886bd0; background: #29204e; }
                        .arch-ai { border-color: #2aa98d; background: #123c3b; }
                        .arch-fallback { border-color: #d69b35; background: #49391d; }
                        .arch-tools { border-color: #20a69d; background: #123f43; }
                        .arch-data { border-color: #48b681; background: #173d34; }
                        .arch-arrow { text-align: center; color: #87c8dc; font-size: 12px; }
                        .arch-arrow b { display: block; color: #d5e4f4; font-weight: 500; }
                        .arch-down { display: block; color: #72aaff; font-size: 24px; line-height: 1; }
                        .arch-branches { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 650px; margin: 0 auto; }
                        .arch-branch-label { margin-bottom: 6px; color: #d5e4f4; text-align: center; font-size: 12px; }
                        .arch-return-flow { max-width: 440px; margin: 22px auto 0; text-align: center; }
                        .arch-return-node { padding: 10px 14px; border: 1px solid #426b9c; border-radius: 8px; background: #142d45; color: #fff; font-weight: 700; }
                        .arch-return-edge { padding: 3px 8px; color: #d5e4f4; font-size: 12px; }
                        .arch-return-edge span { display: block; color: #72aaff; font-size: 20px; line-height: 1; }
                        .arch-summary { margin-top: 18px; padding: 14px 16px; border-left: 3px solid #35b4ae; background: #111f37; color: #e2ebf5; }
                        .arch-components { margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; }
                        .arch-component { padding: 9px 0; border-bottom: 1px solid #273a55; color: #bfcbdb; font-size: 12px; }
                        .arch-component strong { color: #fff; font-size: 13px; }
                        @media (max-width: 700px) { .arch-branches { grid-template-columns: 1fr; max-width: 100%; } .arch-components { grid-template-columns: 1fr; } .arch-arrow { padding: 2px 0; } }
                        </style>
                        <div class="arch">
                            <div class="arch-forward">
                                <div class="arch-node arch-student arch-main-node"><strong>Student</strong><span>Email and password sign-in</span></div>
                                <div class="arch-arrow"><span class="arch-down">&#8595;</span><b>Credentials verified by Supabase Auth</b></div>
                                <div class="arch-node arch-ai arch-main-node"><strong>Supabase Authentication</strong><span>Creates the account and issues an authenticated session</span></div>
                                <div class="arch-arrow"><span class="arch-down">&#8595;</span><b>Authenticated user UUID · auth.users.id</b></div>
                                <div class="arch-node arch-student arch-main-node"><strong>Streamlit UI · app.py</strong><span>Session-bound dashboard, forms, and chat</span></div>
                                <div class="arch-arrow"><span class="arch-down">&#8595;</span><b>User query + context</b></div>
                                <div class="arch-node arch-agent arch-main-node"><strong>Agent Orchestrator · agent.py</strong><span>Understands requests, selects tools, coordinates actions, and generates responses</span></div>
                                <div class="arch-branches" style="margin-top:18px;">
                                    <div><div class="arch-branch-label"><span class="arch-down">&#8595;</span>Reasoning &amp; tool selection</div><div class="arch-node arch-ai"><strong>OpenAI API · Optional</strong><span>LLM reasoning and tool calls</span></div></div>
                                    <div><div class="arch-branch-label"><span class="arch-down">&#8595;</span>Fallback planning when AI service is unavailable</div><div class="arch-node arch-fallback"><strong>Local Fallback · Rule-Based Planning</strong><span>Local prioritization and planning</span></div></div>
                                </div>
                                <div class="arch-arrow"><span class="arch-down">&#8595;</span><b>Tool calls based on user intent</b></div>
                                <div class="arch-node arch-tools arch-main-node"><strong>Campus Tools · tools.py</strong><span>Schedules · Assignments · Exams<br>Placements · Study Progress<br>Create Task · Complete Task</span></div>
                                <div class="arch-arrow"><span class="arch-down">&#8595;</span><b>Retrieve or update campus information</b></div>
                                <div class="arch-node arch-data arch-main-node"><strong>Supabase PostgreSQL · Row Level Security</strong><span>Persistent campus tables; policies restrict each request to auth.uid()</span></div>
                            </div>
                            <div class="arch-return-flow">
                                <div style="margin-bottom:8px;color:#9ec5e8;font-weight:700;">Return path</div>
                                <div class="arch-return-node">Supabase PostgreSQL · RLS</div>
                                <div class="arch-return-edge"><span>&#8593;</span>Data / tool results</div>
                                <div class="arch-return-node">Campus Tools · tools.py</div>
                                <div class="arch-return-edge"><span>&#8593;</span>Tool results</div>
                                <div class="arch-return-node">Agent Orchestrator · agent.py</div>
                                <div class="arch-return-edge"><span>&#8593;</span>Personalized recommendation / action result</div>
                                <div class="arch-return-node">Streamlit UI · app.py</div>
                                <div class="arch-return-edge"><span>&#8593;</span>Response and updated campus information</div>
                                <div class="arch-return-node">Student</div>
                            </div>
                            <div class="arch-components">
                                <div class="arch-component"><strong>Student and Supabase Auth</strong><br>Signs in with email/password; Supabase issues the authenticated user's UUID and session.</div>
                                <div class="arch-component"><strong>Streamlit UI · app.py</strong><br>Provides the dashboard and chat and binds every data operation to the current authenticated session.</div>
                                <div class="arch-component"><strong>Agent Orchestrator · agent.py</strong><br>Interprets requests, determines required campus tools, coordinates calls, and generates responses.</div>
                                <div class="arch-component"><strong>OpenAI API · Optional</strong><br>Provides LLM-based reasoning, intent understanding, prioritization, and tool selection when configured.</div>
                                <div class="arch-component"><strong>Local Fallback · Rule-Based Planning</strong><br>Provides basic prioritization when the OpenAI API is unavailable.</div>
                                <div class="arch-component"><strong>Campus Tools · tools.py</strong><br>Uses the session-bound store for user-scoped reads and task actions; LLM arguments cannot select a user.</div>
                                <div class="arch-component"><strong>Supabase PostgreSQL · RLS</strong><br>Persists profiles, classes, assignments, exams, placements, study topics, tasks, and events under per-user policies.</div>
                                <div class="arch-component"><strong>campus_data.json · Seed only</strong><br>Read only when a signed-in user explicitly chooses Load Demo Data.</div>
                            </div>
                            <div class="arch-summary"><strong>System overview</strong><br>Campus Copilot authenticates each student with Supabase, binds the authenticated UUID to controlled tools, retrieves only that user's RLS-protected campus records, reasons over deadlines and priorities, and returns recommendations or performs requested task actions.</div>
                            <div style="margin-top:10px;color:#aebbd0;font-size:12px;">The app uses the Supabase anon key with the user's access token; database RLS enforces ownership. The service-role key is never used.</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
        )
        st.caption("Operational telemetry and production monitoring remain future work; Supabase authentication and row-level data isolation are part of the application design.")

    with workflow_tab:
        st.subheader("Agent Workflow Design")
        workflow = [
            {"Stage": "Observe", "Decision": "Identify intent and whether the request is read-only or a task mutation."},
            {"Stage": "Retrieve", "Decision": "Select the minimum campus tools needed for schedule, assignments, exams, placements, or study progress."},
            {"Stage": "Reason", "Decision": "Compare urgency, deadlines, mastery gaps, calendar availability, and user energy."},
            {"Stage": "Prioritize", "Decision": "Choose a next action and state the evidence behind it."},
            {"Stage": "Act", "Decision": "Run allowlisted task changes only when explicitly requested by the student."},
            {"Stage": "Respond", "Decision": "Return the result or a deterministic fallback when the model is unavailable."},
        ]
        st.dataframe(workflow, hide_index=True, width="stretch")
        st.warning("Failure path: missing key or model/network error uses the local fallback. Production should add timeouts, bounded retries, trace IDs, and visible tool errors instead of hiding unexpected exceptions.")
        st.caption("External actions such as emailing, applying to jobs, or submitting coursework are out of scope.")

    with deployment_tab:
        st.subheader("Deployment Strategy")
        current, target = st.columns(2)
        with current:
            st.markdown("**Current · Streamlit Community Cloud**")
            st.markdown("- Entrypoint: `app.py`\n- Auth: Supabase email/password\n- Data: Supabase PostgreSQL with per-user RLS\n- Secrets: Streamlit app secrets\n- JSON: explicit demo seed only")
            st.warning("Configure Supabase URL/key and apply `supabase/schema.sql` before sign-up. Use the anon/public key, never the service-role key.")
        with target:
            st.markdown("**Operational next steps**")
            st.markdown("- Add backups and retention policy\n- Add health checks and request timeouts\n- Add rate limits and structured, redacted telemetry\n- Run two-account RLS checks before public release\n- Add dependency/secret scans and release rollback")

    with security_tab:
        st.subheader("Security Model")
        security = [
            {"Area": "Secrets", "Current control": "Supabase anon/public key and optional OpenAI key in Streamlit secrets; no service-role key.", "Review focus": "Rotation, least privilege, secret scanning."},
            {"Area": "Identity and access", "Current control": "Supabase Auth UUID; tools filter by the session user; RLS enforces row ownership.", "Review focus": "Run two-user integration checks and review policies."},
            {"Area": "Tool safety", "Current control": "Fixed tool allowlist; agent gets no user_id argument; mutations are owner-filtered.", "Review focus": "Keep authorization independent from model intent; audit changes."},
            {"Area": "Privacy", "Current control": "Campus records stored per user in Supabase; JSON only seeds a user's workspace on request.", "Review focus": "Define retention/deletion policy and redact logs."},
            {"Area": "Threats", "Current control": "RLS policies and authenticated session access.", "Review focus": "Leaked keys, prompt injection, unauthorized reads/writes, and backup recovery."},
        ]
        st.dataframe(security, hide_index=True, width="stretch")
        st.error("If a credential is committed, pasted into chat, or otherwise exposed, revoke and rotate it immediately.")

    with monitoring_tab:
        st.subheader("Monitoring Dashboard Design")
        monitoring = [
            {"Signal": "Availability", "Metric": "Health-check success rate", "Response": "Investigate repeated failures and dependency health."},
            {"Signal": "Latency", "Metric": "p50/p95 response time by model/fallback", "Response": "Inspect slow calls; enforce request timeouts."},
            {"Signal": "Agent quality", "Metric": "Tool success, invalid arguments, fallback rate, empty answers", "Response": "Review traces and tool contracts without logging student content."},
            {"Signal": "Safety", "Metric": "Rejected unauthorized mutations and validation failures", "Response": "Review authorization and abuse signals."},
            {"Signal": "Cost", "Metric": "Requests, tokens, estimated daily spend", "Response": "Alert on budget thresholds and anomalous volume."},
            {"Signal": "Data health", "Metric": "Supabase query/write errors and RLS denials", "Response": "Inspect policy/query traces and reconcile authorized changes."},
            {"Signal": "Outcomes", "Metric": "Plan acceptance, task completion, repeated replans, feedback", "Response": "Improve prioritization using privacy-reviewed aggregates."},
        ]
        st.dataframe(monitoring, hide_index=True, width="stretch")
        st.info("These are proposed operator signals. The app does not yet collect telemetry or implement an operational monitoring dashboard.")
        st.code("request_id → intent → tools → model/fallback → latency → mutation audit", language="text")

    st.caption("Full diagrams, security controls, deployment notes, and acceptance checklist: docs/capstone-deliverables.md")


def main():
    if "page" not in st.session_state:
        st.session_state.page = "Dashboard"

    set_current_store(None)
    workspace = require_authenticated_workspace()
    if not workspace:
        render_auth_page()
        return

    auth_session, store = workspace
    set_current_store(store)

    try:
        has_campus_data = store.has_campus_data()
    except Exception as exc:
        st.error("Campus Copilot could not read its Supabase tables. Apply `supabase/schema.sql` to the configured project and confirm the anon key has access.")
        st.caption(str(exc))
        return

    if not has_campus_data and not st.session_state.get("onboarding_add_data") and st.query_params.get("view") != "capstone":
        st.sidebar.markdown("<h2 style='color:#8BC000; margin-bottom:0.25rem;'>🎓 CAMPUS COPILOT</h2>", unsafe_allow_html=True)
        st.sidebar.markdown(f"👤 {auth_session.get('email', '')}")
        if st.sidebar.button("🚪 Sign Out", width="stretch"):
            try:
                sign_out_supabase(auth_session)
            except Exception:
                pass
            clear_user_session_state()
            st.rerun()
        render_first_login(store)
        return

    if st.query_params.get("view") == "capstone":
        st.sidebar.markdown("<h2 style='color:#8BC000; margin-bottom:0.25rem;'>🎓 CAMPUS COPILOT</h2>", unsafe_allow_html=True)
        st.sidebar.markdown("<hr style='border:1px solid rgba(139,192,0,0.2);' />", unsafe_allow_html=True)
        st.sidebar.markdown(f"👤 {auth_session.get('email', '')}")
        if st.sidebar.button("← Back to student app", width="stretch"):
            st.query_params.clear()
            st.rerun()
        if st.sidebar.button("🚪 Sign Out", width="stretch", key="capstone_signout"):
            try:
                sign_out_supabase(auth_session)
            except Exception:
                pass
            clear_user_session_state()
            st.query_params.clear()
            st.rerun()
        render_capstone_deliverables()
        return

    sidebar_options = [
        "🏠 Dashboard",
        "🤖 Copilot",
        "📚 Academics",
        "💼 Placements",
        "📅 Calendar",
        "🎯 Study Progress",
        "✅ Tasks",
    ]

    requested_navigation = st.session_state.pop("requested_navigation", None)
    if requested_navigation in sidebar_options:
        st.session_state.navigation = requested_navigation

    st.sidebar.markdown("<h2 style='color:#8BC000; margin-bottom:0.25rem;'>🎓 CAMPUS COPILOT</h2>", unsafe_allow_html=True)
    if st.sidebar.button("View capstone showcase", width="stretch", key="open_capstone_showcase"):
        st.query_params["view"] = "capstone"
        st.rerun()
    st.sidebar.markdown("<hr style='border:1px solid rgba(139,192,0,0.2);' />", unsafe_allow_html=True)
    page = st.sidebar.radio("Navigation", sidebar_options, index=0, key="navigation", label_visibility="collapsed")
    st.session_state.page = page

    student = get_student()
    st.sidebar.markdown("<div style='margin-top:1rem; font-size:0.95rem; color:#A0A0A0;'>" + student.get("name", "Student") + "<br>" + student.get("course", "") + "<br>Semester " + str(student.get("semester", 1)) + "</div>", unsafe_allow_html=True)
    st.sidebar.caption(auth_session.get("email", ""))
    if st.sidebar.button("🚪 Sign Out", width="stretch", key="student_signout"):
        try:
            sign_out_supabase(auth_session)
        except Exception:
            pass
        clear_user_session_state()
        st.query_params.clear()
        st.rerun()

    if page == "🏠 Dashboard":
        render_dashboard()
    elif page == "🤖 Copilot":
        render_copilot(store)
    elif page == "📚 Academics":
        render_academics()
    elif page == "💼 Placements":
        render_placements()
    elif page == "📅 Calendar":
        render_calendar()
    elif page == "🎯 Study Progress":
        render_study_progress()
    elif page == "✅ Tasks":
        render_tasks()


if __name__ == "__main__":
    main()
