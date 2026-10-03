import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import TracePanel from "../components/TracePanel.jsx";
import { Badge, OutcomeBadge, PriorityBadge, Rich, Stars, StatusBadge, ago } from "../components/ui.jsx";

const SUGGESTIONS = [
  "I'm locked out of my account",
  "VPN won't connect from home",
  "I forgot my password, can you reset it?",
  "Please install Tableau for reporting",
  "Outlook is stuck on 'Updating folder'",
  "I clicked a link in a suspicious email",
];

const AGENT_LABEL = {
  guardian: "Guardrails", triage: "Triage", knowledge: "Knowledge", planner: "Resolver",
  policy_gate: "Approval gate", executor: "Executor", escalation: "Escalation",
  responder: "Responder", blocked: "Blocked",
};

export default function Chat({ user }) {
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null); // ticket id
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState(null);
  const [rating, setRating] = useState({});
  const [err, setErr] = useState(null);
  const endRef = useRef(null);

  const loadTickets = () => api.tickets("mine").then(setTickets).catch(() => {});
  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);

  async function openTicket(id) {
    setActive(id);
    setErr(null);
    const t = await api.ticket(id);
    const traces = t.traces || [];
    let ai = 0;
    setMessages(t.messages.map((m) => (m.role === "assistant"
      ? { role: "assistant", content: m.content, meta: { trace_id: traces[ai++]?.trace_id, status: t.status,
          category: t.category, priority: t.priority, path: ai === 1 ? t.path : null } }
      : { role: "user", content: m.content })));
    if (t.csat) setRating((r) => ({ ...r, [id]: t.csat }));
  }

  function newRequest() {
    setActive(null);
    setMessages([]);
    setTrace(null);
    setErr(null);
  }

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setErr(null);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    try {
      const r = await api.chat(msg, active || undefined);
      setActive(r.ticket_id);
      setMessages((m) => [...m, { role: "assistant", content: r.reply, meta: r }]);
      loadTickets();
    } catch (e) {
      setErr(e.status === 429 ? "You're sending messages too quickly - try again in a few seconds." : e.message);
    } finally {
      setBusy(false);
    }
  }

  async function rate(n) {
    if (!active) return;
    setRating((r) => ({ ...r, [active]: n }));
    try { await api.feedback(active, n); } catch (e) { setErr(e.message); }
  }

  const activeTicket = tickets.find((t) => t.id === active);

  return (
    <div className={`chat-layout ${trace ? "with-trace" : ""}`}>
      <aside className="ticket-rail">
        <button className="primary block" onClick={newRequest}>+ New request</button>
        <div className="eyebrow rail-title">My tickets</div>
        {tickets.length === 0 && <div className="muted small">No tickets yet.</div>}
        <ul>
          {tickets.map((t) => (
            <li key={t.id}>
              <button className={`rail-item ${t.id === active ? "active" : ""}`} onClick={() => openTicket(t.id)}>
                <span className="rail-summary">{t.summary || t.id}</span>
                <span className="rail-meta"><StatusBadge status={t.status} /> <span>{ago(t.created_at)}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="conversation">
        <header className="conv-head">
          <div>
            <h2>{activeTicket ? activeTicket.summary || activeTicket.id : "How can IT help today?"}</h2>
            <div className="muted small">
              {activeTicket ? <>{activeTicket.id} · <StatusBadge status={activeTicket.status} /></>
                : "Describe the problem in your own words. Don't share passwords - IT will never ask for them."}
            </div>
          </div>
        </header>

        <div className="messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="starter">
              <p className="muted">Try one of these:</p>
              <div className="chips">
                {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg msg-${m.role}`}>
              {m.role === "assistant" && <div className="avatar" aria-hidden>SD</div>}
              <div className="bubble">
                <Rich text={m.content} />
                {m.role === "assistant" && m.meta && (
                  <div className="msg-meta">
                    {m.meta.outcome && <OutcomeBadge outcome={m.meta.outcome} />}
                    {m.meta.category && <Badge>{m.meta.category}</Badge>}
                    <PriorityBadge p={m.meta.priority} />
                    {m.meta.confidence != null && <Badge title="Triage confidence">conf {Math.round(m.meta.confidence * 100)}%</Badge>}
                    {m.meta.guardrails?.pii_found?.length > 0 && (
                      <Badge tone="warn" title="Personal data was removed before processing">
                        redacted: {m.meta.guardrails.pii_found.join(", ").toLowerCase()}
                      </Badge>
                    )}
                    {m.meta.trace_id && (
                      <button className="link" onClick={() => setTrace(m.meta.trace_id)}>View trace →</button>
                    )}
                  </div>
                )}
                {m.role === "assistant" && m.meta?.path?.length > 0 && (
                  <div className="agent-path" aria-label="Agents involved">
                    {m.meta.path.map((n, j) => (
                      <React.Fragment key={j}>
                        {j > 0 && <span className="arrow">›</span>}
                        <span className={`node node-${n}`}>{AGENT_LABEL[n] || n}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="msg msg-assistant">
              <div className="avatar" aria-hidden>SD</div>
              <div className="bubble typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {active && activeTicket && ["RESOLVED", "CLOSED", "ESCALATED"].includes(activeTicket.status) && (
          <div className="rate-row">
            <span className="muted small">Was this helpful?</span>
            <Stars value={rating[active]} onRate={rate} />
          </div>
        )}
        {err && <div className="error">{err}</div>}

        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={active ? "Reply to continue this ticket…" : "e.g. My laptop won't connect to the office Wi-Fi"}
            rows={2}
            maxLength={4000}
            aria-label="Message"
          />
          <button className="primary" disabled={busy || !input.trim()}>Send</button>
        </form>
      </section>

      {trace && <TracePanel traceId={trace} onClose={() => setTrace(null)} />}
    </div>
  );
}
