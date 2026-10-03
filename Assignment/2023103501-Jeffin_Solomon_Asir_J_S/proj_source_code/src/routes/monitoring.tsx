import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt, useStore } from "@/lib/store";

export const Route = createFileRoute("/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring — AuditLens" },
      { name: "description", content: "Health, quality, safety, cost and business outcome metrics for the audit agents." },
      { property: "og:title", content: "Monitoring — AuditLens" },
      { property: "og:description", content: "Health, quality, safety, cost and business outcome metrics for the audit agents." },
    ],
  }),
  component: Monitoring,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Monitoring() {
  const s = useStore();
  if (!s) return null;
  const audited = s.invoices.filter((i) => i.auditedAt);
  const avgLat = audited.length ? Math.round(audited.reduce((a, i) => a + (i.latencyMs ?? 0), 0) / audited.length / 100) / 10 : 0;
  const auto = audited.filter((i) => i.status === "AUTO_APPROVED").length;
  const flagged = audited.filter((i) => (i.risk ?? 0) >= 30);
  const overrides = s.events.filter((e) => e.actor === "Finance Reviewer").length;
  const statusData = ["PENDING", "AUTO_APPROVED", "NEEDS_REVIEW", "APPROVED", "REJECTED"].map((k) => ({ name: k.replace("_", " "), value: s.invoices.filter((i) => i.status === k).length })).filter((d) => d.value);
  const riskData = audited.map((i) => ({ id: i.id, risk: i.risk ?? 0 }));
  const cards = [
    ["Health", "Avg pipeline latency", `${avgLat}s`],
    ["Quality", "Claims audited", `${audited.length}/${s.invoices.length}`],
    ["Safety", "Human overrides", overrides],
    ["Cost", "Est. AI cost (≈₹0.4/audit)", fmt(Math.round(audited.length * 0.4 * 10) / 10)],
    ["Outcome", "Auto-approval rate", audited.length ? `${Math.round((auto / audited.length) * 100)}%` : "—"],
    ["Outcome", "Leakage prevented", fmt(flagged.filter((i) => i.status !== "APPROVED").reduce((a, i) => a + i.total, 0))],
  ];
  return (
    <div>
      <h1 className="text-4xl">Monitoring</h1>
      <p className="mt-2 text-muted-foreground">Live metrics from this browser's agent runs.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map(([t, k, v]) => (
          <div key={k as string} className="panel">
            <div className="label">{t} · {k}</div>
            <div className="font-display text-3xl">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="panel h-80">
          <h2 className="mb-2 text-lg">Claims by status</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>{statusData.map((_, k) => <Cell key={k} fill={COLORS[k % 5]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="panel h-80">
          <h2 className="mb-2 text-lg">Risk score per audited claim</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={riskData}><XAxis dataKey="id" fontSize={11} /><YAxis domain={[0, 100]} fontSize={11} /><Tooltip /><Bar dataKey="risk" fill="var(--chart-1)" radius={[3, 3, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel mt-6">
        <h2 className="mb-3 text-lg">Trace log</h2>
        <ul className="max-h-72 space-y-1 overflow-y-auto font-mono text-xs">
          {s.events.map((e, k) => <li key={k}>{e.at.slice(0, 19).replace("T", " ")} · {e.invoiceId} · {e.actor}: {e.action}</li>)}
          {!s.events.length && <li className="text-muted-foreground">No agent runs yet.</li>}
        </ul>
      </div>
    </div>
  );
}
