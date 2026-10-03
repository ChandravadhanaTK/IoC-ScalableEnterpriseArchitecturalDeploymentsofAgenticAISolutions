import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Bot, Check, Loader2, Square, X } from "lucide-react";
import { POLICIES, fmt, routeDecision, runPolicyEngine, updateInvoice, useStore, type Finding } from "@/lib/store";
import { StatusStamp } from "@/components/Shell";

export const Route = createFileRoute("/invoices/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — AuditLens` },
      { name: "description", content: `AI audit workspace for claim ${params.id}.` },
      { property: "og:title", content: `${params.id} — AuditLens` },
      { property: "og:description", content: `AI audit workspace for claim ${params.id}.` },
    ],
  }),
  component: Detail,
});

const STEPS = ["Intake & Extraction", "Policy Engine", "AI Auditor", "Decision Router"];

function Detail() {
  const { id } = Route.useParams();
  const s = useStore();
  const [step, setStep] = useState(-1);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [stream, setStream] = useState("");
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  if (!s) return null;
  const i = s.invoices.find((x) => x.id === id);
  if (!i) return <p>Claim not found. <Link to="/" className="underline">Back</Link></p>;
  const running = step >= 0 && step < 4;
  const shownFindings = findings ?? runPolicyEngine(i, s.invoices);
  const report = (stream || i.report || "").replace(/VERDICT:.*$/s, "").trim();

  async function run() {
    if (!i || !s) return;
    setError(""); setStream(""); setStep(0);
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 400));
    setStep(1);
    const f = runPolicyEngine(i, s.invoices);
    setFindings(f);
    await new Promise((r) => setTimeout(r, 400));
    setStep(2);
    abort.current = new AbortController();
    let text = "";
    try {
      const { report: _r, risk: _k, decision: _d, ...data } = i;
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice: data, findings: f, policies: POLICIES }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(res.status === 402 ? "AI credits are used up for this workspace." : res.status === 429 ? "Too many requests — please wait a moment and try again." : msg || `Audit failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setStream(text);
      }
      setStep(3);
      const m = text.match(/VERDICT:\s*(\{.*\})/s);
      let v = { decision: "REVIEW", risk: 50, confidence: 0.5 };
      try { if (m) v = { ...v, ...JSON.parse(m[1] ?? "{}") }; } catch {}
      const status = routeDecision(v.decision, v.risk, f);
      updateInvoice(i.id, { status, risk: v.risk, decision: v.decision, report: text, auditedAt: new Date().toISOString(), latencyMs: Math.round(performance.now() - t0) },
        { actor: "AI Auditor", action: `Verdict ${v.decision} (risk ${v.risk}) → routed ${status}` });
      setStep(4);
    } catch (e) {
      setStep(-1);
      if ((e as Error).name === "AbortError") setError("Audit stopped.");
      else setError((e as Error).message);
    }
  }

  const human = (approve: boolean) =>
    updateInvoice(i.id, { status: approve ? "APPROVED" : "REJECTED" }, { actor: "Finance Reviewer", action: approve ? "Approved by human" : "Rejected by human" });

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Queue</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{i.id} · {i.invoiceNo}</p>
          <h1 className="text-4xl">{i.vendor}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusStamp s={i.status} />
          {running && step === 2 ? (
            <button className="btn-ghost" onClick={() => abort.current?.abort()}><Square className="h-4 w-4" /> Stop</button>
          ) : (
            <button className="btn-primary" disabled={running} onClick={run}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} {i.report ? "Re-run audit" : "Run AI audit"}
            </button>
          )}
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {STEPS.map((n, k) => (
          <li key={n} className={`rounded-md border px-3 py-2 text-sm ${step > k || step === 4 ? "border-success bg-success/10" : step === k ? "border-accent bg-accent/15" : "bg-card"}`}>
            <span className="font-mono text-[11px] text-muted-foreground">Agent {k + 1}</span>
            <div className="flex items-center gap-2 font-medium">{step === k && <Loader2 className="h-3 w-3 animate-spin" />}{n}</div>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="panel">
            <h2 className="mb-3 text-lg">Extracted data</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              {[["Employee", i.employee], ["Department", i.department], ["Category", i.category], ["Date", i.date], ["GSTIN", i.vendorGstin || "—"], ["Receipt", i.hasReceipt ? "Attached" : "Missing"], ["Notes", i.notes || "—"]].map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
              ))}
            </dl>
            <table className="mt-4 w-full border-t text-sm">
              <tbody>
                {i.items.map((x, k) => <tr key={k} className="border-b"><td className="py-2">{x.desc} × {x.qty}</td><td className="py-2 text-right font-mono">{fmt(x.qty * x.unit)}</td></tr>)}
                <tr><td className="py-2 text-muted-foreground">Tax</td><td className="text-right font-mono">{fmt(i.tax)}</td></tr>
                <tr className="font-semibold"><td className="py-2">Total</td><td className="text-right font-mono">{fmt(i.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h2 className="mb-3 text-lg">Policy engine findings</h2>
            {shownFindings.length === 0 ? <p className="text-sm text-success">All deterministic rules passed.</p> : (
              <ul className="space-y-2 text-sm">
                {shownFindings.map((f) => (
                  <li key={f.rule} className="flex gap-2">
                    <span className={`stamp ${f.severity === "HIGH" ? "stamp-bad" : f.severity === "MEDIUM" ? "stamp-warn" : "stamp-idle"}`}>{f.severity}</span>
                    <span><b className="font-mono text-xs">{f.rule}</b> — {f.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="panel min-h-64">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg">AI Auditor report</h2>
              {i.risk !== undefined && !running && <span className="font-mono text-sm">Risk {i.risk}/100 · {i.decision}</span>}
            </div>
            {error && <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {step === 2 && !stream && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ledger is reviewing the claim…</p>}
            {report ? (
              <div className="prose-sm space-y-2 text-sm [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : step < 0 && !error && <p className="text-sm text-muted-foreground">No audit yet. Click “Run AI audit”.</p>}
          </div>
          {i.status === "NEEDS_REVIEW" && (
            <div className="panel border-accent">
              <h2 className="text-lg">Human-in-the-loop approval</h2>
              <p className="mt-1 text-sm text-muted-foreground">The router escalated this claim. A finance reviewer makes the final call.</p>
              <div className="mt-4 flex gap-3">
                <button className="btn-primary" onClick={() => human(true)}><Check className="h-4 w-4" /> Approve</button>
                <button className="btn-danger" onClick={() => human(false)}><X className="h-4 w-4" /> Reject</button>
              </div>
            </div>
          )}
          <div className="panel">
            <h2 className="mb-3 text-lg">Audit trail</h2>
            <ul className="space-y-1 font-mono text-xs">
              {s.events.filter((e) => e.invoiceId === i.id).map((e, k) => <li key={k}>{e.at.slice(0, 19).replace("T", " ")} · {e.actor}: {e.action}</li>)}
              {!s.events.some((e) => e.invoiceId === i.id) && <li className="text-muted-foreground">No events yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
