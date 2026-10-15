import os

CLASSIFICATION_COLUMNS = [
    "thread_id", "outcome", "confidence", "direction", "event", "company",
    "company_normalized", "contact_person", "designation", "email", "phone",
    "amount", "amount_type", "in_kind_note", "conversation_date",
    "evidence", "evidence_message_id",
]


def classification_rows(classifications) -> list:
    import dataclasses
    rows = []
    for c in classifications.values():
        d = dataclasses.asdict(c)
        rows.append({k: d.get(k) for k in CLASSIFICATION_COLUMNS})
    return rows


def _df(rows, columns):
    import pandas as pd
    return pd.DataFrame(rows, columns=columns)


def write_review_workbook(all_rows, problems_rows, path):
    import pandas as pd
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        _df(all_rows, CLASSIFICATION_COLUMNS + ["Verified"]).to_excel(
            writer, sheet_name="All Classified", index=False)
        cols = ["index", "errors", "item"]
        _df(problems_rows, cols).to_excel(writer, sheet_name="Parse Errors", index=False)


def write_crm_workbook(success_rows, interested_rows, unrelated_rows, no_response_rows, all_rows, evidence_rows, path):
    import pandas as pd
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        _df(success_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="Matches", index=False)
        _df(interested_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="Interested", index=False)
        _df(unrelated_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="Unrelated", index=False)
        _df(no_response_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="No Response", index=False)
        _df(all_rows, CLASSIFICATION_COLUMNS).to_excel(
            writer, sheet_name="All Classified", index=False)
        _df(evidence_rows, ["thread_id", "evidence", "evidence_message_id"]).to_excel(
            writer, sheet_name="Evidence", index=False)


def write_csv(rows, path):
    import pandas as pd
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    _df(rows, CLASSIFICATION_COLUMNS).to_csv(path, index=False, encoding="utf-8-sig")


def read_reviewed_rows(path):
    import pandas as pd
    df = pd.read_excel(path, sheet_name="All Classified",
                       keep_default_na=False, dtype=str)
    return df.to_dict(orient="records")


def apply_review(rows):
    kept, rejected = [], []
    for r in rows:
        v = str(r.get("Verified") or "").strip().lower()
        if v in {"reject", "rejected", "no", "n", "false", "remove"}:
            rejected.append(r)
        else:
            kept.append(r)
    return kept, rejected


def write_dict_csv(rows, path):
    import pandas as pd
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not rows:
        pd.DataFrame().to_csv(path, index=False, encoding="utf-8-sig")
        return
    keys = list(rows[0].keys())
    _df(rows, keys).to_csv(path, index=False, encoding="utf-8-sig")