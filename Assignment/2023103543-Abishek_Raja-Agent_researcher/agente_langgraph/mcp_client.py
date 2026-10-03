import os
import sys
from fastapi import FastAPI
from contextlib import asynccontextmanager
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

# Variables globales para manejar la conexión MCP
mcp_session = None

@asynccontextmanager
async def mcp_lifespan(app: FastAPI):
    """Maneja el ciclo de vida de conexión al servidor MCP local de Python mediante stdio."""
    global mcp_session
    server_path = os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "server.py")
    server_path = os.path.abspath(server_path)
    
    server_params = StdioServerParameters(command=sys.executable, args=[server_path])
    
    # Entramos al contexto del servidor stdio
    async with stdio_client(server_params) as (read_stream, write_stream):
        # Y luego al contexto de la sesión
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            mcp_session = session
            print("✅ Cliente LangGraph conectado exitosamente a MCP Hechos!")
            
            # Cede el control de vuelta a la app (FastAPI arrancará aquí)
            yield
            
            # Al salir de FastAPI, pasará por aquí y AnyIO cerrará limpio
            print("❌ Desconectando MCP Hechos...")
            mcp_session = None

async def mcp_guardar_si_es_hecho(texto: str, project_id: str = "default") -> str:
    """Envía un hecho al servidor MCP para guardarlo en la base de datos de hechos."""
    global mcp_session
    res = await mcp_session.call_tool("guardar_si_es_hecho", arguments={"texto": texto, "project_id": project_id})
    return res.content[0].text

async def mcp_search_best_hecho(query: str, project_id: str = "default") -> str:
    """Busca el mejor hecho en el MCP utilizando palabras clave."""
    global mcp_session
    res = await mcp_session.call_tool("search_best_hecho", arguments={"query": query, "project_id": project_id})
    return res.content[0].text

async def mcp_rag_hechos(query: str, project_id: str = "default") -> str:
    """Invoca la herramienta RAG del MCP para obtener contexto de los hechos anteriores."""
    global mcp_session
    res = await mcp_session.call_tool("rag_hechos", arguments={"query": query, "project_id": project_id})
    return res.content[0].text

async def mcp_rag_pdfs(url: str, chunk_range: str = None, query: str = None, project_id: str = "default") -> str:
    """Busca informacion especifica dentro de un PDF utilizando RAG en el MCP. Puedes ir directamente a una sección específica del PDF o hacer una búsqueda semántica dentro de él.
        - 'url' es la dirección del PDF a analizar.
        - Use 'chunk_range' (e.g. "5-10") to read specific sections from the structural map.
        - Use 'query' to semantically search within that PDF.
    """
    global mcp_session
    arguments = {"url": url, "project_id": project_id}
    if query:
        arguments["query"] = query
    if chunk_range:
        arguments["chunk_range"] = chunk_range
    res = await mcp_session.call_tool("rag_pdf", arguments=arguments)
    return res.content[0].text

# Exportamos la lista de "Tools" que vienen del MCP
mcp_tools_list = [
    mcp_guardar_si_es_hecho,
    mcp_search_best_hecho,
    mcp_rag_hechos,
    mcp_rag_pdfs
]
