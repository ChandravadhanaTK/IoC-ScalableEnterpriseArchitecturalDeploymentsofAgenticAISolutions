import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, KeyRound, Laptop, Lock, LogOut, ShieldAlert, ShieldCheck, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, Panel, Stat } from "@/components/ops/ui";
import { CURRENT_USER, useStore } from "@/lib/store";
import { fmtTime, NOW } from "@/lib/data";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/security")({
  head: () => meta("Security & Settings", "Authentication, role-based access, audit events, data protection and user settings."),
  component: SecurityPage,
});

const PERMS = ["Create requests", "View all requests", "Approve AI actions", "Manage departments", "View audit log", "Manage users & roles", "Configure AI agent"];
const ROLES: [string, boolean[]][] = [
  ["Operations Staff", [true, false, false, false, false, false, false]],
  ["Department Manager", [true, true, true, false, false, false, false]],
  ["Hospital Administrator", [true, true, true, true, true, false, false]],
  ["System Administrator", [true, true, true, true, true, true, true]],
];
const SESSIONS = [
  { id: "s1", device: "Chrome · Windows", where: "Admin Block workstation", icon: Laptop, current: true, at: NOW - 0.1 * 3600_000 },
  { id: "s2", device: "Safari · iPad", where: "East Wing nurse station", icon: Smartphone, current: false, at: NOW - 2.4 * 3600_000 },
  { id: "s3", device: "Edge · Windows", where: "Remote VPN", icon: Laptop, current: false, at: NOW - 20 * 3600_000 },
];

function SecurityPage() {
  const { audit, log } = useStore();
  const [sessions, setSessions] = useState(SESSIONS);
  const revoke = (id: string) => { setSessions((s) => s.filter((x) => x.id !== id)); log("Revoked session", id, "warn"); toast.success("Session revoked"); };

  return (
    <>
      <PageHeader eyebrow="Trust & control" title="Security & Settings" subtitle="Security model, access control and personal preferences" />
      <Tabs defaultValue="security">
        <TabsList className="mb-4"><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="roles">Roles</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat label="Authentication" value="SSO + MFA" delta="Signed in as Hospital Admin" icon={<KeyRound />} tone="success" />
            <Stat label="Active sessions" value={String(sessions.length)} delta="Across your devices" icon={<Laptop />} />
            <Stat label="Audit events (24h)" value={String(audit.length + 312)} delta="Immutable log" icon={<ShieldCheck />} tone="teal" />
            <Stat label="Security events" value="3" delta="1 needs review" icon={<ShieldAlert />} tone="warning" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Active sessions">
              <ul className="divide-y">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted"><s.icon className="size-4" /></span>
                    <div className="flex-1 text-sm"><div className="font-medium">{s.device} {s.current && <span className="ml-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-semibold text-success">This device</span>}</div><div className="text-xs text-muted-foreground">{s.where} · {fmtTime(s.at)}</div></div>
                    {!s.current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm" variant="ghost"><LogOut />Revoke</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Revoke this session?</AlertDialogTitle><AlertDialogDescription>{s.device} will be signed out immediately.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => revoke(s.id)}>Revoke</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Data protection">
              <ul className="space-y-3 text-sm">
                {[["Encryption at rest", "AES-256, keys rotated every 90 days"], ["Encryption in transit", "TLS 1.3 enforced"], ["PII redaction", "Input Validator strips identifiers before AI processing"], ["Data residency", "Regional hosting, no patient data stored"], ["Human approval", "Required for critical/high-impact AI actions"], ["Least privilege", "RBAC enforced at the service layer"]].map(([k, v]) => (
                  <li key={k} className="flex gap-3"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-teal/15 text-teal"><Lock className="size-3" /></span><div><div className="font-medium">{k}</div><div className="text-xs text-muted-foreground">{v}</div></div></li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel title="Audit & security events" subtitle="Every user and AI decision is recorded">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">Time</th><th className="pr-4 font-medium">Actor</th><th className="pr-4 font-medium">Action</th><th className="pr-4 font-medium">Target</th><th className="font-medium">Level</th></tr></thead>
                <tbody>{audit.slice(0, 12).map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap py-2.5 pr-4 text-muted-foreground">{fmtTime(e.at)}</td><td className="pr-4">{e.actor}</td><td className="pr-4 font-medium">{e.action}</td><td className="pr-4 font-mono text-xs text-primary">{e.target}</td>
                    <td><span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", e.level === "critical" ? "bg-destructive/10 text-destructive" : e.level === "warn" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>{e.level}</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="roles">
          <Panel title="Role-based access control" subtitle="Permission matrix enforced by the service layer">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground">Permission</th>{ROLES.map(([r]) => <th key={r} className="px-3 text-center text-xs font-semibold">{r}</th>)}</tr></thead>
                <tbody>{PERMS.map((p, i) => (
                  <tr key={p} className="border-b last:border-0"><td className="py-3 pr-4 font-medium">{p}</td>
                    {ROLES.map(([r, g]) => <td key={r} className="text-center">{g[i] ? <Check className="mx-auto size-4 text-success" /> : <X className="mx-auto size-4 text-muted-foreground/40" />}</td>)}
                  </tr>))}</tbody>
              </table>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="settings"><Settings /></TabsContent>
      </Tabs>
    </>
  );
}

function Settings() {
  const { log } = useStore();
  const [threshold, setThreshold] = useState([75]);
  const save = (section: string) => { log(`Updated ${section} settings`, CURRENT_USER.email); toast.success(`${section} settings saved`); };
  const Row = ({ label, desc, on = true }: { label: string; desc: string; on?: boolean }) => (
    <div className="flex items-center justify-between gap-4 py-2"><div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div><Switch defaultChecked={on} /></div>
  );
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={CURRENT_USER.name} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input defaultValue={CURRENT_USER.email} /></div>
          <div className="space-y-1.5"><Label>Role</Label><Input value={CURRENT_USER.role} disabled /></div>
          <div className="space-y-1.5"><Label>Facility</Label><Input value="Northstar Medical Center" disabled /></div>
        </div>
        <Button className="mt-4" onClick={() => save("Profile")}>Save profile</Button>
      </Panel>
      <Panel title="Notifications">
        <Row label="Critical request alerts" desc="Push + email when a critical request is created" />
        <Row label="SLA breach warnings" desc="Notify 30 minutes before breach" />
        <Row label="Approval requests" desc="When the AI needs your sign-off" />
        <Row label="Daily digest" desc="Summary at 07:00" on={false} />
        <Button variant="outline" className="mt-2" onClick={() => save("Notification")}>Save</Button>
      </Panel>
      <Panel title="Security preferences">
        <Row label="Multi-factor authentication" desc="Required for administrators" />
        <Row label="Auto-lock after 10 minutes" desc="Shared workstation protection" />
        <Row label="Login alerts" desc="Email on new device sign-in" />
        <Button variant="outline" className="mt-2" onClick={() => save("Security")}>Save</Button>
      </Panel>
      <Panel title="AI preferences">
        <Row label="Auto-route low priority requests" desc="Skip approval when confidence is high" />
        <Row label="Show AI reasoning" desc="Display explanation with recommendations" />
        <div className="py-3"><div className="mb-2 flex justify-between text-sm"><span className="font-medium">Approval confidence threshold</span><span className="font-mono">{threshold[0]}%</span></div><Slider value={threshold} onValueChange={setThreshold} min={50} max={99} /></div>
        <div className="flex items-center justify-between border-t pt-3">
          <div><div className="text-sm font-medium">Theme</div><div className="text-xs text-muted-foreground">Northstar Navy (default)</div></div>
          <div className="flex gap-2"><span className="size-6 rounded-full bg-navy ring-2 ring-primary ring-offset-2" /><span className="size-6 rounded-full bg-primary" /><span className="size-6 rounded-full bg-teal" /></div>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => save("AI")}>Save</Button>
      </Panel>
    </div>
  );
}
