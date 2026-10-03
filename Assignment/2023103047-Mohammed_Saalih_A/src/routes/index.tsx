import { createFileRoute } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Board } from "@/components/Board";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stonks Fish — AI Chess Tutor: Game Analyzer" },
      { name: "description", content: "Paste your PGN and get human-style coaching on every move from an AI chess tutor." },
      { property: "og:title", content: "Stonks Fish — Your AI Chess Coach" },
      { property: "og:description", content: "Paste your PGN and get human-style coaching on every move." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analyzer,
});

const SAMPLE = `[Event "Casual"]
[White "You"]
[Black "Opponent"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3# 0-1`;

type Ply = { san: string; from: string; to: string; before: string; after: string; color: "w" | "b" };
type Msg = { role: "user" | "assistant"; content: string };

function parse(pgn: string) {
  const g = new Chess();
  g.loadPgn(pgn);
  const headers = g.getHeaders();
  const plies: Ply[] = g.history({ verbose: true }).map((m) => ({
    san: m.san, from: m.from, to: m.to, before: m.before, after: m.after, color: m.color,
  }));
  return { headers, plies };
}

function Analyzer() {
  const [pgn, setPgn] = useState("");
  const [game, setGame] = useState<ReturnType<typeof parse> | null>(null);
  const [error, setError] = useState("");
  const [idx, setIdx] = useState(-1);
  const [flipped, setFlipped] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const start = new Chess().fen();
  const ply = game && idx >= 0 ? game.plies[idx] : null;
  const fen = ply ? ply.after : start;

  const pairs = useMemo(() => {
    const out: { n: number; w?: number; b?: number }[] = [];
    game?.plies.forEach((p, i) => {
      if (p.color === "w") out.push({ n: out.length + 1, w: i });
      else if (out.length && out[out.length - 1]!.b === undefined && out[out.length - 1]!.w !== undefined) out[out.length - 1]!.b = i;
      else out.push({ n: out.length + 1, b: i });
    });
    return out;
  }, [game]);

  const analyze = () => {
    try {
      const g = parse(pgn.trim());
      if (!g.plies.length) throw new Error("No moves found");
      setGame(g); setIdx(-1); setMsgs([]); setError("");
    } catch {
      setError("That PGN couldn't be read. Check the moves and try again.");
    }
  };

  const send = async (history: Msg[]) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setMsgs([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 402 ? "AI credits are used up. Add credits in workspace billing to keep coaching." : res.status === 429 ? "Coach is busy — wait a moment and try again." : "The coach couldn't respond. Please try again.";
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: text }]);
      }
      if (!text) throw new Error("The coach couldn't respond. Please try again.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMsgs([...history, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      if (abortRef.current === ac) setBusy(false);
    }
  };

  const explain = (i: number) => {
    if (!game) return;
    setIdx(i);
    const p = game.plies[i];
    if (!p) return;
    const moveNo = Math.floor(i / 2) + 1;
    const content = `Game PGN:\n${pgn.trim()}\n\nPlease explain move ${moveNo}${p.color === "w" ? "." : "..."} ${p.san} (played by ${p.color === "w" ? "White" : "Black"}).\nFEN before: ${p.before}\nFEN after: ${p.after}`;
    send([...msgs.filter((m) => m.content && !m.content.startsWith("⚠️")), { role: "user", content }]);
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const ctx = ply ? ` (Current position FEN: ${ply.after})` : "";
    send([...msgs.filter((m) => m.content), { role: "user", content: input.trim() + ctx }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-baseline gap-3 px-6 py-5">
          <h1 className="font-display text-2xl tracking-wide text-primary">STONKS FISH</h1>
          <p className="text-sm text-muted-foreground">Your AI Chess Coach</p>
          <span className="ml-auto rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Game Analyzer</span>
        </div>
      </header>

      {!game ? (
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="font-display text-4xl">Paste your game.</h2>
          <p className="mt-2 text-muted-foreground">Your coach will walk through every move with you — no engine numbers, just ideas you can use.</p>
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder="1. e4 e5 2. Nf3 ..."
            className="mt-6 h-64 w-full rounded-lg border border-input bg-card p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button onClick={analyze} disabled={!pgn.trim()} className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40">Analyze Game</button>
            <button onClick={() => setPgn(SAMPLE)} className="rounded-md border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">Load sample</button>
          </div>
        </main>
      ) : (
        <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section>
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{game.headers['White'] ?? "White"} vs {game.headers['Black'] ?? "Black"} {game.headers['Result'] ? `· ${game.headers['Result']}` : ""}</span>
              <button onClick={() => { setGame(null); abortRef.current?.abort(); }} className="hover:text-foreground">New game</button>
            </div>
            <Board fen={fen} flipped={flipped} lastMove={ply ?? undefined} />
            <div className="mt-3 flex gap-2">
              {[["⏮", () => setIdx(-1)], ["◀", () => setIdx((i) => Math.max(-1, i - 1))], ["▶", () => setIdx((i) => Math.min(game.plies.length - 1, i + 1))], ["⏭", () => setIdx(game.plies.length - 1)], ["⇅", () => setFlipped((f) => !f)]].map(([l, fn]) => (
                <button key={l as string} onClick={fn as () => void} className="flex-1 rounded-md border border-border bg-card py-2 hover:bg-secondary">{l as string}</button>
              ))}
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Moves — click one to get coaching</p>
            <ol className="mt-2 grid max-h-56 grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1 overflow-y-auto rounded-lg border border-border bg-card p-3 font-mono text-sm">
              {pairs.map((p) => (
                <li key={p.n} className="contents">
                  <span className="text-muted-foreground">{p.n}.</span>
                  {[p.w, p.b].map((i, k) => i === undefined ? <span key={k}>…</span> : (
                    <button key={k} onClick={() => explain(i)} className={`rounded px-2 py-0.5 text-left ${i === idx ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{game.plies[i]?.san}</button>
                  ))}
                </li>
              ))}
            </ol>
          </section>

          <section className="flex h-[calc(100vh-7rem)] flex-col rounded-lg border border-border bg-card lg:sticky lg:top-6">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-display text-lg">Coach</h2>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {!msgs.length && <p className="text-muted-foreground">Pick a move from the list and I'll explain what happened — then I'll ask you a question to sharpen your thinking.</p>}
              {msgs.map((m, i) => m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                  {m.content.startsWith("Game PGN:") ? `Explain ${m.content.match(/move (.+?) \(/)?.[1] ?? "this move"}` : m.content.replace(/ \(Current position FEN:.*\)$/, "")}
                </div>
              ) : (
                <div key={i} className="prose prose-invert prose-sm max-w-none coach-prose">
                  {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="animate-pulse text-muted-foreground">Coach is thinking…</span>}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={ask} className="flex gap-2 border-t border-border p-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Answer the coach or ask a question…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button disabled={busy || !input.trim()} className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-40">Send</button>
            </form>
          </section>
        </main>
      )}
    </div>
  );
}
