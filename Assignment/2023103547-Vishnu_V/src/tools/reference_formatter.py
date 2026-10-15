from models.schemas import PaperMeta

def _format_authors(authors: list[str], style: str) -> str:
    if not authors:
        return "Unknown Authors"
        
    formatted = []
    for author in authors:
        parts = author.split()
        if not parts:
            continue
        last_name = parts[-1]
        first_initial = parts[0][0] + "." if len(parts) > 1 else ""
        
        if style == "ieee":
            formatted.append(f"{first_initial} {last_name}".strip())
        elif style == "apa":
            formatted.append(f"{last_name}, {first_initial}".strip())
        elif style == "acm":
            formatted.append(f"{last_name}, {first_initial}".strip())
        else:
            formatted.append(author)
            
    if style == "ieee":
        return ", ".join(formatted)
    elif style == "apa":
        if len(formatted) == 1:
            return formatted[0]
        elif len(formatted) == 2:
            return f"{formatted[0]}, & {formatted[1]}"
        else:
            return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"
    elif style == "acm":
        return ", ".join(formatted)
    return ", ".join(authors)


def format_reference(meta: PaperMeta, style: str) -> str:
    """
    Format a reference strictly deterministically. NO LLM involved.
    
    Args:
        meta: The PaperMeta object containing paper details.
        style: The style of reference (ieee, apa, acm).
        
    Returns:
        Formatted reference string.
    """
    style = style.lower()
    authors_str = _format_authors(meta.authors, style)
    title = meta.title or "Unknown Title"
    venue = meta.venue or "Unknown Venue"
    year = meta.year or "n.d."
    doi_str = f"https://doi.org/{meta.doi}" if meta.doi else (meta.url or "")
    
    if style == "ieee":
        # Simplified IEEE: A. Author, "Title," Venue, Year.
        base = f"{authors_str}, \"{title},\" {venue}, {year}."
        return base
        
    elif style == "apa":
        # APA: Author, A. (Year). Title. Venue. URL
        base = f"{authors_str} ({year}). {title}. {venue}."
        if doi_str:
            base += f" {doi_str}"
        return base
        
    elif style == "acm":
        # ACM: Author. Year. Title. Venue. DOI:doi
        base = f"{authors_str}. {year}. {title}. {venue}."
        if meta.doi:
            base += f" DOI:{meta.doi}"
        elif meta.url:
            base += f" URL:{meta.url}"
        return base
        
    else:
        return f"{authors_str}. {title}."


def format_all_references(papers: list[PaperMeta], checks: list, style: str) -> tuple[str, str]:
    """
    Format references, separated into verified and unverified.

    Entries are labelled with the paper_id (e.g. [P03]) so they match the
    citation markers used in the survey text.

    Args:
        papers: PaperMeta objects (or dicts).
        checks: CitationCheck objects or dicts; matched to papers by paper_id.
        style: ieee, apa or acm.

    Returns:
        Tuple of (verified_references_markdown, unverified_references_markdown).
    """
    status_by_id = {}
    for c in checks or []:
        pid = c.get("paper_id") if isinstance(c, dict) else getattr(c, "paper_id", None)
        st = c.get("status") if isinstance(c, dict) else getattr(c, "status", None)
        status_by_id[pid] = st

    verified, unverified = [], []
    for paper in papers:
        if isinstance(paper, dict):
            paper = PaperMeta(**paper)
        entry = f"[{paper.paper_id}] {format_reference(paper, style)}"
        (verified if status_by_id.get(paper.paper_id) == "VERIFIED" else unverified).append(entry)

    verified_md = "### Verified References\n" + "\n".join(verified) if verified else "### Verified References\nNone."
    unverified_md = "### Unverified References\n" + "\n".join(unverified) if unverified else "### Unverified References\nNone."
    return verified_md, unverified_md
