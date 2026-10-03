import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SkillGap, UserSkill } from "./types";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

function chk<T>(r: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (r.error) throw new Error("We couldn't load your data. Please refresh.");
  return r.data as NonNullable<T>;
}

export const profileQ = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const id = await uid();
    const p = chk(await supabase.from("profiles").select("*").eq("id", id).maybeSingle());
    return p ? { ...p, skills: (p.skills as unknown as UserSkill[]) ?? [] } : null;
  },
});

export const analysisQ = queryOptions({
  queryKey: ["analysis"],
  queryFn: async () => {
    const a = chk(await supabase.from("career_analyses").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle());
    return a ? { ...a, gaps: a.gaps as unknown as SkillGap[] } : null;
  },
});

export const roadmapQ = queryOptions({
  queryKey: ["roadmap"],
  queryFn: async () => {
    const rm = chk(await supabase.from("roadmaps").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle());
    if (!rm) return null;
    const tasks = chk(await supabase.from("roadmap_tasks").select("*").eq("roadmap_id", rm.id).order("phase_index").order("position"));
    return { ...rm, tasks: tasks.map((t) => ({ ...t, resources: (t.resources as string[]) ?? [] })) };
  },
});

export const resultsQ = queryOptions({
  queryKey: ["results"],
  queryFn: async () =>
    chk(await supabase.from("assessment_results").select("id, skill, difficulty, score, total, weak_topics, created_at").gte("score", 0).order("created_at", { ascending: false }).limit(30)).map(
      (r) => ({ ...r, weak_topics: (r.weak_topics as string[]) ?? [] }),
    ),
});

export const proposalsQ = queryOptions({
  queryKey: ["proposals"],
  queryFn: async () =>
    chk(await supabase.from("roadmap_change_proposals").select("*").order("created_at", { ascending: false }).limit(30)).map((p) => ({
      ...p,
      changes: (p.changes as { type: string; text: string }[]) ?? [],
      new_tasks: (p.new_tasks as { title: string; phase_title: string; estimated_hours: number }[]) ?? [],
    })),
});

export const logsQ = queryOptions({
  queryKey: ["logs"],
  queryFn: async () => chk(await supabase.from("agent_logs").select("*").order("created_at", { ascending: false }).limit(25)),
});

export const messagesQ = queryOptions({
  queryKey: ["messages"],
  queryFn: async () => chk(await supabase.from("mentor_messages").select("*").order("created_at").limit(200)),
});

export const useProfile = () => useQuery(profileQ);
export const useAnalysis = () => useQuery(analysisQ);
export const useRoadmap = () => useQuery(roadmapQ);
export const useResults = () => useQuery(resultsQ);
export const useProposals = () => useQuery(proposalsQ);
export const useLogs = () => useQuery(logsQ);
export const useMessages = () => useQuery(messagesQ);

export function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/fetch|network/i.test(m)) return "Network problem — check your connection and try again.";
  return m.length > 200 ? "Something went wrong. Please try again." : m;
}
