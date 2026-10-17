import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ctx, type AuditEntry, type Role } from "@/components/gc/shared";
import { sha256 } from "@/lib/grantcraft";
import { CopilotTab } from "@/components/gc/CopilotTab";
import { ArchitectureTab } from "@/components/gc/ArchitectureTab";
import { WorkflowTab } from "@/components/gc/WorkflowTab";
import { DeploymentTab } from "@/components/gc/DeploymentTab";
import { SecurityTab } from "@/components/gc/SecurityTab";
import { MonitoringTab } from "@/components/gc/MonitoringTab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrantCraft AI — Multi-Agent Funding & CSR Copilot for NGOs" },
      { name: "description", content: "Enterprise agentic AI command center that discovers grants, audits compliance, drafts proposals and verifies budgets for NGOs." },
      { property: "og:title", content: "GrantCraft AI — Enterprise Agentic Command Center" },
      { property: "og:description", content: "Multi-agent grant discovery, compliance, drafting and budget verification with human sign-off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SEED: AuditEntry[] = [
  { ts: "2026-10-17 07:12:04Z", actor: "Prompt Injection Filter", type: "GUARDRAIL", action: "Blocked 'ignore previous instructions' payload", hash: "9f2c1ab07e44d1c3a8b6e0f5d2c7a91b" },
  { ts: "2026-10-17 07:20:41Z", actor: "Grant Scout Agent", type: "AGENT", action: "Matched 3 grants (top 91%)", hash: "1b7e93c0aa5f2e8d4c6b1f0e9a3d7c25" },
  { ts: "2026-10-17 07:21:10Z", actor: "Presidio PII Redactor", type: "GUARDRAIL", action: "Redacted 6 tokens (PAN, phone, bank)", hash: "c4d81e2f6a0b9375e1d4c8a2f7b6e013" },
  { ts: "2026-10-17 07:33:58Z", actor: "NGO Director", type: "HITL", action: "APPROVED & signed: Mobile Health Vans ($64,000)", hash: "7a0e5b3c9d1f4e8a2b6c0d7e3f9a1b45" },
];

const TABS = [
  ["copilot", "🚀 Live Agent Copilot"],
  ["arch", "🏗️ 1. Architecture"],
  ["workflow", "🔄 2. Agent Workflow"],
  ["deploy", "☁️ 3. Deployment"],
  ["security", "🛡️ 4. Security Model"],
  ["monitor", "📊 5. Monitoring"],
] as const;

function Index() {
  const [role, setRole] = useState<Role>("director");
  const [audit, setAudit] = useState<AuditEntry[]>(SEED);
  const [funding, setFunding] = useState(0);
  const addAudit = useCallback(async (e: Omit<AuditEntry, "ts" | "hash">) => {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";
    const hash = await sha256(ts + e.actor + e.action);
    setAudit((p) => [{ ...e, ts, hash }, ...p]);
    return hash;
  }, []);
  const addFunding = useCallback((n: number) => setFunding((f) => f + n), []);

  return (
    <Ctx.Provider value={{ role, audit, addAudit, funding, addFunding }}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="glow-primary flex size-9 items-center justify-center rounded-lg bg-primary/15"><Sparkles className="size-5 text-primary" /></div>
              <div>
                <h1 className="text-lg font-bold leading-tight">GrantCraft AI</h1>
                <div className="text-[11px] text-muted-foreground">Scalable Enterprise Multi-Agent Funding & CSR Copilot for NGOs</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 font-mono text-[10px] text-success xl:flex">
              <span className="size-2 animate-pulse rounded-full bg-success" /> CLUSTER HEALTHY • 99.98% UPTIME • MULTI-TENANT GUARDRAILS ACTIVE
            </div>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="writer">NGO Grant Writer</SelectItem>
                <SelectItem value="auditor">Finance Auditor</SelectItem>
                <SelectItem value="director">NGO Director — HITL Approver</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>
        <Tabs defaultValue="copilot" className="mx-auto max-w-[1500px] px-5 py-5">
          <TabsList className="glass h-auto w-full flex-wrap justify-start gap-1 p-1">
            {TABS.map(([v, l]) => <TabsTrigger key={v} value={v} className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{l}</TabsTrigger>)}
          </TabsList>
          <div className="mt-6">
            <TabsContent value="copilot"><CopilotTab /></TabsContent>
            <TabsContent value="arch"><ArchitectureTab /></TabsContent>
            <TabsContent value="workflow"><WorkflowTab /></TabsContent>
            <TabsContent value="deploy"><DeploymentTab /></TabsContent>
            <TabsContent value="security"><SecurityTab /></TabsContent>
            <TabsContent value="monitor"><MonitoringTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </Ctx.Provider>
  );
}
