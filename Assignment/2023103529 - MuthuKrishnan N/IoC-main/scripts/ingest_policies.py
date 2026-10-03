import sys
from pathlib import Path

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.rag.ingestion import ingest_all_policies

def main():
    print("[INFO] Ingesting corporate policies from data/policies into ChromaDB Vector Store...")
    count = ingest_all_policies()
    print(f"[SUCCESS] Ingestion complete. Indexed {count} chunks with full metadata & embeddings.")

if __name__ == "__main__":
    main()
