import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { Badge, fmt } from "../components/ui.jsx";

const OUTCOME_COLORS = {
  auto_resolved: "var(--c-green)", escalated: "var(--c-blue)", open: "var(--c-amber)",
  approval_rejected: "var(--c-red)", policy_denied: "var(--c-purple)", blocked_by_guardrail: "var(--c-red-2)",
};
const OUTCOME_LABEL = {
  auto_resolved: "Auto-resolved", escalated: "Escalated", open: "Awaiting approval",
  approval_rejected: "Rejected", policy_denied: "Policy denied", blocked_by_guardrail: "Blocked",
};
const NODE_LABEL = {
  guardian: "Guardrails", triage: "Triage", knowledge: "Knowledge", planner: "Resolver",
  policy_gate: "Approval gate", executor: "Executor", escalation: "Escalation", responder: "Responder", blocked: "Blocked",
};

function Tile({ label, value, sub, tone, target }) {
  return (
    <div className={`tile ${tone ? `tile-${tone}` : ""}`}>
      <div className="tile-label">{label}</div>
      <div className={`tile-value ${typeof value === "string" && /[a-z]{4,}/i.test(value) ? "tile-value-text" : ""}`} title={String(value)}>{value}</div>
      {(sub || target) && <div className="tile-sub">{sub}{sub && target && " · "}{target && <span className="target">target {target}</span>}</div>}
    </div>
  );
}

function Pillar({ n, title, desc, children, accent }) {
  return (
    <section className="pillar" style={{ "--accent": accent }}>
      <header><span className="pillar-n">{n}</span><div><h3>{title}</h3><p className="muted small">{desc}</p></div></header>
      {children}
    </section>
  );
}

function HBar({ data, colors, labels, unit = "", max }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const top = max || Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="hbars">
      {entries.map(([k, v]) => (
        <div className="hbar" key={k}>
          <span className="hbar-label">{labels?.[k] || k}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(v / top) * 100}%`, background: colors?.[k] || "var(--c-blue)" }} /></span>
          <span className="hbar-val">{typeof v === "number" ? (unit === "ms" ? fmt.ms(v) : fmt.num(v)) : v}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ series }) {
  if (!series.length) return <div className="muted small">No traffic in this window yet.</div>;
  const keys = Object.keys(OUTCOME_COLORS);
  const W = 640, H = 170, pad = { l: 28, b: 22, t: 8, r: 4 };
  const totals = series.map((s) => keys.reduce((a, k) => a + (s[k] || 0), 0));
  const maxV = Math.max(1, ...totals);
  const bw = (W - pad.l - pad.r) / series.length;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / maxV);
  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tickets per hour by outcome">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(maxV * f)} y2={y(maxV * f)} className="gridline" />
            <text x={pad.l - 6} y={y(maxV * f) + 4} className="axis" textAnchor="end">{Math.round(maxV * f)}</text>
          </g>
        ))}
        {series.map((s, i) => {
          let acc = 0;
          const x = pad.l + i * bw + bw * 0.15;
          return (
            <g key={s.hour}>
              {keys.map((k) => {
                const v = s[k] || 0;
                if (!v) return null;
                const y1 = y(acc + v), y0 = y(acc);
                acc += v;
                return <rect key={k} x={x} y={y1} width={bw * 0.7} height={Math.max(0, y0 - y1)} fill={OUTCOME_COLORS[k]} rx="1.5">
                  <title>{`${new Date(s.hour * 1000).toLocaleTimeString([], { hour: "2-digit" })} · ${OUTCOME_LABEL[k]}: ${v}`}</title>
                </rect>;
              })}
              {(i % Math.ceil(series.length / 8) === 0) && (
                <text x={x + bw * 0.35} y={H - 6} className="axis" textAnchor="middle">
                  {new Date(s.hour * 1000).toLocaleTimeString([], { hour: "2-digit" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="legend">
        {keys.map((k) => <span key={k}><i style={{ background: OUTCOME_COLORS[k] }} />{OUTCOME_LABEL[k]}</span>)}
      </figcaption>
    </figure>
  );
}

export default function Monitoring() {
  const [hours, setHours] = useState(24);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => api.metrics(hours).then((r) => alive && setD(r)).catch((e) => setErr(e.message));
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [hours]);

  if (err) return <div className="page"><div className="error">{err}</div></div>;
  if (!d) return <div className="page muted">Loading dashboard…</div>;
  const { business: b, quality: q, safety: s, cost: c, health: h, trace: t, slo } = d;
  const nodeLat = Object.fromEntries(Object.entries(t.node_latency).map(([k, v]) => [k, v.mean_ms]));
  const tools = Object.entries(q.tool_success_rate);

  return (
    <div className="page monitoring">
      <div className="page-head">
        <div>
          <h1>Monitoring</h1>
          <p className="muted">Health, trace, quality, safety, cost and business outcomes · refreshes every 15 s</p>
        </div>
        <div className="seg">
          {[[24, "24 h"], [168, "7 days"], [720, "30 days"]].map(([v, l]) => (
            <button key={v} className={hours === v ? "on" : ""} onClick={() => setHours(v)}>{l}</button>
          ))}
        </div>
      </div>

      {d.alerts.length > 0 ? (
        <div className="alerts">
          {d.alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.severity}`}><Badge tone={a.severity === "critical" ? "bad" : "warn"}>{a.signal}</Badge> {a.msg}</div>
          ))}
        </div>
      ) : <div className="alerts"><div className="alert alert-ok"><Badge tone="ok">all clear</Badge> Every signal is within its SLO.</div></div>}

      <Pillar n="6" title="Business outcomes" desc="Is the agent saving people time?" accent="var(--c-cyan)">
        <div className="tiles">
          <Tile label="Tickets" value={fmt.num(b.tickets)} sub={`${b.awaiting_approval} awaiting approval`} />
          <Tile label="Auto-resolution rate" value={fmt.pct(b.auto_resolution_rate)}
            tone={b.auto_resolution_rate >= slo.auto_resolution_rate_min ? "ok" : "warn"} target={fmt.pct(slo.auto_resolution_rate_min)} />
          <Tile label="Agent hours saved" value={b.agent_hours_saved} sub="vs. manual L1 handling" />
          <Tile label="Net cost avoided" value={fmt.usd(b.cost_avoided_usd, 0)} sub="labour saved − LLM spend" tone="ok" />
          <Tile label="MTTR auto / escalated" value={`${b.mttr_minutes.auto_resolved ?? "-"} / ${b.mttr_minutes.escalated ?? "-"}`} sub="minutes" />
          <Tile label="Approval wait" value={b.approval_wait_avg_min != null ? `${b.approval_wait_avg_min} min` : "-"} sub="avg time to decision" />
        </div>
        <div className="grid-2">
          <div className="panel"><div className="panel-title">Tickets per hour by outcome</div><TrendChart series={d.series} /></div>
          <div className="panel"><div className="panel-title">Volume by category</div><HBar data={b.by_category} /></div>
        </div>
      </Pillar>

      <div className="grid-2">
        <Pillar n="1" title="Health" desc="Is the service up and fast?" accent="var(--c-blue)">
          <div className="tiles tiles-sm">
            <Tile label="p95 latency" value={fmt.ms(h.latency_p95_ms)} tone={h.latency_p95_ms <= slo.p95_latency_ms ? "ok" : "warn"} target={fmt.ms(slo.p95_latency_ms)} />
            <Tile label="p50 latency" value={fmt.ms(h.latency_p50_ms)} />
            <Tile label="Error rate" value={fmt.pct(h.error_rate)} tone={h.error_rate <= slo.error_rate_max ? "ok" : "bad"} />
            <Tile label="LLM" value={h.llm_model} sub={`circuit: ${h.llm_circuit} · fallbacks ${h.llm_fallbacks}`} />
          </div>
        </Pillar>
        <Pillar n="2" title="Trace" desc="Where does time go inside the workflow?" accent="var(--c-purple)">
          <div className="panel-title">Mean latency per agent node</div>
          <HBar data={nodeLat} labels={NODE_LABEL} unit="ms" colors={Object.fromEntries(Object.keys(nodeLat).map((k) => [k, "var(--c-purple)"]))} />
        </Pillar>
      </div>

      <div className="grid-3">
        <Pillar n="3" title="Quality" desc="Are answers correct and useful?" accent="var(--c-green)">
          <div className="tiles tiles-sm">
            <Tile label="CSAT" value={q.csat_avg ?? "-"} sub={`${q.csat_responses} ratings`} tone={q.csat_avg == null ? null : q.csat_avg >= slo.csat_min ? "ok" : "warn"} target={slo.csat_min} />
          </div>
          <div className="panel-title">Tool success rate</div>
          <table className="mini">
            <tbody>{tools.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v.calls}</td><td className={v.success_rate < 0.95 ? "warn-text" : ""}>{fmt.pct(v.success_rate)}</td></tr>
            ))}</tbody>
          </table>
        </Pillar>
        <Pillar n="4" title="Safety" desc="Are guardrails and approvals working?" accent="var(--c-amber)">
          <div className="tiles tiles-sm">
            <Tile label="Injection blocks" value={fmt.num(s.guardrail_blocks)} />
            <Tile label="PII redactions" value={fmt.num(s.pii_redactions)} />
            <Tile label="Policy denials" value={fmt.num(s.policy_denials)} />
            <Tile label="Approvals" value={`${s.approvals_requested}`} sub={`${s.approvals_pending} pending · ${s.approvals_rejected} rejected`} />
          </div>
        </Pillar>
        <Pillar n="5" title="Cost" desc="What does each resolution cost?" accent="var(--c-red)">
          <div className="tiles tiles-sm">
            <Tile label="LLM spend" value={fmt.usd(c.total_usd, 3)} />
            <Tile label="Per ticket" value={fmt.usd(c.per_ticket_usd, 4)} tone={c.per_ticket_usd <= slo.cost_per_ticket_max_usd ? "ok" : "warn"} target={fmt.usd(slo.cost_per_ticket_max_usd)} />
            <Tile label="Tokens in" value={fmt.num(c.input_tokens)} />
            <Tile label="Tokens out" value={fmt.num(c.output_tokens)} />
          </div>
        </Pillar>
      </div>
      <div className="panel"><div className="panel-title">Outcome mix</div>
        <HBar data={b.by_resolution} colors={OUTCOME_COLORS} labels={OUTCOME_LABEL} /></div>
    </div>
  );
}
