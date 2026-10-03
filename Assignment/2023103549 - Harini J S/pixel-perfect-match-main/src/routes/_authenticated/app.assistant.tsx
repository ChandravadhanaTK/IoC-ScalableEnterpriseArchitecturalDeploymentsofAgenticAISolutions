import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, BrainCircuit, ChevronDown, GitCompare, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { AnswerText, btnGhost } from "@/components/kf/bits";
import { collections, documents, getDoc } from "@/data/seed";
import { logActivity, useCollections, useConversations } from "@/hooks/use-knowledge";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getAIProvider } from "@/services/ai/provider";
import type { Answer, Scope } from "@/types/knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/assistant")({
  validateSearch: z.object({ docs: z.string().optional(), collection: z.string().optional(), q: z.string().optional(), c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Assistant — KnowFlow" },
      { name: "description", content: "Ask grounded questions about your knowledge and get answers with citations." },
      { property: "og:title", content: "AI Assistant — KnowFlow" },
      { property: "og:description", content: "Ask grounded questions about your knowledge and get answers with citations." },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user"; text: string } | { role: "ai"; answer: Answer; shown: number };

const prompts = ["What is the role of the leader in Raft?", "How is this different from Paxos?", "What does the CAP theorem say about partitions?", "How does HNSW search work?", "Summarize hybrid retrieval in RAG."];

function scopeKey(s: Scope) {
  return s.kind === "all" ? "all" : s.kind === "collection" ? `c:${s.id}` : `d:${s.ids.join(",")}`;
}
function parseScope(k: string): Scope {
  if (k.startsWith("c:")) return { kind: "collection", id: k.slice(2) };
  if (k.startsWith("d:")) return { kind: "documents", ids: k.slice(2).split(",") };
  return { kind: "all" };
}

function Assistant() {
  const { c } = Route.useSearch();
  const { data: convs } = useConversations();
  return (
    <div className="mx-auto flex max-w-6xl gap-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <Link to="/app/assistant" search={{}} className={cn(btnGhost, "mb-3 w-full justify-center")}><Plus className="h-4 w-4" />New conversation</Link>
        <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">History</p>
        <div className="space-y-0.5">
          {convs?.map((x) => (
            <Link key={x.id} to="/app/assistant" search={{ c: x.id }} className={cn("block truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent", c === x.id ? "bg-accent text-foreground" : "text-muted-foreground")}>{x.title}</Link>
          ))}
          {convs?.length === 0 && <p className="px-1 text-xs text-muted-foreground">No saved conversations yet.</p>}
        </div>
      </aside>
      <div className="min-w-0 flex-1"><Chat key={c ?? "new"} /></div>
    </div>
  );
}

function Chat() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { data: allCollections } = useCollections();
  const initial: Scope = search.docs ? { kind: "documents", ids: search.docs.split(",") } : search.collection ? { kind: "collection", id: search.collection } : { kind: "all" };
  const [scope, setScope] = useState<Scope>(initial);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState(search.q ?? "");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<number | null>(null);
  const [saveErr, setSaveErr] = useState("");
  const convId = useRef<string | undefined>(search.c);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!search.c) return;
    supabase.from("conversations").select("messages,scope").eq("id", search.c).maybeSingle().then(({ data }) => {
      if (!data) return;
      setMsgs(data.messages as unknown as Msg[]);
      setScope(data.scope as unknown as Scope);
    });
  }, [search.c]);

  useEffect(() => { taRef.current?.focus(); }, [busy]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // simulated streaming reveal
  useEffect(() => {
    const last = msgs.at(-1);
    if (!last || last.role !== "ai" || last.shown >= last.answer.text.length) { if (busy && last?.role === "ai") setBusy(false); return; }
    const id = setTimeout(() => setMsgs((m) => m.map((x, i) => (i === m.length - 1 && x.role === "ai" ? { ...x, shown: Math.min(x.shown + 6, x.answer.text.length) } : x))), 12);
    return () => clearTimeout(id);
  }, [msgs, busy]);

  async function persist(all: Msg[], title: string) {
    const stored = all.map((m) => (m.role === "ai" ? { ...m, shown: m.answer.text.length } : m));
    const payload = { messages: stored as unknown as Json, scope: scope as unknown as Json, updated_at: new Date().toISOString() };
    if (convId.current) {
      const { error } = await supabase.from("conversations").update(payload).eq("id", convId.current);
      if (error) return setSaveErr(error.message);
    } else {
      const { data, error } = await supabase.from("conversations").insert({ ...payload, title: title.slice(0, 80) }).select("id").single();
      logActivity("ask", `Asked: ${title.slice(0, 60)}`);
      if (error) return setSaveErr(error.message);
      convId.current = data.id;
      window.history.replaceState(null, "", `/app/assistant?c=${data.id}`);
    }
    setSaveErr("");
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    const withUser: Msg[] = [...msgs, { role: "user", text: q }];
    setMsgs(withUser);
    const history = msgs.filter((m): m is Extract<Msg, { role: "ai" }> => m.role === "ai").map((m) => m.answer);
    await new Promise((r) => setTimeout(r, 450));
    const answer = await getAIProvider().answer(q, scope, history);
    const all: Msg[] = [...withUser, { role: "ai", answer, shown: 0 }];
    setMsgs(all);
    const firstQ = all.find((m): m is Extract<Msg, { role: "user" }> => m.role === "user")?.text ?? q;
    void persist(all, firstQ);
  }

  const singleDoc = scope.kind === "documents" && scope.ids.length === 1 ? scope.ids[0] : null;
  const custom = allCollections?.filter((x) => x.custom) ?? [];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold"><BrainCircuit className="h-5 w-5 text-primary" />AI Assistant</h1>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Scope
          <select value={scopeKey(scope)} onChange={(e) => setScope(parseScope(e.target.value))} className="max-w-56 rounded-lg border bg-card px-2.5 py-1.5 text-sm text-foreground">
            <option value="all">Entire knowledge base</option>
            <optgroup label="Collection">
              {collections.map((c) => <option key={c.id} value={`c:${c.id}`}>{c.name}</option>)}
              {custom.map((c) => <option key={c.id} value={`d:${c.docIds.join(",")}`}>{c.name}</option>)}
            </optgroup>
            <optgroup label="Document">{documents.filter((d) => d.status === "ready").map((d) => <option key={d.id} value={`d:${d.id}`}>{d.title}</option>)}</optgroup>
            {scope.kind === "documents" && scope.ids.length > 1 && !custom.some((c) => `d:${c.docIds.join(",")}` === scopeKey(scope)) && (
              <option value={scopeKey(scope)}>Selected documents ({scope.ids.length})</option>
            )}
          </select>
        </label>
      </div>
      {saveErr && <p className="mb-2 text-xs text-destructive">Couldn't save this conversation: {saveErr}</p>}

      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {msgs.length === 0 && (
          <div className="card-surface hero-surface p-6">
            <p className="font-medium">Ask anything about your documents.</p>
            <p className="mt-1 text-sm text-muted-foreground">Answers only use chunks inside the selected scope, and every claim links back to its source section.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {prompts.map((p) => <button key={p} onClick={() => send(p)} className="rounded-full border bg-background/60 px-3 py-1.5 text-xs hover:border-primary">{p}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end"><p className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</p></div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><BrainCircuit className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <AnswerText text={m.answer.text.slice(0, m.shown)} citations={m.answer.citations} />
                {m.shown < m.answer.text.length && <span className="caret ml-0.5 inline-block h-4 w-1.5 bg-primary align-middle" />}
                {m.shown >= m.answer.text.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setTrace(trace === i ? null : i)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                      How I answered <ChevronDown className={cn("h-3 w-3 transition-transform", trace === i && "rotate-180")} />
                    </button>
                    {m.answer.citations.length > 0 && new Set(m.answer.citations.map((c) => c.docId)).size === 2 && (
                      <Link to="/app/compare" search={{ a: m.answer.citations[0]!.docId, b: m.answer.citations.find((c) => c.docId !== m.answer.citations[0]!.docId)!.docId }} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                        <GitCompare className="h-3 w-3" />Open full comparison
                      </Link>
                    )}
                  </div>
                )}
                {trace === i && (
                  <div className="mt-3 space-y-3 rounded-xl border bg-card p-4 text-xs">
                    <ol className="space-y-1.5">
                      {m.answer.trace.map((t, j) => (
                        <li key={j} className="flex gap-3"><span className="w-40 shrink-0 font-medium">{t.name}</span><span className="text-muted-foreground">{t.detail}</span><span className="ml-auto font-mono text-muted-foreground">{t.ms.toFixed(1)}ms</span></li>
                      ))}
                    </ol>
                    {m.answer.retrieved.length > 0 && (
                      <table className="w-full font-mono text-[11px]">
                        <thead className="text-muted-foreground"><tr><th className="text-left font-normal">chunk</th><th className="text-right font-normal">bm25</th><th className="text-right font-normal">semantic</th><th className="text-right font-normal">hybrid</th></tr></thead>
                        <tbody>{m.answer.retrieved.map((r) => (
                          <tr key={r.chunk.id}><td className="truncate py-0.5">{r.chunk.id}</td><td className="text-right">{r.keyword.toFixed(2)}</td><td className="text-right">{r.semantic.toFixed(2)}</td><td className="text-right text-primary">{r.score.toFixed(2)}</td></tr>
                        ))}</tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && msgs.at(-1)?.role === "user" && <p className="pl-10 text-sm text-muted-foreground animate-pulse">Retrieving from your knowledge…</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="card-surface flex items-end gap-2 p-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          rows={1}
          placeholder={singleDoc ? `Ask about ${getDoc(singleDoc)?.title}…` : "Ask your knowledge…"}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button type="submit" disabled={busy || !input.trim()} className={cn(btnGhost, "border-0 bg-primary p-2 text-primary-foreground hover:bg-primary/90")} aria-label="Send"><ArrowUp className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
