import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { AgentError } from "./llm.server";
import { coachingProgressAgent, interviewEvaluationAgent, interviewPlanningAgent } from "./agents.server";

type DB = SupabaseClient<Database>;
type AgentName = "interview_planning" | "interview_evaluation" | "coaching_progress";

/**
 * Orchestrator: deterministic coordinator (not an agent). It loads data, invokes
 * the three agents in order, validates/persists their outputs and records every
 * execution in agent_runs.
 */
async function traced<T>(db: DB, userId: string, traceId: string, agent: AgentName, state: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const r = await fn();
    await db.from("agent_runs").insert({ user_id: userId, trace_id: traceId, agent, state, success: true, duration_ms: Date.now() - t0 });
    return r;
  } catch (e) {
    await db.from("agent_runs").insert({
      user_id: userId, trace_id: traceId, agent, state, success: false, duration_ms: Date.now() - t0,
      error: e instanceof Error ? e.message.slice(0, 500) : "unknown",
    });
    throw e;
  }
}

const fail = (m: string, s = 400) => new AgentError(m, s);

export async function orchestratePlan(db: DB, userId: string, interviewId: string) {
  const traceId = crypto.randomUUID();
  const { data: iv } = await db.from("interviews").select("*").eq("id", interviewId).single();
  if (!iv) throw fail("Interview not found", 404);
  if (iv.status !== "planning" && iv.status !== "awaiting_approval") throw fail("This interview has already started.");
  const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
  const questions = await traced(db, userId, traceId, "interview_planning", "planning", () =>
    interviewPlanningAgent({
      profile: profile ?? { full_name: "", education: "", experience_level: "", skills: "", programming_languages: "", projects: "", resume_text: "" },
      targetRole: iv.target_role,
      jobDescription: iv.job_description,
      interviewType: iv.interview_type,
      difficulty: iv.difficulty,
      numQuestions: iv.num_questions,
    }),
  );
  await db.from("interview_questions").delete().eq("interview_id", interviewId);
  const { error } = await db.from("interview_questions").insert(
    questions.map((q, i) => ({ interview_id: interviewId, user_id: userId, position: i, ...q })),
  );
  if (error) throw fail("Could not save plan", 500);
  await db.from("interviews").update({ status: "awaiting_approval" }).eq("id", interviewId);
  return { traceId, count: questions.length };
}

export async function orchestrateEvaluation(db: DB, userId: string, questionId: string, answer: string) {
  const traceId = crypto.randomUUID();
  const { data: q } = await db.from("interview_questions").select("*, interviews!inner(status)").eq("id", questionId).single();
  if (!q) throw fail("Question not found", 404);
  if ((q as unknown as { interviews: { status: string } }).interviews.status !== "in_progress") throw fail("Interview is not in progress. Approve the plan first.");
  const ev = await traced(db, userId, traceId, "interview_evaluation", "evaluating", () =>
    interviewEvaluationAgent({ question: q.question, category: q.category, difficulty: q.difficulty, expectedConcepts: q.expected_concepts, answer }),
  );
  await db.from("answers").delete().eq("question_id", questionId);
  const { data: ans, error: aerr } = await db.from("answers").insert({ interview_id: q.interview_id, question_id: questionId, user_id: userId, answer_text: answer }).select().single();
  if (aerr || !ans) throw fail("Could not save answer", 500);
  const { data: saved, error } = await db.from("evaluations").insert({ interview_id: q.interview_id, question_id: questionId, answer_id: ans.id, user_id: userId, ...ev }).select().single();
  if (error) throw fail("Could not save evaluation", 500);
  return saved;
}

export async function orchestrateCoaching(db: DB, userId: string, interviewId: string | null) {
  const { data: rows } = await db
    .from("evaluations")
    .select("score, strengths, weaknesses, interview_questions(question, category, difficulty)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (!rows || rows.length === 0) return null; // insufficient data — never fabricate
  const traceId = crypto.randomUUID();
  const history = rows.map((r) => {
    const q = r.interview_questions as unknown as { question: string; category: string; difficulty: string };
    return { score: r.score, strengths: r.strengths, weaknesses: r.weaknesses, question: q?.question ?? "", category: q?.category ?? "", difficulty: q?.difficulty ?? "" };
  });
  const c = await traced(db, userId, traceId, "coaching_progress", "coaching", () => coachingProgressAgent(history));
  const { data } = await db.from("recommendations").insert({ user_id: userId, interview_id: interviewId, ...c }).select().single();
  return data;
}

export async function orchestrateCompletion(db: DB, userId: string, interviewId: string) {
  const { data: evs } = await db.from("evaluations").select("score").eq("interview_id", interviewId);
  if (!evs || evs.length === 0) throw fail("Answer at least one question before finishing.");
  const avg = evs.reduce((s, e) => s + e.score, 0) / evs.length;
  await db.from("interviews").update({ status: "completed", completed_at: new Date().toISOString(), overall_score: Math.round(avg * 10) / 10 }).eq("id", interviewId);
  let coachingError: string | null = null;
  try {
    await orchestrateCoaching(db, userId, interviewId);
  } catch (e) {
    coachingError = e instanceof Error ? e.message : "Coaching failed";
  }
  await db.from("notifications").insert({
    user_id: userId,
    title: "Interview report ready",
    body: `You scored ${avg.toFixed(1)}/10. Review your feedback and recommended topics.`,
    link: `/interviews/${interviewId}/report`,
  });
  return { overall: avg, coachingError };
}
