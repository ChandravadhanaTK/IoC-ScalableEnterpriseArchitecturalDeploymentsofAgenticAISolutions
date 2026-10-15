import argparse
import os
import sys
import subprocess

from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agents import store
from agents.classify import classify_all
from agents.config import Config
from agents.llm import make_llm_client, LLMError

# Path to phase5_build.py
PHASE5_SCRIPT = os.path.join(os.path.dirname(__file__), "phase5_build.py")


def resolve_paths(evidence_dir=None):
    paths = {}
    if evidence_dir:
        for k, v in store.DEFAULT_PATHS.items():
            rel = os.path.sep.join(v.replace("\\", "/").split("/")[1:])
            paths[k] = os.path.join(evidence_dir, rel)
    else:
        paths = dict(store.DEFAULT_PATHS)
    return paths


def run_phase5(evidence_dir=None):
    """Run phase5_build.py to update CRM Excel with latest classifications."""
    try:
        result = subprocess.run(
            [sys.executable, PHASE5_SCRIPT, "--evidence-dir", evidence_dir or "evidence", "--output-dir", "crm_out"],
            capture_output=True, text=True, timeout=120000
        )
        if result.stdout:
            print("[phase5] " + result.stdout.strip())
        if result.stderr:
            print("[phase5 stderr] " + result.stderr.strip())
        if result.returncode != 0:
            print(f"[phase5] exited with code {result.returncode}")
    except subprocess.TimeoutExpired:
        print("[phase5] timed out after 120s")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Classify candidates across multiple LLM models (quota rotation)")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--models", nargs="+", default=None,
                    help="model ids to try in order (default: from config models list or single config model)")
    ap.add_argument("--min-batch", type=int, default=1, help="stop a model once a batch this small is classified")
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = resolve_paths(args.evidence_dir)

    base_cfg = Config.load(args.config)
    models = args.models

    threads_by_id = {t.thread_id: t for t in store.load_threads(paths["emailstore"])}
    candidates = store.load_candidates(paths["candidates"])
    threads = [threads_by_id[tid] for tid in candidates if tid in threads_by_id]

    for model in models:
        remaining = [t for t in threads if t.thread_id not in
                     store.load_classifications(paths["classifications"])]
        print(f"\n[{model}] {len(remaining)} remaining")
        if not remaining:
            print(f"[{model}] nothing to do; all classified")
            # Still run phase5 to keep Excel updated
            run_phase5(args.evidence_dir)
            continue
        cfg.model = model
        try:
            client = make_llm_client(cfg)
        except LLMError as e:
            print(f"[{model}] setup failed: {e}")
            # Still run phase5 even on setup failure
            run_phase5(args.evidence_dir)
            continue
        passed = 0
        try:
            results = classify_all(client, remaining, cfg, paths["classifications"], paths["problems"])
            passed = len(results)
        except SystemExit:
            raise
        except Exception as e:
            print(f"[{model}] interrupted: {e}")
        total = len(store.load_classifications(paths["classifications"]))
        print(f"[{model}] done; classifications now {total}")

        # Run phase5 after each model to update CRM Excel incrementally
        run_phase5(args.evidence_dir)


if __name__ == "__main__":
    main()