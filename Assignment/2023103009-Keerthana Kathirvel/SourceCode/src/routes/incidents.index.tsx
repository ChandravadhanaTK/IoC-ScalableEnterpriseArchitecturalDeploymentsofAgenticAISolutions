import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, SearchX } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import { EmptyState, ErrorState, PageHeader, Panel, PriorityBadge, RequirePermission, StatusBadge } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/types/domain";
import { fmtDate, fmtHours } from "@/lib/format";

export const Route = createFileRoute("/incidents/")({
  head: () => ({
    meta: [
      { title: "Incident Management — CampusFlow AI" },
      { name: "description", content: "Search, filter and manage every campus incident across departments." },
      { property: "og:title", content: "Incident Management — CampusFlow AI" },
      { property: "og:description", content: "Search and filter all campus incidents." },
    ],
  }),
  component: () => <RequirePermission perm="incident.view_all"><IncidentsPage /></RequirePermission>,
});

function IncidentsPage() {
  const { data, isLoading, error, refetch } = useIncidents();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");

  const rows = useMemo(() => (data ?? []).filter((i) =>
    (status === "all" || i.status === status) && (priority === "all" || i.priority === priority) && (category === "all" || i.category === category) &&
    (!q || `${i.id} ${i.title} ${i.location} ${i.assignee ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status, priority, category]);

  const reset = () => { setQ(""); setStatus("all"); setPriority("all"); setCategory("all"); };
  const F = ({ v, set, opts, label }: { v: string; set: (s: string) => void; opts: readonly string[]; label: string }) => (
    <Select value={v} onValueChange={set}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All {label}</SelectItem>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
  );

  return (
    <>
      <PageHeader title="Incident management" description={`${data?.length ?? "—"} incidents across all departments`} actions={<Button asChild><Link to="/report">New incident</Link></Button>} />
      <Panel>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search by ID, title, location or assignee" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <F v={status} set={setStatus} opts={STATUSES} label="statuses" />
          <F v={priority} set={setPriority} opts={PRIORITIES} label="priorities" />
          <F v={category} set={setCategory} opts={CATEGORIES} label="categories" />
        </div>
        {isLoading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
          : error ? <ErrorState message="Failed to fetch incidents." onRetry={() => refetch()} />
          : rows.length === 0 ? <EmptyState icon={SearchX} title="No matching incidents" description="Try a different search term or clear filters." action={<Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} />
          : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{["ID", "Title", "Category", "Priority", "Department", "Status", "Created", "Assigned", "Resolution"].map((h) => <TableHead key={h} className="whitespace-nowrap text-xs">{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rows.map((i) => (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => nav({ to: "/incidents/$id", params: { id: i.id } })}>
                      <TableCell className="font-mono text-xs text-primary">{i.id}</TableCell>
                      <TableCell className="max-w-[260px] truncate font-medium">{i.title}</TableCell>
                      <TableCell>{i.category}</TableCell>
                      <TableCell><PriorityBadge p={i.priority} /></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{i.department}</TableCell>
                      <TableCell><StatusBadge s={i.status} /></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(i.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">{i.assignee ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>{fmtHours(i.resolutionHours)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </Panel>
    </>
  );
}
