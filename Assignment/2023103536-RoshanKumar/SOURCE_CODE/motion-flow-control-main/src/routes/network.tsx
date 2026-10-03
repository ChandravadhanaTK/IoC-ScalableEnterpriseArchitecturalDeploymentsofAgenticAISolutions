import { createFileRoute } from "@tanstack/react-router";
import { useNetwork } from "@/lib/data";
import { PageHeader, Panel, StatusBadge, Stagger } from "@/components/detour/bits";
import { NetworkGraph } from "@/components/detour/NetworkGraph";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network Canvas — Detour" },
      { name: "description", content: "Interactive supplier → port → route → factory graph with live shipment flows and reroute vectors." },
      { property: "og:title", content: "Network Canvas — Detour" },
      { property: "og:description", content: "Live supply network graph with reroute vectors." },
    ],
  }),
  component: NetworkPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function NetworkPage() {
  const { data } = useNetwork();
  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Topology" title="Network Canvas" />
      <Panel title="Suppliers → Ports → Routes → Pune Plant">
        <NetworkGraph data={data} className="h-[620px]" />
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ports">
          <ul className="divide-y divide-border">
            {data?.ports.map((p: any, i: number) => (
              <Stagger key={p.id} i={i}>
                <li className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.location}</div></div>
                  <StatusBadge status={p.status} tone={p.status === "ACTIVE" ? "ok" : "crit"} />
                </li>
              </Stagger>
            ))}
          </ul>
        </Panel>
        <Panel title="Routes">
          <ul className="divide-y divide-border">
            {data?.routes.map((r: any, i: number) => (
              <Stagger key={r.id} i={i}>
                <li className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-12 font-mono text-xs text-muted-foreground">{r.id}</span>
                  <div className="flex-1"><div className="font-medium">{r.name}</div><div className="font-mono text-[11px] text-muted-foreground">{r.origin} · {r.transport_mode} · {r.transit_days}d · {inr(r.cost)}</div></div>
                  <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} tone={r.active ? "ok" : "crit"} />
                </li>
              </Stagger>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
