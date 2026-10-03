import { useMemo } from "react";
import { ReactFlow, Handle, Position, BaseEdge, getBezierPath, type Edge, type Node, type NodeProps, type EdgeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Anchor, Factory, Globe2, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
const REGIONS = ["East Asia", "Central Asia", "Southeast Asia", "Domestic"];
const PORT_ORDER = ["PRT-MER", "PRT-ATL", "PRT-ORI", "PRT-PAC", "PRT-DEL", "PRT-GTW"];

const MODE: Record<string, { dur: number; count: number; r: number }> = {
  AIR: { dur: 1.1, count: 3, r: 1.8 },
  RAIL: { dur: 3.2, count: 5, r: 2.2 },
  SEA: { dur: 6.5, count: 6, r: 2.8 },
  ROAD: { dur: 2.4, count: 4, r: 2 },
  MULTIMODAL: { dur: 4, count: 5, r: 2.4 },
};

type EdgeData = { mode: string; state: "flow" | "frozen" | "reroute" | "idle"; label?: string };

function ParticleEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps) {
  const d = data as EdgeData;
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const m = (MODE[d.mode] ?? MODE["SEA"])!;
  const color = d.state === "frozen" ? "var(--crit)" : d.state === "reroute" ? "var(--agent)" : "var(--primary)";
  const count = d.state === "reroute" ? m.count + 3 : m.count;
  return (
    <>
      <BaseEdge id={id} path={path} style={{ stroke: d.state === "frozen" ? "var(--crit)" : "var(--border)", strokeWidth: 1, strokeDasharray: d.state === "frozen" ? "3 4" : d.mode === "AIR" ? "2 3" : undefined, opacity: d.state === "frozen" ? 0.6 : 1 }} />
      {d.state === "reroute" && (
        <path d={path} pathLength={1} fill="none" stroke="var(--agent)" strokeWidth={2.2} className="draw-path" style={{ filter: "drop-shadow(0 0 4px var(--agent))" }} />
      )}
      {d.state !== "idle" &&
        Array.from({ length: count }).map((_, i) =>
          d.state === "frozen" ? (
            <circle key={i} r={m.r} fill={color} opacity={0.7}>
              <animateMotion dur={`${m.dur}s`} repeatCount="1" fill="freeze" keyPoints={`0;${((i + 0.5) / count) * 0.45}`} keyTimes="0;1" calcMode="linear" path={path} />
            </circle>
          ) : (
            <circle key={i} r={m.r} fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }}>
              <animateMotion dur={`${m.dur * (d.state === "reroute" ? 0.8 : 1)}s`} begin={`${(i * m.dur) / count + (d.state === "reroute" ? 1.4 : 0)}s`} repeatCount="indefinite" path={path} />
            </circle>
          ),
        )}
    </>
  );
}

function RegionNode({ data }: NodeProps) {
  const d = data as any;
  return (
    <div className={cn("hud-panel w-44 px-3 py-2", d.down && "border-crit/60")}>
      <div className="flex items-center gap-2 text-xs font-semibold"><Globe2 className="size-3.5 text-primary" />{d.label}</div>
      <div className="mt-1 font-mono text-[10px] leading-tight text-muted-foreground">{d.suppliers}</div>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-primary" />
    </div>
  );
}

function PortNode({ data }: NodeProps) {
  const d = data as any;
  const closed = d.status === "CLOSED";
  const air = d.id === "PRT-ORI" || d.id === "PRT-DEL";
  return (
    <div className="relative">
      {closed && (
        <>
          <span className="shockwave pointer-events-none absolute inset-0 rounded-full border-2 border-crit" />
          <span className="shockwave pointer-events-none absolute inset-0 rounded-full border border-crit [animation-delay:0.6s]" />
        </>
      )}
      <div className={cn("relative flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium", closed ? "ring-pulse border-crit text-crit" : d.hot ? "ring-pulse border-agent text-agent" : "border-border text-foreground")}>
        <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-muted-foreground" />
        {air ? <Plane className="size-3.5" /> : <Anchor className="size-3.5" />}
        {d.label}
        {closed && <span className="font-mono text-[9px] tracking-widest">CLOSED</span>}
        <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-muted-foreground" />
      </div>
    </div>
  );
}

function FactoryNode({ data }: NodeProps) {
  const d = data as any;
  return (
    <div className="hud-panel ring-pulse w-40 px-3 py-3 text-ok">
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-ok" />
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Factory className="size-4 text-ok" />Pune Plant</div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">{d.inbound} inbound POs</div>
    </div>
  );
}

const nodeTypes = { region: RegionNode, port: PortNode, factory: FactoryNode };
const edgeTypes = { particle: ParticleEdge };

export function NetworkGraph({ data, className }: { data?: { ports: any[]; routes: any[]; suppliers: any[]; pos: any[] } | undefined; className?: string }) {
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const rerouted = new Set(data.pos.filter((p) => p.current_route_id !== p.original_route_id && p.status !== "DELIVERED").map((p) => p.current_route_id));
    const usedRoutes = new Set(data.pos.filter((p) => p.status !== "DELIVERED").map((p) => p.current_route_id));
    const hotPorts = new Set(data.routes.filter((r) => rerouted.has(r.id)).map((r) => r.associated_port_id));
    const n: Node[] = REGIONS.map((r, i) => ({
      id: `reg-${r}`,
      type: "region",
      position: { x: 0, y: 30 + i * 105 },
      data: { label: r, suppliers: data.suppliers.filter((s) => s.region === r).map((s) => s.name.split(" ")[0]).join(" · "), down: data.suppliers.some((s) => s.region === r && s.status !== "ACTIVE") },
      draggable: false,
    }));
    PORT_ORDER.forEach((pid, i) => {
      const p = data.ports.find((x) => x.id === pid);
      if (p) n.push({ id: pid, type: "port", position: { x: 330, y: 10 + i * 72 }, data: { id: pid, label: p.name.replace("Port ", ""), status: p.status, hot: hotPorts.has(pid) }, draggable: false });
    });
    n.push({ id: "factory", type: "factory", position: { x: 620, y: 185 }, data: { inbound: data.pos.filter((p) => p.status !== "DELIVERED").length }, draggable: false });
    const e: Edge[] = [];
    for (const r of data.routes) {
      const state: EdgeData["state"] = !r.active ? "frozen" : rerouted.has(r.id) ? "reroute" : usedRoutes.has(r.id) ? "flow" : "idle";
      e.push({ id: `${r.id}-a`, source: `reg-${r.origin}`, target: r.associated_port_id, type: "particle", data: { mode: r.transport_mode, state } });
      e.push({ id: `${r.id}-b`, source: r.associated_port_id, target: "factory", type: "particle", data: { mode: r.transport_mode, state } });
    }
    return { nodes: n, edges: e };
  }, [data]);

  return (
    <div className={cn("relative h-[460px] w-full", className)}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.12 }} nodesConnectable={false} elementsSelectable={false} zoomOnScroll={false} panOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }} />
      <div className="pointer-events-none absolute bottom-2 left-3 flex gap-4 font-mono text-[10px] text-muted-foreground">
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-primary" />flow</span>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-agent" />reroute</span>
        <span><i className="mr-1 inline-block size-1.5 rounded-full bg-crit" />frozen</span>
        <span>sea · rail · air · road speeds</span>
      </div>
    </div>
  );
}
