import sys
import os
from dotenv import load_dotenv
from typing import Annotated
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool, InjectedToolArg

# Carga las variables de entorno desde un archivo .env (vital para OPENAI_API_KEY)
load_dotenv()

# Agregamos la ruta base para poder importar herramientas del cliente si fuera necesario
sys.path.append(os.path.dirname(__file__))

def search_web(query: str) -> str:
    """Search the web for information. Returns a list of results with URLs and snippets.
   
      After getting results, you MUST process the URLs:
      - PDF URLs (.pdf) → use process_pdf
      - Web page URLs → use scrape_web
      """
    from tavily import TavilyClient
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = client.search(
        query=query,
        search_depth="advanced",
        num_results=10,
    )
    return response['results'] 

PDF_INDEX_PATH = os.path.join(os.path.dirname(__file__), "pdf_index.json")

def _load_pdf_index() -> dict:
    import json
    if os.path.exists(PDF_INDEX_PATH):
        with open(PDF_INDEX_PATH, "r") as f:
            return json.load(f)
    return {}

def _save_pdf_index(index: dict):
    import json
    with open(PDF_INDEX_PATH, "w") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

@tool
def process_pdf(url: str, config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """
    Download a PDF from a URL, split it into chunks, and index it in the vector database.

      Use this when a URL points to a PDF file (contains .pdf in the URL).
      Returns a structural map with title, abstract, sections, and chunk ranges.
      After indexing, use rag_pdf to query specific content from the PDF.
      If the PDF was already processed, returns the cached structural map immediately.
    """
    # Check if already processed
    pdf_index = _load_pdf_index()
    if url in pdf_index:
        cached = pdf_index[url]
        return f"[ALREADY INDEXED — use rag_pdf_local to query]\n{cached['structural_map']}"

    project_id = config.get("configurable", {}).get("project_id", "default")
    import httpx
    import pymupdf4llm
    import re
    import lancedb
    import datetime
    from openai import OpenAI

    openai_client = OpenAI()
    db = lancedb.connect(os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb"))
    # --- A, B, C) Filename, Cache & Download ---
    raw_filename = url.split("/")[-1].split("?")[0].split("#")[0]
    clean_filename = re.sub(r'[^\w\d.\-]', '_', raw_filename)
    if not clean_filename.lower().endswith(".pdf"):
        clean_filename += ".pdf"
    
    os.makedirs("papers", exist_ok=True)
    file_path = os.path.join("papers", clean_filename)

    if not os.path.exists(file_path):
        try:
            with httpx.Client(follow_redirects=True, timeout=60.0) as client:
                resp = client.get(url)
                resp.raise_for_status()
                with open(file_path, "wb") as f:
                    f.write(resp.content)
        except httpx.HTTPStatusError as e:
            return f"❌ Could not download PDF (HTTP {e.response.status_code}): {url}"
        except httpx.RequestError as e:
            return f"❌ Could not download PDF (connection error): {url}"

    try:
        pages = pymupdf4llm.to_markdown(file_path, page_chunks=True)
    except Exception:
        # Fallback: extract page-by-page, skipping broken pages
        import pymupdf
        doc = pymupdf.open(file_path)
        pages = []
        for i, page in enumerate(doc):
            try:
                pages.append({"text": page.get_text("text"), "metadata": {"page": i + 1}})
            except Exception:
                continue
        doc.close()
        if not pages:
            return f"❌ Could not parse PDF: {url}"

    # --- First pass: chunk text and extract structure ---
    chunks_to_store = []
    sections = []
    current_chunk_text = ""
    current_page = 1
    chunk_index = 0
    MAX_CHARS = 3200
    title = clean_filename
    abstract = ""

    for page_idx, page in enumerate(pages):
        page_num = page_idx + 1
        paragraphs = page["text"].split("\n\n")

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            header_match = re.match(r'^(#+)\s+(.*)', para)
            if header_match:
                level = len(header_match.group(1))
                header_text = header_match.group(2)
                if level == 1 and title == clean_filename:
                    title = header_text
                sections.append({"title": header_text, "page": page_num, "start_chunk": chunk_index})

            if "abstract" in para.lower() and len(para) > 50 and not abstract:
                abstract = para.replace("Abstract", "").strip()[:500] + "..."

            if len(current_chunk_text) + len(para) > MAX_CHARS and current_chunk_text:
                chunks_to_store.append({"texto": current_chunk_text.strip(), "page": current_page, "chunk_index": chunk_index})
                chunk_index += 1
                current_chunk_text = para
                current_page = page_num
            else:
                if not current_chunk_text:
                    current_page = page_num
                current_chunk_text += "\n\n" + para if current_chunk_text else para

    if current_chunk_text:
        chunks_to_store.append({"texto": current_chunk_text.strip(), "page": current_page, "chunk_index": chunk_index})

    texts = [c["texto"] for c in chunks_to_store]
    embeddings = openai_client.embeddings.create(input=texts, model="text-embedding-3-small").data
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    records = [
        {
            "texto": chunk["texto"],
            "vector": embeddings[i].embedding,
            "source_url": url,
            "page": chunk["page"],
            "chunk_index": chunk["chunk_index"],
            "fecha": fecha,
            "project_id": project_id,
        }
        for i, chunk in enumerate(chunks_to_store)
    ]

    # --- Batch insert into LanceDB ---
    if records:
        if "pdf_chunks" not in db.table_names():
            db.create_table("pdf_chunks", data=records)
        else:
            db.open_table("pdf_chunks").add(records)

    # --- H) Format Structured Return ---
    # Map end_chunks for sections
    section_list = []
    for i, sec in enumerate(sections):
        end_chunk = sections[i+1]["start_chunk"] - 1 if i+1 < len(sections) else chunk_index
        section_list.append(f"- {sec['title']} (page {sec['page']}, chunks {sec['start_chunk']}-{max(sec['start_chunk'], end_chunk)})")

    sections_str = "\n  ".join(section_list) if section_list else "- No clear sections detected."

    structural_map = (
        f"PDF: \"{title}\"\n"
        f"Stored: {file_path} ({len(chunks_to_store)} chunks indexed)\n"
        f"Source: {url}\n\n"
        f"Abstract: \"{abstract if abstract else 'No abstract detected.'}\"\n\n"
        f"Sections:\n  {sections_str}"
    )

    # Save to persistent index so future calls skip re-processing
    pdf_index[url] = {"title": title, "file_path": file_path, "chunks": len(chunks_to_store), "structural_map": structural_map}
    _save_pdf_index(pdf_index)

    return structural_map


@tool
def scrape_web(urls: list[str], query: str, config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """Extract and summarize content from web pages. Pass all URLs in one call.

      Handles both HTML pages and PDFs — PDF URLs are automatically detected
      and routed through process_pdf for indexing.
      Use 'query' to focus the summary on what's relevant to the research.
      """
    import trafilatura
    from langchain_openai import ChatOpenAI
    results = []
    pdf_urls = {u for u in urls if u.lower().split("?")[0].split("#")[0].endswith(".pdf")}
    for pdf_url in pdf_urls:
        pdf_result = process_pdf.invoke({"url": pdf_url, "config": config})
        results.append(f"📎 PDF auto-routed → process_pdf:\n{pdf_result}")
    for url in urls:
        if url in pdf_urls:
            continue
        # 1. Descargar y extraer contenido limpio
        try:
            downloaded = trafilatura.fetch_url(url)
        except Exception as e:
            results.append(f"❌ Error de conexión: {url} — {e}")
            continue
        if not downloaded:
            results.append(f"❌ No se pudo descargar: {url}")
            continue

        text = trafilatura.extract(downloaded, include_links=True, include_tables=True)
        if not text:
            results.append(f"❌ No se pudo extraer contenido de: {url}")
            continue

        # 2. Truncar a ~8000 chars para no exceder contexto del LLM de resumen
        text = text[:8000]

        # 3. Resumir con LLM aparte (no entra al estado del agente principal)
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        summary = llm.invoke(
            f"Resume el siguiente contenido web enfocándote en lo relevante a: '{query}'\n\n{text}"
        )
        results.append(f"📄 {url}:\n{summary}")

    return "\n\n".join(results)


@tool
def rag_pdf_local(url: str, query: str, config: Annotated[RunnableConfig, InjectedToolArg]) -> str:
    """Search within a previously indexed PDF by semantic query.
    Use this after process_pdf to find specific content in a PDF you already indexed.
    Requires the same 'url' that was passed to process_pdf.
    """
    import lancedb
    from openai import OpenAI

    project_id = config.get("configurable", {}).get("project_id", "default")
    db_path = os.path.join(os.path.dirname(__file__), "..", "mcp_hechos", "hechos_lancedb")
    db = lancedb.connect(db_path)

    if "pdf_chunks" not in db.table_names():
        return "❌ No PDFs have been indexed yet."

    try:
        openai_client = OpenAI()
        query_vec = openai_client.embeddings.create(
            input=[query], model="text-embedding-3-small"
        ).data[0].embedding

        table = db.open_table("pdf_chunks")
        results = table.search(query_vec).where(f"source_url = '{url}' AND project_id = '{project_id}'").limit(5).to_list()

        if not results:
            return f"❌ No relevant results found for query in PDF: {url}"

        output = []
        for row in results:
            header = f"[Page {row['page']}, Chunk {row['chunk_index']}]"
            output.append(f"{header}\n{row['texto']}")

        return f"--- Semantic Search Results for '{query}' ---\n\n" + "\n\n---\n\n".join(output)
    except Exception as e:
        return f"❌ Error querying PDF: {str(e)}"


@tool
def list_indexed_pdfs() -> str:
    """List all PDFs that have already been processed and indexed.
    Use this to check what's available before calling process_pdf (to avoid re-processing)
    or to find URLs for rag_pdf_local queries.
    """
    pdf_index = _load_pdf_index()
    if not pdf_index:
        return "No PDFs have been indexed yet."
    lines = []
    for url, info in pdf_index.items():
        lines.append(f"- \"{info['title']}\" ({info['chunks']} chunks) → {url}")
    return "Indexed PDFs:\n" + "\n".join(lines)


local_tools = [search_web, scrape_web, process_pdf, rag_pdf_local, list_indexed_pdfs]
