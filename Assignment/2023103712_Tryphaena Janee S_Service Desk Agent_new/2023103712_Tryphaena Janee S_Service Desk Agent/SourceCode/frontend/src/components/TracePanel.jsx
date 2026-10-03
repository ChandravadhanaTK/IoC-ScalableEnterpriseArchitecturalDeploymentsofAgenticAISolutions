import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { fmt } from "./ui.jsx";

const KIND_LABEL = { agent: "Agent", llm: "LLM", tool: "Tool", internal: "Step" };

export default function TracePanel({ traceId, onClose }) {
  const [trace, setTrace] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setTrace(null);
    api.trace(traceId).then(setTrace).catch((e) => setErr(e.message));
  }, [traceId]);

  const spans = trace ? [...trace.spans].sort((a, b) => a.start_ms - b.start_ms) : [];
  const total = trace ? Math.max(trace.total_ms, ...spans.map((s) => s.start_ms + s.duration_ms), 1) : 1;

  return (
    <aside className="trace-panel" aria-label="Trace">
      <header>
        <div>
          <div className="eyebrow">Trace</div>
          <code>{traceId}</code>
        </div>
        <button className="ghost" onClick={onClose} aria-label="Close trace">✕</button>
      </header>
      {err && <div className="error">{err}</div>}
      {!trace && !err && <div className="muted">Loading…</div>}
      {trace && (
        <>
          <div className="trace-stats">
            <div><span>Total</span><b>{fmt.ms(trace.total_ms)}</b></div>
            <div><span>Tokens</span><b>{fmt.num(trace.input_tokens)} / {fmt.num(trace.output_tokens)}</b></div>
            <div><span>Cost</span><b>{fmt.usd(trace.cost_usd, 5)}</b></div>
            <div><span>Outcome</span><b>{trace.outcome}</b></div>
          </div>
          <ol className="spans">
            {spans.map((s, i) => (
              <li key={i} className={`span span-${s.kind} ${s.status === "error" ? "span-error" : ""}`}>
                <div className="span-head">
                  <span className="span-kind">{KIND_LABEL[s.kind] || s.kind}</span>
                  <span className="span-name">{s.name.split(".").slice(1).join(".")}</span>
                  <span className="span-ms">{fmt.ms(s.duration_ms)}</span>
                </div>
                <div className="span-track">
                  <div className="span-bar" style={{
                    left: `${(s.start_ms / total) * 100}%`,
                    width: `${Math.max(1.5, (s.duration_ms / total) * 100)}%`,
                  }} />
                </div>
                {Object.keys(s.attrs || {}).length > 0 && (
                  <div className="span-attrs">
                    {Object.entries(s.attrs).filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
                      <span key={k}>{k}=<b>{typeof v === "object" ? JSON.stringify(v) : String(v)}</b></span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </aside>
  );
}
