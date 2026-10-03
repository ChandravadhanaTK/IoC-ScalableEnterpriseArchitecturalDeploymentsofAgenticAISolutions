import { createFileRoute, Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { useBills, useSubs } from "@/lib/data";
import { formatINR } from "@/lib/agents";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/subscriptions/$id")({
  head: () => ({ meta: [{ title: "Subscription details — BillPilot" }, { name: "description", content: "Price history for a subscription." }, { property: "og:title", content: "Subscription details — BillPilot" }, { property: "og:description", content: "Subscription history." }] }),
  component: SubDetail,
});

function SubDetail() {
  const { id } = Route.useParams();
  const sub = (useSubs().data ?? []).find((s) => s.id === id);
  const bills = (useBills().data ?? []).filter((b) => sub && b.merchant === sub.merchant && b.amount != null)
    .sort((a, b) => (a.billing_date ?? "").localeCompare(b.billing_date ?? ""));
  if (!sub) return <p className="text-muted-foreground">Loading…</p>;
  const amts = bills.map((b) => Number(b.amount));
  const avg = amts.length ? amts.reduce((a, b) => a + b, 0) / amts.length : 0;
  const stats = [
    ["Current amount", formatINR(sub.amount)], ["Average amount", formatINR(avg)],
    ["Highest amount", formatINR(amts.length ? Math.max(...amts) : null)], ["Lowest amount", formatINR(amts.length ? Math.min(...amts) : null)],
    ["Billing frequency", sub.frequency], ["Next billing date", sub.next_billing_date ?? "—"],
  ];
  return (
    <div>
      <PageHeader title={sub.merchant} sub={sub.category}><Button variant="ghost" asChild><Link to="/subscriptions">Back</Link></Button></PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">{stats.map(([l, v]) => <Card key={l}><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-xl font-bold">{v}</p></Card>)}</div>
      <Card className="mt-4">
        <h2 className="mb-4 font-semibold">Price history</h2>
        {bills.length ? <ResponsiveContainer width="100%" height={260}>
          <LineChart data={bills.map((b) => ({ date: b.billing_date, amount: Number(b.amount) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} /><Tooltip formatter={(v) => formatINR(Number(v))} />
            <Line type="monotone" dataKey="amount" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 5, fill: "var(--chart-2)" }} />
          </LineChart>
        </ResponsiveContainer> : <Empty>No historical bills.</Empty>}
        <p className="mt-3 text-sm text-muted-foreground">Previous amounts: {amts.map((a) => formatINR(a)).join(" → ") || "—"}</p>
      </Card>
    </div>
  );
}
