import argparse
import sys
import os
from dotenv import load_dotenv

# Load .env from project root so GEMINI_API_KEY is available
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agents import store
from agents.classify import classify_all
from agents.config import Config
from agents.llm import make_llm_client


DEFAULT_PATHS = store.DEFAULT_PATHS


def resolve_paths(evidence_dir=None):
    """Build paths under an evidence dir (strips leading 'evidence/')."""
    paths = {}
    if evidence_dir:
        for k, v in DEFAULT_PATHS.items():
            rel = os.path.sep.join(v.replace("\\", "/").split("/")[1:])
            paths[k] = os.path.join(evidence_dir, rel)
    else:
        paths = dict(DEFAULT_PATHS)
    return paths


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 3/4: classify candidate threads")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None, help="overrides evidence/ dir")
    ap.add_argument("--no-broad-pass", action="store_true",
                    help="skip the broad LLM pass over non-candidates")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = resolve_paths(args.evidence_dir)

    threads_by_id = {t.thread_id: t for t in store.load_threads(paths["emailstore"])}
    candidates = store.load_candidates(paths["candidates"])
    threads = [threads_by_id[tid] for tid in candidates if tid in threads_by_id]

    client = make_llm_client(cfg)
    results = classify_all(client, threads, cfg, paths["classifications"], paths["problems"])

    from collections import Counter
    dist = Counter(c.outcome for c in results.values())
    print(f"classified {len(results)} threads")
    for outcome, count in sorted(dist.items()):
        print(f"  {outcome}: {count}")


if __name__ == "__main__":
    main()