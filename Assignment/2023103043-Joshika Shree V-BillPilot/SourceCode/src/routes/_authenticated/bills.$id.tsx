import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, StatusBadge } from "@/components/bits";
import { sb } from "@/lib/data";
import { CATEGORIES, formatINR } from "@/lib/agents";
import { approveReview, retryWorkflow } from "@/lib/workflow.functions";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/bills/$id")({
  validateSearch: (s: Record<string, unknown>): { edit?: boolean } => (s["edit"] === true || s["edit"] === "true" ? { edit: true } : {}),
  head: () => ({ meta: [{ title: "Bill review — BillPilot" }, { name: "description", content: "Review extracted bill details." }, { property: "og:title", content: "Bill review — BillPilot" }, { property: "og:description", content: "Bill details." }] }),
  component: BillReview,
});

function BillReview() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const qc = useQueryClient();
  const nav = useNavigate();
  const approve = useServerFn(approveReview);
  const retry = useServerFn(retryWorkflow);
  const { data: bill, refetch } = useQuery({ queryKey: ["bill", id], queryFn: async () => (await sb.from("bills").select("*").eq("id", id).single()).data });
  const { data: docUrl } = useQuery({
    queryKey: ["doc", bill?.document_url], enabled: !!bill?.document_url,
    queryFn: async () => (await sb.storage.from("bills").createSignedUrl(bill.document_url, 3600)).data?.signedUrl as string,
  });
  const [f, setF] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (bill) setF({ merchant: bill.merchant ?? "", invoiceNumber: bill.invoice_number ?? "", billingDate: bill.billing_date ?? "", dueDate: bill.due_date ?? "", amount: bill.amount ?? 0, category: bill.category ?? "Other" }); }, [bill]);
  if (!bill || !f) return <p className="text-muted-foreground">Loading…</p>;

  const needsReview = bill.status === "needs_review";
  const editing = needsReview || edit;
  const conf = Math.round(Number(bill.confidence ?? 0) * 100);
  const isPdf = bill.file_name?.toLowerCase().endsWith(".pdf");

  const onApprove = async () => {
    setBusy(true);
    try {
      if (needsReview) await approve({ data: { billId: id, ...f, amount: Number(f.amount) } });
      else {
        await sb.from("bills").update({ merchant: f.merchant, invoice_number: f.invoiceNumber, billing_date: f.billingDate || null, due_date: f.dueDate || null, amount: Number(f.amount), category: f.category, updated_at: new Date().toISOString() }).eq("id", id);
        await sb.from("audit_logs").insert({ action: "bill_edited", entity: "bill", entity_id: id });
      }
      toast.success(needsReview ? "Approved — workflow continued" : "Saved");
      await qc.invalidateQueries(); refetch(); nav({ to: "/bills/$id", params: { id }, search: {} });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  const onReject = async () => {
    await sb.from("bills").update({ status: "rejected" }).eq("id", id);
    await sb.from("workflow_runs").update({ status: "failed", current_agent: null }).eq("bill_id", id).eq("status", "awaiting_review");
    await sb.from("audit_logs").insert({ action: "review_rejected", entity: "bill", entity_id: id });
    qc.invalidateQueries(); refetch(); toast("Bill rejected");
  };
  const onRetry = async () => {
    setBusy(true);
    try { await retry({ data: { billId: id } }); await qc.invalidateQueries(); refetch(); toast.success("Workflow re-run"); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const fld = (k: string, label: string, type = "text") => (
    <div><Label>{label}</Label><Input type={type} disabled={!editing} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <div>
      <PageHeader title={bill.merchant ?? "Bill"} sub={bill.file_name ?? undefined}>
        {bill.document_url && <Button variant="outline" onClick={onRetry} disabled={busy}><RotateCcw className="mr-1 h-4 w-4" />Retry workflow</Button>}
        <Button variant="ghost" asChild><Link to="/bills">Back</Link></Button>
      </PageHeader>
      {needsReview && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-warning bg-warning/15 p-4">
          <AlertTriangle className="h-5 w-5 text-accent-foreground" />
          <div><p className="font-semibold">Human Review Required</p><p className="text-sm text-muted-foreground">Extraction confidence is {conf}% (below 80%). Check and correct the values, then approve to continue the workflow.</p></div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-h-[420px]">
          <h2 className="mb-3 font-semibold">Uploaded document</h2>
          {!bill.document_url ? <p className="text-sm text-muted-foreground">Demo bill — no document attached.</p>
            : !docUrl ? <p className="text-sm text-muted-foreground">Loading preview…</p>
            : isPdf ? <iframe src={docUrl} className="h-[520px] w-full rounded border" title="Bill PDF" />
            : <img src={docUrl} alt="Uploaded bill" className="max-h-[560px] w-full rounded border object-contain" />}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Extracted information</h2>
            <div className="flex items-center gap-2"><StatusBadge status={bill.status} /><span className={`rounded px-2 py-0.5 text-xs font-bold ${conf >= 80 ? "bg-success/15 text-success" : "bg-warning/30 text-accent-foreground"}`}>{conf}% confidence</span></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fld("merchant", "Merchant")}{fld("invoiceNumber", "Invoice Number")}
            {fld("billingDate", "Billing Date", "date")}{fld("dueDate", "Due Date", "date")}
            {fld("amount", `Amount (${bill.currency})`, "number")}
            <div><Label>Category</Label>
              <select disabled={!editing} className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          {!editing && <p className="mt-4 text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatINR(bill.amount, bill.currency)}</span></p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {editing ? <>
              <Button onClick={onApprove} disabled={busy}>{needsReview ? "Approve & Continue" : "Save changes"}</Button>
              {needsReview && <Button variant="destructive" onClick={onReject} disabled={busy}>Reject</Button>}
            </> : <Button variant="outline" asChild><Link to="/bills/$id" params={{ id }} search={{ edit: true }}>Edit</Link></Button>}
          </div>
        </Card>
      </div>
    </div>
  );
}
