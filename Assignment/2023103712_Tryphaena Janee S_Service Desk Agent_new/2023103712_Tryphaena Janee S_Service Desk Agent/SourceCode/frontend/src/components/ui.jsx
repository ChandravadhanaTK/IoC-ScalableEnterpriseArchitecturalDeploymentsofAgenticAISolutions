import React from "react";

const OUTCOME = {
  auto_resolved: ["Auto-resolved", "ok"],
  approval_pending: ["Awaiting approval", "warn"],
  escalated: ["Escalated", "info"],
  blocked: ["Blocked", "bad"],
  policy_denied: ["Policy denied", "bad"],
  approval_rejected: ["Rejected", "bad"],
};
const STATUS = {
  RESOLVED: "ok", CLOSED: "muted", ESCALATED: "info", AWAITING_APPROVAL: "warn",
  NEW: "muted", PENDING: "warn", APPROVED: "ok", REJECTED: "bad", EXPIRED: "muted",
};
const RISK = { low: "ok", medium: "warn", high: "bad" };

export function Badge({ tone = "muted", children, title }) {
  return <span className={`badge badge-${tone}`} title={title}>{children}</span>;
}
export const OutcomeBadge = ({ outcome }) => {
  const [label, tone] = OUTCOME[outcome] || [outcome || "-", "muted"];
  return <Badge tone={tone}>{label}</Badge>;
};
export const StatusBadge = ({ status }) => (
  <Badge tone={STATUS[status] || "muted"}>{(status || "-").replace("_", " ").toLowerCase()}</Badge>
);
export const RiskBadge = ({ risk }) => <Badge tone={RISK[risk] || "muted"}>{risk} risk</Badge>;
export const PriorityBadge = ({ p }) =>
  p ? <Badge tone={p === "P1" ? "bad" : p === "P2" ? "warn" : "muted"}>{p}</Badge> : null;

// Minimal, injection-safe rich text: **bold**, [KB-xxxx] chips, numbered lines.
// Builds React elements (no innerHTML), so model output can never inject markup.
export function Rich({ text }) {
  const blocks = (text || "").split(/\n{2,}/);
  return (
    <div className="rich">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const isList = lines.length > 1 && lines.slice(1).every((l) => /^\d+\.\s/.test(l));
        if (isList) {
          return (
            <div key={i}>
              <p>{inline(lines[0])}</p>
              <ol>{lines.slice(1).map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s/, ""))}</li>)}</ol>
            </div>
          );
        }
        return <p key={i}>{lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(l)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}

function inline(s) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\[(KB-\d{4})\]/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else out.push(<span key={k++} className="kb-chip">{m[2]}</span>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function Stars({ value, onRate, disabled }) {
  return (
    <span className="stars" role="radiogroup" aria-label="Rate this answer">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={disabled} aria-label={`${n} star`}
          className={n <= (value || 0) ? "on" : ""} onClick={() => onRate(n)}>★</button>
      ))}
    </span>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function ago(ts) {
  if (!ts) return "-";
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const fmt = {
  pct: (v) => (v == null ? "-" : `${Math.round(v * 100)}%`),
  usd: (v, d = 2) => (v == null ? "-" : `$${Number(v).toFixed(d)}`),
  num: (v) => (v == null ? "-" : Number(v).toLocaleString()),
  ms: (v) => (v == null ? "-" : v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`),
};
