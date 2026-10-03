import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { updatePolicy, resetSeed } from "@/services/actions";
import { runScenario, SCENARIOS } from "@/services/scenarios";
import {
  Sliders,
  Play,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { NavView } from "@/components/layout/Sidebar";

interface SettingsPolicyViewProps {
  onNavigate: (view: NavView, params?: { workflowId?: string }) => void;
}

export const SettingsPolicyView: React.FC<SettingsPolicyViewProps> = ({ onNavigate }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];
  const isAdmin = can(currentUser.role, "ADMIN_POLICIES");

  const [policyForm, setPolicyForm] = useState({
    spendingLimit: state.policy.spendingLimit,
    hardSpendCeiling: state.policy.hardSpendCeiling,
    minReliability: state.policy.minReliability,
    retryLimit: state.policy.retryLimit,
    approvalSlaMinutes: state.policy.approvalSlaMinutes,
    planningHorizonDays: state.policy.planningHorizonDays,
    weightPrice: state.policy.weights.price,
    weightLead: state.policy.weights.lead,
    weightRel: state.policy.weights.reliability,
  });

  const [policyMsg, setPolicyMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const handlePolicySave = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyMsg(null);

    if (!isAdmin) {
      setPolicyMsg({ text: `Authorization failure: ${ROLE_LABEL[currentUser.role]} cannot alter corporate policies.`, error: true });
      return;
    }

    try {
      updatePolicy({
        spendingLimit: Number(policyForm.spendingLimit),
        hardSpendCeiling: Number(policyForm.hardSpendCeiling),
        minReliability: Number(policyForm.minReliability),
        retryLimit: Number(policyForm.retryLimit),
        approvalSlaMinutes: Number(policyForm.approvalSlaMinutes),
        planningHorizonDays: Number(policyForm.planningHorizonDays),
        weights: {
          price: Number(policyForm.weightPrice),
          lead: Number(policyForm.weightLead),
          reliability: Number(policyForm.weightRel),
        },
      });
      setPolicyMsg({ text: "Policy configuration saved and committed to durable store." });
      setTimeout(() => setPolicyMsg(null), 4000);
    } catch (err) {
      setPolicyMsg({ text: (err as Error).message, error: true });
    }
  };

  const handleRunScenario = (scenarioId: string) => {
    if (!isAdmin) {
      alert(`Simulation controls are gated to Administrators. Please switch to Alex Mercer in the top bar.`);
      return;
    }

    setRunningScenario(scenarioId);
    try {
      const wfId = runScenario(scenarioId);
      setTimeout(() => {
        setRunningScenario(null);
        onNavigate("agent-ops", { workflowId: wfId });
      }, 350);
    } catch (err) {
      alert((err as Error).message);
      setRunningScenario(null);
    }
  };

  const handleResetSeed = () => {
    if (window.confirm("Reset all databases, workflows, orders, and telemetry back to pristine seed state?")) {
      try {
        resetSeed();
        setPolicyForm({
          spendingLimit: 10000,
          hardSpendCeiling: 250000,
          minReliability: 85,
          retryLimit: 3,
          approvalSlaMinutes: 30,
          planningHorizonDays: 14,
          weightPrice: 0.35,
          weightLead: 0.3,
          weightRel: 0.35,
        });
        setPolicyMsg({ text: "Operational database successfully restored to seed baseline." });
      } catch (err) {
        setPolicyMsg({ text: (err as Error).message, error: true });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Policy Administration</h1>
          <p className="text-sm text-muted-foreground">
            Configure autonomous agent guardrails, scoring weights, SLA timeouts, and run deterministic demo scenarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={handleResetSeed} className="text-xs gap-1.5 h-8 text-destructive border-destructive/30 hover:bg-destructive/10">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Seed Data</span>
            </Button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Policy Administration Locked</div>
            <p className="mt-0.5">
              Active persona (<strong>{currentUser.name}</strong> – {ROLE_LABEL[currentUser.role]}) has read-only access to policy parameters and cannot execute test simulations. Switch to <strong>Alex Mercer (Administrator)</strong> in the top-bar persona switcher to unlock these controls.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Policy Configuration & Simulation Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Configuration Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Corporate Governance Policy</CardTitle>
            <CardDescription className="text-xs">
              Autonomous agent spending limits, quality floors, and retry parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePolicySave} className="space-y-4 text-xs">
              {policyMsg && (
                <div
                  className={`p-3 rounded text-xs flex items-center gap-2 ${
                    policyMsg.error
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {policyMsg.error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  <span>{policyMsg.text}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">HITL Spend Limit ($)</Label>
                <Input
                  type="number"
                  value={policyForm.spendingLimit}
                  onChange={(e) => setPolicyForm({ ...policyForm, spendingLimit: Number(e.target.value) })}
                  disabled={!isAdmin}
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Orders above this trigger mandatory manager approval.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Hard Spend Ceiling ($)</Label>
                <Input
                  type="number"
                  value={policyForm.hardSpendCeiling}
                  onChange={(e) => setPolicyForm({ ...policyForm, hardSpendCeiling: Number(e.target.value) })}
                  disabled={!isAdmin}
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Orders above this are blocked outright at POLICY_CHECK.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Minimum Supplier Reliability (%)</Label>
                <Input
                  type="number"
                  value={policyForm.minReliability}
                  onChange={(e) => setPolicyForm({ ...policyForm, minReliability: Number(e.target.value) })}
                  disabled={!isAdmin}
                  className="h-8 text-xs font-mono"
                  required
                />
                <p className="text-[10px] text-muted-foreground">Suppliers below this threshold require approval.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Retry Limit</Label>
                  <Input
                    type="number"
                    value={policyForm.retryLimit}
                    onChange={(e) => setPolicyForm({ ...policyForm, retryLimit: Number(e.target.value) })}
                    disabled={!isAdmin}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Approval SLA (min)</Label>
                  <Input
                    type="number"
                    value={policyForm.approvalSlaMinutes}
                    onChange={(e) => setPolicyForm({ ...policyForm, approvalSlaMinutes: Number(e.target.value) })}
                    disabled={!isAdmin}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="font-semibold text-foreground text-[11px]">Sourcing Formula Weights (Sum = 1.0):</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Price</span>
                    <Input
                      type="number"
                      step="0.05"
                      value={policyForm.weightPrice}
                      onChange={(e) => setPolicyForm({ ...policyForm, weightPrice: Number(e.target.value) })}
                      disabled={!isAdmin}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Lead</span>
                    <Input
                      type="number"
                      step="0.05"
                      value={policyForm.weightLead}
                      onChange={(e) => setPolicyForm({ ...policyForm, weightLead: Number(e.target.value) })}
                      disabled={!isAdmin}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Reliability</span>
                    <Input
                      type="number"
                      step="0.05"
                      value={policyForm.weightRel}
                      onChange={(e) => setPolicyForm({ ...policyForm, weightRel: Number(e.target.value) })}
                      disabled={!isAdmin}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={!isAdmin} className="w-full text-xs h-8">
                  Update Policy Rules
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Deterministic Demo Scenarios Simulator (Section 9 requirement) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">One-Click Demonstration Simulator</CardTitle>
                <CardDescription className="text-xs">
                  Deterministic, reproducible scenarios covering routine flows, approval gates, and all 5 failure modes
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
                Deterministic Seed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-all gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                      {sc.id}
                    </Badge>
                    <span className="font-bold text-xs text-foreground">{sc.title}</span>
                    {sc.failureMode && (
                      <Badge variant="destructive" className="text-[9px] uppercase">
                        Failure {sc.failureMode}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Expected outcome: <strong className="text-foreground">{sc.expected}</strong>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Product: {sc.input.productId} · Warehouse: {sc.input.warehouseId} · Qty: {sc.input.quantity}
                    {sc.fault && ` · Fault: ${sc.fault.tool} (x${sc.fault.remainingFailures})`}
                  </div>
                </div>

                <div className="shrink-0">
                  <Button
                    size="sm"
                    disabled={!isAdmin || runningScenario === sc.id}
                    onClick={() => handleRunScenario(sc.id)}
                    className="h-8 text-xs gap-1.5"
                    variant={sc.id === "S1" ? "default" : "outline"}
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{runningScenario === sc.id ? "Launching..." : "Execute Scenario"}</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
