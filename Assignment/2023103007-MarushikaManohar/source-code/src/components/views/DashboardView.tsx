import React from "react";
import { useAppState } from "@/hooks/useAppState";
import { can, ROLE_LABEL } from "@/services/rbac";
import { projectedStock, stockoutRisk } from "@/agents/formulas";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import type { NavView } from "@/components/layout/Sidebar";

interface DashboardViewProps {
  onNavigate: (view: NavView, params?: { workflowId?: string; productId?: string; warehouseId?: string }) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const state = useAppState();
  const currentUser = state.users.find((u) => u.id === state.sessionUserId) ?? state.users[0];

  // Calculate inventory risk stats
  let lowRiskCount = 0;
  let medRiskCount = 0;
  let highRiskCount = 0;

  state.inventory.forEach((item) => {
    // Determine demand history avg for this product/wh
    const dh = state.demandHistory.find((d) => d.productId === item.productId && d.warehouseId === item.warehouseId);
    const avgDaily = dh ? dh.daily.slice(-30).reduce((a, b) => a + b, 0) / 30 : 10;
    const expDemand = Math.round(avgDaily * 14);
    const proj = projectedStock(item.onHand, expDemand, item.inTransit);
    const risk = stockoutRisk(proj, item.safetyStock);

    if (risk === "HIGH") highRiskCount++;
    else if (risk === "MEDIUM") medRiskCount++;
    else lowRiskCount++;
  });

  const pieData = [
    { name: "Low Risk", value: lowRiskCount, color: "#10b981" },
    { name: "Medium Risk", value: medRiskCount, color: "#f59e0b" },
    { name: "High Stockout Risk", value: highRiskCount, color: "#ef4444" },
  ];

  // Active workflows
  const activeWorkflows = state.workflows.filter(
    (w) => !["COMPLETED", "REJECTED", "FAILED"].includes(w.state),
  );
  const pendingApprovals = state.workflows.filter((w) => w.state === "AWAITING_APPROVAL");
  const totalPoSpend = state.purchaseOrders.reduce((sum, po) => sum + po.total, 0);

  // Success rate
  const completedCount = state.workflows.filter((w) => w.state === "COMPLETED").length;
  const terminalCount = state.workflows.filter((w) => ["COMPLETED", "REJECTED", "FAILED"].includes(w.state)).length;
  const successRate = terminalCount > 0 ? Math.round((completedCount / terminalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Persona Context */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Overview</h1>
          <p className="text-sm text-muted-foreground">
            Deterministic multi-agent supply chain orchestration, stock monitoring, and human-in-the-loop governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(currentUser.role, "REQUEST_REPLENISHMENT") && (
            <Button size="sm" onClick={() => onNavigate("replenishment")}>
              Create Replenishment
            </Button>
          )}
          {can(currentUser.role, "ADMIN_POLICIES") && (
            <Button size="sm" variant="outline" onClick={() => onNavigate("settings")}>
              Simulation Controls
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Active Workflows
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingApprovals.length} awaiting human approval
            </p>
          </CardContent>
        </Card>

        <Card className={pendingApprovals.length > 0 ? "border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Pending Approvals (HITL)
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${pendingApprovals.length > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {can(currentUser.role, "REVIEW_APPROVE")
                ? "Authorization enabled for current persona"
                : "Approval gated to Manager / Admin"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Critical Stockout Items
            </CardTitle>
            <Boxes className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected stock &lt; Safety stock threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Committed PO Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPoSpend.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {state.purchaseOrders.length} purchase orders issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Inventory Risk Chart & Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Inventory Risk Distribution Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Risk Distribution</CardTitle>
            <CardDescription className="text-xs">
              Projected stock vs safety thresholds across 50 warehouse SKU pairs
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pending Approvals Quick Queue Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Pending Approval Queue</CardTitle>
              <CardDescription className="text-xs">
                Workflows paused at AWAITING_APPROVAL requiring policy evaluation
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("approvals")}
              className="text-xs gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/80 mb-2" />
                <p className="text-sm font-medium">All approval queues are clear</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No workflows are currently blocked at the human-in-the-loop gate.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((wf) => {
                  const prod = state.products.find((p) => p.id === wf.productId);
                  const sel = wf.supplier?.selected;
                  const orderVal = sel ? sel.unitPrice * wf.quantity : 0;
                  return (
                    <div
                      key={wf.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{wf.id}</span>
                          <span className="text-xs font-medium text-foreground">
                            {prod?.name ?? wf.productId} ({wf.quantity} units)
                          </span>
                          {wf.emergency && (
                            <Badge variant="destructive" className="text-[9px] uppercase">Emergency</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3">
                          <span>Vendor: <strong>{sel?.supplierName ?? "Pending"}</strong></span>
                          <span>Value: <strong>${orderVal.toLocaleString()}</strong></span>
                          <span>Triggers: <strong className="text-amber-600 dark:text-amber-400">{wf.risk?.triggers.join(", ")}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-8"
                          onClick={() => onNavigate("approvals")}
                        >
                          Review Decision
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows Stream & Agent System Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Workflows Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Active & Recent Workflows</CardTitle>
              <CardDescription className="text-xs">
                Real-time deterministic pipeline progression
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("agent-ops")}
              className="text-xs gap-1"
            >
              <span>Agent Trace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {state.workflows.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No workflows submitted yet. Use the Replenishment form or run a simulation.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {state.workflows.slice(-5).reverse().map((wf) => {
                  const prod = state.products.find((p) => p.id === wf.productId);
                  return (
                    <div
                      key={wf.id}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/20 px-2 rounded transition-colors"
                      onClick={() => onNavigate("agent-ops", { workflowId: wf.id })}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{wf.id}</span>
                          <span className="text-xs text-foreground truncate">
                            {prod?.name ?? wf.productId} · {wf.quantity} units
                          </span>
                          {wf.scenario && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground hidden sm:inline-flex">
                              {wf.scenario}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {wf.outcomeReason || wf.history.at(-1)?.reason || `Status: ${wf.state}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={
                            wf.state === "COMPLETED"
                              ? "default"
                              : wf.state === "AWAITING_APPROVAL"
                              ? "destructive"
                              : wf.state === "REJECTED" || wf.state === "FAILED"
                              ? "destructive"
                              : wf.state === "ESCALATED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px] font-mono uppercase"
                        >
                          {wf.state}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground hidden sm:block">
                          {new Date(wf.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Operational Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Agent Engine Status</CardTitle>
            <CardDescription className="text-xs">
              Deterministic TypeScript service health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Orchestrator Agent", desc: "Coordinates state transitions & retries", status: "Operational" },
              { name: "Demand Agent", desc: "MA30/60/90 velocity & seasonal factors", status: "Operational" },
              { name: "Inventory Agent", desc: "Safety threshold & projected balance", status: "Operational" },
              { name: "Supplier Agent", desc: "Weighted composite ranking & capacity", status: "Operational" },
              { name: "Risk & Policy Agent", desc: "Hard ceilings & rule evaluation matrix", status: "Operational" },
              { name: "Procurement Agent", desc: "Idempotent SHA256 PO issuance", status: "Operational" },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <div>
                  <div className="font-medium text-foreground">{agent.name}</div>
                  <div className="text-[10px] text-muted-foreground">{agent.desc}</div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{agent.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
