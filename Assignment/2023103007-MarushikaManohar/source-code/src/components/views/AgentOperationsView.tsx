import React, { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Wrench,
  FileCode,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgentExecution, WorkflowRun } from "@/types";

interface AgentOperationsViewProps {
  initialWorkflowId?: string;
}

export const AgentOperationsView: React.FC<AgentOperationsViewProps> = ({ initialWorkflowId }) => {
  const state = useAppState();

  const [selectedWfId, setSelectedWfId] = useState<string>(
    initialWorkflowId || state.workflows.at(-1)?.id || "",
  );
  const [expandedExecs, setExpandedExecs] = useState<Record<string, boolean>>({});

  const currentWf = state.workflows.find((w) => w.id === selectedWfId) ?? state.workflows.at(-1);

  const executions = currentWf
    ? state.agentExecutions.filter((e) => e.workflowId === currentWf.id)
    : [];

  const toggleExpand = (id: string) => {
    setExpandedExecs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const product = currentWf ? state.products.find((p) => p.id === currentWf.productId) : null;
  const warehouse = currentWf ? state.warehouses.find((w) => w.id === currentWf.warehouseId) : null;

  // Pipeline stages
  const stages = [
    { name: "CREATED", label: "Request Submitted" },
    { name: "ANALYZING", label: "Demand & Inventory Analysis" },
    { name: "POLICY_CHECK", label: "Hard Policy Governance" },
    { name: "RISK_ASSESSMENT", label: "Risk Matrix Evaluation" },
    { name: "RECOMMENDATION_READY", label: "Recommendation Synthesis" },
    { name: "AWAITING_APPROVAL", label: "Human Approval Gate" },
    { name: "APPROVED", label: "Authorized" },
    { name: "PURCHASE_ORDER_CREATED", label: "PO Issuance" },
    { name: "COMPLETED", label: "Workflow Completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Workflow Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Operations & Execution Trace</h1>
          <p className="text-sm text-muted-foreground">
            Per-workflow deterministic multi-agent execution telemetry, tool calls, structured I/O, and evidence logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Select Workflow:</span>
          <Select
            value={currentWf?.id ?? ""}
            onValueChange={(val) => {
              setSelectedWfId(val);
              setExpandedExecs({});
            }}
          >
            <SelectTrigger className="w-56 text-xs h-9 font-mono font-medium">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {state.workflows.slice().reverse().map((w) => (
                <SelectItem key={w.id} value={w.id} className="font-mono text-xs">
                  {w.id} · {w.state} {w.scenario ? `(${w.scenario})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!currentWf ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-xs">
            No workflows have been initiated yet. Submit a replenishment request or run a scenario from Policy Admin.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Workflow Overview Banner */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-primary">{currentWf.id}</span>
                  <Badge
                    variant={
                      currentWf.state === "COMPLETED"
                        ? "default"
                        : currentWf.state === "AWAITING_APPROVAL"
                        ? "destructive"
                        : currentWf.state === "REJECTED" || currentWf.state === "FAILED" || currentWf.state === "ESCALATED"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs font-mono font-bold uppercase"
                  >
                    {currentWf.state}
                  </Badge>
                  {currentWf.scenario && (
                    <Badge variant="outline" className="text-xs">
                      {currentWf.scenario}
                    </Badge>
                  )}
                  {currentWf.retries > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                      Retries: {currentWf.retries}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Initiated: {new Date(currentWf.createdAt).toLocaleTimeString()} · Updated:{" "}
                  {new Date(currentWf.updatedAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px]">Product:</span>
                  <div className="font-medium text-foreground">{product?.name ?? currentWf.productId}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Warehouse:</span>
                  <div className="font-medium text-foreground">{warehouse?.name ?? currentWf.warehouseId}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Quantity:</span>
                  <div className="font-medium text-foreground">{currentWf.quantity.toLocaleString()} {product?.unit}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Outcome / Status:</span>
                  <div className="font-medium text-foreground truncate" title={currentWf.outcomeReason || currentWf.state}>
                    {currentWf.outcomeReason || currentWf.state}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow State Transitions Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Workflow State Transitions History</CardTitle>
              <CardDescription className="text-xs">
                Validated state machine progression governed by workflowEngine.ts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l-2 border-primary/20 space-y-4 text-xs">
                {currentWf.history.map((record, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {record.from ?? "START"} → {record.to}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {record.actorId} ({record.role})
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(record.at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{record.reason}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Executions Deep Dive */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span>Specialized Agent Executions ({executions.length})</span>
            </h2>

            {executions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded border">
                No individual agent executions recorded for this workflow yet.
              </div>
            ) : (
              executions.map((exe) => {
                const isExpanded = !!expandedExecs[exe.id];

                return (
                  <Card key={exe.id} className="overflow-hidden border border-border shadow-sm">
                    {/* Execution Bar */}
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors bg-card"
                      onClick={() => toggleExpand(exe.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-muted-foreground">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                          {exe.agent.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{exe.agent}</span>
                            <Badge variant={exe.status === "SUCCESS" ? "default" : "destructive"} className="text-[10px]">
                              {exe.status}
                            </Badge>
                            {exe.attempt > 1 && (
                              <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px]">
                                Attempt #{exe.attempt}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                            <span>ID: <strong className="font-mono">{exe.id}</strong></span>
                            <span>Duration: <strong>{exe.durationMs}ms</strong></span>
                            <span>Tools: <strong className="font-mono">{exe.toolCalls.join(", ") || "None"}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(exe.startedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-4 space-y-4 text-xs animate-in fade-in-50">
                        {exe.error && (
                          <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2 font-medium">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Execution Error: {exe.error}</span>
                          </div>
                        )}

                        {/* Decision Evidence */}
                        <div className="space-y-1.5">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            <span>Auditable Decision Evidence:</span>
                          </div>
                          <div className="rounded bg-card border p-3 space-y-1 font-mono text-[11px] text-foreground">
                            {exe.evidence.map((ev, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-primary font-bold">›</span>
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Structured Input & Output Tabs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="font-semibold text-muted-foreground text-[11px] flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              <span>Structured Input:</span>
                            </span>
                            <pre className="p-3 rounded bg-background border font-mono text-[10px] overflow-x-auto max-h-48 text-muted-foreground">
                              {JSON.stringify(exe.input, null, 2)}
                            </pre>
                          </div>

                          <div className="space-y-1">
                            <span className="font-semibold text-muted-foreground text-[11px] flex items-center gap-1">
                              <FileCode className="h-3 w-3" />
                              <span>Structured Output:</span>
                            </span>
                            <pre className="p-3 rounded bg-background border font-mono text-[10px] overflow-x-auto max-h-48 text-muted-foreground">
                              {JSON.stringify(exe.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
