import argparse
import os

from agents import store
from agents import score
from agents.classify import broad_pass
from agents.llm import make_llm_client
from agents.config import Config


def resolve_paths(evidence_dir):
    """Build absolute paths under an evidence dir (overrides CJE_SINGLE path)."""
    paths = {}
    if evidence_dir:
        for k, v in store.DEFAULT_PATHS.items():
            rel = os.path.sep.join(v.replace("\\", "/").split("/")[1:])
            paths[k] = os.path.join(evidence_dir, rel)
    else:
        paths = dict(store.DEFAULT_PATHS)
    return paths


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 2: detect candidate threads via scoring rules")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--broad-pass", action="store_true",
                    help="run a small LLM pass over non-candidates")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = resolve_paths(args.evidence_dir)

    threads = store.load_threads(paths["emailstore"])
    candidates = score.candidate_threads(threads, cfg)

    if args.broad_pass:
        non_candidates = [t for t in threads if t.thread_id not in candidates]
        if non_candidates:
            client = make_llm_client(cfg)
            flagged = broad_pass(client, non_candidates, cfg)
            for tid in flagged:
                candidates[tid] = 0.0
        candidates = {tid: s for tid, s in candidates.items()}

    store.save_candidates(candidates, paths["candidates"])
    print(f"{len(candidates)} candidate thread(s) out of {len(threads)}")


if __name__ == "__main__":
    main()