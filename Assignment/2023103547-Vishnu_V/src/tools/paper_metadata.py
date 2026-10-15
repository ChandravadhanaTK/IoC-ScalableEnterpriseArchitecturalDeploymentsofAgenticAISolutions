import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from datetime import datetime, timezone
import re

from models.schemas import PaperMeta
from utils.logging import get_logger

logger = get_logger(__name__)


class MetadataLookupError(Exception):
    """Exception raised when paper metadata lookup fails."""
    pass


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _get_crossref_metadata(doi: str) -> PaperMeta:
    url = f"https://api.crossref.org/works/{doi}"
    with httpx.Client(timeout=30.0) as client:
        response = client.get(url)
        if response.status_code == 404:
            raise MetadataLookupError(f"DOI not found in Crossref: {doi}")
        response.raise_for_status()
        item = response.json().get("message", {})

    titles = item.get("title", [])
    title = titles[0] if titles else "Unknown Title"
    
    authors = []
    for a in item.get("author", []):
        given = a.get("given", "")
        family = a.get("family", "")
        if given or family:
            authors.append(f"{given} {family}".strip())
            
    year = None
    date_parts = item.get("published-print", {}).get("date-parts")
    if not date_parts:
        date_parts = item.get("published-online", {}).get("date-parts")
    if date_parts and date_parts[0]:
        year = date_parts[0][0]
        
    containers = item.get("container-title", [])
    venue = containers[0] if containers else None
    
    return PaperMeta(
        paper_id="",
        title=title,
        authors=authors,
        year=year,
        venue=venue,
        abstract=item.get("abstract"),
        doi=doi,
        url=item.get("URL"),
        pdf_url=None,
        citation_count=item.get("is-referenced-by-count", 0),
        source_api="crossref",
        retrieved_at=datetime.now(timezone.utc)
    )

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _get_semanticscholar_metadata(paper_id: str) -> PaperMeta:
    url = f"https://api.semanticscholar.org/graph/v1/paper/{paper_id}"
    params = {
        "fields": "title,authors,year,venue,abstract,externalIds,citationCount,isOpenAccess,openAccessPdf"
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.get(url, params=params)
        if response.status_code == 404:
            raise MetadataLookupError(f"ID not found in Semantic Scholar: {paper_id}")
        response.raise_for_status()
        item = response.json()

    authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
    pdf_url = None
    if item.get("isOpenAccess") and item.get("openAccessPdf"):
        pdf_url = item.get("openAccessPdf").get("url")
        
    ext_ids = item.get("externalIds", {})
    doi = ext_ids.get("DOI")
    
    return PaperMeta(
        paper_id="",
        title=item.get("title") or "Unknown Title",
        authors=authors,
        year=item.get("year"),
        venue=item.get("venue"),
        abstract=item.get("abstract"),
        doi=doi,
        url=f"https://doi.org/{doi}" if doi else f"https://semanticscholar.org/paper/{item.get('paperId')}",
        pdf_url=pdf_url,
        citation_count=item.get("citationCount", 0),
        source_api="semantic_scholar",
        retrieved_at=datetime.now(timezone.utc)
    )

def get_paper_metadata(paper_id_or_doi: str) -> PaperMeta:
    """
    Fetch metadata for a paper given its ID or DOI.
    
    Args:
        paper_id_or_doi: A DOI string or an ID string.
        
    Returns:
        PaperMeta object containing the retrieved metadata.
        
    Raises:
        MetadataLookupError: If the paper metadata could not be fetched.
    """
    doi_pattern = re.compile(r'^10.\d{4,9}/[-._;()/:A-Z0-9]+$', re.I)
    is_doi = bool(doi_pattern.match(paper_id_or_doi)) or "doi.org" in paper_id_or_doi

    clean_doi = paper_id_or_doi
    if "doi.org/" in clean_doi:
        clean_doi = clean_doi.split("doi.org/")[-1]

    if is_doi:
        try:
            return _get_crossref_metadata(clean_doi)
        except Exception as e:
            logger.warning(f"Crossref lookup failed for DOI {clean_doi}: {e}")
            try:
                # Semantic Scholar accepts DOI prefixed with 'DOI:'
                return _get_semanticscholar_metadata(f"DOI:{clean_doi}")
            except Exception as e2:
                logger.error(f"Semantic Scholar fallback failed: {e2}")
                raise MetadataLookupError(f"Could not resolve metadata for {paper_id_or_doi}") from e2
    else:
        try:
            return _get_semanticscholar_metadata(paper_id_or_doi)
        except Exception as e:
            logger.error(f"Semantic Scholar lookup failed for ID {paper_id_or_doi}: {e}")
            raise MetadataLookupError(f"Could not resolve metadata for {paper_id_or_doi}") from e
