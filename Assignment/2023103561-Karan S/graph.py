"""
graph.py
========
Builds the full LangGraph, matching the architecture:

User Report
    -> Incident Agent
        -> [Map Agent, Knowledge RAG, Resource Agent]  (in parallel)
    -> Decision Agent
    -> Safety Checker
    -> Action Plan
"""
from langgraph.graph import StateGraph, START, END

from state import IncidentState
from incident_agent import incident_agent
from map_agent import map_agent
from knowledge_rag import knowledge_rag
from resource_agent import resource_agent
from decision_agent import decision_agent
from evidence_verifier import evidence_verifier
from human_approval_agent import human_approval_agent
from safety_checker import safety_checker
from action_plan_agent import action_plan_agent


def build_graph():
    graph = StateGraph(IncidentState)

    # Register every Agent as a node
    graph.add_node("incident_agent", incident_agent)
    graph.add_node("map_agent", map_agent)
    graph.add_node("knowledge_rag", knowledge_rag)
    graph.add_node("resource_agent", resource_agent)
    graph.add_node("decision_agent", decision_agent)
    graph.add_node("safety_checker", safety_checker)
    graph.add_node("evidence_verifier", evidence_verifier)
    graph.add_node("human_approval_agent", human_approval_agent)
    graph.add_node("action_plan_agent", action_plan_agent)

    # Start -> Incident Agent
    graph.add_edge(START, "incident_agent")

    # Incident Agent -> the three parallel branches (fan-out)
    graph.add_edge("incident_agent", "map_agent")
    graph.add_edge("incident_agent", "knowledge_rag")
    graph.add_edge("incident_agent", "resource_agent")

    # All three merge into Decision Agent (fan-in)
    # LangGraph automatically waits for all predecessors to finish before
    # running decision_agent
    graph.add_edge("map_agent", "decision_agent")
    graph.add_edge("knowledge_rag", "decision_agent")
    graph.add_edge("resource_agent", "decision_agent")

    # Decision -> Safety Checker -> Evidence Verifier -> Human Approval -> Action Plan -> end
    graph.add_edge("decision_agent", "safety_checker")
    graph.add_edge("safety_checker", "evidence_verifier")
    graph.add_edge("evidence_verifier", "human_approval_agent")
    graph.add_edge("human_approval_agent", "action_plan_agent")
    graph.add_edge("action_plan_agent", END)

    return graph.compile()


# One ready-to-import compiled instance
compiled_graph = build_graph()


def run_incident_pipeline(report_text: str, approval_status: str = "pending", review_comments: str = "") -> dict:
    """
    Main entry point: takes the user's report text and returns the full
    final state after execution.
    """
    initial_state: IncidentState = {
        "report": report_text,
        "trace": [],
        "approval_status": approval_status,
        "review_comments": review_comments,
    }
    final_state = compiled_graph.invoke(initial_state)
    return final_state
