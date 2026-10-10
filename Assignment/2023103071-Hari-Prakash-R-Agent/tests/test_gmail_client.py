import os
import sys
import base64

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pytest

from agents.models import Message
from agents import gmail_client


def _payload(data_text, ctype="multipart/mixed"):
    encoded = base64.urlsafe_b64encode(data_text.encode("utf-8")).decode("ascii")
    return {
        "mimeType": ctype,
        "headers": [],
        "body": {},
        "parts": [{"mimeType": "text/plain", "body": {"data": encoded}}],
    }


def _msg(mid, thread_id, subject, from_email, date, internal_date, body_text):
    return {
        "id": mid,
        "threadId": thread_id,
        "internalDate": internal_date,
        "payload": {
            "mimeType": "message/rfc822",
            "headers": [
                {"name": "From", "value": from_email},
                {"name": "To", "value": "csea@example.com"},
                {"name": "Subject", "value": subject},
                {"name": "Date", "value": date},
            ],
            "body": _payload(body_text)["body"],
            "parts": [
                {"mimeType": "text/plain",
                 "body": {"data": base64.urlsafe_b64encode(body_text.encode("utf-8")).decode("ascii")}}
            ],
        },
        "snippet": body_text[:50],
    }


class _FakeListResponse:
    def __init__(self, payload, token=None):
        self._payload = payload
        self._token = token

    def execute(self):
        out = {"threads": self._payload}
        if self._token:
            out["nextPageToken"] = self._token
        return out


class _FakeGetResponse:
    def __init__(self, payload):
        self._payload = payload

    def execute(self):
        return self._payload


class _FakeService:
    """Minimal fake for service.users().threads().list/get chains."""

    def __init__(self, threads_by_id, ids_page1, next_token=None, ids_page2=None):
        self._by_id = threads_by_id
        self._p1 = ids_page1
        self._p2 = ids_page2 if ids_page2 is not None else []
        self._t1 = next_token
        self.calls = []

    def users(self):
        return self

    def threads(self):
        return self

    def list(self, userId, q, pageToken=None, maxResults=None):
        tok = pageToken
        ids = self._p1 if tok is None else self._p2
        token = self._t1 if tok is None else None
        self.calls.append(("list", tok))
        return _FakeListResponse([{"id": i} for i in ids], token)

    def get(self, userId, id):
        self.calls.append(("get", id))
        return _FakeGetResponse(self._by_id[id])


def test_parse_message_body_and_headers():
    m = _msg("m1", "t1", "Sponsorship", "sponsor@acme.com",
             "Fri, 01 Jan 2021 00:00:00 +0000", "1609459200000",
             "We are happy to sponsor.")
    msg = gmail_client._parse_message(m)
    assert isinstance(msg, Message)
    assert msg.subject == "Sponsorship"
    assert msg.from_email == "sponsor@acme.com"
    assert msg.body_text == "We are happy to sponsor."
    assert msg.date.startswith("2021-01-01")


def test_parse_thread_keeps_messages_and_dates():
    older = _msg("m1", "t1", "Initial", "sponsor@acme.com",
                 "Fri, 01 Jan 2021 00:00:00 +0000", "1609459200000",
                 "Hello.")
    newer = _msg("m2", "t1", "Re: Initial", "sponsor@acme.com",
                 "Sun, 03 Jan 2021 00:00:00 +0000", "1609632000000",
                 "We agree.")
    # Gmail returns newest first
    thread = gmail_client._parse_thread([newer, older], ["csea@example.com"])
    assert thread.messages, "messages must not be empty"
    assert len(thread.messages) == 2
    assert thread.subject == "Initial"  # from oldest
    assert thread.first_date.startswith("2021-01-01")
    assert thread.last_date.startswith("2021-01-03")
    assert thread.direction_hint == "inbound"


def test_parse_thread_empty_messages():
    thread = gmail_client._parse_thread([], [])
    assert thread.messages == []
    assert thread.thread_id == ""


def test_iter_fetch_threads_paginates_and_yields_all():
    m1 = _msg("m1", "t1", "S1", "a@x.com", "Fri, 01 Jan 2021 00:00:00 +0000",
              "1609459200000", "text")
    m2 = _msg("m2", "t2", "S2", "b@x.com", "Sat, 02 Jan 2021 00:00:00 +0000",
              "1609545600000", "text")
    svc = _FakeService({"t1": {"messages": [m1]}, "t2": {"messages": [m2]}},
                       ["t1"], next_token="tok2", ids_page2=["t2"])
    yielded = list(gmail_client.iter_fetch_threads(svc, query=""))
    threads = [t for _p, batch, _est in yielded for t in batch]
    assert len(threads) == 2
    tids = {t.thread_id for t in threads}
    assert tids == {"t1", "t2"}
    # first page fetched list once + get per thread, second page list once
    lists = [c for c in svc.calls if c[0] == "list"]
    gets = [c for c in svc.calls if c[0] == "get"]
    assert len(lists) == 2
    assert len(gets) == 2


def test_fetch_all_threads_compat_list_api():
    m1 = _msg("m1", "t1", "S1", "a@x.com", "Fri, 01 Jan 2021 00:00:00 +0000",
              "1609459200000", "text")
    svc = _FakeService({"t1": {"messages": [m1]}}, ["t1"])
    threads = gmail_client.fetch_all_threads(svc, query="")
    assert isinstance(threads, list)
    assert len(threads) == 1