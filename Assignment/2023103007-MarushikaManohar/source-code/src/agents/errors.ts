import type { ToolName } from "@/types";

/**
 * Shared domain errors.
 *
 * These live in their own module (rather than in `tools/core.ts`) so that
 * `tools/actionTools.ts` can raise a TransientToolError without creating an
 * import cycle with `tools/core.ts`, which imports from `actionTools` consumers.
 */

/** Thrown when an agent calls a tool outside its least-privilege grant. */
export class ToolPermissionError extends Error {
  override name = "ToolPermissionError";
}

/** Thrown when a tool rejects its input during Zod validation. */
export class ToolValidationError extends Error {
  override name = "ToolValidationError";
}

/**
 * Thrown by a tool on a transient (retryable) failure — timeout, injected
 * fault, flaky dependency. The Orchestrator catches this to enter RETRYING
 * with exponential backoff, up to the policy retry limit.
 */
export class TransientToolError extends Error {
  override name = "TransientToolError";
  constructor(
    public tool: ToolName,
    message: string,
  ) {
    super(message);
  }
}

/** Type guard: does this thrown value represent a retryable tool failure? */
export function isTransientToolError(e: unknown): e is TransientToolError {
  return e instanceof Error && e.name === "TransientToolError" && "tool" in e;
}