import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Empty, StatusBadge } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { sb, useSubs } from "@/lib/data";
import { formatINR } from "@/lib/agents";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/subscriptions/")({
  head: () => ({ meta: [{ title: "Subscriptions — BillPilot" }, { name: "description", content: "Recurring subscriptions detected by the agents." }, { property: "og:title", content: "Subscriptions — BillPilot" }, { property: "og:description", content: "Recurring subscriptions." }] }),
  component: Subs,
});

function Subs() {
  const subs = useSubs().data ?? [];
  const qc = useQueryClient();
  const toggle = async (s: any) => {
    await sb.from("subscriptions").update({ status: s.status === "active" ? "cancelled" : "active" }).eq("id", s.id);
    await sb.from("audit_logs").insert({ action: "subscription_status_changed", entity: "subscription", entity_id: s.id });
    qc.invalidateQueries({ queryKey: ["subscriptions"] });
  };
  return (
    <div>
      <PageHeader title="Subscriptions" sub="Detected automatically by the Subscription Detection Agent." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subs.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <div className="flex items-start justify-between">
              <div><h3 className="text-lg font-bold">{s.merchant}</h3><p className="text-xs text-muted-foreground">{s.category}</p></div>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-4 font-display text-3xl font-bold">{formatINR(s.amount, s.currency)}<span className="text-sm font-normal text-muted-foreground"> / {s.frequency}</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Next: {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" asChild><Link to="/subscriptions/$id" params={{ id: s.id }}>Details</Link></Button>
              <Button size="sm" variant="outline" onClick={() => toggle(s)}>{s.status === "active" ? "Mark cancelled" : "Mark active"}</Button>
            </div>
          </Card>
        ))}
      </div>
      {!subs.length && <Card><Empty>No subscriptions yet — upload recurring bills or load demo data from the dashboard.</Empty></Card>}
    </div>
  );
}
