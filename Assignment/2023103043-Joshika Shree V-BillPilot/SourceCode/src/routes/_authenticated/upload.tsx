import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Circle, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/bits";
import { sb } from "@/lib/data";
import { AGENT_ORDER, validationAgent } from "@/lib/agents";
import { useAuth } from "@/hooks/useAuth";
import { processBill } from "@/lib/workflow.functions";
import { PageHeader } from "./route";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({ meta: [{ title: "Upload bill — BillPilot" }, { name: "description", content: "Upload a bill and watch the agents process it." }, { property: "og:title", content: "Upload bill — BillPilot" }, { property: "og:description", content: "Upload a bill." }] }),
  component: UploadPage,
});

type AgentState = "pending" | "running" | "completed" | "failed";

function UploadPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const process = useServerFn(processBill);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [wfBill, setWfBill] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, AgentState>>({});
  const [result, setResult] = useState<null | { status: string; billId: string }>(null);
  const [running, setRunning] = useState(false);

  // Poll real workflow state from the database
  useEffect(() => {
    if (!wfBill || result) return undefined;
    const t = setInterval(async () => {
      const { data: wf } = await sb.from("workflow_runs").select("id,current_agent,status").eq("bill_id", wfBill).order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (!wf) return;
      const { data: runs } = await sb.from("agent_runs").select("agent_name,status").eq("workflow_id", wf.id);
      const s: Record<string, AgentState> = {};
      (runs ?? []).forEach((r: any) => (s[r.agent_name] = r.status));
      if (wf.current_agent && !s[wf.current_agent] && wf.status === "running") s[wf.current_agent] = "running";
      setStates(s);
    }, 600);
    return () => clearInterval(t);
  }, [wfBill, result]);

  const pick = (f?: File | null) => {
    if (!f) return;
    const v = validationAgent({ name: f.name, size: f.size, type: f.type });
    if (!v.valid) { toast.error(v.issues.join(", ")); return; }
    setFile(f); setResult(null); setStates({}); setWfBill(null);
  };

  const start = async () => {
    if (!file || !user) return;
    setRunning(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const up = await sb.storage.from("bills").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { data: bill, error } = await sb.from("bills").insert({ document_url: path, file_name: file.name, status: "processing" }).select().single();
      if (error) throw error;
      await sb.from("audit_logs").insert({ action: "bill_uploaded", entity: "bill", entity_id: bill.id });
      setWfBill(bill.id);
      const r = await process({ data: { billId: bill.id, name: file.name, size: file.size, type: file.type, path } });
      // final sync
      const { data: runs } = await sb.from("agent_runs").select("agent_name,status").eq("workflow_id", r.workflowId);
      const s: Record<string, AgentState> = {}; (runs ?? []).forEach((x: any) => (s[x.agent_name] = x.status)); setStates(s);
      setResult({ status: r.status, billId: bill.id });
      qc.invalidateQueries();
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); } finally { setRunning(false); }
  };

  return (
    <div>
      <PageHeader title="Upload Bill" sub="PDF, PNG, JPG or JPEG · max 10 MB" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => input.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition ${drag ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
          >
            <UploadCloud className="mb-3 h-10 w-10 text-primary" />
            <p className="font-semibold">Drag & drop your bill here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <input ref={input} type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          {file && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
              <span className="truncate">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
              {!running && <button onClick={() => setFile(null)}><X className="h-4 w-4" /></button>}
            </div>
          )}
          <Button className="mt-4 w-full" disabled={!file || running} onClick={start}>{running ? "Processing…" : "Process bill"}</Button>
          <p className="mt-3 text-xs text-muted-foreground">Tip for Demo AI Mode: file names like <code>netflix_799.pdf</code> or <code>electricity.png</code> are recognised; unknown names trigger human review.</p>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">{running ? "Processing Bill…" : result ? "Workflow finished" : "Agent pipeline"}</h2>
          <ul className="space-y-3">
            {AGENT_ORDER.map((a) => {
              const s = states[a] ?? "pending";
              return (
                <li key={a} className="flex items-center gap-3">
                  {s === "completed" ? <Check className="h-5 w-5 text-success" /> : s === "running" ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : s === "failed" ? <X className="h-5 w-5 text-destructive" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  <span className={s === "pending" ? "text-muted-foreground" : "font-medium"}>{a}</span>
                </li>
              );
            })}
          </ul>
          {result && (
            <div className="mt-6 rounded-lg border p-4">
              {result.status === "awaiting_review" ? <p className="mb-3 font-semibold text-accent-foreground">Human Review Required — confidence below 80%.</p>
                : result.status === "failed" ? <p className="mb-3 font-semibold text-destructive">Validation failed.</p>
                : <p className="mb-3 font-semibold text-success">All agents completed.</p>}
              <Button asChild><Link to="/bills/$id" params={{ id: result.billId }}>{result.status === "awaiting_review" ? "Review now" : "View bill"}</Link></Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
