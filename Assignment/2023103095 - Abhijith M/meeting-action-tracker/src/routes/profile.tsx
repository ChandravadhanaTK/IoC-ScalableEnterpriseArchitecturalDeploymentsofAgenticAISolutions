import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/profile")({
  head: () => pageMeta("Profile", "Your account, role and recent audit trail."),
  component: () => <AppShell><Profile /></AppShell>,
});

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const [p, r, a] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("audit_logs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
      ]);
      return { profile: p.data, roles: (r.data ?? []).map((x) => x.role), audit: a.data ?? [] };
    },
  });
  const [name, setName] = useState("");
  useEffect(() => { if (data?.profile) setName(data.profile.display_name ?? ""); }, [data?.profile]);

  async function save() {
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 100) }).eq("id", user!.id);
    error ? toast.error(error.message) : toast.success("Profile saved");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-lg border bg-card p-5">
          <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <div className="eyebrow mb-1.5">Roles (RBAC)</div>
            <div className="flex gap-2">{(data?.roles ?? []).map((r) => <span key={r} className="rounded bg-secondary px-2 py-0.5 font-mono text-xs uppercase">{r}</span>)}</div>
            <p className="mt-2 text-xs text-muted-foreground">USER sees only their own meetings and tasks. ADMIN can read all records. Roles are stored server-side and enforced by row-level policies.</p>
          </div>
          <Button onClick={save}>Save</Button>
        </div>
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-medium">Audit log</div>
          {(data?.audit.length ?? 0) === 0 ? <div className="p-4"><EmptyState /></div> : (
            <ul className="divide-y text-sm">
              {data!.audit.map((a) => (
                <li key={a.id} className="flex gap-3 px-4 py-2.5">
                  <span className="w-40 shrink-0 font-mono text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  <span className="font-mono text-xs">{a.action}</span>
                  <span className="text-muted-foreground">{a.entity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
