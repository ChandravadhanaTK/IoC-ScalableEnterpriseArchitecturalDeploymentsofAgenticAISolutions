from backend.agents.triage_agent import TriageAgent
from backend.agents.priority_agent import PriorityAgent
from backend.agents.assignment_agent import AssignmentAgent
from backend.agents.resolution_agent import ResolutionAgent


def test_triage_agent_network_keywords():
    result = TriageAgent().analyze("Wi-Fi is not working in Lab 3")
    assert result["category"] == "Network"
    assert result["analysis_source"] == "rule_based"


def test_triage_agent_plumbing_keywords():
    result = TriageAgent().analyze("Water pipe is leaking in washroom")
    assert result["category"] == "Plumbing"


def test_priority_agent_handles_safety_and_urgency():
    result = PriorityAgent().analyze("Electrical sparks and smoke in classroom")
    assert result["priority"] in {"High", "Critical"}
    assert result["confidence"] > 0.5


def test_assignment_agent_maps_category():
    result = AssignmentAgent().assign("Electrical")
    assert result["team_name"] == "Electrical Team"


def test_resolution_agent_produces_steps():
    result = ResolutionAgent().generate("Projector not working")
    assert "resolution" in result
    assert len(result["resolution"]) > 0
