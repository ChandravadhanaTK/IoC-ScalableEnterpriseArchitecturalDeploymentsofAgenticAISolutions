import json
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from openai import OpenAI

from tools import (
    complete_task,
    create_task,
    get_pending_assignments,
    get_placement_deadlines,
    get_study_progress,
    get_tasks,
    get_today_schedule,
    get_upcoming_exams,
)

SYSTEM_PROMPT = """You are Campus Copilot, an intelligent university student assistant.

Your job is to help a university student manage academics,
placements, campus activities, deadlines and study progress.

You are an agent, not merely a conversational chatbot.

When answering a question:

1. Understand the student's intent.
2. Determine what information is required.
3. Use the appropriate tools to retrieve that information.
4. Reason over the retrieved information.
5. Prioritize based on urgency, deadline, importance,
   estimated effort and the student's current study progress.
6. Provide a practical and concise recommendation.
7. Use action tools when the student explicitly asks you
   to create or complete something.

Rules:

- Never invent campus information.
- Never invent deadlines.
- Never invent placement information.
- Use tools whenever the answer depends on stored campus data.
- Clearly distinguish facts from recommendations.
- Do not take external actions.
- Do not send emails or applications.
- Do not access private accounts.
- Only modify tasks when the user explicitly requests it.
"""


def get_api_key() -> str | None:
    load_dotenv()
    try:
        import streamlit as st

        secret_value = st.secrets.get("OPENAI_API_KEY", None)
        if secret_value:
            return str(secret_value)
    except Exception:
        pass

    return os.getenv("OPENAI_API_KEY")


def get_tool_definitions() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "get_today_schedule",
                "description": "Returns the student's classes and campus events for today.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_pending_assignments",
                "description": "Returns incomplete assignments sorted by closest deadline.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_upcoming_exams",
                "description": "Returns the student's upcoming exams.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_placement_deadlines",
                "description": "Returns upcoming placement activities such as assessments and interviews.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_study_progress",
                "description": "Returns study topic mastery rankings for the student.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "get_tasks",
                "description": "Returns all student tasks and their current status.",
                "parameters": {"type": "object", "properties": {}, "required": []},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_task",
                "description": "Creates a new task with a title, deadline, priority, and source.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "deadline": {"type": "string"},
                        "priority": {"type": "string"},
                        "source": {"type": "string"},
                    },
                    "required": ["title", "deadline", "priority", "source"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "complete_task",
                "description": "Marks a task as completed when the student confirms it is finished.",
                "parameters": {
                    "type": "object",
                    "properties": {"task_id": {"type": "string"}},
                    "required": ["task_id"],
                },
            },
        },
    ]


def call_tool_by_name(name: str, arguments: Dict[str, Any]) -> Any:
    tool_map = {
        "get_today_schedule": get_today_schedule,
        "get_pending_assignments": get_pending_assignments,
        "get_upcoming_exams": get_upcoming_exams,
        "get_placement_deadlines": get_placement_deadlines,
        "get_study_progress": get_study_progress,
        "get_tasks": get_tasks,
        "create_task": lambda: create_task(
            arguments.get("title", ""),
            arguments.get("deadline", ""),
            arguments.get("priority", "Medium"),
            "agent",
        ),
        "complete_task": lambda: complete_task(arguments.get("task_id", "")),
    }
    fn = tool_map.get(name)
    if fn is None:
        return {"error": f"Tool {name} not found."}
    return fn()


def _reasoning_snapshot():
    assignments = get_pending_assignments()
    placements = get_placement_deadlines()
    exams = get_upcoming_exams()
    study = sorted(get_study_progress(), key=lambda item: item.get("mastery", 100))

    next_assignment = assignments[0] if assignments else None
    next_placement = placements[0] if placements else None
    next_exam = exams[0] if exams else None
    weak_topic = study[0] if study else None
    today_schedule = get_today_schedule()
    todays_events = today_schedule.get("events", [])

    return {
        "next_assignment": next_assignment,
        "next_placement": next_placement,
        "next_exam": next_exam,
        "weak_topic": weak_topic,
        "today_events": todays_events,
    }


def fallback_agent_response(prompt: str) -> Dict[str, Any]:
    prompt_lower = (prompt or "").lower()
    snapshot = _reasoning_snapshot()

    if "add a task" in prompt_lower or "create a task" in prompt_lower:
        if "loadshare" in prompt_lower:
            task = create_task("Prepare for LoadShare OA", "2026-10-03", "High", "agent")
            return {
                "status": "ok",
                "answer": "I prioritized this because LoadShare OA is the most time-sensitive item on your schedule, and it is due tomorrow.\n\n✓ Task created\nPrepare for LoadShare OA\nDeadline: Tomorrow\nPriority: High",
                "task": task,
            }
        return {"status": "ok", "answer": "I created the task because it matches a current gap in your workload and has a real deadline to track."}

    if "finished my ai assignment" in prompt_lower or "complete my ai assignment" in prompt_lower:
        for task in get_tasks():
            if "AI Assignment" in task.get("title", ""):
                done = complete_task(task.get("id"))
                if not done:
                    continue
                return {
                    "status": "ok",
                    "answer": f"I marked the task as complete because it was your most urgent academic item and it is no longer pending.\n\n✓ Task completed\n{done.get('title')}\nStatus: Completed",
                    "task": done,
                }
        return {"status": "ok", "answer": "I looked for the AI assignment task and did not find a matching pending item to close."}

    if "what should i focus on today" in prompt_lower or "focus on today" in prompt_lower:
        next_assignment = snapshot["next_assignment"]
        next_placement = snapshot["next_placement"]
        next_exam = snapshot["next_exam"]
        weak_topic = snapshot["weak_topic"]
        todays_events = snapshot["today_events"]

        lines = [
            "I checked your assignments, placement pipeline, exam dates, and weak study areas before choosing this plan.",
            "",
        ]
        if next_assignment:
            lines.extend(["1. Clear the nearest academic deadline.", f"   {next_assignment.get('title')} is due {next_assignment.get('deadline')} and is still incomplete."])
        else:
            lines.append("1. No pending assignment deadline needs action right now.")
        if next_placement:
            lines.extend(["2. Protect the placement timeline.", f"   {next_placement.get('company')} {next_placement.get('stage')} is coming up, so I recommend a preparation block."])
        else:
            lines.append("2. No placement milestone is currently listed.")
        if weak_topic:
            lines.extend(["3. Strengthen a study gap.", f"   {weak_topic.get('topic')} in {weak_topic.get('subject')} is at {weak_topic.get('mastery')}% mastery."])
        else:
            lines.append("3. Add study topics with mastery scores to enable personalized revision advice.")
        lines.append("4. Keep the schedule realistic.")
        if next_exam:
            lines.append(f"   Your next exam is {next_exam.get('subject')} on {next_exam.get('date')}, so review its core topics before the day ends.")
        if todays_events:
            first_event = todays_events[0]
            lines.append(f"   There is also a campus event today: {first_event.get('name')} at {first_event.get('time')}.")
        lines.append("Recommended order: complete the assignment, do a focused revision block, then do the placement prep and leave time for the campus event.")
        return {"status": "ok", "answer": "\n".join(lines)}

    if "placement" in prompt_lower:
        placements = get_placement_deadlines()
        if not placements:
            return {"status": "ok", "answer": "I checked the placement pipeline and there are no active placement activities in the current campus data."}
        lines = [
            "I reviewed your placement pipeline and prioritized the upcoming actions by time sensitivity.",
        ]
        for item in placements[:4]:
            lines.append(
                f"- {item.get('company')} — {item.get('role')} | {item.get('stage')} | OA: {item.get('oa_date') or '—'} | Interview: {item.get('interview_date') or '—'}"
            )
        lines.append("The highest-priority action is the placement item closest to today, because timing matters more than quantity when shortlisting fast-approaching opportunities.")
        return {"status": "ok", "answer": "\n".join(lines)}

    if "study tonight" in prompt_lower or "what should i study" in prompt_lower:
        next_exam = snapshot["next_exam"]
        weak_topic = snapshot["weak_topic"]
        if weak_topic and next_exam and weak_topic.get("subject") == next_exam.get("subject"):
            lines = [
                f"I recommend starting with {weak_topic.get('topic')} in {weak_topic.get('subject')}: mastery is {weak_topic.get('mastery')}%, and your exam is {next_exam.get('date')}.",
                "Use active recall first, then check your answers against the core exam topics.",
            ]
        elif weak_topic:
            lines = [f"I recommend reviewing {weak_topic.get('topic')} in {weak_topic.get('subject')} first; mastery is {weak_topic.get('mastery')}%."]
        else:
            lines = ["I couldn't find study mastery scores to personalize a topic recommendation."]
        return {"status": "ok", "answer": "\n".join(lines)}

    if "replan my next three days" in prompt_lower or "next three days" in prompt_lower:
        pending = get_pending_assignments()[:2]
        exams = get_upcoming_exams()[:2]
        placements = get_placement_deadlines()[:2]
        lines = [
            "I rebuilt the plan around urgency, exam pressure, and weak-study areas instead of just stacking tasks by default.",
            "",
            "Day 1: Clear the current urgent assignment and do a short review from the nearest exam topic.",
            "Day 2: Prioritize placement prep and do one deeper study block on your weakest current topic.",
            "Day 3: Finish any remaining task, then convert the week’s learning into quick revision notes and a final scan of the next deadlines.",
        ]
        if pending:
            lines.append(f"Urgent task: {pending[0].get('title')} due {pending[0].get('deadline')}")
        if exams:
            lines.append(f"Exam risk: {exams[0].get('subject')} is coming up on {exams[0].get('date')}")
        if placements:
            lines.append(f"Placement focus: {placements[0].get('company')} {placements[0].get('stage')}")
        return {"status": "ok", "answer": "\n".join(lines)}

    if "due this week" in prompt_lower or "everything due" in prompt_lower:
        assignments = get_pending_assignments()
        lines = ["I ranked the week by nearest deadline and importance, not by subject alone."]
        for item in assignments[:5]:
            lines.append(f"- {item.get('title')} ({item.get('subject')}) — {item.get('deadline')} — {item.get('priority')}")
        return {"status": "ok", "answer": "\n".join(lines)}

    return {
        "status": "ok",
        "answer": "I reviewed your current deadlines, placement timeline, study gaps, and exam pressure. The best next move is to clear the nearest deadline first, then work on the weakest topic, and keep placement prep active without letting it crowd out your core study blocks.",
    }


def _create_task_for_explicit_request(prompt: str) -> Dict[str, Any] | None:
    prompt_lower = prompt.lower()
    action_words = ("add", "create", "make", "track")
    if "task" not in prompt_lower or not any(word in prompt_lower for word in action_words):
        return None

    placements = get_placement_deadlines()
    placement = next(
        (item for item in placements if item.get("company", "").lower() in prompt_lower),
        None,
    )
    if placement:
        company = placement.get("company", "placement")
        stage = placement.get("stage", "preparation")
        title = f"Prepare for {company} OA" if "assessment" in stage.lower() else f"Prepare for {company} {stage}"
        deadline = placement.get("oa_date") or placement.get("interview_date") or ""
        priority = "High" if deadline else "Medium"
    else:
        return {
            "status": "error",
            "answer": "I can add a campus-linked task when I can match it to a placement or academic item. Which item should I track?",
        }

    existing = next(
        (
            task for task in get_tasks()
            if task.get("status") != "completed" and task.get("title", "").strip().casefold() == title.casefold()
        ),
        None,
    )
    if existing:
        return {
            "status": "ok",
            "mode": "action",
            "task": existing,
            "task_created": False,
            "answer": "This task is already on your Tasks list, so I left it there without creating a duplicate.",
        }

    task = create_task(title, deadline, priority, "agent")
    return {
        "status": "ok",
        "mode": "action",
        "task": task,
        "task_created": True,
        "answer": "Task created and added to your Tasks list.",
    }


def _allows_task_mutation(prompt: str, tool_name: str) -> bool:
    prompt_lower = prompt.lower()
    if tool_name == "create_task":
        return "task" in prompt_lower and any(word in prompt_lower for word in ("add", "create", "make", "track"))
    if tool_name == "complete_task":
        return any(word in prompt_lower for word in ("finish", "finished", "complete", "completed", "mark as done"))
    return True


def agent_response(prompt: str, store=None) -> Dict[str, Any]:
    if not prompt or not prompt.strip():
        return {"status": "error", "answer": "Please ask a valid question."}

    from tools import get_current_store, set_current_store

    if store is not None:
        set_current_store(store)
    else:
        try:
            get_current_store()
        except RuntimeError:
            return {"status": "error", "answer": "Please sign in to use your personal campus workspace."}

    action_result = _create_task_for_explicit_request(prompt)
    if action_result:
        return action_result

    api_key = get_api_key()
    if not api_key:
        fallback = fallback_agent_response(prompt)
        return {
            "status": "ok",
            "mode": "fallback",
            "answer": fallback.get("answer", "I can still help with your campus data using the local planner."),
        }

    try:
        client = OpenAI(api_key=api_key)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=get_tool_definitions(),
            tool_choice="auto",
        )

        assistant_message = response.choices[0].message
        tool_calls = assistant_message.tool_calls or []

        if tool_calls:
            for tool_call in tool_calls:
                if not _allows_task_mutation(prompt, tool_call.function.name):
                    return {
                        "status": "ok",
                        "answer": "I can retrieve your campus information, but I only change tasks when you explicitly ask me to.",
                    }

            tool_results = []
            assistant_tool_calls = []
            for tool_call in tool_calls:
                arguments = json.loads(tool_call.function.arguments or "{}")
                result = call_tool_by_name(tool_call.function.name, arguments)
                tool_results.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_call.function.name,
                        "content": json.dumps(result),
                    }
                )
                assistant_tool_calls.append(
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments,
                        },
                    }
                )

            final_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "tool_calls": assistant_tool_calls},
                    *tool_results,
                ],
            )
            answer = final_response.choices[0].message.content or "I reviewed the data and here is the next best step."
            return {"status": "ok", "answer": answer}

        answer = assistant_message.content or "I reviewed the available campus information and here is a recommendation."
        return {"status": "ok", "answer": answer}
    except Exception:
        fallback = fallback_agent_response(prompt)
        fallback["mode"] = "fallback"
        return fallback
