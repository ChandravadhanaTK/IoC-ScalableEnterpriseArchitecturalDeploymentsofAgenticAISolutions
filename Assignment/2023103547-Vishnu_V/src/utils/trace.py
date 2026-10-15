"""Research trace utilities.

Manages the append-only trace of events that records every action
taken by every agent. Events are stored in graph state and mirrored
to JSONL files in data/traces/.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from models.schemas import TraceEvent
from utils.config import TRACES_DIR
from utils.logging import get_logger

logger = get_logger(__name__)


def create_trace_event(
    agent: str,
    action: str,
    status: Literal["ok", "warning", "error", "waiting"] = "ok",
    detail: str = "",
) -> TraceEvent:
    """Create a new TraceEvent.

    Args:
        agent: Name of the agent creating the event.
        action: Description of the action taken.
        status: Event status.
        detail: Additional detail string.

    Returns:
        A new TraceEvent instance.
    """
    return TraceEvent(
        ts=datetime.now(timezone.utc),
        agent=agent,
        action=action,
        status=status,
        detail=detail,
    )


def mirror_trace_event(thread_id: str, event: TraceEvent) -> None:
    """Write a trace event to the JSONL file for a thread.

    Args:
        thread_id: The research session thread ID.
        event: The TraceEvent to mirror to disk.
    """
    trace_file = TRACES_DIR / f"{thread_id}.jsonl"
    try:
        with open(trace_file, "a", encoding="utf-8") as f:
            f.write(event.model_dump_json() + "\n")
    except OSError as e:
        logger.error("Failed to mirror trace event: %s", e)


def load_trace(thread_id: str) -> list[TraceEvent]:
    """Load all trace events for a thread from disk.

    Args:
        thread_id: The research session thread ID.

    Returns:
        List of TraceEvent instances.
    """
    trace_file = TRACES_DIR / f"{thread_id}.jsonl"
    events: list[TraceEvent] = []
    if not trace_file.exists():
        return events
    try:
        with open(trace_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    events.append(TraceEvent.model_validate_json(line))
    except (OSError, json.JSONDecodeError) as e:
        logger.error("Failed to load trace: %s", e)
    return events


def format_trace_for_report(events: list[TraceEvent]) -> str:
    """Format trace events as a markdown table for the final report.

    Args:
        events: List of TraceEvent instances.

    Returns:
        Markdown-formatted trace table.
    """
    if not events:
        return "_No trace events recorded._"

    lines = [
        "| Timestamp | Agent | Action | Status | Detail |",
        "|-----------|-------|--------|--------|--------|",
    ]
    for ev in events:
        ts_str = ev.ts.strftime("%Y-%m-%d %H:%M:%S")
        detail_short = ev.detail[:80].replace("|", "\\|") if ev.detail else ""
        lines.append(
            f"| {ts_str} | {ev.agent} | {ev.action} | {ev.status} | {detail_short} |"
        )
    return "\n".join(lines)
