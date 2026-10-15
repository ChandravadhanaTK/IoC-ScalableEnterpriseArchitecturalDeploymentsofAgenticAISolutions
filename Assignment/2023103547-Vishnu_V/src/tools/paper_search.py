import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from datetime import datetime, timezone
import logging

from models.schemas import PaperMeta
from utils.config import get_settings
from utils.logging import get_logger

logger = get_logger(__name__)


def normalize_doi(doi: str | None) -> str | None:
    """Strip resolver prefixes so every DOI is stored as '10.xxxx/...'."""
    if not doi:
        return None
    doi = doi.strip()
    for prefix in ("https://doi.org/", "http://doi.org/", "https://dx.doi.org/", "doi:"):
        if doi.lower().startswith(prefix):
            doi = doi[len(prefix):]
    return doi or None


class SearchUnavailableError(Exception):
    """Exception raised when paper search APIs are unavailable or fail."""
    pass


def _rebuild_abstract(inverted_index: dict[str, list[int]] | None) -> str | None:
    if not inverted_index:
        return None
    try:
        max_pos = max([pos for positions in inverted_index.values() for pos in positions], default=-1)
        if max_pos == -1:
            return None
        words = [""] * (max_pos + 1)
        for word, positions in inverted_index.items():
            for pos in positions:
                words[pos] = word
        return " ".join(words).strip()
    except Exception:
        return None


def _strip_tags(text: str | None) -> str | None:
    if not text:
        return None
    import re
    return re.sub(r"<[^>]+>", " ", text).strip() or None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
def _search_openalex(query: str, year_from: int, year_to: int, limit: int) -> list[PaperMeta]:
    settings = get_settings()
    email = settings.openalex_email or "researchpilot@example.com"
    url = "https://api.openalex.org/works"
    params = {
        "search": query,
        "filter": f"publication_year:{year_from}-{year_to}",
        "per_page": limit,
        "mailto": email
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
    results = []
    for item in data.get("results", []):
        authors = [a.get("author", {}).get("display_name") for a in item.get("authorships", [])]
        authors = [a for a in authors if a]
        
        primary_location = item.get("primary_location") or {}
        source = primary_location.get("source") or {}
        venue = source.get("display_name")
        
        pdf_url = primary_location.get("pdf_url")
        if not pdf_url:
            best_oa = item.get("best_oa_location") or {}
            pdf_url = best_oa.get("pdf_url")

        if not item.get("title"):
            continue
        meta = PaperMeta(
            paper_id="",
            title=item.get("title"),
            authors=authors,
            year=item.get("publication_year"),
            venue=venue,
            abstract=_rebuild_abstract(item.get("abstract_inverted_index")),
            doi=normalize_doi(item.get("doi")),
            url=item.get("doi") or item.get("id"),
            pdf_url=pdf_url,
            citation_count=item.get("cited_by_count") or 0,
            source_api="openalex",
            retrieved_at=datetime.now(timezone.utc)
        )
        results.append(meta)
    return results


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
def _search_semantic_scholar(query: str, year_from: int, year_to: int, limit: int) -> list[PaperMeta]:
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "year": f"{year_from}-{year_to}",
        "limit": limit,
        "fields": "title,authors,year,venue,abstract,externalIds,citationCount,isOpenAccess,openAccessPdf"
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("data", []):
        authors = [a.get("name") for a in (item.get("authors") or []) if a.get("name")]
        pdf_url = None
        if item.get("openAccessPdf"):
            pdf_url = item["openAccessPdf"].get("url")
            
        ext_ids = item.get("externalIds") or {}
        doi = normalize_doi(ext_ids.get("DOI"))

        if not item.get("title"):
            continue
        meta = PaperMeta(
            paper_id="",
            title=item.get("title"),
            authors=authors,
            year=item.get("year"),
            venue=item.get("venue"),
            abstract=item.get("abstract"),
            doi=doi,
            url=f"https://doi.org/{doi}" if doi else f"https://semanticscholar.org/paper/{item.get('paperId')}",
            pdf_url=pdf_url,
            citation_count=item.get("citationCount") or 0,
            source_api="semantic_scholar",
            retrieved_at=datetime.now(timezone.utc)
        )
        results.append(meta)
    return results


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
def _search_crossref(query: str, year_from: int, year_to: int, limit: int) -> list[PaperMeta]:
    url = "https://api.crossref.org/works"
    params = {
        "query": query,
        "filter": f"from-pub-date:{year_from},until-pub-date:{year_to}",
        "rows": limit
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("message", {}).get("items", []):
        titles = item.get("title") or []
        if not titles:
            continue
        title = titles[0]

        authors = []
        for a in item.get("author") or []:
            given = a.get("given", "")
            family = a.get("family", "")
            if given or family:
                authors.append(f"{given} {family}".strip())
                
        year = None
        for key in ("published-print", "published-online", "issued"):
            date_parts = (item.get(key) or {}).get("date-parts")
            if date_parts and date_parts[0] and date_parts[0][0]:
                year = date_parts[0][0]
                break
            
        containers = item.get("container-title") or []
        venue = containers[0] if containers else None
        
        doi = normalize_doi(item.get("DOI"))
        url_link = item.get("URL")
        
        meta = PaperMeta(
            paper_id="",
            title=title,
            authors=authors,
            year=year,
            venue=venue,
            abstract=_strip_tags(item.get("abstract")),
            doi=doi,
            url=url_link,
            pdf_url=None,
            citation_count=item.get("is-referenced-by-count") or 0,
            source_api="crossref",
            retrieved_at=datetime.now(timezone.utc)
        )
        results.append(meta)
    return results


def search_papers(query: str, year_from: int, year_to: int, limit: int = 10) -> list[PaperMeta]:
    """
    Search for papers using the fallback chain OpenAlex -> Semantic Scholar -> Crossref.

    The next source is tried when the previous one fails OR returns nothing.

    Raises:
        SearchUnavailableError: If every source fails (an empty result from a
            working source is returned as an empty list, not an error).
    """
    sources = (
        ("OpenAlex", _search_openalex),
        ("Semantic Scholar", _search_semantic_scholar),
        ("Crossref", _search_crossref),
    )
    last_error: Exception | None = None
    any_ok = False
    for name, fn in sources:
        try:
            logger.info("Trying %s for query: %s", name, query)
            results = fn(query, year_from, year_to, limit)
            any_ok = True
            if results:
                return results
        except Exception as e:  # noqa: BLE001
            last_error = e
            logger.warning("%s failed: %s", name, e)
    if any_ok:
        return []
    raise SearchUnavailableError(f"All search engines failed for query: {query}") from last_error
