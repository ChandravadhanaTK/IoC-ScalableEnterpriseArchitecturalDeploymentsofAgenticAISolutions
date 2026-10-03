import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { callJson, callModel, AgentError } from "./ai.server";
import type { NewTask, ProposalChange, SkillGap, UserSkill } from "./types";

type DB = SupabaseClient<Database>;

export async function log(db: DB, userId: string, agent: string, action: string, status = "success", detail?: string) {
  await db.from("agent_logs").insert({ user_id: userId, agent, action, status, detail: detail ?? null });
}

async function must<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) {
    console.error(error);
    throw new AgentError("We couldn't save or load your data. Please try again.");
  }
  return data as NonNullable<T>;
}

export async function loadContext(db: DB, userId: string) {
  const profile = await must(db.from("profiles").select("*").eq("id", userId).maybeSingle());
  const analysis = await must(
    db.from("career_analyses").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  );
  const roadmap = await must(
    db.from("roadmaps").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  );
  const tasks = roadmap
    ? await must(db.from("roadmap_tasks").select("*").eq("roadmap_id", roadmap.id).order("phase_index").order("position"))
    : [];
  const results = await must(
    db.from("assessment_results").select("*").eq("user_id", userId).gte("score", 0).order("created_at", { ascending: false }).limit(10),
  );
  const proposals = await must(
    db.from("roadmap_change_proposals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
  );
  return { profile, analysis, roadmap, tasks, results, proposals };
}

function profileText(p: NonNullable<Awaited<ReturnType<typeof loadContext>>["profile"]>) {
  const skills = (p.skills as unknown as UserSkill[]) ?? [];
  return `Name: ${p.full_name}
Education: ${p.education}
Experience: ${p.experience_level}
Target role: ${p.target_role} (industry: ${p.target_industry})
Timeline: ${p.timeline_months} months, ${p.hours_per_week} hours/week
Current skills (1=Beginner..4=Expert): ${skills.map((s) => `${s.name}=${s.level}`).join(", ") || "none"}
Learning preferences: ${p.learning_preferences || "-"}
Preferred projects: ${p.project_types || "-"}
Goals: ${p.goals || "-"}`;
}

/* ---------------- Career Analysis Agent ---------------- */
export async function runCareerAnalysis(db: DB, userId: string) {
  const { profile } = await loadContext(db, userId);
  if (!profile?.target_role) throw new AgentError("Please complete your career assessment first.");
  await log(db, userId, "Career Analysis Agent", "Career analysis started", "running");
  try {
    const out = await callJson<{ summary: string; gaps: SkillGap[] }>(
      "You are the Career Analysis Agent. You analyze a target career, determine the competencies and skills it requires (technical and supporting), compare them against the user's current skills, and prioritize gaps.",
      `${profileText(profile)}

Return JSON: {"summary": string (2-3 sentences about the role and the user's fit), "gaps": [{"skill": string, "category": "Technical"|"Supporting", "required": 1-4, "current": 0-4 (use the user's stated level, 0 if absent), "gap": "None"|"Low"|"Medium"|"High", "priority": "Low"|"Medium"|"High", "reason": string (one sentence why this matters for the role)}]}.
Include 8-12 skills, ordered by priority.`,
    );
    const gaps = (out.gaps ?? []).slice(0, 14).map((g) => ({
      ...g,
      required: Math.max(1, Math.min(4, Number(g.required) || 3)),
      current: Math.max(0, Math.min(4, Number(g.current) || 0)),
    }));
    const row = await must(
      db.from("career_analyses").insert({ user_id: userId, summary: out.summary, gaps: gaps as never }).select().single(),
    );
    await log(db, userId, "Career Analysis Agent", "Career analysis completed", "success", `${gaps.length} skills analyzed`);
    return row;
  } catch (e) {
    await log(db, userId, "Career Analysis Agent", "Career analysis failed", "error");
    throw e;
  }
}

/* ---------------- Roadmap Planning Agent ---------------- */
type PlanTask = {
  title: string; description: string; skill: string; priority: string; estimated_hours: number;
  prerequisites: string; resources: string[]; practice: string;
};
type PlanPhase = { title: string; milestones: { title: string; tasks: PlanTask[] }[] };

export async function runRoadmapPlanning(db: DB, userId: string) {
  const { profile, analysis, roadmap: old } = await loadContext(db, userId);
  if (!profile || !analysis) throw new AgentError("Career analysis is required before building a roadmap.");
  await log(db, userId, "Roadmap Planning Agent", "Roadmap generation started", "running");
  try {
    const out = await callJson<{ title: string; summary: string; phases: PlanPhase[] }>(
      "You are the Roadmap Planning Agent. You design personalized, dependency-ordered learning roadmaps that fit the learner's weekly hours and timeline. Fundamentals come before advanced topics; projects and interview prep come last.",
      `${profileText(profile)}

Skill gaps (from Career Analysis Agent):
${JSON.stringify(analysis.gaps)}

Return JSON: {"title": string, "summary": string, "phases": [{"title": string, "milestones": [{"title": string, "tasks": [{"title": string, "description": string (2 sentences), "skill": string (one of the gap skills), "priority": "High"|"Medium"|"Low", "estimated_hours": number, "prerequisites": string (earlier tasks or "None"), "resources": [string] (2-3 specific real resources), "practice": string (a concrete exercise or mini project)}]}]}]}
Use 4-6 phases, 1-2 milestones each, 2-4 tasks per milestone. Total hours should roughly fit ${profile.timeline_months} months at ${profile.hours_per_week} h/week.`,
    );
    if (!out.phases?.length) throw new AgentError("The roadmap came back empty. Please try again.");
    if (old) await db.from("roadmaps").update({ is_active: false }).eq("id", old.id);
    const rm = await must(
      db.from("roadmaps").insert({ user_id: userId, title: out.title, summary: out.summary, version: (old?.version ?? 0) + 1 }).select().single(),
    );
    const rows = out.phases.flatMap((ph, pi) => {
      let pos = 0;
      return ph.milestones.flatMap((m) =>
        m.tasks.map((t) => ({
          roadmap_id: rm.id, user_id: userId, phase_index: pi, phase_title: ph.title, milestone: m.title,
          title: t.title, description: t.description, skill: t.skill, priority: t.priority,
          estimated_hours: Math.round(Number(t.estimated_hours) || 4), prerequisites: t.prerequisites,
          resources: (t.resources ?? []) as never, practice: t.practice, position: (pos += 10),
        })),
      );
    });
    await must(db.from("roadmap_tasks").insert(rows));
    await db.from("profiles").update({ assessment_completed: true }).eq("id", userId);
    await log(db, userId, "Roadmap Planning Agent", "Roadmap generated", "success", `${rows.length} tasks in ${out.phases.length} phases`);
    return rm;
  } catch (e) {
    await log(db, userId, "Roadmap Planning Agent", "Roadmap generation failed", "error");
    throw e;
  }
}

/* ---------------- Progress Analysis + Adaptive Planning Agents ---------------- */
export type ProgressReport = {
  summary: string;
  strong_areas: string[];
  weak_areas: string[];
  delays: string[];
  recommendations: string[];
  significant_issue: boolean;
  issue: string;
};

export async function runProgressAnalysis(db: DB, userId: string) {
  const ctx = await loadContext(db, userId);
  if (!ctx.roadmap) throw new AgentError("You need a roadmap before progress can be analyzed.");
  const done = ctx.tasks.filter((t) => t.completed);
  const started = new Date(ctx.roadmap.created_at!).getTime();
  const weeks = Math.max(1, (Date.now() - started) / (7 * 864e5));
  const totalHours = ctx.tasks.reduce((a, t) => a + (t.estimated_hours ?? 0), 0);
  const doneHours = done.reduce((a, t) => a + (t.estimated_hours ?? 0), 0);
  const expected = Math.min(totalHours, weeks * (ctx.profile?.hours_per_week ?? 10));
  const report = await callJson<ProgressReport>(
    "You are the Progress Analysis Agent. You review a learner's completed tasks, assessment scores and pace, then detect weak areas, strong areas, delays and skills needing practice. Flag significant_issue=true only for real problems such as an assessment score under 60% or being far behind schedule.",
    `Target: ${ctx.profile?.target_role}
Tasks: ${done.length}/${ctx.tasks.length} completed. Hours done ${doneHours} of ${totalHours}; expected by now ≈ ${Math.round(expected)}.
Completed tasks: ${done.map((t) => t.title).join("; ") || "none"}
Assessment results: ${ctx.results.map((r) => `${r.skill} ${Math.round((r.score / r.total) * 100)}% weak topics: ${(r.weak_topics as string[]).join(", ")}`).join(" | ") || "none yet"}

Return JSON: {"summary": string, "strong_areas": [string], "weak_areas": [string], "delays": [string], "recommendations": [string] (3-5 concrete actions), "significant_issue": boolean, "issue": string (one-line description, empty if none)}`,
  );
  await log(db, userId, "Progress Analysis Agent", "Progress analyzed", "success", report.significant_issue ? report.issue : "No significant issues");
  return { report, ctx };
}

export async function runAdaptivePlanning(db: DB, userId: string, report: ProgressReport) {
  const ctx = await loadContext(db, userId);
  if (!ctx.roadmap) return null;
  const pending = ctx.proposals.find((p) => p.status === "pending");
  if (pending) return pending;
  const phases = [...new Map(ctx.tasks.map((t) => [t.phase_index, t.phase_title])).entries()];
  const out = await callJson<{ issue: string; reason: string; changes: ProposalChange[]; new_tasks: NewTask[] }>(
    "You are the Adaptive Planning Agent. Given a detected learning problem, propose a focused, minimal change to the roadmap: remedial tasks inserted at the right phase, revision milestones, or re-sequencing. The user must approve before anything is applied.",
    `Detected issue: ${report.issue}
Weak areas: ${report.weak_areas.join(", ")}
Current phases (index: title): ${phases.map(([i, t]) => `${i}: ${t}`).join(" | ")}
Incomplete tasks: ${ctx.tasks.filter((t) => !t.completed).map((t) => `[phase ${t.phase_index}] ${t.title}`).join("; ")}

Return JSON: {"issue": string, "reason": string (2 sentences addressed to the learner), "changes": [{"type": "add"|"move"|"delay"|"note", "text": string}], "new_tasks": [{"phase_index": number (existing index where the remedial work belongs, usually the earliest incomplete phase), "phase_title": string (matching that phase), "milestone": string, "title": string, "description": string, "skill": string, "estimated_hours": number}]}
Propose 2-5 new tasks.`,
  );
  const row = await must(
    db.from("roadmap_change_proposals").insert({
      user_id: userId, roadmap_id: ctx.roadmap.id, issue: out.issue || report.issue, reason: out.reason,
      changes: (out.changes ?? []) as never, new_tasks: (out.new_tasks ?? []) as never,
    }).select().single(),
  );
  await log(db, userId, "Adaptive Planning Agent", "Adaptive proposal created", "success", row.issue);
  return row;
}

/* ---------------- Assessments ---------------- */
type Q = { question: string; options: string[]; answer: number; topic: string };

export async function createAssessment(db: DB, userId: string, skill: string, difficulty: string) {
  const out = await callJson<{ questions: Q[] }>(
    "You write accurate multiple-choice skill assessments.",
    `Create 6 ${difficulty} multiple-choice questions assessing "${skill}". Each tests a distinct sub-topic.
Return JSON: {"questions": [{"question": string, "options": [4 strings], "answer": index 0-3 of correct option, "topic": string (sub-topic name)}]}`,
  );
  const qs = (out.questions ?? []).filter((q) => q.options?.length >= 2).slice(0, 8);
  if (!qs.length) throw new AgentError("Couldn't create the assessment. Please try again.");
  const row = await must(
    db.from("assessment_results").insert({ user_id: userId, skill, difficulty, score: -1, total: qs.length, questions: qs as never }).select().single(),
  );
  return { id: row.id, skill, difficulty, questions: qs.map(({ question, options, topic }) => ({ question, options, topic })) };
}

export async function submitAssessment(db: DB, userId: string, id: string, answers: number[]) {
  const row = await must(db.from("assessment_results").select("*").eq("id", id).single());
  if (row.score >= 0) throw new AgentError("This assessment was already submitted.");
  const qs = row.questions as unknown as Q[];
  let score = 0;
  const weak = new Set<string>();
  const review = qs.map((q, i) => {
    const ok = answers[i] === q.answer;
    if (ok) score++; else weak.add(q.topic);
    return { question: q.question, options: q.options, correct: q.answer, chosen: answers[i] ?? -1, topic: q.topic };
  });
  await must(db.from("assessment_results").update({ score, weak_topics: [...weak] as never }).eq("id", id));
  await log(db, userId, "Progress Analysis Agent", `Assessment scored: ${row.skill}`, "success", `${score}/${qs.length}`);
  const pct = Math.round((score / qs.length) * 100);
  let proposalId: string | null = null;
  if (pct < 60) {
    const { report } = await runProgressAnalysis(db, userId);
    const forced = { ...report, significant_issue: true, issue: report.issue || `${row.skill} assessment score: ${pct}% (weak: ${[...weak].join(", ")})` };
    const p = await runAdaptivePlanning(db, userId, forced);
    proposalId = p?.id ?? null;
  }
  return { score, total: qs.length, pct, weak: [...weak], review, proposalId };
}

export async function decideProposal(db: DB, userId: string, id: string, accept: boolean) {
  const p = await must(db.from("roadmap_change_proposals").select("*").eq("id", id).single());
  if (p.status !== "pending") throw new AgentError("This proposal has already been decided.");
  if (accept && p.roadmap_id) {
    const tasks = p.new_tasks as unknown as NewTask[];
    const existing = await must(db.from("roadmap_tasks").select("phase_index, phase_title").eq("roadmap_id", p.roadmap_id));
    const valid = new Map(existing.map((t) => [t.phase_index, t.phase_title]));
    const rows = tasks.map((t, i) => {
      const pi = valid.has(t.phase_index) ? t.phase_index : Math.min(...valid.keys());
      return {
        roadmap_id: p.roadmap_id!, user_id: userId, phase_index: pi, phase_title: valid.get(pi) ?? t.phase_title,
        milestone: t.milestone || "Adaptive revision", title: t.title, description: t.description, skill: t.skill,
        priority: "High", estimated_hours: Math.round(Number(t.estimated_hours) || 3), prerequisites: "Added by Adaptive Planning Agent",
        resources: [] as never, practice: null, position: i + 1,
      };
    });
    await must(db.from("roadmap_tasks").insert(rows));
    const rm = await must(db.from("roadmaps").select("version").eq("id", p.roadmap_id).single());
    await db.from("roadmaps").update({ version: rm.version + 1 }).eq("id", p.roadmap_id);
  }
  await must(db.from("roadmap_change_proposals").update({ status: accept ? "accepted" : "rejected", decided_at: new Date().toISOString() }).eq("id", id));
  await log(db, userId, "Adaptive Planning Agent", accept ? "Proposal accepted" : "Proposal rejected", "success", p.issue);
  return { ok: true };
}

/* ---------------- AI Career Mentor ---------------- */
export async function mentorReply(db: DB, userId: string, message: string) {
  const ctx = await loadContext(db, userId);
  const history = await must(
    db.from("mentor_messages").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(16),
  );
  await must(db.from("mentor_messages").insert({ user_id: userId, role: "user", content: message }));
  const next = ctx.tasks.filter((t) => !t.completed).slice(0, 5);
  const system = `You are the PATHFINDER AI Career Mentor. Be warm, specific and concise (under 180 words, short paragraphs or bullets). Always ground answers in the learner's real data below; never invent progress.

PROFILE
${ctx.profile ? profileText(ctx.profile) : "No profile"}

SKILL GAPS: ${JSON.stringify(ctx.analysis?.gaps ?? [])}
ROADMAP: ${ctx.roadmap?.title ?? "none"} (v${ctx.roadmap?.version ?? 0}); ${ctx.tasks.filter((t) => t.completed).length}/${ctx.tasks.length} tasks done.
NEXT TASKS: ${next.map((t) => `${t.title} [${t.phase_title}, ${t.estimated_hours}h]`).join("; ") || "none"}
ASSESSMENTS: ${ctx.results.map((r) => `${r.skill}: ${r.score}/${r.total}, weak: ${(r.weak_topics as string[]).join(", ")}`).join(" | ") || "none"}
ADAPTIVE CHANGES: ${ctx.proposals.map((p) => `${p.status}: ${p.issue} — ${p.reason}`).join(" | ") || "none"}`;
  const reply = await callModel(system, [
    ...history.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ]);
  await must(db.from("mentor_messages").insert({ user_id: userId, role: "assistant", content: reply }));
  await log(db, userId, "AI Career Mentor", "Mentor request processed");
  return reply;
}
