import time, uuid, threading
from .models import ClaimIn, ClaimRecord, Status, AuditEvent
from .agents import PIPELINE, Rejected, GuardrailBlock
from .metrics import metrics

_STORE, _LOCK = {}, threading.Lock()


def log(r, actor, event, detail=""):
    r.audit.append(AuditEvent(ts=time.time(), actor=actor, event=event, detail=detail))


def submit(claim: ClaimIn) -> ClaimRecord:
    t0 = time.perf_counter()
    r = ClaimRecord(id=uuid.uuid4().hex[:10], claim=claim)
    metrics.inc("claims_total")
    log(r, "system", "RECEIVED")
    for name, fn in PIPELINE:
        try:
            fn(r)
            log(r, name, "OK", r.status.value)
        except GuardrailBlock as e:
            metrics.inc("guardrail_blocks")
            r.status, r.final_reason = Status.REJECTED, str(e)
            log(r, name, "GUARDRAIL", str(e)); metrics.inc("rejected"); break
        except Rejected as e:
            r.status, r.final_reason = Status.REJECTED, str(e)
            log(r, name, "REJECTED", str(e)); metrics.inc("rejected"); break
        except Exception as e:  # failure path: dead-letter for manual handling
            r.status, r.final_reason = Status.FAILED, f"{name} failed: {e}"
            log(r, name, "FAILED", str(e)); metrics.inc("failed"); break
    if r.status == Status.APPROVED:
        metrics.inc("approved_auto"); metrics.paid(r.payable_amount)
    if r.status == Status.PENDING_APPROVAL:
        metrics.inc("pending_human")
    metrics.observe((time.perf_counter() - t0) * 1000)
    with _LOCK:
        _STORE[r.id] = r
    return r


def get(cid):
    return _STORE.get(cid)


def all_claims():
    return list(_STORE.values())


def decide(cid, approve, reason, actor="officer"):
    r = _STORE.get(cid)
    if not r or r.status != Status.PENDING_APPROVAL:
        return None
    r.status = Status.APPROVED if approve else Status.REJECTED
    r.final_reason = reason
    log(r, actor, "HUMAN_DECISION", f"{'approve' if approve else 'reject'}: {reason}")
    if approve:
        metrics.inc("approved_human"); metrics.paid(r.payable_amount)
    else:
        metrics.inc("rejected")
    return r
