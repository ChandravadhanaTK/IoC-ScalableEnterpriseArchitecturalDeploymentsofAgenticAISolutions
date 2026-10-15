from typing import Any

from models.schemas import ComparisonTable

NOT_REPORTED = "Not reported in the paper"
COLUMNS = ["Paper", "Method", "Dataset", "Metrics", "Results", "Limitation"]


def _val(extracted: dict[str, Any], field: str) -> str:
    f = extracted.get(field) or {}
    value = (f.get("value") if isinstance(f, dict) else getattr(f, "value", "")) or ""
    status = f.get("status", "reported") if isinstance(f, dict) else getattr(f, "status", "reported")
    value = str(value).strip()
    return value if value and status != "not_reported" else NOT_REPORTED


def compare_papers(
    extracted_papers: list[dict[str, Any]],
    candidates: list[dict[str, Any]] | None = None,
) -> ComparisonTable:
    """Build the comparison table (pure data transformation, no LLM).

    Args:
        extracted_papers: ExtractedPaper dicts (from state["extracted"]).
        candidates: PaperMeta dicts, used to show titles.
    """
    titles = {p.get("paper_id"): p for p in (candidates or [])}
    rows = []
    for ep in extracted_papers:
        pid = ep.get("paper_id", "?")
        meta = titles.get(pid, {})
        label = f"[{pid}] {meta.get('title', '')}".strip()
        rows.append({
            "Paper": label,
            "Method": _val(ep, "methodology"),
            "Dataset": _val(ep, "dataset"),
            "Metrics": _val(ep, "metrics"),
            "Results": _val(ep, "results"),
            "Limitation": _val(ep, "limitations"),
        })
    return ComparisonTable(columns=COLUMNS, rows=rows)
