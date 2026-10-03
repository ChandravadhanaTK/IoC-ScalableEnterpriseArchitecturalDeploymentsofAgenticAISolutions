import os
import datetime
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel
from langgraph.types import Send
from langchain_openai import ChatOpenAI
from state import OverallState
from worker import WORKER_SYSTEM_PROMPT, worker_subgraph


load_dotenv()

_HECHOS_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb")


def _embed(text: str) -> list[float]:
    from openai import OpenAI
    client = OpenAI()
    return client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding


def _rag_hechos_local(query: str, project_id: str, k: int = 5) -> str:
    """Retrieve top-k semantically relevant hechos for this project. Returns joined text or ''."""
    import lancedb
    if not os.path.exists(_HECHOS_DB_PATH):
        return ""
    db = lancedb.connect(_HECHOS_DB_PATH)
    if "hechos" not in db.table_names():
        return ""
    try:
        qvec = _embed(query)
        tbl = db.open_table("hechos")
        results = tbl.search(qvec).where(f"project_id = '{project_id}'").limit(k).to_list()
        if not results:
            return ""
        return "\n".join(f"- {r['texto']}" for r in results)
    except Exception:
        return ""


def _save_hecho_local(texto: str, project_id: str):
    """Append a hecho row to the project-scoped LanceDB table."""
    import lancedb
    db = lancedb.connect(_HECHOS_DB_PATH)
    vector = _embed(texto)
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    data = [{"texto": texto, "vector": vector, "fecha": fecha, "project_id": project_id}]
    if "hechos" not in db.table_names():
        db.create_table("hechos", data=data)
    else:
        db.open_table("hechos").add(data)

llm_planner = ChatOpenAI(model="gpt-5.4-mini", temperature=0.2, streaming=True) # Asume OPENAI_API_KEY

class PlannerOutput(BaseModel):
    needs_research: bool
    angles: list[str]          # populated if needs_research=True, else []
    direct_response: str | None # populated if needs_research=False, else None

_PLANNER_BASE_PROMPT = """Eres un asistente de investigacion que enruta conversaciones.

Antes de decidir, LEE TODO el historial de mensajes anteriores Y la MEMORIA DEL PROYECTO si esta presente. Tu tarea es distinguir entre:

(A) El usuario pide informacion NUEVA que no esta en el historial ni en la memoria → needs_research=true, angles=[3-5 ángulos], direct_response=null.

(B) El usuario hace una aclaracion, pregunta de seguimiento, resumen, o pide reformular algo que ya se investigo (en el historial) o que ya esta guardado (en la memoria del proyecto) → needs_research=false, angles=[], direct_response=tu respuesta basada en el contexto previo.

(C) Saludo, charla casual, o pregunta que puedes responder con conocimiento general sin investigar → needs_research=false, angles=[], direct_response=tu respuesta.

Regla clave: PREFIERE (B) sobre (A) si la respuesta es derivable del historial o de la memoria. Solo lanza investigacion nueva cuando el usuario pide algo que genuinamente no esta cubierto."""


def planner_node(state: OverallState, config: RunnableConfig):
    project_id = config.get("configurable", {}).get("project_id", "default")
    messages = state["messages"]

    # Memory READ: pull project-scoped hechos relevant to the latest user message
    hechos_context = ""
    last_user = next((m for m in reversed(messages) if isinstance(m, HumanMessage)), None)
    if last_user:
        hechos_context = _rag_hechos_local(str(last_user.content), project_id)

    sys_content = _PLANNER_BASE_PROMPT
    if hechos_context:
        sys_content += f"\n\nMEMORIA DEL PROYECTO (hechos guardados de conversaciones previas en este proyecto):\n{hechos_context}"
    sys_msg = SystemMessage(content=sys_content)

    # Build LLM input fresh each turn — system message is not persisted in state
    if messages and isinstance(messages[0], SystemMessage):
        llm_input = [sys_msg] + list(messages[1:])
    else:
        llm_input = [sys_msg] + list(messages)

    llm_structured = llm_planner.with_structured_output(PlannerOutput)
    plan = llm_structured.invoke(llm_input)
    if plan.needs_research:
        return {"research_angles": plan.angles}
    else:
        return {"messages": [AIMessage(content=plan.direct_response)], "research_angles": []}

def route_after_planner(state: OverallState):
    if len(state.get("research_angles") or []) > 0:
        question = next(m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage))
        return [
            Send("research_worker", {
                "messages": [
                    SystemMessage(content=WORKER_SYSTEM_PROMPT),
                    HumanMessage(content=f"ÁNGULO: {angle}\nPREGUNTA: {question}"),
                ],
                "angle": angle,
                "iteration_count": 0,
            })
            for angle in state["research_angles"]
        ]
    else:
        # Direct-response path also passes through memory_node so casual-chat facts get saved
        return "memory_node"

llm_synthe = ChatOpenAI(model="gpt-5.4", temperature=0.2, streaming=True) # Asume OPENAI_API_KEY

async def synthesizer_node(state: OverallState):
    # Only synthesize results from THIS turn. `worker_results` accumulates across
    # turns via operator.add, but `research_angles` is overwritten each turn by the
    # planner, so the current turn's results are the last N entries (N = angles).
    n_current = len(state.get("research_angles", []))
    current_results = state["worker_results"][-n_current:] if n_current else []

    findings_text = "\n\n".join([
      f"## Ángulo: {wr['angle']}\n\nHallazgos:\n{wr['findings']}\n\nFuentes:\n" +
      "\n".join(f"- {s}" for s in wr['sources'])
      for wr in current_results
      ])
    original_question = next(m.content for m in reversed(state["messages"]) if isinstance(m, HumanMessage))
    synthesis_prompt = HumanMessage(content=f"""Pregunta original: {original_question}
        Hallazgos de los investigadores:
        {findings_text}
        Sintetiza estos hallazgos en una respuesta final en español con citas.""")

    response = await llm_synthe.ainvoke([synthesis_prompt])

    return {"messages": [response]}


# --- Memory node: runs at the end of BOTH paths (direct + research+synthesis) ---
# Decides if the latest user/agent exchange contains durable facts worth saving as hechos.

llm_memory = ChatOpenAI(model="gpt-5.4-mini", temperature=0.0)


class MemoryDecision(BaseModel):
    should_save: bool
    facts: list[str]  # standalone declarative sentences; empty if should_save=False


_MEMORY_PROMPT_TEMPLATE = """Analiza el último intercambio y decide si contiene un hecho duradero sobre el usuario o el proyecto que valga la pena recordar para futuras conversaciones.

GUARDA solo:
- Hechos personales declarados sobre el usuario (nombre, preferencias, rol, ubicación, etc.)
- Decisiones, objetivos o restricciones del proyecto que el usuario menciona
- Información factual confirmada que sera util en conversaciones futuras

NO GUARDES:
- Preguntas o solicitudes
- Charla casual o saludos sin contenido factual
- Respuestas del agente que solo repiten lo que el usuario dijo
- Información temporal de un solo uso

Cada hecho debe ser una frase declarativa corta y standalone (sin pronombres ambiguos como "él", "esto", "eso").

Usuario dijo: "{user_msg}"
Agente respondió: "{ai_msg}"

Si hay algo que valga la pena guardar, devuelve should_save=true y la lista de hechos.
Si no, should_save=false y facts=[]."""


async def memory_node(state: OverallState, config: RunnableConfig):
    project_id = config.get("configurable", {}).get("project_id", "default")
    msgs = state["messages"]
    last_user = next((m for m in reversed(msgs) if isinstance(m, HumanMessage)), None)
    last_ai = next((m for m in reversed(msgs) if isinstance(m, AIMessage)), None)
    if not last_user or not last_ai or not last_ai.content:
        return {}

    prompt = _MEMORY_PROMPT_TEMPLATE.format(
        user_msg=str(last_user.content),
        ai_msg=str(last_ai.content),
    )

    try:
        decision = await llm_memory.with_structured_output(MemoryDecision).ainvoke(prompt)
    except Exception:
        return {}

    if decision.should_save and decision.facts:
        for fact in decision.facts:
            try:
                _save_hecho_local(fact, project_id)
            except Exception:
                pass  # never break the conversation if hecho write fails

    return {}


# Construcción de las aristas y el flujo del grafo
graph_builder = StateGraph(OverallState)
graph_builder.add_node("planner", planner_node)
graph_builder.add_node("research_worker", worker_subgraph)  # from worker.py
graph_builder.add_node("synthesizer", synthesizer_node)
graph_builder.add_node("memory_node", memory_node)

graph_builder.add_edge(START, "planner")
graph_builder.add_conditional_edges("planner", route_after_planner, ["research_worker", "memory_node"])
graph_builder.add_edge("research_worker", "synthesizer")
graph_builder.add_edge("synthesizer", "memory_node")
graph_builder.add_edge("memory_node", END)
                                                                                                                                                                                                                                               

# Module-level placeholder. The compiled graph is set by api.py's lifespan, which owns
# the AsyncSqliteSaver context. Endpoints read `agente.graph` at request time.
graph = None


def compile_graph(checkpointer):
    """Compile graph_builder against a runtime-supplied checkpointer (typically AsyncSqliteSaver)."""
    return graph_builder.compile(checkpointer=checkpointer)
