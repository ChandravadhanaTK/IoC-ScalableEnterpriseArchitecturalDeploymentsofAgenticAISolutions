import React, { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { History, Search, ShieldCheck, ChevronDown, ChevronRight, Filter, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuditLog } from "@/types";

export const AuditTraceView: React.FC = () => {
  const state = useAppState();

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [resultFilter, setResultFilter] = useState<string>("ALL");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = useMemo(() => {
    return state.auditLogs
      .filter((log) => {
        const s = search.toLowerCase();
        const matchesSearch =
          log.action.toLowerCase().includes(s) ||
          (log.workflowId && log.workflowId.toLowerCase().includes(s)) ||
          log.userId.toLowerCase().includes(s) ||
          (log.agent && log.agent.toLowerCase().includes(s));

        const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;
        const matchesResult = resultFilter === "ALL" || log.result === resultFilter;

        return matchesSearch && matchesSeverity && matchesResult;
      })
      .reverse();
  }, [state.auditLogs, search, severityFilter, resultFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Append-Only Audit Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Immutable trace of every agent action, state transition, tool invocation, and human decision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Cryptographic Integrity Assured</span>
          </Badge>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action, workflow ID, user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue placeholder="All Results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Results</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="FAILURE">FAILURE</SelectItem>
              <SelectItem value="DENIED">DENIED</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <strong>{filteredLogs.length}</strong> of {state.auditLogs.length} ledger events
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider border-b">
                <tr>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-3 py-3">Seq / Time</th>
                  <th className="px-3 py-3">Actor (Role)</th>
                  <th className="px-3 py-3">Workflow ID</th>
                  <th className="px-3 py-3">Agent / Tool</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-3 py-3 text-center">Result</th>
                  <th className="px-3 py-3 text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No audit events match current search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = !!expandedRows[log.id];

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => toggleRow(log.id)}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-3 text-center text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-mono font-bold text-foreground">#{log.seq}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-foreground">{log.userId}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{log.role}</div>
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-primary">
                            {log.workflowId ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-foreground">{log.agent ?? "—"}</div>
                            {log.tool && (
                              <div className="text-[10px] text-muted-foreground font-mono">{log.tool}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-foreground">
                            {log.action}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge
                              variant={
                                log.result === "SUCCESS"
                                  ? "default"
                                  : log.result === "DENIED"
                                  ? "destructive"
                                  : "destructive"
                              }
                              className={`text-[9px] uppercase font-bold ${
                                log.result === "DENIED" ? "bg-amber-500/10 text-amber-600 border-amber-500/50" : ""
                              }`}
                            >
                              {log.result}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge
                              variant={
                                log.severity === "CRITICAL"
                                  ? "destructive"
                                  : log.severity === "WARN"
                                  ? "outline"
                                  : "secondary"
                              }
                              className={`text-[9px] uppercase font-bold ${
                                log.severity === "WARN" ? "border-amber-500 text-amber-600" : ""
                              }`}
                            >
                              {log.severity}
                            </Badge>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-muted/15">
                            <td colSpan={8} className="px-6 py-3 border-b">
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold text-muted-foreground">
                                  Structured Event Details (Immutable JSON):
                                </div>
                                <pre className="p-3 rounded-md bg-background border font-mono text-[10px] text-muted-foreground overflow-x-auto max-h-56">
                                  {JSON.stringify(
                                    {
                                      id: log.id,
                                      seq: log.seq,
                                      timestamp: log.timestamp,
                                      userId: log.userId,
                                      role: log.role,
                                      workflowId: log.workflowId,
                                      agent: log.agent,
                                      tool: log.tool,
                                      action: log.action,
                                      fromState: log.fromState,
                                      toState: log.toState,
                                      result: log.result,
                                      severity: log.severity,
                                      details: log.details,
                                    },
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
