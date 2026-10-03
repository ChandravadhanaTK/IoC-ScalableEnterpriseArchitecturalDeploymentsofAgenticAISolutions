import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { PageHeader, Panel, PriorityBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, PRIORITIES, type Incident, type NewIncidentInput } from "@/types/domain";
import { incidentService, newIncidentSchema } from "@/services/incidentService";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Incident — CampusFlow AI" },
      { name: "description", content: "Report a campus issue. The AI agent classifies, prioritizes and routes it instantly." },
      { property: "og:title", content: "Report an Incident — CampusFlow AI" },
      { property: "og:description", content: "Report a campus issue for instant AI triage." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const empty: NewIncidentInput = { title: "", description: "", location: "", category: "IT", severity: "Medium", reporter: user.name };
  const [form, setForm] = useState<NewIncidentInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Incident | null>(null);

  const m = useMutation({
    mutationFn: (v: NewIncidentInput) => incidentService.create(v, user),
    onSuccess: (inc) => { setCreated(inc); qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success(`Incident ${inc.id} submitted`); },
    onError: () => toast.error("Submission failed. Please try again."),
  });

  const set = <K extends keyof NewIncidentInput>(k: K, v: NewIncidentInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = newIncidentSchema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    m.mutate(r.data);
  };

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <Panel>
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-success" />
            <h1 className="mt-3 text-xl font-bold">Incident submitted</h1>
            <p className="text-sm text-muted-foreground">Your reference ID</p>
            <p className="mt-2 font-mono text-2xl font-bold text-primary">{created.id}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
            <div><p className="text-xs text-muted-foreground">AI category</p><p className="font-semibold">{created.category}</p></div>
            <div><p className="text-xs text-muted-foreground">AI priority</p><PriorityBadge p={created.priority} /></div>
            <div className="col-span-2"><p className="text-xs text-muted-foreground">Routed to</p><p className="font-semibold">{created.department}</p></div>
            {created.approval === "pending" && <p className="col-span-2 text-xs text-warning-foreground">This incident requires human approval before action is taken.</p>}
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild><Link to="/incidents/$id" params={{ id: created.id }}>View details</Link></Button>
            <Button variant="outline" onClick={() => { setCreated(null); setForm(empty); }}>Report another</Button>
          </div>
        </Panel>
      </div>
    );
  }

  const field = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <>
      <PageHeader title="Report an incident" description="Describe the issue clearly. Our AI agent will classify, prioritize and route it to the right team." />
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3" noValidate>
        <Panel className="lg:col-span-2">
          <div className="space-y-4">
            <div><Label htmlFor="title">Incident title</Label><Input id="title" value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Projector failure in CS Lab 3" />{field("title")}</div>
            <div><Label htmlFor="desc">Detailed description</Label><Textarea id="desc" rows={6} maxLength={2000} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What happened, since when, and who is affected?" />{field("description")}<p className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/2000</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="loc">Location</Label><Input id="loc" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Building, floor, room" />{field("location")}</div>
              <div><Label htmlFor="rep">Reporter</Label><Input id="rep" value={form.reporter} onChange={(e) => set("reporter", e.target.value)} />{field("reporter")}</div>
            </div>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Classification">
            <div className="space-y-4">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v as NewIncidentInput["category"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Severity (your estimate)</Label>
                <Select value={form.severity} onValueChange={(v) => set("severity", v as NewIncidentInput["severity"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label htmlFor="file">Attachment (optional)</Label>
                <label htmlFor="file" className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50">
                  <Paperclip className="size-4" />{form.attachmentName ?? "Upload a photo or PDF (max 10 MB)"}
                </label>
                <input id="file" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size > 10 * 1024 * 1024) { toast.error("File exceeds 10 MB"); return; }
                  set("attachmentName", f?.name);
                }} />
              </div>
            </div>
          </Panel>
          <Button type="submit" className="w-full" size="lg" disabled={m.isPending}>{m.isPending ? <><Loader2 className="size-4 animate-spin" />Submitting & triaging…</> : "Submit incident"}</Button>
          <p className="text-center text-xs text-muted-foreground">Inputs are validated and sanitized before processing.</p>
        </div>
      </form>
    </>
  );
}
