"""Enterprise system adapters (simulated).

Each class mirrors the shape of a real integration so it can be replaced by a
real client without touching the agents:
  IdentityProvider -> Entra ID / Okta Graph API
  ITSM             -> ServiceNow / Jira Service Management
  StatusPage       -> Statuspage.io / internal health API
  SoftwareCatalog  -> Intune / Company Portal + license manager

`FAULTS` lets tests and chaos drills inject failures per integration.
"""
from __future__ import annotations

import random
import time
import uuid

FAULTS: dict[str, int] = {}  # integration name -> number of upcoming calls that should fail


class IntegrationError(Exception):
    pass


def _maybe_fail(name: str) -> None:
    remaining = FAULTS.get(name, 0)
    if remaining > 0:
        FAULTS[name] = remaining - 1
        raise IntegrationError(f"{name}: upstream unavailable (injected fault)")


class IdentityProvider:
    name = "idp"

    def unlock_account(self, username: str) -> dict:
        _maybe_fail(self.name)
        return {"username": username, "locked": False, "unlocked_at": time.time()}

    def send_password_reset(self, username: str) -> dict:
        _maybe_fail(self.name)
        # Never generates or returns a password: issues a one-time link to the
        # user's *registered* recovery channel only.
        return {"username": username, "channel": "registered recovery email",
                "link_expires_minutes": 15, "request_id": uuid.uuid4().hex[:8]}


class ITSM:
    name = "itsm"
    QUEUES = {"access": "Identity & Access", "network": "Network Ops", "email": "Messaging",
              "hardware": "Field Services", "software": "End-User Computing",
              "security": "Security Operations (SOC)", "other": "Service Desk L2"}

    def create_incident(self, *, ticket_id: str, category: str, priority: str, summary: str,
                        handoff: dict) -> dict:
        _maybe_fail(self.name)
        return {"external_id": f"SN{random.randint(1000000, 9999999)}", "ticket_id": ticket_id,
                "queue": self.QUEUES.get(category, self.QUEUES["other"]), "priority": priority,
                "summary": summary, "handoff_fields": sorted(handoff.keys())}


class StatusPage:
    name = "status"
    # Demo state: VPN gateway in Mumbai is degraded so the "outage-aware" path is visible.
    SERVICES = {
        "vpn": {"status": "degraded", "note": "Mumbai VPN gateway is degraded; Chennai and Singapore are healthy. Engineers are working on it."},
        "email": {"status": "operational", "note": ""},
        "teams": {"status": "operational", "note": ""},
        "wifi": {"status": "operational", "note": ""},
        "sap": {"status": "operational", "note": ""},
        "sharepoint": {"status": "operational", "note": ""},
        "printer": {"status": "operational", "note": ""},
    }
    ALIASES = {"outlook": "email", "wi-fi": "wifi", "globalprotect": "vpn"}

    def get(self, service: str) -> dict:
        _maybe_fail(self.name)
        key = self.ALIASES.get(service, service)
        return {"service": key, **self.SERVICES.get(key, {"status": "unknown", "note": ""})}


class SoftwareCatalog:
    name = "catalog"
    ITEMS = {
        "visual studio code": {"label": "Visual Studio Code", "license": "free", "allowed": True},
        "vs code": {"label": "Visual Studio Code", "license": "free", "allowed": True},
        "zoom": {"label": "Zoom", "license": "free", "allowed": True},
        "slack": {"label": "Slack", "license": "free", "allowed": True},
        "postman": {"label": "Postman", "license": "free", "allowed": True},
        "python": {"label": "Python 3", "license": "free", "allowed": True},
        "notepad++": {"label": "Notepad++", "license": "free", "allowed": True},
        "jira": {"label": "Jira Software seat", "license": "paid", "allowed": True, "cost_month": 8},
        "tableau": {"label": "Tableau Creator", "license": "paid", "allowed": True, "cost_month": 75},
        "power bi": {"label": "Power BI Pro", "license": "paid", "allowed": True, "cost_month": 10},
        "adobe acrobat": {"label": "Adobe Acrobat Pro", "license": "paid", "allowed": True, "cost_month": 20},
        "photoshop": {"label": "Adobe Photoshop", "license": "paid", "allowed": True, "cost_month": 23},
        "figma": {"label": "Figma Professional", "license": "paid", "allowed": True, "cost_month": 15},
        "docker desktop": {"label": "Docker Desktop Business", "license": "paid", "allowed": True, "cost_month": 24},
        "utorrent": {"label": "uTorrent", "license": "free", "allowed": False, "reason": "peer-to-peer software is prohibited"},
        "teamviewer": {"label": "TeamViewer", "license": "free", "allowed": False, "reason": "unmanaged remote-control tools are prohibited"},
        "winrar": {"label": "WinRAR", "license": "paid", "allowed": False, "reason": "use the pre-approved 7-Zip instead"},
    }

    def lookup(self, software: str) -> dict | None:
        return self.ITEMS.get((software or "").lower())

    def assign(self, username: str, software: str) -> dict:
        _maybe_fail(self.name)
        item = self.lookup(software)
        if not item or not item["allowed"]:
            raise IntegrationError("software not assignable")
        return {"username": username, "software": item["label"], "deployment": "Company Portal push",
                "eta_minutes": 30}


IDP, ITSM_CLIENT, STATUS, CATALOG = IdentityProvider(), ITSM(), StatusPage(), SoftwareCatalog()
