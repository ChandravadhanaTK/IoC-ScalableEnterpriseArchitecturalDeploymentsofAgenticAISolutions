import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, KeyRound, Lock, Monitor, ShieldCheck, Smartphone, X } from "lucide-react";
import { useAudit } from "@/hooks/useIncidents";
import { PageHeader, Panel, RequirePermission, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ROLE_PERMISSIONS, useAuth, type Permission } from "@/lib/auth";
import { ROLES } from "@/types/domain";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Overview — CampusFlow AI" },
      { name: "description", content: "Authentication, role-based access control, sessions, audit logs and data protection status." },
      { property: "og:title", content: "Security Overview — CampusFlow AI" },
      { property: "og:description", content: "Security posture for CampusFlow AI." },
    ],
  }),
  component: () => <RequirePermission perm="security.view"><SecurityPage /></RequirePermission>,
});

const PERMS: Permission[] = ["incident.create", "incident.view_all", "incident.update", "incident.approve", "monitoring.view", "agent.view", "security.view", "settings.admin"];
const SESSIONS = [
  { who: "Arvind Shah", device: "Chrome · macOS", ip: "10.12.0.14", where: "Admin Block", icon: Monitor, current: true },
  { who: "Neha Kapoor", device: "Edge · Windows", ip: "10.12.3.88", where: "Facilities Office", icon: Monitor },
  { who: "Rahul Menon", device: "CampusFlow iOS", ip: "10.14.9.21", where: "IT Building", icon: Smartphone },
  { who: "Officer Vikram", device: "CampusFlow Android", ip: "10.14.2.5", where: "Security Control", icon: Smartphone },
];
const SECRETS = [
  ["AI model API key", "Server-side secret store", "Rotated 12 days ago"],
  ["Database credentials", "Managed vault", "Rotated 30 days ago"],
  ["SSO client secret", "Server-side secret store", "Rotated 45 days ago"],
  ["SMTP credentials", "Server-side secret store", "Rotation due in 9 days"],
];

function SecurityPage() {
  const { data: audit, isLoading } = useAudit();
  const { user } = useAuth();
  const denied = audit?.filter((a) => a.outcome !== "success") ?? [];

  return (
    <>
      <PageHeader title="Security overview" description="Authentication, authorization and data protection posture" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Authentication" value="SSO + MFA" hint={`Signed in as ${user.name}`} icon={ShieldCheck} tone="success" />
        <StatCard label="Active sessions" value={SESSIONS.length} hint="Across 4 users" icon={Monitor} tone="info" />
        <StatCard label="Security events" value={denied.length} hint="Denied or failed (24h)" icon={Lock} tone="critical" />
        <StatCard label="Secrets in frontend" value="0" hint="All keys held server-side" icon={KeyRound} />
      </div>

      <Panel title="Role-based access control" description="Permissions enforced on every page and action" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">Permission</th>{ROLES.map((r) => <th key={r} className={cn("px-3 py-2 text-center font-medium", r === user.role && "text-primary")}>{r}</th>)}</tr></thead>
            <tbody className="divide-y">{PERMS.map((p) => (
              <tr key={p}><td className="py-2 pr-4 font-mono text-xs">{p}</td>{ROLES.map((r) => <td key={r} className="px-3 py-2 text-center">{ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-success" /> : <X className="mx-auto size-4 text-muted-foreground/50" />}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Active sessions">
          <div className="divide-y">{SESSIONS.map((s) => (
            <div key={s.ip} className="flex items-center gap-3 py-2.5 text-sm">
              <s.icon className="size-4 text-muted-foreground" />
              <div className="flex-1"><p className="font-medium">{s.who} {s.current && <span className="ml-1 rounded bg-success/12 px-1.5 text-[11px] text-success">this session</span>}</p><p className="text-xs text-muted-foreground">{s.device} · {s.ip} · {s.where}</p></div>
              {!s.current && (
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="sm">Revoke</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Revoke session for {s.who}?</AlertDialogTitle><AlertDialogDescription>The user will be signed out on {s.device} immediately. This action is audit-logged.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => toast.success(`Session for ${s.who} revoked`)}>Revoke</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}</div>
        </Panel>
        <Panel title="Data protection">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[["Encryption at rest", "AES-256"], ["Encryption in transit", "TLS 1.3"], ["PII redaction", "Before AI calls"], ["Data retention", "365 days"], ["Backups", "Hourly, 30-day"], ["Input validation", "Schema-enforced"]].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 rounded-xl bg-muted/60 p-3"><Check className="size-4 text-success" /><div><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div></div>
            ))}
          </div>
        </Panel>
        <Panel title="Secrets & configuration">
          <div className="divide-y">{SECRETS.map(([n, loc, rot = ""]) => (
            <div key={n} className="flex items-center gap-3 py-2.5 text-sm"><KeyRound className="size-4 text-primary" /><div className="flex-1"><p className="font-medium">{n}</p><p className="text-xs text-muted-foreground">{loc}</p></div><span className={cn("text-xs", rot.includes("due") ? "text-warning-foreground" : "text-muted-foreground")}>{rot}</span></div>
          ))}</div>
        </Panel>
        <Panel title="Audit log" description="Most recent privileged and auth events">
          {isLoading ? <Skeleton className="h-48" /> : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto text-sm">{audit?.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <span className={cn("size-2 rounded-full", a.outcome === "success" ? "bg-success" : a.outcome === "denied" ? "bg-warning" : "bg-critical")} />
                <span className="font-mono text-xs">{a.action}</span><span className="truncate text-muted-foreground">{a.actor} → {a.target}</span>
                <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(a.at)}</span>
              </div>
            ))}</div>
          )}
        </Panel>
      </div>
    </>
  );
}
