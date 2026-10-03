import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReminderOnMount } from "@/hooks/useReminder";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/tasks")({
  head: () => pageMeta("Tasks", "Tasks created by the Task Management Agent — filter, edit and update status."),
  component: () => <AppShell><Tasks /></AppShell>,
});

const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

type Task = { id: string; title: string; description: string | null; owner: string | null; deadline: string | null; deadline_text: string | null; priority: string; status: string; meeting_id: string | null; created_at: string; updated_at: string; meetings: { title: string } | null };

function Tasks() {
  useReminderOnMount();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fs, setFs] = useState("ALL");
  const [fp, setFp] = useState("ALL");
  const [fo, setFo] = useState("");
  const [edit, setEdit] = useState<Task | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => ((await supabase.from("tasks").select("*, meetings(title)").order("deadline", { ascending: true, nullsFirst: false })).data ?? []) as Task[],
  });
  const rows = (data ?? []).filter((t) => (fs === "ALL" || t.status === fs) && (fp === "ALL" || t.priority === fp) && (t.owner ?? "").toLowerCase().includes(fo.toLowerCase()));

  async function update(id: string, patch: Partial<Task>) {
    const { meetings: _m, ...clean } = patch;
    const { error } = await supabase.from("tasks").update({ ...clean, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("audit_logs").insert({ user_id: user!.id, action: "task_updated", entity: "task", entity_id: id, details: clean as any });
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader eyebrow="Task Management Agent" title="Tasks" desc="Created only from human-approved action items." />
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={fs} onValueChange={setFs}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent>{["ALL", ...STATUSES].map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All statuses" : s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
        <Select value={fp} onValueChange={setFp}><SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent>{["ALL", ...PRIORITIES].map((s) => <SelectItem key={s} value={s}>{s === "ALL" ? "All priorities" : s}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Filter by owner…" value={fo} onChange={(e) => setFo(e.target.value)} className="max-w-xs bg-card" />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <EmptyState title="No tasks" hint="Approve extracted action items on a meeting to create tasks." /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left"><tr>{["Task", "Owner", "Deadline", "Priority", "Status", ""].map((h) => <th key={h} className="eyebrow px-4 py-2.5 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {rows.map((t) => (
                <tr key={t.id} className="align-top hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.title}</div>
                    {t.meeting_id && <Link to="/meetings/$id" params={{ id: t.meeting_id }} className="text-xs text-muted-foreground hover:underline">{t.meetings?.title}</Link>}
                  </td>
                  <td className="px-4 py-3">{t.owner ?? <i className="text-muted-foreground">Unassigned</i>}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.deadline ?? <span className="text-muted-foreground">{t.deadline_text ?? "—"}</span>}</td>
                  <td className="px-4 py-3"><StatusBadge value={t.priority} /></td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={(v) => update(t.id, { status: v })}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3"><Button size="icon" variant="ghost" onClick={() => setEdit(t)} aria-label="Edit"><Pencil className="size-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <EditDialog task={edit} onClose={() => setEdit(null)} onSave={async (p) => { await update(edit!.id, p); setEdit(null); toast.success("Task updated"); }} />
    </>
  );
}

function EditDialog({ task, onClose, onSave }: { task: Task | null; onClose: () => void; onSave: (p: Partial<Task>) => void }) {
  const [f, setF] = useState<Partial<Task>>({});
  const v = { ...task, ...f } as Task;
  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) { setF({}); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
        {task && (
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={v.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={v.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Owner</Label><Input value={v.owner ?? ""} onChange={(e) => setF({ ...f, owner: e.target.value || null })} /></div>
              <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={v.deadline ?? ""} onChange={(e) => setF({ ...f, deadline: e.target.value || null })} /></div>
              <div className="space-y-1.5"><Label>Priority</Label>
                <Select value={v.priority} onValueChange={(p) => setF({ ...f, priority: p })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={v.status} onValueChange={(p) => setF({ ...f, status: p })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((p) => <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => { onSave(f); setF({}); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
