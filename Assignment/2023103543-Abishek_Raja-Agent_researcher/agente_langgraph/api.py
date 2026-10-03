import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import os

import agente
from agente import compile_graph
from langchain_core.messages import HumanMessage
from mcp_client import mcp_lifespan
from projects import list_projects, create_project, delete_project
from chats import list_chats, create_chat, delete_chat
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Compose: bring up the AsyncSqliteSaver-backed graph + the MCP client lifespan."""
    db_path = os.path.join(os.path.dirname(__file__), "checkpoints.db")
    async with AsyncSqliteSaver.from_conn_string(db_path) as checkpointer:
        agente.graph = compile_graph(checkpointer)
        async with mcp_lifespan(app):
            yield
        agente.graph = None


app = FastAPI(title="Agente Educacional MCP y LangGraph", lifespan=lifespan)

# Habilitamos CORS para que los frontends (React) nos puedan consultar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    project_id: str
    chat_id: str | None = None


class ProjectCreate(BaseModel):
    name: str


class ChatCreate(BaseModel):
    name: str


@app.get("/api/projects")
def get_projects():
    return {"projects": list_projects()}


@app.post("/api/projects")
def post_project(req: ProjectCreate):
    return create_project(req.name)


@app.delete("/api/projects/{project_id}")
def remove_project(project_id: str):
    if not delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@app.get("/api/projects/{project_id}/chats")
def get_chats(project_id: str):
    return {"chats": list_chats(project_id)}


@app.post("/api/projects/{project_id}/chats")
def post_chat(project_id: str, req: ChatCreate):
    return create_chat(project_id, req.name)


@app.delete("/api/chats/{chat_id}")
def remove_chat(chat_id: str):
    if not delete_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}


@app.get("/api/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str, project_id: str):
    """Rehydrate the user-visible history for a chat from the LangGraph checkpoint."""
    config = {"configurable": {"thread_id": chat_id, "project_id": project_id}}
    state = await agente.graph.aget_state(config)
    if not state or not state.values:
        return {"messages": []}
    msgs = state.values.get("messages", [])
    output = []
    for m in msgs:
        cls = m.__class__.__name__
        if cls == "HumanMessage":
            output.append({"role": "user", "content": m.content})
        elif cls == "AIMessage" and m.content:
            output.append({"role": "agent", "content": m.content})
    return {"messages": output}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint principal para conversar con el Agente LangGraph.
    Retorna tanto la respuesta textual como el historial detallado de las Tools que usó.
    """
    try:
        thread_id = request.chat_id or request.project_id
        config = {"configurable": {"thread_id": thread_id, "project_id": request.project_id}}

        input_message = HumanMessage(content=request.message)
        result = await agente.graph.ainvoke({"messages": [input_message]}, config)
        
        # Procesamos solo la porción nueva del historial, omitiendo cosas de turnos anteriores
        new_messages = result["messages"]
        # Encontramos desde dónde empezó la conversación de ESTE turno específico
        # que sería a partir del último HumanMessage.
        start_index = 0
        for i in range(len(new_messages) - 1, -1, -1):
            if isinstance(new_messages[i], HumanMessage):
                start_index = i + 1
                break
                
        turn_messages = new_messages[start_index:]
        
        log_msgs = []
        for m in turn_messages:
            tool_calls = getattr(m, 'tool_calls', [])
            log_msgs.append({
                "type": m.__class__.__name__,
                "content": m.content,
                "tool_calls": tool_calls,
                "name": getattr(m, 'name', '') # Importante para saber qué Tool se ejecutó
            })
            
        return {
            "response": result["messages"][-1].content,
            "history": log_msgs,
            "workers": [
                {
                    "angle": wr["angle"],
                    "findings": wr["findings"],
                    "sources": wr["sources"],
                }
                for wr in (
                    result.get("worker_results", [])[-len(result.get("research_angles", [])):]
                    if result.get("research_angles") else []
                )
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Streaming variant of /api/chat. Returns Server-Sent Events with progress updates:
      - {"type": "planner", "angles": [...]}      planner chose to research
      - {"type": "direct", "content": "..."}      planner answered without research
      - {"type": "worker_done", "angle": "...", "findings": "...", "sources": [...]}
      - {"type": "token", "text": "..."}          synthesizer streaming tokens
      - {"type": "done"}                          graph finished
      - {"type": "error", "message": "..."}       something blew up
    """
    thread_id = request.chat_id or request.project_id
    config = {"configurable": {"thread_id": thread_id, "project_id": request.project_id}}
    input_message = HumanMessage(content=request.message)

    async def event_generator():
        def sse(payload: dict) -> str:
            return f"data: {json.dumps(payload)}\n\n"

        try:
            async for mode, chunk in agente.graph.astream(
                {"messages": [input_message]},
                config,
                stream_mode=["updates", "messages"],
            ):
                if mode == "updates":
                    # chunk is {node_name: state_update}
                    for node_name, update in chunk.items():
                        if node_name == "planner":
                            if update.get("research_angles"):
                                yield sse({"type": "planner", "angles": update["research_angles"]})
                            elif update.get("messages"):
                                # Direct-response path (no research needed)
                                yield sse({"type": "direct", "content": update["messages"][-1].content})
                        elif node_name == "research_worker":
                            # Each worker finishing produces its own update with one WorkerResult
                            for wr in update.get("worker_results", []):
                                yield sse({
                                    "type": "worker_done",
                                    "angle": wr["angle"],
                                    "findings": wr["findings"],
                                    "sources": wr["sources"],
                                })
                        # synthesizer 'updates' event is redundant — tokens already streamed
                elif mode == "messages":
                    # chunk is (AIMessageChunk, metadata)
                    msg_chunk, metadata = chunk
                    if metadata.get("langgraph_node") == "synthesizer":
                        text = getattr(msg_chunk, "content", "") or ""
                        if text:
                            yield sse({"type": "token", "text": text})

            yield sse({"type": "done"})
        except Exception as e:
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/hechos")
def get_hechos(project_id: str = "default"):
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb"))
    if not os.path.exists(db_path):
        return {"hechos": []}

    import lancedb
    db = lancedb.connect(db_path)
    if "hechos" not in db.table_names():
        return {"hechos": []}

    tbl = db.open_table("hechos")
    rows = tbl.to_arrow().to_pylist()

    if not rows:
        return {"hechos": []}

    rows = [r for r in rows if r.get("project_id", "default") == project_id]
    rows.sort(key=lambda x: x["fecha"], reverse=True)

    return {"hechos": [{"id": len(rows) - i, "contenido": r["texto"], "fecha": r["fecha"]} for i, r in enumerate(rows)]}

@app.get("/api/pdf-chunks")
def get_pdf_chunks(project_id: str = "default"):
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb"))
    if not os.path.exists(db_path):
        return {"chunks": []}

    import lancedb
    db = lancedb.connect(db_path)
    if "pdf_chunks" not in db.table_names():
        return {"chunks": []}

    tbl = db.open_table("pdf_chunks")
    rows = tbl.to_arrow().to_pylist()

    if not rows:
        return {"chunks": []}

    rows = [r for r in rows if r.get("project_id", "default") == project_id]
    rows.sort(key=lambda x: (x.get("source_url", ""), x.get("chunk_index", 0)))

    return {"chunks": [
        {
            "texto": r["texto"],
            "source_url": r.get("source_url", ""),
            "page": r.get("page", 0),
            "chunk_index": r.get("chunk_index", 0),
            "fecha": r.get("fecha", ""),
        }
        for r in rows
    ]}


@app.get("/api/documents")
def get_documents(project_id: str = "default"):
    """List documents (papers) associated with a project via indexed chunks."""
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb"))
    papers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "papers"))

    # Get unique source_urls for this project from pdf_chunks
    project_urls: set[str] = set()
    if os.path.exists(db_path):
        import lancedb
        db = lancedb.connect(db_path)
        if "pdf_chunks" in db.table_names():
            rows = db.open_table("pdf_chunks").to_arrow().to_pylist()
            for r in rows:
                if r.get("project_id", "default") == project_id:
                    project_urls.add(r.get("source_url", ""))

    # Match URLs to local files and collect metadata
    documents = []
    for url in sorted(project_urls):
        if not url:
            continue
        # Reconstruct filename the same way process_pdf does
        import re
        raw_filename = url.split("/")[-1].split("?")[0].split("#")[0]
        clean_filename = re.sub(r'[^\w\d.\-]', '_', raw_filename)
        if not clean_filename.lower().endswith(".pdf"):
            clean_filename += ".pdf"
        file_path = os.path.join(papers_dir, clean_filename)

        chunks_count = sum(1 for r in rows if r.get("source_url") == url and r.get("project_id", "default") == project_id)
        documents.append({
            "filename": clean_filename,
            "source_url": url,
            "chunks": chunks_count,
            "downloaded": os.path.exists(file_path),
        })

    return {"documents": documents}


@app.get("/api/documents/download/{filename}")
def download_document(filename: str):
    """Serve a downloaded paper file."""
    papers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "papers"))
    file_path = os.path.join(papers_dir, filename)
    if not os.path.exists(file_path) or not os.path.abspath(file_path).startswith(papers_dir):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf")
