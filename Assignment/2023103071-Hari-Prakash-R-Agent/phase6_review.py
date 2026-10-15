"""Phase 6: Apply human review to filtered CRM data.

Reads a review_sheet.xlsx where reviewers fill the 'Verified' column
(Yes/Edit/Reject), then re-exports cleansed CRM files.
"""
import argparse
import os
import json
import sys

import pandas as pd

# Ensure agents package is importable
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agents import consolidation, export, store
from agents.config import Config
from agents.models import Classification
from agents.models import SUCCESS_OUTCOMES


def normalize_company(name):
    """Normalize company name (inline, same logic as agents.dedupe)."""
    if not name:
        return ""
    n = " ".join(name.strip().lower().split())
    n = n.rstrip(" .,-")
    SUFFIXES = frozenset({
        "pvt", "private", "limited", "ltd", "inc", "incorporated", "llc",
        "corp", "corporation", "technologies", "technology", "tech",
        "solutions", "solution", "systems", "services",
    })
    while True:
        parts = n.split()
        if parts and parts[-1].strip(".,") in SUFFIXES:
            parts.pop()
            n = " ".join(parts).rstrip(" .,-")
        else:
            break
    return n


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 6: apply human review")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    ap.add_argument("--output-dir", default=None)
    ap.add_argument("--review", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = {}
    if args.evidence_dir:
        # Build paths under the evidence directory (same as phase1/phase5)
        for k, v in store.DEFAULT_PATHS.items():
            rel = os.path.sep.join(v.replace("\\", "/").split("/")[1:])
            paths[k] = os.path.join(args.evidence_dir, rel)
    else:
        paths = dict(store.DEFAULT_PATHS)
    output_dir = args.output_dir or paths["output"]
    os.makedirs(output_dir, exist_ok=True)

    review_path = args.review or os.path.join(output_dir, "review_sheet.xlsx")

    # Read the reviewed Excel sheet
    rows = export.read_reviewed_rows(review_path)

    # Apply review: keep rows where Verified is Yes/Edit, reject Reject/No
    kept, rejected = export.apply_review(rows)

    # Load existing company map and update normalization
    map_data = store.load_json(paths["company_map"], default={}) or {}
    # Apply any new edits from the review kept rows
    for r in kept:
        company = r.get("company") or ""
        canon = r.get("company_normalized") or ""
        if company and canon:
            map_data[normalize_company(company)] = canon
    store.save_json(map_data, paths["company_map"])

    # Re-normalize kept classifications using updated map
    classifications = {}
    for r in kept:
        # Build a Classification dict from the review row
        c_dict = {
            "thread_id": r.get("thread_id"),
            "outcome": r.get("outcome"),
            "confidence": float(r.get("confidence") or 0.0),
            "direction": r.get("direction") or "unknown",
            "event": r.get("event"),
            "company": r.get("company") or None,
            "company_normalized": r.get("company_normalized") or normalize_company(r.get("company") or ""),
            "contact_person": r.get("contact_person"),
            "designation": r.get("designation"),
            "email": r.get("email"),
            "phone": r.get("phone"),
            "amount": r.get("amount"),
            "amount_type": r.get("amount_type"),
            "in_kind_note": r.get("in_kind_note"),
            "conversation_date": r.get("conversation_date"),
            "evidence": r.get("evidence") or "",
            "evidence_message_id": r.get("evidence_message_id"),
            "parse_error": False,
        }
        # Apply normalization
        norm_map = store.load_json(paths["company_map"], default={}) or {}
        norm_name = normalize_company(c_dict["company"]) if c_dict["company"] else ""
        c_dict["company_normalized"] = norm_map.get(norm_name, c_dict["company_normalized"])
        c = Classification(**c_dict)
        classifications[r["thread_id"]] = c

    rows_out = export.classification_rows(classifications)
    success = [r for r in rows_out if r["outcome"] in SUCCESS_OUTCOMES]
    interested = [r for r in rows_out if r["outcome"] == "interested_uncommitted"]
    evidence_rows = [{"thread_id": r["thread_id"], "evidence": r["evidence"],
                      "evidence_message_id": r["evidence_message_id"]} for r in rows_out]

    export.write_crm_workbook(success, interested, rows_out, evidence_rows,
                              os.path.join(output_dir, "sponsorship_crm.xlsx"))
    export.write_csv(success, os.path.join(output_dir, "sponsorship_crm.csv"))
    export.write_csv(interested, os.path.join(output_dir, "interested.csv"))
    export.write_csv(rows_out, os.path.join(output_dir, "all_classified.csv"))
    export.write_dict_csv(consolidation.build_history(success),
                          os.path.join(output_dir, "sponsorship_history.csv"))
    print(f"reviewed: kept {len(kept)}, rejected {len(rejected)}; "
          f"CLEAN crm has {len(success)} successful sponsorships")


if __name__ == "__main__":
    main()