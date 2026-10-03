import functools, itertools, random

KB = {
    "vpn": "Install the corporate VPN client, sign in with SSO, choose the 'Corp' profile.",
    "wifi": "Connect to 'Corp-Secure' using your SSO credentials; forget old networks first.",
    "printer": "Add the printer from Settings > Printers using the hostname on the printer label.",
    "email": "Use the web mail portal or re-add the account with SSO; clear cached credentials.",
}
_ticket_ids = itertools.count(1001)


class ToolError(Exception):
    pass


def with_retry(times=2):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*a, **kw):
            last = None
            for _ in range(times + 1):
                try:
                    return fn(*a, **kw)
                except ToolError as e:
                    last = e
            raise last
        return wrapper
    return deco


FAIL_RATE = 0.0  # tests can raise this to simulate outages


@with_retry(2)
def kb_search(query: str):
    if random.random() < FAIL_RATE:
        raise ToolError("kb unavailable")
    for key, article in KB.items():
        if key in query.lower():
            return article
    return None


@with_retry(2)
def create_ticket(user: str, summary: str, priority="P3"):
    if random.random() < FAIL_RATE:
        raise ToolError("ticketing unavailable")
    return {"ticket_id": f"INC{next(_ticket_ids)}", "user": user, "summary": summary, "priority": priority}


@with_retry(2)
def reset_password(user: str):
    if random.random() < FAIL_RATE:
        raise ToolError("identity provider unavailable")
    return f"Temporary password link sent to {user}'s registered device."
