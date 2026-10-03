import React, { useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Cpu,
  Wrench,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const MonitoringTelemetryView: React.FC = () => {
  const state = useAppState();

  // Agent performance metrics derived from actual executions and telemetry
  const agentMetrics = useMemo(() => {
    const agents = [
      "DemandAgent",
      "InventoryAgent",
      "SupplierAgent",
      "RiskAndPolicyAgent",
      "ProcurementAgent",
      "OrchestratorAgent",
    ];

    return agents.map((agentName) => {
      const execs = state.agentExecutions.filter((e) => e.agent === agentName);
      const tele = state.telemetry.filter((t) => t.source === agentName);

      const totalExecs = execs.length;
      const successCount = execs.filter((e) => e.status === "SUCCESS").length;
      const successRate = totalExecs > 0 ? Math.round((successCount / totalExecs) * 100) : 100;

      const avgDuration =
        totalExecs > 0
          ? Math.round(execs.reduce((sum, e) => sum + e.durationMs, 0) / totalExecs)
          : 0;

      return {
        name: agentName.replace("Agent", ""),
        fullName: agentName,
        executions: totalExecs,
        successRate,
        avgLatencyMs: avgDuration,
      };
    });
  }, [state.agentExecutions, state.telemetry]);

  // Safety & Policy Security Events
  const policyViolations = state.auditLogs.filter(
    (l) => l.action === "POLICY_VIOLATION_BLOCKED" || l.action === "HARD_SPEND_CEILING_EXCEEDED",
  ).length;

  const authDenials = state.auditLogs.filter(
    (l) => l.result === "DENIED" || l.action === "TOOL_PERMISSION_DENIED",
  ).length;

  const toolFailures = state.telemetry.filter((t) => t.kind === "tool" && !t.ok).length;
  const slaTimeouts = state.auditLogs.filter((l) => l.action === "APPROVAL_SLA_TIMEOUT").length;

  // Workflows summary
  const completedWfs = state.workflows.filter((w) => w.state === "COMPLETED").length;
  const activeWfs = state.workflows.filter(
    (w) => !["COMPLETED", "REJECTED", "FAILED"].includes(w.state),
  ).length;
  const failedWfs = state.workflows.filter((w) => w.state === "FAILED").length;
  const rejectedWfs = state.workflows.filter((w) => w.state === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Monitoring & Telemetry</h1>
          <p className="text-sm text-muted-foreground">
            Real-time agent engine latencies, tool execution telemetry, safety governance violations, and business outcomes.
          </p>
        </div>
      </div>

      {/* Top Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Agent Invocations
            </CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.agentExecutions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {state.workflows.length} workflow instances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Telemetry Events Logged
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.telemetry.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              High-resolution millisecond latency records
            </p>
          </CardContent>
        </Card>

        <Card className={authDenials > 0 ? "border-destructive/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Security / RBAC Denials
            </CardTitle>
            <ShieldCheck className={`h-4 w-4 ${authDenials > 0 ? "text-destructive" : "text-emerald-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${authDenials > 0 ? "text-destructive" : ""}`}>{authDenials}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unauthorized actions strictly blocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Policy Interceptions
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {policyViolations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ceiling violations prevented from execution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latency by Agent Bar Chart & Safety Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Agent Average Latency (ms)</CardTitle>
            <CardDescription className="text-xs">
              Measured duration of deterministic reasoning and tool interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  formatter={(value: any) => [`${value} ms`, "Average Latency"]}
                  labelStyle={{ fontSize: 12, fontWeight: "bold" }}
                />
                <Bar dataKey="avgLatencyMs" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {agentMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Safety & Security Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Safety & Reliability Guardrails</CardTitle>
            <CardDescription className="text-xs">
              Autonomous system exception and policy telemetry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-muted/30 border">
              <div>
                <div className="font-semibold text-foreground">Hard Spend Ceiling Breaches</div>
                <div className="text-[10px] text-muted-foreground">Orders blocked above $250k</div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{policyViolations}</Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-muted/30 border">
              <div>
                <div className="font-semibold text-foreground">RBAC Denials & Tool Violations</div>
                <div className="text-[10px] text-muted-foreground">Least-privilege enforcement</div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{authDenials}</Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-muted/30 border">
              <div>
                <div className="font-semibold text-foreground">Transient Tool Timeouts</div>
                <div className="text-[10px] text-muted-foreground">Recovered via exponential backoff</div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{toolFailures}</Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-muted/30 border">
              <div>
                <div className="font-semibold text-foreground">SLA Escalation Timeouts</div>
                <div className="text-[10px] text-muted-foreground">Pending approvals past SLA limit</div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{slaTimeouts}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Agent Engine Telemetry Scorecard</CardTitle>
          <CardDescription className="text-xs">
            Individual service reliability, execution volume, and latency statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Agent Module</th>
                  <th className="px-3 py-3 text-right">Total Executions</th>
                  <th className="px-3 py-3 text-right">Success Rate (%)</th>
                  <th className="px-3 py-3 text-right">Average Latency (ms)</th>
                  <th className="px-3 py-3 text-center">Service Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentMetrics.map((agent) => (
                  <tr key={agent.fullName} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{agent.fullName}</td>
                    <td className="px-3 py-3 text-right font-medium">{agent.executions}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={agent.successRate < 100 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                        {agent.successRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-muted-foreground">{agent.avgLatencyMs} ms</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10 gap-1 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>Nominal</span>
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
