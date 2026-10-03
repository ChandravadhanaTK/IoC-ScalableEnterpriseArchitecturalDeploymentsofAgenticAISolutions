import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Empty, SeverityBadge, StatusBadge } from "@/components/bits";
import { useAnomalies, useBills, useReminders, useSubs } from "@/lib/data";
import { formatINR } from "@/lib/agents";
import { loadDemoData } from "@/lib/workflow.functions";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BillPilot" }, { name: "description", content: "Your bill and subscription overview." }, { property: "og:title", content: "Dashboard — BillPilot" }, { property: "og:description", content: "Spending overview." }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
const monthly = (amt: number, f: string) => f === "Yearly" ? amt / 12 : f === "Quarterly" ? amt / 3 : amt;

function Dashboard() {
  const bills = useBills().data ?? [];
  const subs = useSubs().data ?? [];
  const anomalies = useAnomalies().data ?? [];
  const reminders = useReminders().data ?? [];
  const qc = useQueryClient();
  const seed = useServerFn(loadDemoData);
  const [seeding, setSeeding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const active = subs.filter((s) => s.status === "active");
  const mrr = active.reduce((a, s) => a + monthly(Number(s.amount), s.frequency), 0);
  const upcoming = bills.filter((b) => b.due_date && b.due_date >= today && b.due_date <= in7);

  const byMonth = useMemo(() => {
    const m: Record<string, number> = {};
    bills.forEach((b) => { if (b.billing_date) { const k = b.billing_date.slice(0, 7); m[k] = (m[k] ?? 0) + Number(b.amount ?? 0); } });
    return Object.entries(m).sort().slice(-6).map(([month, total]) => ({ month, total: Math.round(total) }));
  }, [bills]);
  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    bills.forEach((b) => { m[b.category ?? "Other"] = (m[b.category ?? "Other"] ?? 0) + Number(b.amount ?? 0); });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [bills]);
  const billMap = Object.fromEntries(bills.map((b) => [b.id, b]));

  const doSeed = async () => {
    setSeeding(true);
    try { await seed(); await qc.invalidateQueries(); toast.success("Demo data loaded"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); } finally { setSeeding(false); }
  };

  return (
    <div>
      <PageHeader title="Dashboard" sub="Live figures computed from your saved bills.">
        {bills.length === 0 && <Button variant="outline" onClick={doSeed} disabled={seeding}>{seeding ? "Loading…" : "Load demo data"}</Button>}
        <Button asChild><Link to="/upload">Upload bill</Link></Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Monthly Recurring", formatINR(mrr)],
          ["Active Subscriptions", active.length],
          ["Upcoming Bills (7d)", upcoming.length],
          ["Anomalies", anomalies.length],
        ].map(([l, v]) => (
          <Card key={l as string}><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl font-bold">{v}</p></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Monthly spending</h2>
          {byMonth.length ? <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byMonth}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v) => formatINR(Number(v))} /><Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer> : <Empty>No bills yet.</Empty>}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">By category</h2>
          {byCat.length ? <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={byCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>{byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]!} />)}</Pie><Tooltip formatter={(v) => formatINR(Number(v))} /></PieChart>
          </ResponsiveContainer> : <Empty>No data.</Empty>}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 font-semibold">Recent bills</h2>
          {bills.slice(0, 6).map((b) => (
            <Link key={b.id} to="/bills/$id" params={{ id: b.id }} className="flex items-center justify-between border-b py-2 text-sm last:border-0 hover:text-primary">
              <span>{b.merchant ?? "Processing…"}</span><span className="flex items-center gap-2">{formatINR(b.amount)}<StatusBadge status={b.status} /></span>
            </Link>
          ))}
          {!bills.length && <Empty>Nothing yet.</Empty>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Upcoming reminders</h2>
          {reminders.filter((r) => r.status === "pending").slice(0, 6).map((r) => (
            <div key={r.id} className="border-b py-2 text-sm last:border-0"><p>{r.message}</p><p className="text-xs text-muted-foreground">{r.reminder_date}</p></div>
          ))}
          {!reminders.length && <Empty>No reminders.</Empty>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Recent anomalies</h2>
          {anomalies.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <span>{billMap[a.bill_id]?.merchant ?? "Bill"} · {a.type?.replace("_", " ").toLowerCase()} {a.percentage_change ? `(${a.percentage_change > 0 ? "+" : ""}${a.percentage_change}%)` : ""}</span><SeverityBadge s={a.severity} />
            </div>
          ))}
          {!anomalies.length && <Empty>No anomalies detected.</Empty>}
        </Card>
      </div>
    </div>
  );
}
