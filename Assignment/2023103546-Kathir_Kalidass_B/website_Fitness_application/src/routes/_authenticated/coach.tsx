import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SendHorizonal, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { getCoachHistory, sendCoachMessage } from "@/lib/coach.functions";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — HFC Holistic Fitness Club" },
      { name: "description", content: "Chat with Coach Aria, your AI fitness coach." },
      { property: "og:title", content: "AI Coach — HFC Holistic Fitness Club" },
      { property: "og:description", content: "Chat with Coach Aria, your AI fitness coach." },
    ],
  }),
  component: CoachPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

function CoachPage() {
  const queryClient = useQueryClient();
  const fetchHistory = useServerFn(getCoachHistory);
  const send = useServerFn(sendCoachMessage);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<Msg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data } = useQuery({
    queryKey: ["coach-history"],
    queryFn: () => fetchHistory(),
  });

  const messages: Msg[] = [
    ...((data ?? []) as Msg[]),
    ...optimistic,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setPending(true);
    setOptimistic([{ id: `tmp-${Date.now()}`, role: "user", content: text }]);
    try {
      const result = await send({ data: { message: text } });
      setOptimistic([]);
      if (result?.error || !result?.reply) {
        toast.error(result?.error ?? "Coach is unavailable right now.");
      } else {
        await queryClient.invalidateQueries({ queryKey: ["coach-history"] });
      }
    } catch (err) {
      setOptimistic([]);
      toast.error("Coach is unavailable right now.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="glass rise mx-auto flex h-[calc(100vh-220px)] max-w-3xl flex-col p-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <div className="grid size-10 place-items-center rounded-full bg-brand/15 ring-1 ring-white/10">
          <Sparkles className="size-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-semibold">Coach Aria</p>
          <p className="flex items-center gap-1.5 text-[11px] text-mist">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Online · knows your program
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 && !pending && (
          <div className="mx-auto mt-10 max-w-sm text-center">
            <p className="font-display text-lg font-semibold">Hey, I'm Aria</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Ask me about training, meals, recovery or sleep. Try: "Adjust today's push session for
              a sore shoulder."
            </p>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-brand px-4 py-3 text-sm leading-relaxed text-brand-foreground"
            >
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="max-w-[85%] text-sm leading-relaxed text-foreground">
              <div className="prose-sm prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ),
        )}
        {pending && (
          <div className="flex items-center gap-2 text-sm text-mist">
            <span className="size-2 animate-pulse rounded-full bg-brand" />
            Aria is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-white/5 p-4">
        <div className="flex items-end gap-2 rounded-full bg-white/5 py-2 pl-5 pr-2 ring-1 ring-white/10 focus-within:ring-brand/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Message Coach Aria…"
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-mist"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-40"
            aria-label="Send"
          >
            <SendHorizonal className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
