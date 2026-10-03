from contextvars import ContextVar
from datetime import datetime, timedelta

_CURRENT_STORE = ContextVar("campus_copilot_store", default=None)


def set_current_store(store):
    return _CURRENT_STORE.set(store)


def reset_current_store(token):
    _CURRENT_STORE.reset(token)


def get_current_store():
    store = _CURRENT_STORE.get()
    if store is None:
        raise RuntimeError("No authenticated Supabase workspace is bound to this request.")
    return store


def build_focus_sprint(available_minutes, energy, start_at, today=None):
    data = get_all_data()
    today = today or datetime.now().date()
    today_text = today.isoformat()

    def days_until(date_value):
        try:
            return (datetime.strptime(date_value, "%Y-%m-%d").date() - today).days
        except (TypeError, ValueError):
            return None

    def urgency_points(days):
        if days is None:
            return 0
        if days <= 0:
            return 8
        if days == 1:
            return 7
        if days <= 3:
            return 5
        if days <= 7:
            return 3
        return 1

    candidates = []
    for assignment in data.get("assignments", []):
        if assignment.get("status") == "completed":
            continue
        days = days_until(assignment.get("deadline"))
        priority = assignment.get("priority", "Medium").title()
        score = urgency_points(days) + {"High": 3, "Medium": 1.5, "Low": 0}.get(priority, 0)
        if assignment.get("status") == "in_progress":
            score += 1
        candidates.append({
            "kind": "Assignment",
            "title": assignment.get("title", "Pending assignment"),
            "subject": assignment.get("subject", "Academic work"),
            "priority": priority,
            "deadline": assignment.get("deadline", ""),
            "score": score,
            "reasons": [
                f"Due in {max(days, 0)} day(s)" if days is not None else "Has an active deadline",
                f"{priority} priority",
            ],
        })

    for placement in data.get("placements", []):
        if str(placement.get("status", "")).lower() in {"completed", "rejected", "withdrawn"}:
            continue
        dates = [days_until(placement.get(field)) for field in ("oa_date", "interview_date")]
        dates = [days for days in dates if days is not None]
        if not dates:
            continue
        days = min(dates)
        candidates.append({
            "kind": "Placement",
            "title": f"Prepare for {placement.get('company', 'placement')} {placement.get('stage', 'activity')}",
            "subject": placement.get("role", "Placement preparation"),
            "priority": "High" if days <= 2 else "Medium",
            "deadline": min(
                (placement.get("oa_date"), placement.get("interview_date")),
                key=lambda value: days_until(value) if days_until(value) is not None else 9999,
            ),
            "score": 3 + urgency_points(days),
            "reasons": [f"Placement milestone in {max(days, 0)} day(s)", "Preparation benefits from a short practice block"],
        })

    exams_by_subject = {}
    for exam in data.get("exams", []):
        days = days_until(exam.get("date"))
        if days is not None and days >= 0:
            current = exams_by_subject.get(exam.get("subject"))
            if current is None or days < current:
                exams_by_subject[exam.get("subject")] = days

    for topic in data.get("study_progress", []):
        mastery = topic.get("mastery", 100)
        exam_days = exams_by_subject.get(topic.get("subject"))
        score = 2 + (100 - mastery) / 20
        reasons = [f"Mastery is {mastery}%"]
        if exam_days is not None:
            if exam_days <= 2:
                score += 4
            elif exam_days <= 7:
                score += 3
            elif exam_days <= 14:
                score += 1.5
            reasons.append(f"Related exam in {exam_days} day(s)")
        candidates.append({
            "kind": "Study",
            "title": f"Active recall: {topic.get('topic', 'weak topic')}",
            "subject": topic.get("subject", "Study"),
            "priority": "Medium",
            "deadline": "",
            "score": score,
            "reasons": reasons,
        })

    energy = energy.title()
    for candidate in candidates:
        if energy == "Low" and candidate["kind"] == "Study":
            candidate["score"] += 1
        elif energy == "High" and candidate["kind"] in {"Assignment", "Placement"}:
            candidate["score"] += 1

    if not candidates:
        candidates.append({
            "kind": "Reset",
            "title": "Review your task list and choose one small next action",
            "subject": "Planning",
            "priority": "Low",
            "deadline": "",
            "score": 0,
            "reasons": ["No active assignments, placements, or study topics were found"],
        })
    candidates.sort(key=lambda candidate: candidate["score"], reverse=True)

    commitments = []
    for item in data.get("classes", []) + data.get("events", []):
        if item.get("date") != today_text:
            continue
        time_text = item.get("start_time") or item.get("time")
        try:
            commitment_time = datetime.strptime(time_text, "%H:%M").time()
        except (TypeError, ValueError):
            continue
        if commitment_time > start_at:
            commitments.append((commitment_time, item.get("subject") or item.get("name") or "Calendar event"))
    commitments.sort(key=lambda item: item[0])

    requested_minutes = max(0, int(available_minutes))
    free_minutes = requested_minutes
    next_commitment = None
    if commitments:
        commitment_time, commitment_name = commitments[0]
        minutes_to_commitment = int((
            datetime.combine(today, commitment_time) - datetime.combine(today, start_at)
        ).total_seconds() // 60)
        free_minutes = min(free_minutes, max(0, minutes_to_commitment))
        next_commitment = {"name": commitment_name, "time": commitment_time.strftime("%H:%M")}

    segments = []
    if free_minutes >= 10:
        if free_minutes <= 30:
            first_block = max(10, free_minutes - 5)
        else:
            first_block = min(45, max(20, ((free_minutes - 5) // 2 // 5) * 5))

        cursor = datetime.combine(today, start_at)
        remaining = free_minutes
        work_index = 0
        while remaining > 0:
            if work_index == 0:
                block_minutes = min(first_block, remaining)
            else:
                block_minutes = min(45, remaining)
            block_end = cursor + timedelta(minutes=block_minutes)
            candidate = candidates[min(work_index, len(candidates) - 1)]
            title = candidate["title"]
            if work_index >= len(candidates):
                title = f"Continue or capture next steps: {candidates[0]['title']}"
            segments.append({
                "type": "Focus",
                "title": title,
                "minutes": block_minutes,
                "start": cursor.strftime("%H:%M"),
                "end": block_end.strftime("%H:%M"),
            })
            cursor = block_end
            remaining -= block_minutes
            work_index += 1
            if remaining > 0:
                is_wrap_up = remaining <= 15
                break_minutes = remaining if is_wrap_up else 5
                break_end = cursor + timedelta(minutes=break_minutes)
                segments.append({
                    "type": "Wrap-up" if is_wrap_up else "Reset",
                    "title": "Write down what you finished and the next action" if is_wrap_up else "Step away, then return with a clear head",
                    "minutes": break_minutes,
                    "start": cursor.strftime("%H:%M"),
                    "end": break_end.strftime("%H:%M"),
                })
                cursor = break_end
                remaining -= break_minutes

    return {
        "date": today_text,
        "requested_minutes": requested_minutes,
        "available_minutes": free_minutes,
        "energy": energy,
        "next_commitment": next_commitment,
        "recommendation": candidates[0],
        "alternatives": candidates[1:],
        "segments": segments,
    }


def get_all_data():
    return get_current_store().get_all_data()


def get_today_schedule():
    return get_current_store().get_today_schedule(datetime.now().date())


def get_pending_assignments():
    return get_current_store().get_pending_assignments()


def get_upcoming_exams():
    return get_current_store().get_upcoming_exams()


def get_placement_deadlines():
    return get_current_store().get_placement_deadlines()


def get_study_progress():
    return get_current_store().get_study_progress()


def get_tasks():
    return get_current_store().get_tasks()


def get_student():
    return get_current_store().get_profile()


def create_task(title, deadline, priority="Medium", source="manual"):
    return get_current_store().create_task(title, deadline, priority, source)


def complete_task(task_id):
    return get_current_store().complete_task(task_id)


def add_record(table, values):
    return get_current_store().insert(table, values)


def update_record(table, record_id, values):
    return get_current_store().update(table, record_id, values)


def delete_record(table, record_id):
    return get_current_store().delete(table, record_id)
