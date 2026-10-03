import { createFileRoute, Link } from "@tanstack/react-router";
import { fmt, useStore } from "@/lib/store";
import { StatusStamp } from "@/components/Shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audit Queue — AuditLens" },
      { name: "description", content: "Queue of invoices and expense claims awaiting AI audit and human review." },
      { property: "og:title", content: "Audit Queue — AuditLens" },
      { property: "og:description", content: "Queue of invoices and expense claims awaiting AI audit and human review." },
    ],
  }),
  component: Queue,
});

function Queue() {
  const s = useStore();
  if (!s) return null;
  const inv = s.invoices;
  const count = (k: string) => inv.filter((i) => i.status === k).length;
  const kpis = [
    ["Claims in ledger", inv.length],
    ["Awaiting audit", count("PENDING")],
    ["Needs human review", count("NEEDS_REVIEW")],
    ["Value audited", fmt(inv.filter((i) => i.status !== "PENDING").reduce((a, i) => a + i.total, 0))],
  ];
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Agentic AI · Finance Operations</p>
      <h1 className="mt-1 text-4xl">Audit Queue</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Open a claim and run the agent pipeline: extract → policy check → AI audit → route to auto-approve or a human reviewer.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="panel">
            <div className="label">{k}</div>
            <div className="font-display text-3xl">{v}</div>
          </div>
        ))}
      </div>
      <div className="panel mt-8 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>{["Claim", "Vendor", "Employee", "Category", "Date", "Total", "Risk", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {inv.map((i) => (
              <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3 font-mono"><Link to="/invoices/$id" params={{ id: i.id }} className="text-primary underline-offset-2 hover:underline">{i.id}</Link></td>
                <td className="px-4 py-3">{i.vendor}</td>
                <td className="px-4 py-3">{i.employee}</td>
                <td className="px-4 py-3">{i.category}</td>
                <td className="px-4 py-3 font-mono">{i.date}</td>
                <td className="px-4 py-3 font-mono">{fmt(i.total)}</td>
                <td className="px-4 py-3 font-mono">{i.risk ?? "—"}</td>
                <td className="px-4 py-3"><StatusStamp s={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
