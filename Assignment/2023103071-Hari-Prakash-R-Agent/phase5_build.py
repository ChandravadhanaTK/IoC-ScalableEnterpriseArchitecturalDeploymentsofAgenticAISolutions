import argparse
import json
import os
import pathlib
import sys
from dotenv import load_dotenv

# Load .env from project root so GEMINI_API_KEY is available
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# Import dedupe dynamically to avoid circular import issues in agents/__init__.py
import importlib.util
_spec = importlib.util.find_spec("agents.dedupe")
if _spec is not None and _spec.origin is not None:
    _dedupe = importlib.util.module_from_spec(_spec)
    sys.modules["agents.dedupe"] = _dedupe
    _spec.loader.exec_module(_dedupe)
else:
    _dedupe = None

import pandas as pd

from agents import consolidation, export, store
from agents.config import Config
from agents.models import SUCCESS_OUTCOMES


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 5: build generic CRM exports (matches + history)")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--output-dir", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = {}
    if args.evidence_dir:
        # Build paths under the evidence directory
        for k, v in store.DEFAULT_PATHS.items():
            # v is like "evidence/raw/emailstore.jsonl" - strip leading "evidence/"
            rel = os.path.sep.join(v.replace("\\", "/").split("/")[1:])
            paths[k] = os.path.join(args.evidence_dir, rel)
    else:
        paths = dict(store.DEFAULT_PATHS)
    output_dir = args.output_dir or paths["output"]
    os.makedirs(output_dir, exist_ok=True)

    classifications = store.load_classifications(paths["classifications"])
    problems = store.load_json(paths["problems"], default=[]) or []
    if not classifications:
        print("no classifications found; run phase3 first")
        return

    # Use dedupe module (imported dynamically)
    norm_map = None
    raw_map = None
    if _dedupe is not None:
        known_renames = cfg.known_company_renames
        # Build company map from all classification companies
        companies = [c.company for c in classifications.values() if c.company]
        if companies:
            norm_map, raw_map = _dedupe.build_company_map(
                companies, known_renames=known_renames,
            )
    if norm_map is None:
        norm_map = {}
    for c in classifications.values():
        if _dedupe is not None:
            _dedupe.apply_company_normalization(c, norm_map)
    # Save the normalized map for future runs
    store.save_json(norm_map, paths["company_map"])

    rows = export.classification_rows(classifications)
    success = [r for r in rows if r["outcome"] in SUCCESS_OUTCOMES]
    interested = [r for r in rows if r["outcome"] == "interested_uncommitted"]
    unrelated = [r for r in rows if r["outcome"] == "unrelated"]
    no_response = [r for r in rows if r["outcome"] == "no_response"]
    all_rows = rows
    evidence_rows = [{"thread_id": r["thread_id"], "evidence": r["evidence"],
                      "evidence_message_id": r["evidence_message_id"]} for r in rows]

    export.write_review_workbook(all_rows, problems,
                                 os.path.join(output_dir, "review_sheet.xlsx"))
    export.write_crm_workbook(success, interested, unrelated, no_response, all_rows, evidence_rows,
                              os.path.join(output_dir, "crm.xlsx"))
    export.write_csv(success, os.path.join(output_dir, "crm.csv"))
    export.write_csv(interested, os.path.join(output_dir, "interested.csv"))
    export.write_csv(all_rows, os.path.join(output_dir, "all_classified.csv"))
    # Write history CSV using consolidation.build_history
    hist_rows = consolidation.build_history(success)
    export.write_dict_csv(hist_rows,
                          os.path.join(output_dir, "history.csv"))
    # Legacy aliases (sponsorship-era names) for backwards compat.
    import shutil
    for src, dst in (("crm.xlsx", "sponsorship_crm.xlsx"), ("crm.csv", "sponsorship_crm.csv"),
                     ("history.csv", "sponsorship_history.csv")):
        try:
            shutil.copyfile(os.path.join(output_dir, src), os.path.join(output_dir, dst))
        except OSError:
            pass
    print(f"CRM: {len(success)} successful, {len(interested)} interested, "
          f"{len(unrelated)} unrelated, {len(no_response)} no_response, "
          f"{len(all_rows)} classified")


if __name__ == "__main__":
    main()