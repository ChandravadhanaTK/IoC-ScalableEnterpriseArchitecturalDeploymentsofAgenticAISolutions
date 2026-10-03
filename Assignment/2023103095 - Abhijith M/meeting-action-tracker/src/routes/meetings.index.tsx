import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatusBadge, EmptyState } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/meetings/")({
  head: () => pageMeta("Meetings", "Browse, search and filter analyzed meetings."),
  component: () => <AppShell><Meetings /></AppShell>,
});

const STATES = ["ALL", "IDLE", "PROCESSING", "VALIDATING", "AWAITING_APPROVAL", "COMPLETED", "FAILED"];

function Meetings() {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => (await supabase.from("meetings").select("id,title,meeting_date,participants,agent_state,created_at").order("meeting_date", { ascending: false })).data ?? [],
  });
  const rows = (data ?? []).filter((m) =>
    (st === "ALL" || m.agent_state === st) &&
    (`${m.title} ${m.participants}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Meetings" desc="Every meeting and the current state of its agent pipeline."
        actions={<Button asChild><Link to="/meetings/new">New meeting</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Search title or participants…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        <Select value={st} onValueChange={setSt}>
          <SelectTrigger className="w-52 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <EmptyState title="No meetings found" hint="Create a meeting to get started." /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left"><tr>{["Date", "Title", "Participants", "Agent state"].map((h) => <th key={h} className="eyebrow px-4 py-2.5 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.meeting_date}</td>
                  <td className="px-4 py-3"><Link to="/meetings/$id" params={{ id: m.id }} className="font-medium hover:underline">{m.title}</Link></td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{m.participants || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge value={m.agent_state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
