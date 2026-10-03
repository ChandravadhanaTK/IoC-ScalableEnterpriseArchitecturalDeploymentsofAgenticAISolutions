import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import TracePanel from "../components/TracePanel.jsx";
import { Badge, Empty, PriorityBadge, Rich, StatusBadge, ago } from "../components/ui.jsx";

export default function Tickets() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [trace, setTrace] = useState(null);

  useEffect(() => { api.tickets("all").then(setRows); }, []);

  const filtered = (rows || []).filter((t) =>
    !q || `${t.id} ${t.summary} ${t.category} ${t.requester} ${t.status}`.toLowerCase().includes(q.toLowerCase()));

  async function view(id) {
    setTrace(null);
    setOpen(await api.ticket(id));
  }

  return (
    <div className={`page ${trace ? "page-with-trace" : ""}`}>
      <div className="page-head">
        <div>
          <h1>All tickets</h1>
          <p className="muted">Every conversation the agent has handled, with the handoff package for escalations.</p>
        </div>
        <input className="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter tickets" />
      </div>
      {rows === null && <div className="muted">Loading…</div>}
      {rows?.length === 0 && <Empty>No tickets yet.</Empty>}
      {filtered.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ticket</th><th>Summary</th><th>Requester</th><th>Category</th><th>Pri</th><th>Status</th><th>CSAT</th><th>Created</th></tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => view(t.id)} className={open?.id === t.id ? "sel" : ""} tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && view(t.id)}>
                  <td><code>{t.id}</code></td>
                  <td className="summary-cell">{t.summary}</td>
                  <td>{t.requester}</td>
                  <td>{t.category && <Badge>{t.category}</Badge>}</td>
                  <td><PriorityBadge p={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.csat ? "★".repeat(t.csat) : <span className="muted">-</span>}</td>
                  <td className="muted">{ago(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="drawer" role="dialog" aria-label={`Ticket ${open.id}`}>
          <header>
            <div><div className="eyebrow">{open.id}</div><h3>{open.summary}</h3></div>
            <button className="ghost" onClick={() => setOpen(null)} aria-label="Close">✕</button>
          </header>
          {open.handoff && (
            <section className="handoff">
              <div className="eyebrow">Escalation handoff</div>
              <dl className="kv">
                <dt>Reason</dt><dd>{open.handoff.reason}</dd>
                <dt>KB tried</dt><dd>{open.handoff.kb_tried.join(", ") || "-"}</dd>
                <dt>Tools tried</dt><dd>{open.handoff.tools_attempted.map((t) => `${t.tool}${t.ok ? " ✓" : " ✗"}`).join(", ") || "-"}</dd>
                <dt>Triage</dt><dd>{open.handoff.triage?.intent} · conf {Math.round((open.handoff.triage?.confidence || 0) * 100)}%</dd>
              </dl>
            </section>
          )}
          <div className="transcript">
            {open.messages.map((m, i) => (
              <div key={i} className={`t-msg t-${m.role}`}><span className="eyebrow">{m.role}</span><Rich text={m.content} /></div>
            ))}
          </div>
          <div className="eyebrow">Traces</div>
          <div className="trace-links">
            {open.traces.map((t) => (
              <button key={t.trace_id} className="chip" onClick={() => setTrace(t.trace_id)}>
                {t.trace_id.slice(0, 8)} · {t.outcome} · {Math.round(t.total_ms)} ms
              </button>
            ))}
          </div>
        </div>
      )}
      {trace && <TracePanel traceId={trace} onClose={() => setTrace(null)} />}
    </div>
  );
}
