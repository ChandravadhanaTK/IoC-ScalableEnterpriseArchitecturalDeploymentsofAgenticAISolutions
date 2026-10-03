import { z } from "zod";
import { getState, mutateDurable } from "@/services/db";
import { appendAudit, appendTelemetry } from "@/services/ledger";
import { ToolPermissionError, ToolValidationError, TransientToolError } from "@/agents/errors";
import type { AgentName, ToolName } from "@/types";

// Re-exported so tool consumers have a single import surface for the error
// contract (permission denial, input rejection, retryable failure).
export { ToolPermissionError, ToolValidationError, TransientToolError };

export interface ToolContext {
  actorId: string;
  agent: AgentName;
  workflowId?: string;
  calls?: ToolName[];
}

/** Least-privilege agent → tool permission matrix. */
export const TOOL_PERMISSIONS: Record<AgentName, ToolName[]> = {
  DemandAgent: ["DemandHistoryTool"],
  InventoryAgent: ["InventoryTool"],
  SupplierAgent: ["SupplierTool", "AvailabilityTool"],
  RiskAndPolicyAgent: ["PolicyTool", "RiskMatrixTool"],
  ProcurementAgent: ["PurchaseOrderTool", "InventoryTool", "AuditTool"],
  OrchestratorAgent: ["AuditTool", "TelemetryTool", "NotificationTool", "PolicyTool"],
};

const QUIET: ToolName[] = ["AuditTool", "TelemetryTool"];

/**
 * Every tool call: (1) Zod validation, (2) auth/context check,
 * (3) operation, (4) typed output, (5) audit + telemetry emission.
 */
export function defineTool<S extends z.ZodTypeAny, O>(
  tool: ToolName,
  operation: string,
  schema: S,
  run: (input: z.infer<S>, ctx: ToolContext) => O,
) {
  return (ctx: ToolContext, rawInput: z.input<S>): O => {
    const t0 = performance.now();
    if (!TOOL_PERMISSIONS[ctx.agent].includes(tool)) {
      appendAudit({
        userId: ctx.actorId, workflowId: ctx.workflowId, agent: ctx.agent, tool,
        action: "TOOL_PERMISSION_DENIED", result: "DENIED", severity: "CRITICAL",
        details: { operation },
      });
      throw new ToolPermissionError(`${ctx.agent} is not permitted to call ${tool}`);
    }
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      appendAudit({
        userId: ctx.actorId, workflowId: ctx.workflowId, agent: ctx.agent, tool,
        action: "TOOL_INPUT_REJECTED", result: "FAILURE", severity: "WARN",
        details: { operation, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      });
      throw new ToolValidationError(`${tool}.${operation}: invalid input`);
    }
    ctx.calls?.push(tool);

    // Fault injection (admin simulation): a workflow can mark a tool as transiently failing.
    const wf = ctx.workflowId ? getState().workflows.find((w) => w.id === ctx.workflowId) : undefined;
    if (wf?.fault && wf.fault.tool === tool && wf.fault.remainingFailures > 0) {
      mutateDurable((s) => {
        const w = s.workflows.find((x) => x.id === wf.id)!;
        w.fault!.remainingFailures -= 1;
      });
      appendTelemetry({ kind: "tool", source: tool, latencyMs: performance.now() - t0, ok: false, workflowId: ctx.workflowId });
      appendAudit({
        userId: ctx.actorId, workflowId: ctx.workflowId, agent: ctx.agent, tool,
        action: "TOOL_INVOCATION", result: "FAILURE", severity: "WARN",
        details: { operation, error: "TIMEOUT (injected transient fault)" },
      });
      throw new TransientToolError(tool, `${tool}.${operation} timed out`);
    }

    try {
      const out = run(parsed.data, ctx);
      if (!QUIET.includes(tool)) {
        appendTelemetry({ kind: "tool", source: tool, latencyMs: performance.now() - t0, ok: true, workflowId: ctx.workflowId });
        appendAudit({
          userId: ctx.actorId, workflowId: ctx.workflowId, agent: ctx.agent, tool,
          action: "TOOL_INVOCATION", result: "SUCCESS", severity: "INFO", details: { operation },
        });
      }
      return out;
    } catch (e) {
      appendTelemetry({ kind: "tool", source: tool, latencyMs: performance.now() - t0, ok: false, workflowId: ctx.workflowId });
      throw e;
    }
  };
}
