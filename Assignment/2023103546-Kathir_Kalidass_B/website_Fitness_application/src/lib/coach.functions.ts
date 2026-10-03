import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z.object({ message: z.string().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;

    // Get or create the member's single coach thread.
    let { data: thread } = await supabase
      .from("coach_threads")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!thread) {
      const { data: created, error: threadError } = await supabase
        .from("coach_threads")
        .insert({ user_id: userId, title: "Coach Aria" })
        .select("id")
        .single();
      if (threadError) {
        console.error("coach thread create failed:", threadError);
        return { reply: null, error: "Could not start a conversation." };
      }
      thread = created;
    }
    const threadId = thread.id;

    const { data: history } = await supabase
      .from("coach_messages")
      .select("role, content")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    const { error: insertError } = await supabase
      .from("coach_messages")
      .insert({ thread_id: threadId, user_id: userId, role: "user", content: data.message });
    if (insertError) {
      console.error("coach message insert failed:", insertError);
      return { reply: null, error: "Could not save your message." };
    }

    let reply: string;
    try {
      const { askCoach } = await import("./coach.server");
      reply = await askCoach([
        ...(history ?? []).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: data.message },
      ]);
    } catch (aiError) {
      console.error("coach AI call failed:", aiError);
      return { reply: null, error: "Coach Aria is unavailable right now. Please try again in a moment." };
    }

    const { error: replyError } = await supabase
      .from("coach_messages")
      .insert({ thread_id: threadId, user_id: userId, role: "assistant", content: reply });
    if (replyError) console.error("coach reply insert failed:", replyError);

    return { reply, error: null };
  });

export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data, error } = await supabase
      .from("coach_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error("Could not load conversation.");
    return data ?? [];
  });
