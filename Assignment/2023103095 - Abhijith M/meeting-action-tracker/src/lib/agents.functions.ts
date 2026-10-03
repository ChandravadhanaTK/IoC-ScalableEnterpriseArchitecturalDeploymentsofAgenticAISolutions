// Orchestrator + the three agents. All run server-side as the signed-in user (RLS applies).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ANALYSIS_MODEL,
  callAnalysisLLM,
  detectInjection,
  extractedSchema,
  redactPII,
  validateItems,
} from "./agents.server";

type Ctx = { supabase: any; userId: string };

function tracer(ctx: Ctx, traceId: string, meetingId: string | null) {
  return async (row: {
    agent: string;
    step: string;
    state: string;
    success?: boolean | null;
    error?: string | null;
    duration_ms?: number;
    input_tokens?: number | null;
    output_tokens?: number | null;
    model?: string | null;
    details?: Record<string, unknown>;
  }) => {
    await ctx.supabase.from("agent_runs").insert({
      user_id: ctx.userId,
      trace_id: traceId,
      meeting_id: meetingId,
      ...row,
      details: row.details ?? {},
    });
  };
}

async function audit(ctx: Ctx, action: string, entity: string, entity_id: string | null, details = {}) {
  await ctx.supabase.from("audit_logs").insert({ user_id: ctx.userId, action, entity, entity_id, details });
}

/* ---------------- Meeting Analysis Agent ---------------- */
export const analyzeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ meetingId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: meeting, error } = await ctx.supabase
      .from("meetings")
      .select("*")
      .eq("id", data.meetingId)
      .maybeSingle();
    if (error || !meeting) throw new Error("Meeting not found or access denied");

    const traceId = crypto.randomUUID();
    const log = tracer(ctx, traceId, meeting.id);
    const t0 = Date.now();
    await log({ agent: "Orchestrator", step: "dispatch", state: "PROCESSING", details: { target: "MeetingAnalysisAgent" } });
    await ctx.supabase.from("meetings").update({ agent_state: "PROCESSING", last_error: null, updated_at: new Date().toISOString() }).eq("id", meeting.id);
    await ctx.supabase.from("action_items").delete().eq("meeting_id", meeting.id).eq("review_status", "PENDING");

    // Safety: injection screening + PII masking
    const hits = detectInjection(meeting.transcript);
    if (hits.length) {
      await ctx.supabase.from("security_events").insert(
        hits.map((h) => ({ user_id: ctx.userId, meeting_id: meeting.id, trace_id: traceId, kind: h.kind, pattern: h.pattern, snippet: h.snippet })),
      );
      await audit(ctx, "prompt_injection_detected", "meeting", meeting.id, { count: hits.length });
    }
    const redacted = redactPII(meeting.transcript);

    const apiKey = process.env["LOVABLE_API_KEY"];
    const tA = Date.now();
    let parsed: z.infer<typeof extractedSchema>;
    let usage: { input_tokens?: number; output_tokens?: number } = {};
    try {
      if (!apiKey) throw new Error("LLM API key is not configured on the server.");
      const r = await callAnalysisLLM({ apiKey, transcript: redacted.text, meetingDate: meeting.meeting_date });
      usage = r.usage;
      let json: unknown;
      try {
        json = JSON.parse(r.text);
      } catch {
        throw new Error("LLM returned malformed JSON.");
      }
      const p = extractedSchema.safeParse(json);
      if (!p.success) throw new Error("LLM output did not match the action-item schema.");
      parsed = p.data;
      await log({
        agent: "MeetingAnalysisAgent", step: "llm_extraction", state: "PROCESSING", success: true,
        duration_ms: Date.now() - tA, model: ANALYSIS_MODEL,
        input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
        details: { raw_items: parsed.items.length, injection_flags: hits.length, pii_masked: redacted.count },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown LLM failure";
      await log({
        agent: "MeetingAnalysisAgent", step: "llm_extraction", state: "FAILED", success: false, error: msg,
        duration_ms: Date.now() - tA, model: ANALYSIS_MODEL,
        input_tokens: usage.input_tokens ?? null, output_tokens: usage.output_tokens ?? null,
      });
      await log({ agent: "Orchestrator", step: "complete", state: "FAILED", success: false, error: msg, duration_ms: Date.now() - t0 });
      await ctx.supabase.from("meetings").update({ agent_state: "FAILED", last_error: msg }).eq("id", meeting.id);
      await audit(ctx, "analysis_failed", "meeting", meeting.id, { error: msg });
      return { ok: false as const, traceId, error: msg };
    }

    // Validation
    await ctx.supabase.from("meetings").update({ agent_state: "VALIDATING" }).eq("id", meeting.id);
    const tV = Date.now();
    const { accepted, rejected } = validateItems(parsed.items, meeting.transcript);
    await log({
      agent: "MeetingAnalysisAgent", step: "validation", state: "VALIDATING", success: true,
      duration_ms: Date.now() - tV, details: { accepted: accepted.length, dropped: rejected },
    });

    if (accepted.length) {
      await ctx.supabase.from("action_items").insert(
        accepted.map((it) => ({
          meeting_id: meeting.id, user_id: ctx.userId, title: it.title, owner: it.owner,
          deadline_text: it.deadline_text, deadline_date: it.deadline_date, priority: it.priority,
          context: it.context, source_text: it.source_text,
        })),
      );
    }
    await ctx.supabase.from("meetings").update({ agent_state: "AWAITING_APPROVAL" }).eq("id", meeting.id);
    await log({ agent: "HumanApproval", step: "awaiting_review", state: "AWAITING_APPROVAL", details: { items: accepted.length } });
    await audit(ctx, "analysis_completed", "meeting", meeting.id, { traceId, items: accepted.length });
    return { ok: true as const, traceId, count: accepted.length, dropped: rejected.length };
  });

/* ---------------- Reminder Agent core ---------------- */
async function reminderCore(ctx: Ctx, traceId: string, meetingId: string | null) {
  const log = tracer(ctx, traceId, meetingId);
  const t0 = Date.now();
  const { data: tasks } = await ctx.supabase
    .from("tasks")
    .select("id,title,owner,deadline,status")
    .eq("user_id", ctx.userId)
    .neq("status", "COMPLETED")
    .not("deadline", "is", null);
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  let overdue = 0, upcoming = 0;
  const notes: any[] = [];
  for (const t of tasks ?? []) {
    if (t.deadline < today) {
      overdue++;
      if (t.status !== "OVERDUE") await ctx.supabase.from("tasks").update({ status: "OVERDUE", updated_at: new Date().toISOString() }).eq("id", t.id);
      notes.push({ user_id: ctx.userId, task_id: t.id, kind: "OVERDUE", message: `Overdue: "${t.title}"${t.owner ? ` (${t.owner})` : ""} was due ${t.deadline}.` });
    } else if (t.deadline <= soon) {
      upcoming++;
      notes.push({ user_id: ctx.userId, task_id: t.id, kind: "UPCOMING", message: `Upcoming: "${t.title}"${t.owner ? ` (${t.owner})` : ""} is due ${t.deadline}.` });
    }
  }
  let created = 0;
  if (notes.length) {
    const { data: ins } = await ctx.supabase
      .from("notifications")
      .upsert(notes, { onConflict: "task_id,kind", ignoreDuplicates: true })
      .select("id");
    created = ins?.length ?? 0;
  }
  await log({
    agent: "ReminderAgent", step: "deadline_scan", state: "COMPLETED", success: true, duration_ms: Date.now() - t0,
    details: { scanned: tasks?.length ?? 0, overdue, upcoming, notifications_created: created, duplicates_skipped: notes.length - created },
  });
  return { scanned: tasks?.length ?? 0, overdue, upcoming, created };
}

/* ---------------- Human approval → Task Management Agent → Reminder Agent ---------------- */
export const reviewActionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      meetingId: z.string().uuid(),
      approvedIds: z.array(z.string().uuid()),
      rejectedIds: z.array(z.string().uuid()),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { data: meeting } = await ctx.supabase.from("meetings").select("id,title,agent_state").eq("id", data.meetingId).maybeSingle();
    if (!meeting) throw new Error("Meeting not found or access denied");
    if (meeting.agent_state !== "AWAITING_APPROVAL") throw new Error("Meeting is not awaiting approval");

    const { data: lastRun } = await ctx.supabase
      .from("agent_runs").select("trace_id").eq("meeting_id", meeting.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const traceId: string = lastRun?.trace_id ?? crypto.randomUUID();
    const log = tracer(ctx, traceId, meeting.id);

    if (data.rejectedIds.length)
      await ctx.supabase.from("action_items").update({ review_status: "REJECTED" }).in("id", data.rejectedIds).eq("meeting_id", meeting.id);
    if (data.approvedIds.length)
      await ctx.supabase.from("action_items").update({ review_status: "APPROVED" }).in("id", data.approvedIds).eq("meeting_id", meeting.id);
    await log({ agent: "HumanApproval", step: "decision", state: "COMPLETED", success: true, details: { approved: data.approvedIds.length, rejected: data.rejectedIds.length } });
    await audit(ctx, "action_items_reviewed", "meeting", meeting.id, { approved: data.approvedIds.length, rejected: data.rejectedIds.length });

    // Task Management Agent
    const tT = Date.now();
    let createdTasks = 0;
    try {
      if (data.approvedIds.length) {
        const { data: items } = await ctx.supabase.from("action_items").select("*").in("id", data.approvedIds).eq("meeting_id", meeting.id);
        const rows = (items ?? []).map((it: any) => ({
          user_id: ctx.userId, meeting_id: meeting.id, action_item_id: it.id, title: it.title,
          description: it.context, owner: it.owner, deadline: it.deadline_date, deadline_text: it.deadline_text,
          priority: it.priority, status: "TODO",
        }));
        const { data: ins, error } = await ctx.supabase.from("tasks").insert(rows).select("id");
        if (error) throw new Error(error.message);
        createdTasks = ins?.length ?? 0;
      }
      await log({ agent: "TaskManagementAgent", step: "create_tasks", state: "COMPLETED", success: true, duration_ms: Date.now() - tT, details: { tasks_created: createdTasks } });
      await audit(ctx, "tasks_created", "meeting", meeting.id, { count: createdTasks });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Task creation failed";
      await log({ agent: "TaskManagementAgent", step: "create_tasks", state: "FAILED", success: false, error: msg, duration_ms: Date.now() - tT });
      await ctx.supabase.from("meetings").update({ agent_state: "FAILED", last_error: msg }).eq("id", meeting.id);
      return { ok: false as const, error: msg };
    }

    const reminder = await reminderCore(ctx, traceId, meeting.id);
    await ctx.supabase.from("meetings").update({ agent_state: "COMPLETED", updated_at: new Date().toISOString() }).eq("id", meeting.id);
    await log({ agent: "Orchestrator", step: "complete", state: "COMPLETED", success: true });
    return { ok: true as const, createdTasks, reminder, traceId };
  });

/* ---------------- Reminder Agent (standalone run) ---------------- */
export const runReminderAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const traceId = crypto.randomUUID();
    const r = await reminderCore(ctx, traceId, null);
    return { ...r, traceId };
  });
