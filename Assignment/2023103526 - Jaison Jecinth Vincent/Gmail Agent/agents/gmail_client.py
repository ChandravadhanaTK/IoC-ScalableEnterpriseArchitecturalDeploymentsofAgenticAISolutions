import base64
import os
import pickle
import sys
from datetime import datetime, timezone
from typing import List, Optional

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from agents.models import Message, Thread


# Scopes for read-only Gmail access
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Paths for credential persistence
DEFAULT_CREDENTIALS_PATH = 'credentials.json'
DEFAULT_TOKEN_PATH = 'token.json'


def build_credentials(
    credentials_path: str = DEFAULT_CREDENTIALS_PATH,
    token_path: str = DEFAULT_TOKEN_PATH,
) -> object:
    """Load or run OAuth2 flow to obtain Gmail API credentials.

    Returns a credentials object compatible with google-auth.
    The token is cached at ``token_path`` so subsequent runs
    skip the browser flow.
    """
    creds = None
    if os.path.exists(token_path):
        with open(token_path, "rb") as f:
            creds = pickle.load(f)

    # If no (valid) credentials, restart the flow.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request

            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                print(
                    f"ERROR: credentials file not found at {credentials_path}. "
                    "Download OAuth 2.0 Client ID from Google Cloud Console "
                    "and save as ``credentials.json``.",
                )
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save the credentials for the next run
        with open(token_path, "wb") as f:
            pickle.dump(creds, f)

    return creds


def build_service(creds: object) -> object:
    """Build and return a Gmail API service object."""
    return build("gmail", "v1", credentials=creds, static_discovery=False)


def _extract_from_header(headers: list) -> str:
    """Return the From header value from a list of Gmail message headers."""
    for h in headers:
        if h.get("name", "").lower() == "from":
            return h.get("value", "")
    return ""


def _direction_hint(own_addresses: List[str], from_email: str) -> str:
    """Return a direction hint based on whether the email is inbound/outbound."""
    if not own_addresses:
        return "unknown"
    own_set = set(own_addresses)
    if from_email in own_set:
        return "outbound"
    # If the from address doesn't match own addresses, treat as inbound
    return "inbound"


def _internal_date_to_iso(internal_date) -> str:
    """Convert Gmail's internalDate (milliseconds since epoch) to ISO."""
    try:
        return datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc).isoformat()
    except (TypeError, ValueError):
        return "1970-01-01T00:00:00+00:00"


def _decode_body_data(data: Optional[str]) -> str:
    """Decode a base64url-safe Gmail payload body."""
    if not data:
        return ""
    try:
        padding = "=" * (-len(data) % 4)
        raw = base64.urlsafe_b64decode(data + padding)
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return ""


def _extract_body_text(payload: dict) -> str:
    """Recursively pull plain-text (then HTML) body text from a payload."""
    mime = payload.get("mimeType", "")
    body = payload.get("body") or {}
    data = body.get("data")
    if mime in ("text/plain", "text/html"):
        text = _decode_body_data(data)
        if text.strip():
            if mime == "text/html":
                import re
                text = re.sub(r"<[^>]+>", " ", text)
                text = re.sub(r"\s+", " ", text).strip()
            return text

    for part in payload.get("parts", []):
        text = _extract_body_text(part)
        if text.strip():
            return text
    return ""


def _parse_message(gmail_msg: dict) -> Message:
    """Convert a single Gmail message dict into a pipeline ``Message``."""
    payload = gmail_msg.get("payload", {})
    headers = payload.get("headers", [])
    hmap = {h.get("name", "").lower(): h.get("value", "") for h in headers}
    to_raw = hmap.get("to", "")
    return Message(
        id=gmail_msg.get("id", ""),
        from_email=hmap.get("from") or None,
        to=[t.strip() for t in to_raw.split(",") if t.strip()],
        date=_internal_date_to_iso(gmail_msg.get("internalDate")),
        subject=hmap.get("subject", ""),
        body_text=_extract_body_text(payload),
    )


def _parse_thread(messages: list, own_addresses: List[str]) -> Thread:
    """Convert a list of Gmail message dicts into a ``Thread``.

    The ``direction_hint`` is inferred from the ``From`` address
    of the oldest message relative to *own_addresses*.
    """
    if not messages:
        return Thread(
            thread_id="",
            subject="",
            messages=[],
            first_date="1970-01-01T00:00:00+00:00",
            last_date="1970-01-01T00:00:00+00:00",
            direction_hint="unknown",
        )

    # Gmail API returns messages newest-first; reverse for chronological
    msgs = messages[::-1]
    parsed = [_parse_message(m) for m in msgs]

    first = parsed[0]
    last = parsed[-1]
    hint = _direction_hint(own_addresses, first.from_email or "")

    return Thread(
        thread_id=msgs[0].get("threadId") or first.id,
        subject=first.subject,
        messages=parsed,
        first_date=first.date,
        last_date=last.date,
        direction_hint=hint,
    )


def iter_fetch_threads(
    service: object,
    query: str = "",
    own_addresses: Optional[List[str]] = None,
):
    """Yield ``Thread`` objects as they are fetched, one page at a time.

    Yields ``(page_no, threads_in_page, list_of_threads)`` so the caller
    can save incrementally and observe progress without waiting for the
    entire (slow, paginated) fetch to finish.
    """
    own_addresses = own_addresses or []
    page_token = None
    page_no = 0
    while True:
        page_no += 1
        response = (
            service.users()
            .threads()
            .list(userId="me", q=query, pageToken=page_token)
            .execute()
        )
        batch: List[Thread] = []
        for gmail_thread in response.get("threads", []):
            thread_id = gmail_thread["id"]
            thread_data = (
                service.users()
                .threads()
                .get(userId="me", id=thread_id)
                .execute()
            )
            thread = _parse_thread(thread_data.get("messages", []), own_addresses)
            batch.append(thread)

        pages = response.get("resultSizeEstimate", 0)
        yield page_no, batch, pages

        page_token = response.get("nextPageToken")
        if not page_token:
            break


def fetch_all_threads(
    service: object,
    query: str = "",
    own_addresses: Optional[List[str]] = None,
) -> List[Thread]:
    """Fetch all threads matching *query* from the Gmail API.

    Returns a list of ``Thread`` objects (as used by the rest of the
    pipeline: ``classify_all`` → ``phase5_build``).
    """
    threads: List[Thread] = []
    for _page_no, batch, _pages in iter_fetch_threads(service, query, own_addresses):
        threads.extend(batch)

    # Sort threads by first date so order is deterministic
    threads.sort(key=lambda t: t.first_date)
    return threads