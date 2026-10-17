import { useMemo, useState } from "react";
import { Check, X, ShieldAlert, KeyRound, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { redactPII } from "@/lib/grantcraft";
import { Panel, Pill, PageHead, useApp } from "./shared";

const PERMS = ["Create draft", "Edit budget", "View PII", "Run pipeline", "HITL approve", "Export signed", "View audit log", "Manage keys"];
const MATRIX: Record<string, boolean[]> = {
  "Grant Writer": [true, false, false, true, false, false, false, false],
  "Finance Officer": [false, true, false, true, false, false, true, false],
  "NGO Director": [true, true, true, true, true, true, true, false],
  "System Auditor": [false, false, false, false, false, false, true, true],
};
const SAMPLE = `Donor Mrs. Priya Sharma pledged ₹25,00,000 to Asha Foundation (PAN ABCDE1234F, EIN 12-3456789).
Funds to be wired to A/C 004512345678901 at HDFC Bank. Contact Mr. Rahul Verma at +91 98765 43210
or rahul.verma@ashafoundation.org for the 80G receipt.`;

export function SecurityTab() {
  const { audit } = useApp();
  const [text, setText] = useState(SAMPLE);
  const [out, setOut] = useState<{ text: string; count: number } | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const rows = useMemo(() => audit.filter((a) => (type === "ALL" || a.type === type) && (a.action + a.actor).toLowerCase().includes(q.toLowerCase())), [audit, q, type]);

  return (
    <div>
      <PageHead kicker="Deliverable 4" title="Security, Privacy & Governance Center" desc="Least-privilege roles, PII never reaches the model, strict tenant isolation, and a tamper-evident audit trail." />
      <Panel title="Identity & RBAC Permission Matrix">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="py-2 text-left">Role</th>{PERMS.map((p) => <th key={p} className="px-2 text-center font-medium">{p}</th>)}</tr></thead>
            <tbody>{Object.entries(MATRIX).map(([r, v]) => (
              <tr key={r} className="border-b border-border/50"><td className="py-2 font-medium">{r}</td>{v.map((b, i) => <td key={i} className="text-center">{b ? <Check className="mx-auto size-4 text-success" /> : <X className="mx-auto size-4 text-muted-foreground/40" />}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="PII & Secret Redaction Sandbox" icon={<ShieldAlert className="size-4" />}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-32 font-mono text-xs" />
          <Button className="mt-3" onClick={() => setOut(redactPII(text))}>Test Guardrail Redaction</Button>
          {out && (
            <div className="mt-3">
              <div className="mb-1 flex items-center gap-2 text-xs"><Pill tone="success">{out.count} tokens redacted</Pill><span className="text-muted-foreground">Safe for LLM ingestion</span></div>
              <pre className="whitespace-pre-wrap rounded-lg border bg-background/70 p-3 font-mono text-xs">
                {out.text.split(/(\[REDACTED_[A-Z_]+\])/).map((p, i) => p.startsWith("[REDACTED") ? <span key={i} className="rounded bg-destructive/20 px-1 text-destructive">{p}</span> : p)}
              </pre>
            </div>
          )}
        </Panel>
        <Panel title="Secrets & Tenant Isolation" icon={<KeyRound className="size-4" />}>
          <ul className="space-y-3 text-sm">
            <li><b>HashiCorp Vault + Cloud KMS</b><div className="text-muted-foreground">Dynamic, short-lived LLM & DB credentials; envelope encryption with 90-day automatic key rotation; no secrets in images or env files.</div></li>
            <li><b>Vector DB namespace isolation</b><div className="text-muted-foreground">Every Pinecone query is forced into <code className="font-mono text-info">namespace=tenant_id</code> and a mandatory <code className="font-mono text-info">{`filter: { tenant_id: $jwt.tenant }`}</code> injected server-side.</div></li>
            <li><b>Row-Level Security</b><div className="text-muted-foreground">PostgreSQL policies <code className="font-mono text-info">USING (tenant_id = current_setting('app.tenant'))</code>.</div></li>
            <li className="flex items-center gap-2"><Database className="size-4 text-primary" /><Pill tone="success">Cross-tenant leakage tests: 0 / 5,000</Pill></li>
          </ul>
        </Panel>
      </div>

      <Panel title="Immutable Audit Trail" className="mt-5" right={<div className="flex gap-2"><Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-40 text-xs" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-8 rounded-md border bg-background px-2 text-xs">{["ALL", "AGENT", "TOOL", "GUARDRAIL", "HITL"].map((t) => <option key={t}>{t}</option>)}</select></div>}>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-popover"><tr className="border-b text-left uppercase text-muted-foreground"><th className="py-2">Timestamp</th><th>Type</th><th>Actor</th><th>Action</th><th>SHA-256</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50 align-top"><td className="py-2 pr-2 font-mono text-muted-foreground">{r.ts}</td><td className="pr-2"><Pill tone={r.type === "GUARDRAIL" ? "danger" : r.type === "HITL" ? "accent" : r.type === "TOOL" ? "info" : "success"}>{r.type}</Pill></td><td className="pr-2">{r.actor}</td><td className="pr-2">{r.action}</td><td className="font-mono text-muted-foreground">{r.hash.slice(0, 16)}…</td></tr>
            ))}</tbody>
          </table>
          {rows.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No entries.</div>}
        </div>
      </Panel>
    </div>
  );
}
