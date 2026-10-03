import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, Empty, SeverityBadge, StatusBadge } from "@/components/bits";
import { sb, useAnomalies, useBills } from "@/lib/data";
import { CATEGORIES, formatINR } from "@/lib/agents";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/bills/")({
  head: () => ({ meta: [{ title: "Bills — BillPilot" }, { name: "description", content: "Search and filter all your bills." }, { property: "og:title", content: "Bills — BillPilot" }, { property: "og:description", content: "All bills." }] }),
  component: Bills,
});

const sel = "h-9 rounded-md border bg-card px-2 text-sm";

function Bills() {
  const bills = useBills().data ?? [];
  const anomalies = useAnomalies().data ?? [];
  const qc = useQueryClient();
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [status, setStatus] = useState("");
  const [from, setFrom] = useState(""); const [anom, setAnom] = useState("");
  const anomBy = Object.fromEntries(anomalies.map((a) => [a.bill_id, a]));
  const rows = useMemo(() => bills.filter((b) =>
    (!q || `${b.merchant} ${b.invoice_number}`.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || b.category === cat) && (!status || b.status === status) &&
    (!from || (b.billing_date ?? "") >= from) &&
    (!anom || (anom === "yes" ? !!anomBy[b.id] : !anomBy[b.id]))), [bills, q, cat, status, from, anom, anomBy]);

  const del = async (id: string, path?: string) => {
    if (!confirm("Delete this bill?")) return;
    if (path) await sb.storage.from("bills").remove([path]);
    const { error } = await sb.from("bills").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await sb.from("audit_logs").insert({ action: "bill_deleted", entity: "bill", entity_id: id });
    qc.invalidateQueries(); toast.success("Bill deleted");
  };

  return (
    <div>
      <PageHeader title="Bills" sub={`${rows.length} of ${bills.length} bills`}><Button asChild><Link to="/upload">Upload bill</Link></Button></PageHeader>
      <Card className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="Search merchant or invoice…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{["processed", "approved", "needs_review", "processing", "rejected"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} title="Billed on or after" />
        <select className={sel} value={anom} onChange={(e) => setAnom(e.target.value)}><option value="">Any anomaly</option><option value="yes">With anomaly</option><option value="no">No anomaly</option></select>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr>{["Merchant", "Amount", "Category", "Billing Date", "Due Date", "Status", "Anomaly", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 font-medium">{b.merchant ?? "—"}</td>
                <td className="px-4 py-3">{formatINR(b.amount, b.currency)}</td>
                <td className="px-4 py-3">{b.category}</td>
                <td className="px-4 py-3">{b.billing_date ?? "—"}</td>
                <td className="px-4 py-3">{b.due_date ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3"><SeverityBadge s={anomBy[b.id]?.severity ?? null} /></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <Button size="icon" variant="ghost" asChild title="View"><Link to="/bills/$id" params={{ id: b.id }}><Eye className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" asChild title="Edit"><Link to="/bills/$id" params={{ id: b.id }} search={{ edit: true }}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => del(b.id, b.document_url)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No bills match.</Empty>}
      </Card>
    </div>
  );
}
