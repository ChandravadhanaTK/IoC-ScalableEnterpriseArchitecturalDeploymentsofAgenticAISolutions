import httpx
from rapidfuzz import fuzz

from models.schemas import CitationCheck
from tools.paper_search import normalize_doi
from utils.logging import get_logger

logger = get_logger(__name__)


class CitationLookupError(Exception):
    """Exception raised when citation lookup fails."""


def _surnames(authors: list[str]) -> set[str]:
    out = set()
    for author in authors or []:
        parts = author.replace(",", " ").split()
        if parts:
            out.add(parts[-1].lower())
    return out


def _years(item: dict) -> set[int]:
    years = set()
    for key in ("published-print", "published-online", "issued", "created"):
        parts = (item.get(key) or {}).get("date-parts")
        if parts and parts[0] and parts[0][0]:
            years.add(int(parts[0][0]))
    return years


def _crossref_get(url: str, params: dict | None = None) -> dict | None:
    try:
        with httpx.Client(timeout=10.0, headers={"User-Agent": "ResearchPilot/1.0 (mailto:researchpilot@example.com)"}) as client:
            response = client.get(url, params=params)
            if response.status_code == 200:
                return response.json()
            if response.status_code == 404:
                return None
            raise CitationLookupError(f"Crossref returned HTTP {response.status_code}")
    except httpx.HTTPError as e:
        raise CitationLookupError(str(e)) from e


def _find_by_doi(doi: str) -> dict | None:
    data = _crossref_get(f"https://api.crossref.org/works/{doi}")
    return (data or {}).get("message")


def _find_by_title(title: str) -> dict | None:
    data = _crossref_get("https://api.crossref.org/works", {"query.title": title, "rows": 3})
    items = ((data or {}).get("message") or {}).get("items") or []
    best, best_score = None, -1.0
    for it in items:
        t = (it.get("title") or [""])[0]
        score = fuzz.ratio(title.lower(), t.lower())
        if score > best_score:
            best, best_score = it, score
    return best


def evaluate_match(
    paper_id: str, title: str, authors: list[str], year: int | None, found: dict,
) -> CitationCheck:
    """Compare a paper's metadata with a Crossref record.

    VERIFIED: title >= 90, author-surname overlap >= 50 %, year matches.
    PARTIAL : found, but one of those conditions fails.
    UNVERIFIED: major mismatch.
    """
    found_title = (found.get("title") or [""])[0]
    found_authors = [f"{a.get('given', '')} {a.get('family', '')}".strip() for a in found.get("author") or []]

    title_score = float(fuzz.ratio(title.lower(), found_title.lower()))
    target, got = _surnames(authors), _surnames(found_authors)
    if target:
        authors_score = len(target & got) / len(target) * 100
    else:
        authors_score = 100.0 if not got else 0.0
    years = _years(found)
    year_ok = (year in years) if year else (not years)

    if title_score >= 90 and authors_score >= 50 and year_ok:
        status = "VERIFIED"
    elif title_score >= 70 or authors_score >= 30:
        status = "PARTIAL"
    else:
        status = "UNVERIFIED"

    return CitationCheck(
        paper_id=paper_id,
        status=status,
        exists=True,
        title_match=round(title_score, 1),
        authors_match=round(authors_score, 1),
        year_match=bool(year_ok),
        notes=f"Matched Crossref record '{found_title[:80]}'",
    )


def verify_citation(
    title: str,
    authors: list[str],
    year: int | None,
    doi: str | None = None,
    paper_id: str = "",
) -> CitationCheck:
    """Verify a citation against Crossref (DOI first, then title search).

    Never raises: a network failure yields UNVERIFIED with an explanatory note.
    """
    doi = normalize_doi(doi)
    found = None
    doi_resolves: bool | None = None
    try:
        if doi:
            found = _find_by_doi(doi)
            doi_resolves = found is not None
        if not found:
            found = _find_by_title(title)
    except CitationLookupError as e:
        logger.warning("Citation lookup failed for %s: %s", paper_id or title[:40], e)
        return CitationCheck(paper_id=paper_id, status="UNVERIFIED", doi_resolves=doi_resolves,
                             notes=f"Lookup failed (network/API): {e}")

    if not found:
        return CitationCheck(paper_id=paper_id, status="UNVERIFIED", doi_resolves=doi_resolves,
                             notes="Not found in Crossref")

    check = evaluate_match(paper_id, title, authors, year, found)
    check.doi_resolves = doi_resolves
    return check
