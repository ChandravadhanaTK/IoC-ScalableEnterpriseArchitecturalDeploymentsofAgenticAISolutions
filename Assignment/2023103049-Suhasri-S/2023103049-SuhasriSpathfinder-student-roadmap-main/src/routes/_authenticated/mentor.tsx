import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askMentor } from "@/lib/agents.functions";
import { errMsg, useMessages } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/mentor")({
  head: () => ({ meta: [{ title: "AI Career Mentor — Pathfinder" }, { name: "description", content: "Chat with a mentor that knows your roadmap and progress." }] }),
  component: Mentor,
});

const SUGGEST = ["What should I learn today?", "Am I falling behind?", "What is my weakest skill?", "Why did my roadmap change?", "What project should I build?"];

function Mentor() {
  const { data } = useMessages();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const ask = useServerFn(askMentor);
  const qc = useQueryClient();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [data, pending]);

  const send = async (text: string) => {
    const m = text.trim();
    if (!m || pending) return;
    setPending(m); setInput("");
    try { await ask({ data: { message: m } }); await qc.invalidateQueries({ queryKey: ["messages"] }); }
    catch (e) { toast.error(errMsg(e)); setInput(m); await qc.invalidateQueries({ queryKey: ["messages"] }); }
    finally { setPending(null); }
  };

  const msgs = data ?? [];
  return (
    <AppShell>
      <PageHeader title="AI Career Mentor" subtitle="Knows your profile, gaps, roadmap, scores and adaptive changes." />
      <div className="flex h-[65vh] flex-col rounded-2xl border bg-card">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 && !pending && (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">Try asking:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">{SUGGEST.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>{s}</Button>)}</div>
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{m.content}</div>
          ))}
          {pending && !msgs.some((m) => m.role === "user" && m.content === pending && msgs[msgs.length - 1] === m) && (
            <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">{pending}</div>
          )}
          {pending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Mentor is thinking…</div>}
          <div ref={end} />
        </div>
        <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <Textarea aria-label="Message" rows={1} className="min-h-10 resize-none" placeholder="Ask about your career path…" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
          <Button type="submit" size="icon" aria-label="Send" disabled={!!pending || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </AppShell>
  );
}
