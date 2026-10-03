import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApprovalChain, EscalateBadge, PolicyEvidence, RiskFlags } from "@/components/procure/ResultView";
import { actOnRequest, createPurchaseOrder } from "@/lib/procure/actions.functions";
import { inr, type RequestRecord, type RequestStatus } from "@/lib/procure/data";
import { useProcure } from "@/lib/procure/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — ProcureAI" },
      { name: "description", content: "Review AI purchase recommendations, approve requests, create purchase orders and browse the audit log." },
      { property: "og:title", content: "Approvals — ProcureAI" },
      { property: "og:description", content: "Manager approvals, purchase orders and a searchable audit log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Approvals,
});

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending_manager: "Awaiting manager",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  approved: "Approved · awaiting PO",
  po_created: "PO created",
};

function Approvals() {
  const { requests, audit, ready } = useProcure();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return audit.filter((a) => !s || [a.role, a.agent, a.tool, a.result, a.status, a.at].join(" ").toLowerCase().includes(s));
  }, [audit, q]);

  return (
    <main className="mx-auto max-w-[1300px] px-4 py-5">
      <h1 className="mb-4 text-2xl font-bold">Approvals</h1>
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Requests</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4 space-y-3">
          {!ready ? <p className="text-sm text-muted-foreground">Loading…</p> : requests.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> : requests.map((r) => <RequestCard key={r.id} r={r} />)}
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search audit log…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Role</TableHead><TableHead>Agent</TableHead><TableHead>Tool</TableHead><TableHead>Result</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.slice(0, 300).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{new Date(a.at).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">{a.role}</TableCell>
                    <TableCell className="font-mono text-xs">{a.agent}</TableCell>
                    <TableCell className="font-mono text-xs">{a.tool}</TableCell>
                    <TableCell className="text-xs">{a.result}</TableCell>
                    <TableCell><span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", a.status === "OK" ? "bg-success text-success-foreground" : a.status === "BLOCKED" || a.status === "DENIED" || a.status === "ERROR" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground")}>{a.status}</span></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No matching entries.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function RequestCard({ r }: { r: RequestRecord }) {
  const { role, updateRequest, addAudit, requests } = useProcure();
  const act = useServerFn(actOnRequest);
  const po = useServerFn(createPurchaseOrder);
  const [open, setOpen] = useState(r.status === "pending_manager");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);
  const res = r.result;
  const done = r.status === "po_created" ? res.approvalChain.length : r.status === "approved" ? 1 : 0;

  const decide = async (action: "approve" | "reject" | "changes") => {
    setBusy(true); setDenied(null);
    try {
      const out = await act({ data: { role, action, comment, currentStatus: r.status } });
      if (!out.ok) {
        setDenied(out.error);
        addAudit({ agent: "approvals", tool: `manager_${action}`, result: `${r.id}: ${out.error}`, status: "DENIED" });
        return;
      }
      updateRequest(r.id, { status: out.status as RequestStatus, actions: [...r.actions, { role, action, comment, at: new Date().toISOString() }] });
      addAudit({ agent: "approvals", tool: `manager_${action}`, result: `${r.id} → ${out.status}${comment ? ` (“${comment}”)` : ""}`, status: "OK" });
      toast.success(out.message); setComment("");
    } catch {
      toast.error("Couldn't save that decision. Please retry.");
    } finally { setBusy(false); }
  };

  const createPo = async () => {
    setBusy(true); setDenied(null);
    try {
      const out = await po({ data: { role, currentStatus: r.status, existingPo: r.poNumber, allPoNumbers: requests.map((x) => x.poNumber).filter((x): x is string => !!x) } });
      if (!out.ok) {
        setDenied(out.error);
        addAudit({ agent: "approvals", tool: "create_po", result: `${r.id}: ${out.error}`, status: "DENIED" });
        return;
      }
      updateRequest(r.id, { status: "po_created", poNumber: out.poNumber, actions: [...r.actions, { role, action: "create_po", comment: out.poNumber ?? "", at: new Date().toISOString() }] });
      addAudit({ agent: "approvals", tool: "create_po", result: `${r.id} → ${out.poNumber}`, status: "OK" });
      toast.success(out.message);
    } catch {
      toast.error("Couldn't create the purchase order. Please retry.");
    } finally { setBusy(false); }
  };

  return (
    <div className="panel p-4">
      <button className="flex w-full flex-wrap items-center gap-3 text-left" onClick={() => setOpen((o) => !o)}>
        <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
        <span className="min-w-0 flex-1 truncate font-medium">{r.text}</span>
        <span className="text-xs text-muted-foreground">{r.department}</span>
        <span className="font-display font-semibold">{inr(res.total)}</span>
        <EscalateBadge result={res} />
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", r.status === "po_created" ? "bg-success text-success-foreground" : r.status === "rejected" ? "bg-destructive text-destructive-foreground" : r.status === "pending_manager" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}>
          {STATUS_LABEL[r.status]}{r.poNumber ? ` · ${r.poNumber}` : ""}
        </span>
      </button>
      {open && (
        <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="eyebrow mb-1">AI recommendation</p>
              <p className="font-semibold">{res.recommendation.top.product.name} <span className="text-sm font-normal text-muted-foreground">· {res.recommendation.top.product.vendor} · {inr(res.recommendation.top.product.price)} × {res.requirement.quantity}</span></p>
              <p className="text-sm">{res.recommendation.top.reason}</p>
              {res.recommendation.alternative && <p className="mt-1 text-xs text-muted-foreground">Alternative: {res.recommendation.alternative.product.name} ({inr(res.recommendation.alternative.product.price)})</p>}
            </div>
            <div><p className="eyebrow mb-1">Approval chain</p><ApprovalChain chain={res.approvalChain} done={done} /></div>
            <div><p className="eyebrow mb-1">Risk flags</p><RiskFlags result={res} /></div>
            {r.actions.length > 0 && (
              <div><p className="eyebrow mb-1">History</p>
                <ul className="space-y-0.5 text-xs">{r.actions.map((a, i) => <li key={i}><span className="font-mono text-muted-foreground">{new Date(a.at).toLocaleString("en-IN")}</span> · {a.role} · {a.action}{a.comment ? ` — ${a.comment}` : ""}</li>)}</ul>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div><p className="eyebrow mb-1">Policy evidence</p><PolicyEvidence result={res} /></div>
            {r.status === "pending_manager" && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="eyebrow">Manager decision</p>
                <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment (required for reject / changes)" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => decide("approve")}>Approve</Button>
                  <Button size="sm" variant="destructive" disabled={busy} onClick={() => decide("reject")}>Reject</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("changes")}>Request changes</Button>
                </div>
              </div>
            )}
            {(r.status === "approved" || r.status === "po_created") && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="eyebrow">Procurement</p>
                <Button size="sm" disabled={busy} onClick={createPo}>Create Purchase Order</Button>
                {r.poNumber && <p className="text-xs text-muted-foreground">PO on file: <span className="font-mono">{r.poNumber}</span></p>}
              </div>
            )}
            {denied && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive p-3 text-sm">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div><p className="font-semibold">Not authorized</p><p className="text-muted-foreground">{denied} You're signed in as {role} — switch roles in the top bar.</p></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
