import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, PriorityBadge } from "@/components/ops/ui";
import { CATEGORIES, DEPARTMENTS, LOCATIONS, PRIORITIES, SLA_BY_PRIORITY } from "@/lib/data";
import { useStore } from "@/lib/store";
import { analyze } from "@/lib/agent";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/new-request")({
  head: () => meta("New Request", "Submit a new operational request for AI-assisted triage."),
  component: NewRequest,
});

// Input Validator (presentation-side mirror of the agent's validation rules)
const schema = z.object({
  title: z.string().trim().min(5, "At least 5 characters").max(120),
  description: z.string().trim().min(10, "At least 10 characters").max(1000),
  department: z.enum(DEPARTMENTS, { message: "Select a department" }),
  location: z.string().min(1, "Select a location"),
  category: z.enum(CATEGORIES, { message: "Select a category" }),
  priority: z.enum(PRIORITIES, { message: "Select a priority" }),
  due: z.string().optional(),
  notes: z.string().max(500).optional(),
});
type Form = Record<keyof z.infer<typeof schema>, string>;
const empty: Form = { title: "", description: "", department: "", location: "", category: "", priority: "", due: "", notes: "" };

function NewRequest() {
  const { addRequest, log } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const ai = f.title.length > 4 ? analyze(f.title, f.description) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse(f);
    if (!res.success) {
      setErrors(Object.fromEntries(res.error.issues.map((i) => [i.path[0], i.message])));
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const d = res.data;
    const created = addRequest({ title: d.title, description: d.description, department: d.department, location: d.location, category: d.category, priority: d.priority, slaHours: SLA_BY_PRIORITY[d.priority], notes: d.notes });
    log("Created request", created.id);
    log("Queued for AI triage", created.id, "info", "AI Agent");
    setBusy(false);
    toast.success(`Request ${created.id} submitted`, { description: "Queued for AI triage and added to the request list." });
    setF(empty);
    nav({ to: "/requests" });
  };

  const field = (k: keyof Form, label: string, node: React.ReactNode) => (
    <div className="space-y-1.5"><Label htmlFor={k}>{label}</Label>{node}{errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}</div>
  );
  const sel = (k: keyof Form, opts: readonly string[], ph: string) => (
    <Select value={f[k]} onValueChange={set(k)}><SelectTrigger id={k} className="w-full"><SelectValue placeholder={ph} /></SelectTrigger><SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
  );

  return (
    <>
      <PageHeader eyebrow="Presentation layer" title="New Operational Request" subtitle="Requests are validated, then analyzed by the operations agent. Do not enter patient or clinical information." />
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-2" noValidate>
            <div className="md:col-span-2">{field("title", "Request title", <Input id="title" value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Water leak above Pharmacy ceiling" />)}</div>
            <div className="md:col-span-2">{field("description", "Description", <Textarea id="description" rows={4} value={f.description} onChange={(e) => set("description")(e.target.value)} placeholder="What is happening, since when, and what's impacted?" />)}</div>
            {field("department", "Department", sel("department", DEPARTMENTS, "Select department"))}
            {field("location", "Location", sel("location", LOCATIONS, "Select location"))}
            {field("category", "Category", sel("category", CATEGORIES, "Select category"))}
            {field("priority", "Priority", sel("priority", PRIORITIES, "Select priority"))}
            {field("due", "Preferred completion time", <Input id="due" type="datetime-local" value={f.due} onChange={(e) => set("due")(e.target.value)} />)}
            <div />
            <div className="md:col-span-2">{field("notes", "Additional notes", <Textarea id="notes" rows={2} value={f.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Access instructions, contacts…" />)}</div>
            <div className="flex items-center justify-between gap-3 md:col-span-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-teal" />Inputs are validated and PII-screened before processing.</p>
              <Button type="submit" disabled={busy}><Send />{busy ? "Submitting…" : "Submit request"}</Button>
            </div>
          </form>
        </Panel>
        <Panel title="Live AI pre-triage" subtitle="Updates as you type · mock model">
          {!ai ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"><Bot className="mx-auto mb-2 size-6" />Start typing a title to see the agent's suggestion.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {[["Classification", ai.classification], ["Recommended dept.", ai.department], ["SLA risk", ai.slaRisk], ["Confidence", `${ai.confidence}%`]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b pb-2"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>
              ))}
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Priority</span><PriorityBadge priority={ai.priority} /></div>
              <p className="rounded-lg bg-accent p-3 text-accent-foreground">{ai.action}</p>
              {ai.issues.map((i) => <p key={i} className="text-xs text-destructive">⚠ {i}</p>)}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
