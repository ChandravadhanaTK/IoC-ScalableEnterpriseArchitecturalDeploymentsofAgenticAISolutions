def build_history(crm_rows):
    history = {}
    for r in crm_rows:
        key = r.get("company_normalized") or ""
        if not key:
            continue
        rec = history.setdefault(key, {
            "company": r.get("company") or "",
            "company_normalized": key,
            "match_count": 0,
            "first_year": None,
            "last_year": None,
            "latest_date": None,
            "latest_amount": None,
            "latest_event": None,
            "latest_contact": None,
            "latest_email": None,
            "latest_phone": None,
            "latest_outcome": None,
        })
        rec["match_count"] += 1
        # Legacy alias kept for backwards compat with old exports/tests.
        rec["sponsorship_count"] = rec["match_count"]
        year = (r.get("conversation_date") or "")[:4] or None
        if year and (rec["first_year"] is None or year < rec["first_year"]):
            rec["first_year"] = year
        if year and (rec["last_year"] is None or year > rec["last_year"]):
            rec["last_year"] = year
        d = r.get("conversation_date") or ""
        if rec["latest_date"] is None or d > rec["latest_date"]:
            rec.update({
                "latest_date": d,
                "latest_amount": r.get("amount"),
                "latest_event": r.get("event"),
                "latest_contact": r.get("contact_person"),
                "latest_email": r.get("email"),
                "latest_phone": r.get("phone"),
                "latest_outcome": r.get("outcome"),
            })
    return sorted(history.values(), key=lambda h: (h["last_year"] or ""), reverse=True)


HISTORY_COLUMNS = [
    "company", "company_normalized", "match_count", "first_year",
    "last_year", "latest_date", "latest_amount", "latest_event",
    "latest_contact", "latest_email", "latest_phone", "latest_outcome",
]