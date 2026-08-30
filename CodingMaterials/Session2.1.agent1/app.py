import os
import sys
from typing import Dict, TypedDict, Literal
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# ==========================================
# 1. DEFINE THE SYSTEM STATE
# ==========================================
# The State keeps track of data passed between agents.
class AgentState(TypedDict):
    topic: str
    content: str
    critique: str
    revision_count: int
    status: str  # "approved" or "needs_revision"

# ==========================================
# 2. INITIALIZE THE LLM
# ==========================================
llm = ChatOllama(model="llama3.2:3b", temperature=0.7)

# ==========================================
# 3. DEFINE THE AGENTS (NODES)
# ==========================================

def writer_agent(state: AgentState) -> Dict:
    """Generates or updates the content based on topic and feedback."""
    topic = state["topic"]
    critique = state.get("critique", "")
    current_content = state.get("content", "")
    revision_count = state.get("revision_count", 0)

    if not current_content:
        # Initial draft request
        prompt = f"Write a short, engaging one-paragraph summary about: {topic}."
    else:
        # Revision request
        prompt = f"Revise the following text about '{topic}' by addressing this critique: '{critique}'.\n\nCurrent text: {current_content}"

    messages = [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    
    return {
        "content": response.content,
        "revision_count": revision_count + 1
    }


def critic_agent(state: AgentState) -> Dict:
    """Evaluates the content and decides if it passes quality control."""
    content = state["content"]
    
    system_prompt = (
        "You are an expert editor. Analyze the provided text. "
        "If it is good, clear, and informative, reply with exactly 'APPROVE'. "
        "If it lacks depth or clarity, provide a short, constructive one-sentence critique."
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Review this text: {content}")
    ]
    response = llm.invoke(messages)
    review_result = str(response.content).strip()

    if "APPROVE" in review_result:
        return {"status": "approved", "critique": ""}
    else:
        return {"status": "needs_revision", "critique": review_result}

# ==========================================
# 4. DEFINE THE ROUTER (CONDITIONAL EDGE)
# ==========================================
def routing_logic(state: AgentState) -> Literal["writer", "__end__"]:
    """Determines whether to loop back to the writer or finish."""
    # Safety breakout: stop looping if it hits 3 revisions to avoid infinite API costs
    if state["revision_count"] >= 3:
        print("--- [System Warning] Hit max revision limit. Forcing completion. ---")
        return END
        
    if state["status"] == "approved":
        return END
    else:
        return "writer"

# ==========================================
# 5. BUILD AND COMPILE THE GRAPH
# ==========================================
workflow = StateGraph(AgentState)

# Add our processing units (Nodes)
workflow.add_node("writer", writer_agent)
workflow.add_node("critic", critic_agent)

# Set up the operational flow (Edges)
workflow.set_entry_point("writer")      # Start here
workflow.add_edge("writer", "critic")     # Move from writer directly to critic

# Use conditional routing out of the critic node
workflow.add_conditional_edges(
    "critic",
    routing_logic,
    {
        "writer": "writer",
        END: END
    }
)

# Compile into an executable app with memory checkpointer
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

# ==========================================
# 6. RUN AND VALIDATE
# ==========================================
if __name__ == "__main__":
    initial_input = {
        "topic": "The importance of quantum computing in 2026",
        "content": "",
        "critique": "",
        "revision_count": 0,
        "status": ""
    }

    print("🚀 Initializing Multi-Agent Graph execution...\n")
    
    config = {"configurable": {"thread_id": "1"}}
    # Run the graph and stream state changes chronologically
    for event in app.stream(initial_input, config=config):
        for node_name, state_update in event.items():
            print(f"--- Node executed: [{node_name}] ---")
            if "content" in state_update:
                print(f"📝 Current Draft:\n{state_update['content']}\n")
            if "critique" in state_update and state_update["critique"]:
                print(f"❌ Critic Feedback:\n{state_update['critique']}\n")
            if "status" in state_update:
                print(f"✅ Critic Status Verdict: {state_update['status'].upper()}\n")
            print("="*50)

    # Fetch final output state
    final_state = app.get_state(config=config)
    print("\n🎉 Process Finished successfully!")
