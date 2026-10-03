import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Inbox, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Panel, PriorityBadge, StatusBadge } from "@/components/ops/ui";
import { CATEGORIES, fmtTime, PRIORITIES, slaRemaining, STATUSES, type OpsRequest } from "@/lib/data";
import { useStore } from "@/lib/store";
import { analyze } from "@/lib/agent";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/requests")({
  head: () => meta("Requests", "Search, filter and manage hospital operational requests."),
  component: RequestsPage,
});

type SortKey = "id" | "priority" | "createdAt" | "status";
const prioRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function RequestsPage() {
  const { requests } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [prio, setPrio] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "createdAt", dir: -1 });
  const [selected, setSelected] = useState<OpsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, []);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return requests
      .filter((r) => (!s || `${r.id} ${r.title} ${r.team} ${r.department}`.toLowerCase().includes(s))
        && (cat === "all" || r.category === cat) && (status === "all" || r.status === status) && (prio === "all" || r.priority === prio))
      .sort((a, b) => {
        const k = sort.key;
        const va = k === "priority" ? prioRank[a.priority] : k === "status" ? STATUSES.indexOf(a.status) : a[k];
        const vb = k === "priority" ? prioRank[b.priority] : k === "status" ? STATUSES.indexOf(b.status) : b[k];
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });
  }, [requests, q, cat, status, prio, sort]);

  const filtered = q || cat !== "all" || status !== "all" || prio !== "all";
  const clear = () => { setQ(""); setCat("all"); setStatus("all"); setPrio("all"); };
  const th = (label: string, key?: SortKey) => (
    <th className="whitespace-nowrap py-3 pr-4 text-left text-xs font-medium text-muted-foreground">
      {key ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((p) => ({ key, dir: p.key === key ? (-p.dir as 1 | -1) : 1 }))}>{label}<ArrowUpDown className="size-3" /></button> : label}
    </th>
  );

  return (
    <>
      <PageHeader eyebrow="Service layer" title="Operational Requests" subtitle={`${requests.length} requests · demo records only`}
        actions={<Button asChild><Link to="/new-request"><Plus />Create request</Link></Button>} />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, title, team…" className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <Filter value={cat} onChange={setCat} label="Category" options={CATEGORIES} />
          <Filter value={status} onChange={setStatus} label="Status" options={STATUSES} />
          <Filter value={prio} onChange={setPrio} label="Priority" options={PRIORITIES} />
          {filtered && <Button variant="ghost" onClick={clear}><X />Clear</Button>}
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-muted"><Inbox className="size-5 text-muted-foreground" /></div>
            <p className="mt-3 font-semibold">No requests match these filters</p>
            <p className="text-sm text-muted-foreground">Try a different search or clear the filters.</p>
            <Button variant="outline" className="mt-4" onClick={clear}>Clear filters</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b"><tr>{th("Request ID", "id")}{th("Title")}{th("Category")}{th("Priority", "priority")}{th("Department")}{th("Status", "status")}{th("Assigned Team")}{th("Created", "createdAt")}{th("SLA")}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const sla = slaRemaining(r);
                  return (
                    <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4 font-mono text-xs text-primary">{r.id}</td>
                      <td className="max-w-64 truncate pr-4 font-medium">{r.title}</td>
                      <td className="pr-4 text-muted-foreground">{r.category}</td>
                      <td className="pr-4"><PriorityBadge priority={r.priority} /></td>
                      <td className="whitespace-nowrap pr-4 text-muted-foreground">{r.department}</td>
                      <td className="pr-4"><StatusBadge status={r.status} /></td>
                      <td className="whitespace-nowrap pr-4">{r.team}</td>
                      <td className="whitespace-nowrap pr-4 text-muted-foreground">{fmtTime(r.createdAt)}</td>
                      <td className={cn("whitespace-nowrap text-xs font-semibold", sla.tone === "bad" ? "text-destructive" : sla.tone === "warn" ? "text-warning" : "text-success")}>{sla.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <RequestDetail request={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-xl lg:w-44"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function RequestDetail({ request, onClose }: { request: OpsRequest | null; onClose: () => void }) {
  const { requests, updateStatus, log } = useStore();
  const r = request ? requests.find((x) => x.id === request.id) ?? request : null;
  const ai = r ? analyze(r.title, r.description) : null;
  const act = (s: OpsRequest["status"], msg: string) => { if (!r) return; updateStatus(r.id, s); log(msg, r.id); toast.success(`${r.id}: ${msg}`); };
  return (
    <Sheet open={!!r} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {r && ai && (
          <>
            <SheetHeader>
              <p className="font-mono text-xs text-primary">{r.id}</p>
              <SheetTitle className="text-xl">{r.title}</SheetTitle>
              <SheetDescription>{r.description}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 flex gap-2 px-4"><StatusBadge status={r.status} /><PriorityBadge priority={r.priority} /></div>
            <dl className="mt-5 grid grid-cols-2 gap-4 px-4 text-sm">
              {[["Category", r.category], ["Department", r.department], ["Assigned team", r.team], ["Location", r.location], ["Created", fmtTime(r.createdAt)], ["SLA", `${r.slaHours}h · ${slaRemaining(r).label}`]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            <div className="mx-4 mt-5 rounded-xl border border-teal/30 bg-accent p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">AI recommendation · {ai.confidence}% confidence</p>
              <p className="mt-1 text-accent-foreground">{ai.action}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 px-4 pb-6">
              <Button onClick={() => act("In Progress", "Marked in progress")}>Start work</Button>
              <Button variant="outline" onClick={() => act("Resolved", "Marked resolved")}>Resolve</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive">Escalate</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Escalate {r.id}?</AlertDialogTitle><AlertDialogDescription>This notifies the duty manager and department head and is recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => act("Escalated", "Escalated to duty manager")}>Escalate</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
