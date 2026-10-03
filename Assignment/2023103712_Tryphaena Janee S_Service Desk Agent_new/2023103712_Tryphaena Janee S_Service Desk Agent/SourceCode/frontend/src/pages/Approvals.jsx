import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { Badge, Empty, Rich, RiskBadge, StatusBadge, ago } from "../components/ui.jsx";

export default function Approvals() {
  const [filter, setFilter] = useState("PENDING");
  const [items, setItems] = useState(null);
  const [reason, setReason] = useState({});
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const load = () => api.approvals(filter).then(setItems).catch((e) => setErr(e.message));
  useEffect(() => { setItems(null); load(); }, [filter]);

  async function decide(a, approve) {
    if (!approve && !(reason[a.id] || "").trim()) {
      setErr("Please give a reason when rejecting - the requester will see it.");
      return;
    }
    setBusy(a.id);
    setErr(null);
    try {
      const r = await api.decide(a.id, approve, reason[a.id] || "");
      setResult({ id: a.id, approve, reply: r.reply, outcome: r.outcome });
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p className="muted">High-risk actions wait here for a human decision. Nothing runs until you approve.</p>
        </div>
        <div className="seg" role="tablist">
          {["PENDING", "ALL"].map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? "on" : ""}
              onClick={() => setFilter(f)}>{f === "PENDING" ? "Pending" : "History"}</button>
          ))}
        </div>
      </div>

      {err && <div className="error">{err}</div>}
      {result && (
        <div className={`callout ${result.approve ? "callout-ok" : "callout-bad"}`}>
          <b>{result.approve ? "Approved" : "Rejected"} {result.id}.</b> The agent resumed and replied to the requester:
          <div className="callout-quote"><Rich text={result.reply} /></div>
        </div>
      )}

      {items === null && <div className="muted">Loading…</div>}
      {items?.length === 0 && <Empty>No {filter === "PENDING" ? "pending approvals" : "approvals yet"}. </Empty>}

      <div className="cards">
        {items?.map((a) => (
          <article key={a.id} className="card approval">
            <header>
              <div>
                <div className="eyebrow">{a.id} · {a.ticket_id}</div>
                <h3>{a.tool_label}</h3>
              </div>
              <div className="badges"><RiskBadge risk={a.risk} /><StatusBadge status={a.status} /></div>
            </header>
            <dl className="kv">
              <dt>Requested by</dt><dd>{a.requester_name} <span className="muted">({a.requested_by})</span></dd>
              <dt>Requested</dt><dd>{ago(a.created_at)}</dd>
              <dt>Justification</dt><dd>{a.justification || "-"}</dd>
              <dt>Parameters</dt>
              <dd className="params">{Object.entries(a.args).map(([k, v]) => <Badge key={k}>{k}: {String(v)}</Badge>)}</dd>
              {a.status !== "PENDING" && (<><dt>Decision</dt>
                <dd>{a.decided_by} {a.decision_reason ? `- "${a.decision_reason}"` : ""}</dd></>)}
            </dl>
            {a.status === "PENDING" && (
              a.can_decide ? (
                <div className="decide">
                  <input placeholder="Reason (required to reject)" value={reason[a.id] || ""}
                    onChange={(e) => setReason({ ...reason, [a.id]: e.target.value })} maxLength={500}
                    aria-label="Decision reason" />
                  <button className="danger" disabled={busy === a.id} onClick={() => decide(a, false)}>Reject</button>
                  <button className="primary" disabled={busy === a.id} onClick={() => decide(a, true)}>Approve</button>
                </div>
              ) : (
                <div className="muted small">You can't decide this one (separation of duties or insufficient role).</div>
              )
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
