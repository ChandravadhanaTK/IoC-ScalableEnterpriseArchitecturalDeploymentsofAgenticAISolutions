import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { PageHeader, btnPrimary } from "@/components/kf/bits";
import { concepts, documents, relations } from "@/data/seed";
import type { RelationType } from "@/types/knowledge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/graph")({
  validateSearch: z.object({ focus: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Knowledge Graph — KnowFlow" },
      { name: "description", content: "Explore how your documents and concepts connect." },
      { property: "og:title", content: "Knowledge Graph — KnowFlow" },
      { property: "og:description", content: "Explore how your documents and concepts connect." },
    ],
  }),
  component: Graph,
});

type N = { id: string; label: string; type: "doc" | "concept"; x: number; y: number; vx: number; vy: number; deg: number };
const W = 900, H = 620;
const edgeStyle: Record<RelationType, string> = {
  discusses: "stroke-border", related_to: "stroke-info", references: "stroke-cat-academics",
  contrasts_with: "stroke-destructive", belongs_to: "stroke-secondary", depends_on: "stroke-warning",
};
const dashed: Partial<Record<RelationType, string>> = { contrasts_with: "6 4", references: "2 3" };

function layout() {
  const ready = documents.filter((d) => d.sections.length);
  const nodes: N[] = [
    ...ready.map((d) => ({ id: d.id, label: d.title, type: "doc" as const })),
    ...concepts.map((c) => ({ id: c.id, label: c.name, type: "concept" as const })),
  ].map((n, i, a) => ({ ...n, x: W / 2 + Math.cos((i / a.length) * 6.283) * 250, y: H / 2 + Math.sin((i / a.length) * 6.283) * 220, vx: 0, vy: 0, deg: 0 }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = relations.filter((r) => byId.has(r.from) && byId.has(r.to));
  edges.forEach((e) => { byId.get(e.from)!.deg++; byId.get(e.to)!.deg++; });
  for (let it = 0; it < 300; it++) {
    for (const a of nodes) for (const b of nodes) {
      if (a === b) continue;
      const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
      const f = 2600 / d2;
      a.vx += dx * f / Math.sqrt(d2); a.vy += dy * f / Math.sqrt(d2);
    }
    for (const e of edges) {
      const a = byId.get(e.from)!, b = byId.get(e.to)!;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 90) * 0.02;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * 0.004; n.vy += (H / 2 - n.y) * 0.004;
      n.x = Math.max(40, Math.min(W - 40, n.x + n.vx * 0.5)); n.y = Math.max(30, Math.min(H - 30, n.y + n.vy * 0.5));
      n.vx *= 0.6; n.vy *= 0.6;
    }
  }
  return { nodes, edges, byId };
}

function Graph() {
  const { focus } = Route.useSearch();
  const nav = Route.useNavigate();
  const { nodes, edges, byId } = useMemo(layout, []);
  const [zoom, setZoom] = useState(1.4);
  const sel = focus ? byId.get(focus) : undefined;
  const neighbors = new Set(sel ? edges.flatMap((e) => (e.from === sel.id ? [e.to] : e.to === sel.id ? [e.from] : [])) : []);
  const concept = sel?.type === "concept" ? concepts.find((c) => c.id === sel.id) : undefined;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Knowledge Graph" sub={`${nodes.length} nodes · ${edges.length} relations`}>
        <div className="flex gap-1">
          <button className="rounded-md border bg-card px-2.5 py-1 text-sm" onClick={() => setZoom((z) => Math.min(2.5, z * 1.2))}>+</button>
          <button className="rounded-md border bg-card px-2.5 py-1 text-sm" onClick={() => setZoom((z) => Math.max(0.6, z / 1.2))}>−</button>
        </div>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card-surface overflow-hidden">
          <svg viewBox={`${W / 2 - W / 2 / zoom} ${H / 2 - H / 2 / zoom} ${W / zoom} ${H / zoom}`} className="h-[560px] w-full" onClick={() => nav({ search: {} })}>
            {edges.map((e, i) => {
              const a = byId.get(e.from)!, b = byId.get(e.to)!;
              const on = sel && (e.from === sel.id || e.to === sel.id);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cn(edgeStyle[e.type], sel && !on && "opacity-15")} strokeWidth={on ? 2 : 1} strokeDasharray={dashed[e.type]} />;
            })}
            {nodes.map((n) => {
              const r = n.type === "doc" ? 9 + n.deg * 0.8 : 5 + n.deg * 0.9;
              const dim = sel && n.id !== sel.id && !neighbors.has(n.id);
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`} className={cn("cursor-pointer transition-opacity", dim && "opacity-20")} onClick={(ev) => { ev.stopPropagation(); nav({ search: { focus: n.id } }); }}>
                  <circle r={r} className={n.type === "doc" ? "fill-primary" : "fill-secondary"} stroke={n.id === sel?.id ? "currentColor" : "none"} strokeWidth={2} />
                  <text y={r + 12} textAnchor="middle" className="fill-muted-foreground text-[10px]">{n.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Document</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-secondary" />Concept</span>
            {(Object.keys(edgeStyle) as RelationType[]).map((t) => (
              <span key={t} className="flex items-center gap-1"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" className={edgeStyle[t]} strokeWidth="2" strokeDasharray={dashed[t]} /></svg>{t.replace("_", " ")}</span>
            ))}
          </div>
        </div>
        <aside className="card-surface p-5">
          {!sel ? (
            <p className="text-sm text-muted-foreground">Select a node to see its connections.</p>
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{sel.type === "doc" ? "Document" : "Concept"}</p>
              <p className="mt-1 text-lg font-semibold">{sel.label}</p>
              {concept && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{concept.definition}</p>}
              <p className="mb-2 mt-5 text-sm font-medium">Connected ({neighbors.size})</p>
              <div className="flex flex-wrap gap-1.5">
                {[...neighbors].map((id) => <button key={id} onClick={() => nav({ search: { focus: id } })} className="rounded-full border bg-background px-2 py-0.5 text-xs hover:border-primary">{byId.get(id)!.label}</button>)}
              </div>
              <div className="mt-5 flex flex-col gap-2">
                {sel.type === "doc" ? (
                  <Link to="/app/documents/$id" params={{ id: sel.id }} className={btnPrimary}>Open document</Link>
                ) : (
                  <Link to="/app/assistant" search={{ q: `Explain ${sel.label}` }} className={btnPrimary}>Ask AI about {sel.label}</Link>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
