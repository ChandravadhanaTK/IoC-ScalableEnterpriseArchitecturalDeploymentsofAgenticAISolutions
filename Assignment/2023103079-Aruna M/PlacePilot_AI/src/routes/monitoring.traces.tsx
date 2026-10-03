import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useApp } from "@/lib/placepilot/store";
import type { Span } from "@/lib/placepilot/types";
import { ArchTabs, EngineBadge, PageHeader, Panel, Pill } from "@/components/pp";

export const Route = createFileRoute("/monitoring/traces")({
  validateSearch: (s) => z.object({ trace: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Trace Inspector — PlacePilot AI" },
      { name: "description", content: "Deep trace inspector with parent/child spans, latency waterfall and token estimates." },
      { property: "og:title", content: "Trace Inspector — PlacePilot AI" },
      { property: "og:description", content: "Inspect every agent span." },
    ],
  }),
  component: Traces,
});

function depth(s: Span, all: Span[]): number {
  let d = 0;
  let p = s.parentId;
  while (p) {
    d++;
    p = all.find((x) => x.id === p)?.parentId ?? null;
  }
  return d;
}

function Traces() {
  const { traces } = useApp();
  const { trace } = Route.useSearch();
  const nav = Route.useNavigate();
  const t = traces.find((x) => x.id === trace) ?? traces[0];
  const total = t?.spans[0]?.latencyMs || 1;
  return (
    <div>
      <ArchTabs />
      <PageHeader kicker="Deliverable 5b" title="Trace inspector">Each pipeline run is one trace. Spans nest under their parent; bars show when each started and how long it took.</PageHeader>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel title={`Traces (${traces.length})`}>
          <ul className="space-y-1">
            {traces.map((x) => (
              <li key={x.id}>
                <button onClick={() => nav({ search: { trace: x.id } })} className={`w-full rounded-sm px-2 py-2 text-left text-sm ${x.id === t?.id ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                  <span className="block truncate">{x.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{x.id.slice(0, 16)} · {new Date(x.startedAt).toLocaleString("en-IN")}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        {t ? (
          <Panel title={t.label} right={<EngineBadge engine={t.engine} />}>
            <p className="mb-3 font-mono text-xs text-muted-foreground">trace_id {t.id} · total {total}ms · safety flags {t.safetyFlags}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="font-mono text-[10px] uppercase text-muted-foreground">
                  <tr><th className="pb-2 text-left">Span</th><th className="text-left">State</th><th className="text-left">Engine</th><th className="w-[30%] text-left">Waterfall</th><th className="text-right">ms</th><th className="text-right">tok in/out</th></tr>
                </thead>
                <tbody>
                  {t.spans.map((s) => (
                    <tr key={s.id} className="border-t border-border" title={s.note}>
                      <td className="py-2 font-mono" style={{ paddingLeft: depth(s, t.spans) * 16 }}>
                        {depth(s, t.spans) > 0 && <span className="text-muted-foreground">└ </span>}{s.name}
                        <span className="block text-[10px] text-muted-foreground">parent {s.parentId ? s.parentId.split("_").pop() : "—"} · {s.agent}</span>
                      </td>
                      <td><Pill v={s.state} /></td>
                      <td className="font-mono text-[10px]">{s.engine === "real" ? "real-ai" : "demo"}</td>
                      <td>
                        <div className="relative h-2 rounded-sm bg-muted">
                          <div className={`absolute h-2 rounded-sm ${s.state === "FALLBACK" ? "bg-warning" : "bg-primary"}`} style={{ left: `${(s.startOffsetMs / total) * 100}%`, width: `${Math.max((s.latencyMs / total) * 100, 1)}%` }} />
                        </div>
                      </td>
                      <td className="text-right font-mono">{s.latencyMs}</td>
                      <td className="text-right font-mono">{s.tokensIn}/{s.tokensOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Token counts are estimates (≈4 chars/token) unless reported by the AI gateway. Demo-engine latencies are deterministic simulations.</p>
          </Panel>
        ) : (
          <Panel><p className="text-muted-foreground">No traces yet.</p></Panel>
        )}
      </div>
    </div>
  );
}
