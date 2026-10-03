import os
import logging
from typing import Any

from utils.logging import get_logger

logger = get_logger(__name__)


class PDFExtractionError(Exception):
    """Exception raised when PDF text extraction fails."""
    pass


def extract_pdf(path: str) -> list[dict[str, Any]]:
    """
    Extract text from a PDF file page by page.
    Falls back to pypdf if PyMuPDF (fitz) fails.
    Detects scanned/empty PDFs.
    
    Args:
        path: Absolute path to the PDF file.
        
    Returns:
        List of dictionaries containing 'page' (int, 1-indexed) and 'text' (str).
        
    Raises:
        PDFExtractionError: If the file cannot be processed or text is too sparse.
    """
    if not os.path.exists(path):
        raise PDFExtractionError(f"File not found: {path}")

    pages = []
    total_text = ""

    try:
        try:
            import pymupdf as fitz  # PyMuPDF >= 1.24.3
        except ImportError:
            import fitz  # older PyMuPDF
        with fitz.open(path) as doc:
            for i, page in enumerate(doc):
                text = page.get_text()
                total_text += text
                pages.append({"page": i + 1, "text": text})
    except ImportError:
        logger.warning("PyMuPDF (fitz) not available, falling back to pypdf.")
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                total_text += text
                pages.append({"page": i + 1, "text": text})
        except Exception as e:
            raise PDFExtractionError(f"Fallback pypdf extraction failed: {e}") from e
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}. Falling back to pypdf.")
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                total_text += text
                pages.append({"page": i + 1, "text": text})
        except Exception as e_fallback:
            raise PDFExtractionError(f"Both fitz and pypdf extraction failed: {e_fallback}") from e_fallback

    if len(total_text.strip()) < 100:
        raise PDFExtractionError("PDF appears to be empty or scanned (less than 100 characters of text extracted).")

    return pages
