import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Bot, FileSearch, Paperclip, User, Cog } from "lucide-react";
import { useAudit, useIncident } from "@/hooks/useIncidents";
import { AnalysisCard } from "@/components/agent/AnalysisCard";
import { EmptyState, ErrorState, Panel, PriorityBadge, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { incidentService } from "@/services/incidentService";
import { useAuth } from "@/lib/auth";
import { STATUSES, type Status } from "@/types/domain";
import { fmtDateTime, fmtHours } from "@/lib/format";

export const Route = createFileRoute("/incidents/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Incident Details — CampusFlow AI` },
      { name: "description", content: `AI analysis, timeline and audit trail for incident ${params.id}.` },
      { property: "og:title", content: `${params.id} — CampusFlow AI` },
      { property: "og:description", content: `Incident details and AI analysis for ${params.id}.` },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const { data: inc, isLoading, error, refetch } = useIncident(id);
  const { data: audit } = useAudit();
  const { user, can } = useAuth();
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: ["incident", id] }); qc.invalidateQueries({ queryKey: ["incidents"] }); qc.invalidateQueries({ queryKey: ["audit"] }); };

  const statusM = useMutation({ mutationFn: (s: Status) => incidentService.updateStatus(id, s, user), onSuccess: (r) => { refresh(); toast.success(`Status changed to ${r.status}`); }, onError: () => toast.error("Could not update status") });
  const approvalM = useMutation({ mutationFn: (ok: boolean) => incidentService.decideApproval(id, ok, user), onSuccess: (r) => { refresh(); toast.success(r.approval === "approved" ? "Recommendation approved" : "Recommendation rejected"); } });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>;
  if (error) return <ErrorState message="Could not load incident." onRetry={() => refetch()} />;
  if (!inc) return <EmptyState icon={FileSearch} title="Incident not found" description={`No incident with ID ${id}.`} action={<Button asChild variant="outline"><Link to="/incidents">Back to incidents</Link></Button>} />;

  const trail = audit?.filter((a) => a.target === inc.id) ?? [];
  const icon = { agent: Bot, human: User, system: Cog };

  return (
    <>
      <Link to="/incidents" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />All incidents</Link>
      <div className="mb-4 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-primary">{inc.id}</span><PriorityBadge p={inc.priority} /><StatusBadge s={inc.status} /></div>
            <h1 className="mt-2 text-2xl font-bold">{inc.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{inc.location} · reported by {inc.reporter} · {fmtDateTime(inc.createdAt)}</p>
          </div>
          {can("incident.update") && (
            <Select value={inc.status} onValueChange={(v) => statusM.mutate(v as Status)} disabled={statusM.isPending}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
        {inc.approval === "pending" && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm"><b>Human approval required.</b> The AI recommendation is on hold until a Department Manager approves.</p>
            {can("incident.approve") ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => approvalM.mutate(false)} disabled={approvalM.isPending}>Reject</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="sm" disabled={approvalM.isPending}>Approve & route</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Approve AI recommendation?</AlertDialogTitle>
                      <AlertDialogDescription>This routes {inc.id} to {inc.department} with {inc.priority} priority and triggers the recommended actions. Your approval will be recorded in the audit log.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => approvalM.mutate(true)}>Approve</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : <span className="text-xs text-muted-foreground">Your role cannot approve.</span>}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel title="Incident information">
            <p className="text-sm leading-relaxed">{inc.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              {[["Category", inc.category], ["Department", inc.department], ["Assignee", inc.assignee ?? "Unassigned"], ["Resolution time", fmtHours(inc.resolutionHours)], ["Reported severity", inc.reportedSeverity], ["Approval", inc.approval.replace("_", " ")]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
              ))}
            </dl>
            {inc.attachmentName && <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs"><Paperclip className="size-3.5" />{inc.attachmentName}</p>}
          </Panel>
          <Panel title="AI analysis & recommended action"><AnalysisCard a={inc.analysis} /></Panel>
          <Panel title="Audit trail" description="Immutable record of privileged actions">
            {trail.length ? (
              <div className="space-y-2 text-sm">{trail.map((a) => <div key={a.id} className="flex flex-wrap gap-x-3 rounded-lg bg-muted/50 px-3 py-2"><span className="font-mono text-xs text-muted-foreground">{a.id}</span><span className="font-mono text-xs">{a.action}</span><span>{a.actor} ({a.role})</span><span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(a.at)}</span></div>)}</div>
            ) : <EmptyState title="No privileged actions yet" description="Approvals and status changes will appear here." />}
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Status timeline">
            <ol className="relative space-y-4 border-l pl-5">
              {inc.timeline.map((t, i) => (
                <li key={i}><span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" /><StatusBadge s={t.status} /><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(t.at)} · {t.by}</p></li>
              ))}
            </ol>
          </Panel>
          <Panel title="Activity log">
            <div className="space-y-3">{[...inc.activity].reverse().map((a, i) => { const I = icon[a.kind]; return (
              <div key={i} className="flex gap-3 text-sm"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted"><I className="size-3.5" /></span><div><p>{a.message}</p><p className="text-xs text-muted-foreground">{a.actor} · {fmtDateTime(a.at)}</p></div></div>
            ); })}</div>
          </Panel>
        </div>
      </div>
    </>
  );
}
