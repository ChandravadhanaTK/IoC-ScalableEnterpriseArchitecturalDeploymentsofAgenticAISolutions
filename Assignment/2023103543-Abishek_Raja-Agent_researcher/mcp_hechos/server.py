import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), "..", "agente_langgraph", ".env")
load_dotenv(env_path)

import lancedb
from openai import OpenAI
import datetime
from mcp.server.fastmcp import FastMCP

# Configuración de base de datos
DB_PATH = os.path.join(os.path.dirname(__file__), "hechos_lancedb")
db = lancedb.connect(DB_PATH)

# El cliente OpenAI asume que OPENAI_API_KEY está en entorno
client = OpenAI()

def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

# Inicializamos el servidor FastMCP
mcp = FastMCP("ServidorHechosLanceDB")

@mcp.tool()
def guardar_si_es_hecho(texto: str, project_id: str = "default") -> str:
    """
    Guarda un texto en la base de datos de hechos vectoriales.

    El Agente LLM debería utilizar esta herramienta si, a su juicio, la frase del
    usuario constituye un 'hecho' o información vital que debe ser recordada.
    """
    try:
        vector = get_embedding(texto)
        fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        data = [{"texto": texto, "vector": vector, "fecha": fecha, "project_id": project_id}]

        if "hechos" not in db.table_names():
            db.create_table("hechos", data=data)
        else:
            tbl = db.open_table("hechos")
            tbl.add(data)

        return f"✅ Hecho guardado y vectorizado en LanceDB: '{texto}'"
    except Exception as e:
        return f"❌ Error guardando hecho: {str(e)}"

@mcp.tool()
def search_best_hecho(query: str, project_id: str = "default") -> str:
    """
    Busca el hecho más relevante en la BD de forma semántica usando embeddings.
    Retorna el hecho que más coincida con el significado de la búsqueda.
    """
    if "hechos" not in db.table_names():
        return "❌ La base de datos está vacía, no hay hechos."

    try:
        query_vector = get_embedding(query)
        tbl = db.open_table("hechos")
        results = tbl.search(query_vector).where(f"project_id = '{project_id}'").limit(1).to_list()
        
        if results:
            mejor_hecho = results[0]["texto"]
            distancia = results[0].get("_distance", 0.0)
            return f"🔎 Mejor hecho encontrado (Distancia {distancia:.4f}): {mejor_hecho}"
        return "❌ No se encontraron hechos relevantes."
    except Exception as e:
        return f"❌ Error buscando hecho: {str(e)}"

@mcp.tool()
def rag_hechos(query: str, project_id: str = "default") -> str:
    """
    Retrieve index of pdf chunks that are relevant to the query, and return the text of those chunks as context.

      - Use 'query' to semantically search for info of the previosly processed PDF.
      Requires the same 'url' that was passed to process_pdf.
    """
    if "hechos" not in db.table_names():
        return "❌ No hay contexto en la DB."

    try:
        query_vector = get_embedding(query)
        tbl = db.open_table("hechos")
        results = tbl.search(query_vector).where(f"project_id = '{project_id}'").limit(5).to_list()
        
        if results:
            hechos = [res["texto"] for res in results]
            contexto = " | ".join(hechos)
            return f"📚 Contexto semántico recuperado para '{query}': {contexto}"
        return f"❌ No se pudo recuperar contexto."
    except Exception as e:
        return f"❌ Error recuperando contexto: {str(e)}"

@mcp.tool()
def rag_pdf(url: str, query: str = None, chunk_range: str = None, project_id: str = "default") -> str:
    """Read content from a PDF that was previously indexed with process_pdf.

    - Use 'chunk_range' (e.g. "5-10") to read specific sections from the structural map.
    - Use 'query' to semantically search within that PDF.
    Requires the same 'url' that was passed to process_pdf.
    """

    if chunk_range:
        try:
            table = db.open_table("pdf_chunks")
            start, end = map(int, chunk_range.split('-'))

            filter_stmt = f"source_url = '{url}' AND project_id = '{project_id}' AND chunk_index BETWEEN {start} AND {end}"
            
            results = table.search().where(filter_stmt).to_pandas().sort_values("chunk_index") # Critical to keep the text in order
            
            
            if results.empty:
                return f"No data encontrada para {url} en el rango {chunk_range}."

            context = "\n\n".join(results["texto"].tolist())
            return f"--- Retrieved Chunks {chunk_range} ---\n\n{context}"
            
        except Exception as e:
            return f"Error realizando la busqueda por chunk_range:  {str(e)}"

    if query:
        table = db.open_table("pdf_chunks")
        query_vec = get_embedding(query)
        results = table.search(query_vec).where(f"source_url = '{url}' AND project_id = '{project_id}'").limit(5).to_pandas()
        
        
        if results.empty:
            return "No se encontraron resultados relevantes para la consulta."

        output = []
        for _, row in results.iterrows():
            # Using your keys: page, chunk_index, and texto
            header = f"[Page {row['page']}, Chunk {row['chunk_index']}]"
            output.append(f"{header}\n{row['texto']}")

        return f"--- Semantic Search Results ---\n\n" + "\n\n---\n\n".join(output)

    return "Provide 'query' or 'chunk_range'."

if __name__ == "__main__":
    # Ejecuta el servidor MCP comunicándose por standard input/output (stdio)
    mcp.run(transport="stdio")
