"""Five cooperating agents. Each reads/writes the ClaimRecord and either
advances state, raises Rejected (business reject) or AgentError (system failure)."""
import os
from .models import Status, ClaimRecord
from .security import INJECTION
from .tools import rainfall_lookup, land_record_lookup, with_retry

ALLOWED_CAUSES = {"drought", "flood", "pest", "hail", "cyclone"}
SUM_INSURED_PER_ACRE = 40000
LOSS_THRESHOLD = 33


class Rejected(Exception):
    pass


class AgentError(Exception):
    pass


class GuardrailBlock(Rejected):
    pass


def intake_agent(r: ClaimRecord):
    c = r.claim
    if INJECTION.search(c.notes) or INJECTION.search(c.crop):
        raise GuardrailBlock("prompt-injection / unsafe content detected")
    if c.cause.lower() not in ALLOWED_CAUSES:
        raise Rejected(f"cause '{c.cause}' not covered")
    r.status = Status.VALIDATED


def verification_agent(r: ClaimRecord):
    c = r.claim
    acres = with_retry(lambda: land_record_lookup(c.farmer_id))
    if acres is None:
        raise Rejected("farmer not found in land records")
    if c.acres > acres:
        raise Rejected(f"claimed acres {c.acres} exceed registered {acres}")


def risk_agent(r: ClaimRecord):
    c, score, why = r.claim, 0.0, []
    if c.claim_amount / c.acres > SUM_INSURED_PER_ACRE:
        score += 0.4; why.append("amount per acre above sum insured")
    if c.loss_percent >= 100:
        score += 0.2; why.append("100% loss claimed")
    if c.cause.lower() == "drought" and rainfall_lookup(c.district) < 20:
        score += 0.3; why.append("drought claimed but rainfall near normal")
    if not c.notes.strip():
        score += 0.1; why.append("no supporting notes")
    r.risk_score, r.risk_reasons, r.status = round(score, 2), why, Status.RISK_SCORED


def assessment_agent(r: ClaimRecord):
    c = r.claim
    if c.loss_percent < LOSS_THRESHOLD:
        raise Rejected(f"loss {c.loss_percent}% below {LOSS_THRESHOLD}% threshold")
    cap = c.acres * SUM_INSURED_PER_ACRE
    r.payable_amount = round(min(c.claim_amount, cap) * c.loss_percent / 100, 2)
    r.status = Status.ASSESSED


def approval_gate(r: ClaimRecord):
    limit = float(os.getenv("AUTO_APPROVE_LIMIT", 50000))
    thr = float(os.getenv("RISK_REVIEW_THRESHOLD", 0.5))
    if r.risk_score >= thr or r.payable_amount > limit:
        r.needs_human, r.status = True, Status.PENDING_APPROVAL
    else:
        r.status, r.final_reason = Status.APPROVED, "auto-approved within policy"


PIPELINE = [("intake", intake_agent), ("verification", verification_agent),
            ("risk", risk_agent), ("assessment", assessment_agent),
            ("approval_gate", approval_gate)]
