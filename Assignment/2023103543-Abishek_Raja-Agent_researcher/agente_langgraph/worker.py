import re
from typing import Literal
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolNode
from langchain_core.messages import  AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from local_tools import local_tools
from state import OverallState, WorkerState
load_dotenv()

WORKER_SYSTEM_PROMPT = """Eres un trabajador de investigación. Tu tarea es seguir el ángulo de investigación que se te asigna y recopilar información relevante utilizando las herramientas a tu disposición.
    Cuando recibas un ángulo de investigación, debes:
    1. Analizar el ángulo y determinar qué herramientas son más adecuadas para recopilar información relevante.
    2. Utilizar las herramientas para investigar el ángulo asignado.
    3. Recopilar y organizar la información obtenida de las herramientas.
    4. Reportar tus hallazgos de manera clara y concisa, asegurándote de que la información recopilada esté directamente relacionada con el ángulo de investigación asignado.
    Recuerda que tu objetivo es proporcionar información útil y relevante que pueda ayudar a responder la consulta original del usuario, siguiendo el ángulo de investigación asignado de manera efectiva.
"""

llm = ChatOpenAI(model="gpt-5.4-nano", temperature=0.0, streaming=True) # Asume OPENAI_API_KEY

llm_with_tools = llm.bind_tools(local_tools)

def worker_chatbot(state: WorkerState):
    return {
        "messages": [llm_with_tools.invoke(state["messages"])],
        "iteration_count": state.get('iteration_count', 0) + 1,
    }

def collect_result(state: WorkerState):
    """Collect results from the worker and decide if more iterations are needed"""

    last_message = state["messages"][-1].content if isinstance(state["messages"][-1],AIMessage) else ""
    tool_history = [tc for m in state["messages"] if isinstance(m, AIMessage) for tc in m.tool_calls] 
    sources = re.findall(r'\[Source:\s*(https?://\S+)\]', last_message)
    return {"worker_results": [{"angle": state["angle"], "findings": last_message, "sources": sources, "tool_history": tool_history}]}

def should_continue(state: WorkerState ) -> Literal["tool_node", "collect_result"]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]

    if state.get("iteration_count", 0) >= 6:  # Safety check to prevent infinite loops
         return "collect_result"
    if last_message.tool_calls:
        return "tool_node"

    return "collect_result"

tool_node = ToolNode(local_tools)

subagent_builder = StateGraph(WorkerState, output_schema=OverallState)  # output schema maps to parent
subagent_builder.add_node("chatbot", worker_chatbot)
subagent_builder.add_node("tool_node", tool_node)
subagent_builder.add_node("collect_result", collect_result)

subagent_builder.add_edge(START, "chatbot")
subagent_builder.add_conditional_edges("chatbot", should_continue, ["tool_node", "collect_result"])
subagent_builder.add_edge("tool_node", "chatbot")
subagent_builder.add_edge("collect_result", END)
worker_subgraph = subagent_builder.compile()
