import os
import sys
from typing import Dict, List, Literal, TypedDict, Annotated
import operator
from dotenv import load_dotenv
from pydantic import BaseModel, Field

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain_tavily import TavilySearch

from langgraph.graph import StateGraph, START, END

# ==========================================
# 1. DEFINE THE MULTI-AGENT STATE
# ==========================================
# We keep track of messages, current findings, drafts, and the next agent to invoke.
class TeamState(TypedDict):
    task: str
    search_results: str
    draft_content: str
    critic_feedback: str
    next_step: str  # Dictates routing: 'SearchAgent', 'WriterAgent', 'CriticAgent', or 'FINISH'

# ==========================================
# 2. INITIALIZE ECOSYSTEM COMPONENTS
# ==========================================
llm = ChatOllama(model="llama3.2:3b", temperature=0.2)
search_tool = TavilySearch(max_results=2)

# ==========================================
# 3. DEFINE THE SUPERVISOR (THE ROUTER)
# ==========================================
# We use Pydantic to strictly enforce structured output from the LLM supervisor.
class SupervisorDecision(BaseModel):
    reasoning: str = Field(description="Internal logic for choosing the next action.")
    next_agent: Literal["SearchAgent", "WriterAgent", "CriticAgent", "FINISH"] = Field(
        description="The next specialized agent to call, or FINISH if content is fully approved."
    )

def supervisor_agent(state: TeamState) -> Dict:
    """Acts as the team lead, assessing current progress and routing to workers."""
    system_prompt = (
        "You are a Project Supervisor managing three agents: SearchAgent, WriterAgent, and CriticAgent.\n"
        "Your job is to coordinate them step-by-step to fulfill the user's task.\n\n"
        "RULES:\n"
        "1. If relevant factual data is missing, send the task to 'SearchAgent'.\n"
        "2. Once facts are collected but no draft exists (or a draft needs revision), send to 'WriterAgent'.\n"
        "3. Once a new draft is generated, ALWAYS send it to 'CriticAgent' for inspection.\n"
        "4. ONLY route to 'FINISH' if CriticAgent explicitly states the draft is approved."
    )

    context = (
        f"User Task: {state['task']}\n"
        f"Current Search Context: {state.get('search_results', 'None')}\n"
        f"Current Content Draft: {state.get('draft_content', 'None')}\n"
        f"Latest Critic Feedback: {state.get('critic_feedback', 'None')}\n"
    )

    # Force the LLM to output structural JSON matching our schema
    structured_llm = llm.with_structured_output(SupervisorDecision)
    decision = structured_llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=context)
    ])

    return {"next_step": decision.next_agent}


# ==========================================
# 4. DEFINE SPECIALIZED WORKER AGENTS
# ==========================================

def search_agent(state: TeamState) -> Dict:
    """Executes live web search to pull fresh contextual references."""
    print("🤖 [SearchAgent] Hunting for real-time web references...")
    task = state["task"]
    
    # Execute tool call programmatically
    tool_raw_output = search_tool.invoke({"query": task})
    
    # Format structural tool summaries cleanly for downstream consumption
    formatted_results = ""
    if isinstance(tool_raw_output, dict) and "results" in tool_raw_output:
        results = tool_raw_output["results"]
    elif isinstance(tool_raw_output, list):
        results = tool_raw_output
    else:
        results = []

    for idx, doc in enumerate(results, 1):
        source = doc.get("url", "N/A") if isinstance(doc, dict) else str(doc)
        content = doc.get("content", "") if isinstance(doc, dict) else ""
        formatted_results += f"[{idx}] Source: {source}\nContent: {content}\n\n"
        
    return {"search_results": formatted_results}


def writer_agent(state: TeamState) -> Dict:
    """Drafts or modifies content text using research and feedback buffers."""
    print("🤖 [WriterAgent] Composing content piece...")
    task = state["task"]
    facts = state.get("search_results", "No search facts provided.")
    feedback = state.get("critic_feedback", "")
    current_draft = state.get("draft_content", "")

    if not current_draft:
        prompt = f"Write a comprehensive 2-paragraph report on: '{task}'. Use these verified facts:\n{facts}"
    else:
        prompt = f"Revise this draft report: '{current_draft}'\n\nAddress this specific feedback:\n{feedback}\n\nIncorporate factual context if needed:\n{facts}"

    response = llm.invoke([HumanMessage(content=prompt)])
    return {"draft_content": response.content}


def critic_agent(state: TeamState) -> Dict:
    """Acts as Quality Control to vet structural drafts or flag discrepancies."""
    print("🤖 [CriticAgent] Reviewing content standards...")
    draft = state.get("draft_content", "")
    
    prompt = (
        f"Review this text: '{draft}'\n\n"
        "Critique rules:\n"
        "- If it is excellent, detailed, and directly answers the user intent, output exactly: 'APPROVED'.\n"
        "- If it needs improvements, specify precisely what changes are required in one sentence."
    )
    
    response = llm.invoke([HumanMessage(content=prompt)])
    verdict = str(response.content).strip()
    
    if "APPROVED" in verdict:
        return {"critic_feedback": "APPROVED"}
    else:
        return {"critic_feedback": verdict}


# ==========================================
# 5. CONSTRUCT THE CONDITIONAL ROUTING MAP
# ==========================================
def supervisor_router(state: TeamState) -> Literal["SearchAgent", "WriterAgent", "CriticAgent", "__end__"]:
    """Reads supervisor state payload to trigger the physical graph edges."""
    destination = state["next_step"]
    if destination == "FINISH":
        return END
    return destination


# ==========================================
# 6. ASSEMBLE AND COMPILE THE LANGGRAPH
# ==========================================
workflow = StateGraph(TeamState)

# Add all architectural system nodes
workflow.add_node("Supervisor", supervisor_agent)
workflow.add_node("SearchAgent", search_agent)
workflow.add_node("WriterAgent", writer_agent)
workflow.add_node("CriticAgent", critic_agent)

# Entrypoint always lands on the team supervisor
workflow.set_entry_point("Supervisor")

# Workers always report straight back to the Supervisor upon node completion
workflow.add_edge("SearchAgent", "Supervisor")
workflow.add_edge("WriterAgent", "Supervisor")
workflow.add_edge("CriticAgent", "Supervisor")

# Define conditional supervisor forks
workflow.add_conditional_edges(
    "Supervisor",
    supervisor_router,
    {
        "SearchAgent": "SearchAgent",
        "WriterAgent": "WriterAgent",
        "CriticAgent": "CriticAgent",
        END: END
    }
)

app = workflow.compile()

# ==========================================
# 7. RUN AND VALIDATE
# ==========================================
if __name__ == "__main__":
    initial_input = {
        "task": "Research recent breakthroughs in renewable energy and summarize key trends.",
        "search_results": "",
        "draft_content": "",
        "critic_feedback": "",
        "next_step": ""
    }

    print("🚀 Initializing Multi-Agent Supervisor Team...\n")
    
    for event in app.stream(initial_input):
        for node_name, state_update in event.items():
            print(f"--- Node executed: [{node_name}] ---")
            if "next_step" in state_update:
                print(f"🧭 Supervisor Decision: Route to [{state_update['next_step']}]\n")
            if "search_results" in state_update:
                print(f"🔍 Search Summary Received\n")
            if "draft_content" in state_update:
                print(f"📝 Draft Update:\n{state_update['draft_content']}\n")
            if "critic_feedback" in state_update:
                print(f"🧐 Critic Feedback: {state_update['critic_feedback']}\n")
            print("="*50)

    print("\n🎉 Multi-Agent Team execution finished!")
