from __future__ import annotations

import os
from typing import Any

import httpx

from backend.agents.assignment_agent import AssignmentAgent
from backend.agents.priority_agent import PriorityAgent
from backend.agents.resolution_agent import ResolutionAgent
from backend.agents.triage_agent import TriageAgent


class LLMService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")

    def analyze(self, description: str) -> dict | None:
        if not self.api_key:
            return None
        try:
            response = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": f"Return JSON with category, priority, reason, resolution, assignment for: {description}"}],
                    "temperature": 0.2,
                },
                timeout=15,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return {"analysis": content}
        except Exception:
            return None


class AgentOrchestrator:
    def __init__(self) -> None:
        self.triage = TriageAgent()
        self.priority = PriorityAgent()
        self.assignment = AssignmentAgent()
        self.resolution = ResolutionAgent()
        self.llm = LLMService()

    def process_ticket(self, ticket: Any, db: Any | None = None) -> dict:
        description = f"{ticket.title or ''} {ticket.description or ''} {ticket.location or ''}"
        triage = self.triage.analyze(description, title=ticket.title)
        priority = self.priority.analyze(description, category=triage["category"], affected_people=1)
        assignment = self.assignment.assign(triage["category"])
        resolution = self.resolution.generate(description, category=triage["category"])

        llm_result = self.llm.analyze(description)
        if llm_result:
            analysis_source = "llm"
            category = triage["category"]
            priority_name = priority["priority"]
            reasoning = priority["reasoning"]
            resolution_suggestion = "; ".join(resolution["resolution"])
        else:
            analysis_source = "rule_based"
            category = triage["category"]
            priority_name = priority["priority"]
            reasoning = priority["reasoning"]
            resolution_suggestion = "; ".join(resolution["resolution"])

        return {
            "category": category,
            "priority": priority_name,
            "assignment": assignment["team_name"],
            "team_name": assignment["team_name"],
            "team_id": assignment["team_id"],
            "reasoning": reasoning,
            "resolution_suggestion": resolution_suggestion,
            "confidence": max(triage["confidence"], priority["confidence"]),
            "analysis_source": analysis_source,
        }
