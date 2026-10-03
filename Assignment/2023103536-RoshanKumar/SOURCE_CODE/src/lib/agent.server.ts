// Detour orchestrator agent: deterministic tools + single agent loop + backend validation.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;
export const APPROVAL_THRESHOLD = 5000;
const PLANT = "Pune Plant";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const dayToDate = (n: number) => {
  const d = today();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dateToDay = (s: string) => Math.round((new Date(s + "T00:00:00Z").getTime() - today().getTime()) / 86400000);
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

async function one<T = any>(q: any): Promise<T> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as T;
}

async function log(runId: string | null, poId: string | null, event_type: string, message: string, metadata: any = null, actor = "AGENT") {
  await db.from("audit_logs").insert({ agent_run_id: runId, po_id: poId, event_type, message, metadata, actor });
}

/* ------------------------------ TOOLS ------------------------------ */

export async function tool_exposed_orders(dis: any) {
  const pos: any[] = await one(db.from("purchase_orders").select("*, route:routes!purchase_orders_current_route_id_fkey(*)").neq("status", "DELIVERED").order("id"));
  const out: { po_id: string; exposure_reason: string }[] = [];
  for (const p of pos) {
    if (dis.target_type === "PORT" && p.route?.associated_port_id === dis.target_id)
      out.push({ po_id: p.id, exposure_reason: `Active route ${p.route.name} passes through the closed port` });
    if (dis.target_type === "ROUTE" && p.current_route_id === dis.target_id)
      out.push({ po_id: p.id, exposure_reason: `Assigned to suspended route ${p.route.name}` });
    if (dis.target_type === "SUPPLIER" && p.supplier_id === dis.target_id)
      out.push({ po_id: p.id, exposure_reason: `Sourced from shut-down supplier` });
  }
  return out;
}

export async function tool_stock_cover(po: any) {
  const inv: any = await one(db.from("inventory").select("*").eq("product_id", po.product_id).eq("location", PLANT).maybeSingle());
  const qty = inv?.quantity ?? 0;
  const dd = inv?.daily_demand || 1;
  const cover = Math.floor(qty / dd);
  return {
    current_inventory: qty,
    daily_demand: dd,
    stock_cover_days: cover,
    stockout_date: dayToDate(cover),
    risk_level: cover <= 3 ? "HIGH" : cover <= 7 ? "MEDIUM" : "LOW",
  };
}

export async function tool_alt_suppliers(product_id: string, quantity: number, exclude_supplier_id: string) {
  const rows: any[] = await one(db.from("supplier_products").select("*, supplier:suppliers(*)").eq("product_id", product_id).neq("supplier_id", exclude_supplier_id));
  return rows
    .filter((r) => r.supplier.status === "ACTIVE")
    .map((r) => ({
      supplier_id: r.supplier_id,
      name: r.supplier.name,
      region: r.supplier.region,
      lead_days: r.supplier.lead_days,
      available_quantity: r.available_quantity,
      unit_cost: Number(r.unit_cost),
      reliability_score: Number(r.supplier.reliability_score),
      sufficient: r.available_quantity >= quantity,
    }));
}

export async function tool_route_options(origin: string, required_day: number, dis: any) {
  const rows: any[] = await one(db.from("routes").select("*").eq("origin", origin).eq("destination", PLANT));
  return rows
    .filter((r) => r.active && !(dis.target_type === "PORT" && r.associated_port_id === dis.target_id) && !(dis.target_type === "ROUTE" && r.id === dis.target_id))
    .map((r) => ({
      route_id: r.id,
      name: r.name,
      transport_mode: r.transport_mode,
      transit_days: r.transit_days,
      cost: Number(r.cost),
      reliability: Number(r.reliability),
      expected_arrival: dayToDate(r.transit_days),
      meets_required: r.transit_days <= required_day,
      active: r.active,
    }));
}

export async function tool_verify_service_impact(poId: string) {
  const po: any = await one(db.from("purchase_orders").select("*").eq("id", poId).single());
  const sc = await tool_stock_cover(po);
  const a = dateToDay(po.expected_arrival);
  const r = dateToDay(po.required_date);
  const s = sc.stock_cover_days;
  const service_level_status = po.status === "ESCALATED" || a > s ? "STOCKOUT" : a > r ? "AT_RISK" : "SAFE";
  return {
    expected_arrival: po.expected_arrival,
    stockout_date: sc.stockout_date,
    required_date: po.required_date,
    service_level_status,
    stockout_risk: service_level_status === "SAFE" ? "LOW" : service_level_status === "AT_RISK" ? "MEDIUM" : "HIGH",
  };
}

/* --------------------------- VALIDATED ACTIONS --------------------------- */

async function validateRoute(routeId: string, dis: any) {
  const r: any = await one(db.from("routes").select("*").eq("id", routeId).maybeSingle());
  if (!r) throw new Error(`Route ${routeId} does not exist`);
  if (!r.active) throw new Error(`Route ${r.name} is inactive`);
  if (dis.target_type === "PORT" && r.associated_port_id === dis.target_id) throw new Error(`Route ${r.name} uses the disrupted port`);
  return r;
}

export async function tool_reroute_po(poId: string, routeId: string, dis: any, status = "REROUTED") {
  const po: any = await one(db.from("purchase_orders").select("*").eq("id", poId).maybeSingle());
  if (!po) throw new Error(`PO ${poId} does not exist`);
  const r = await validateRoute(routeId, dis);
  const expected_arrival = dayToDate(r.transit_days);
  await one(db.from("purchase_orders").update({ current_route_id: routeId, expected_arrival, status, disruption_status: "RESOLVED", updated_at: new Date().toISOString() }).eq("id", poId));
  return { expected_arrival };
}

export async function tool_substitute_supplier(poId: string, supplierId: string, routeId: string, dis: any) {
  const po: any = await one(db.from("purchase_orders").select("*").eq("id", poId).single());
  const sup: any = await one(db.from("suppliers").select("*").eq("id", supplierId).maybeSingle());
  if (!sup || sup.status !== "ACTIVE") throw new Error(`Supplier ${supplierId} is not active`);
  const sp: any = await one(db.from("supplier_products").select("*").eq("supplier_id", supplierId).eq("product_id", po.product_id).maybeSingle());
  if (!sp || sp.available_quantity < po.quantity) throw new Error(`${sup.name} lacks capacity (${sp?.available_quantity ?? 0} < ${po.quantity})`);
  const r = await validateRoute(routeId, dis);
  if (r.origin !== sup.region) throw new Error(`Route ${r.name} does not serve ${sup.region}`);
  const expected_arrival = dayToDate(sup.lead_days + r.transit_days);
  await one(db.from("purchase_orders").update({ supplier_id: supplierId, unit_cost: sp.unit_cost, current_route_id: routeId, expected_arrival, status: "SUBSTITUTED", disruption_status: "RESOLVED", updated_at: new Date().toISOString() }).eq("id", poId));
  return { expected_arrival };
}

/* ------------------------------ AGENT ------------------------------ */

type Candidate = {
  key: string;
  type: "NO_ACTION" | "REROUTE" | "EXPEDITE" | "SUBSTITUTE";
  label: string;
  route_id: string | null;
  supplier_id: string | null;
  additional_cost: number;
  arrival_day: number;
  expected_arrival: string;
  feasible: boolean;
  meets_required: boolean;
  reliability: number;
  stockout_risk: "LOW" | "MEDIUM" | "HIGH";
  note: string;
  status?: string;
};

async function evaluatePO(runId: string, dis: any, poId: string, excluded: string[], pace = 250) {
  const po: any = await one(db.from("purchase_orders").select("*, route:routes!purchase_orders_current_route_id_fkey(*), product:products(*), supplier:suppliers!purchase_orders_supplier_id_fkey(*)").eq("id", poId).single());
  const r = dateToDay(po.required_date);

  await log(runId, poId, "TOOL_CALL", `stock_cover(${poId}) — checking ${po.product.name} inventory`, { tool: "stock_cover" });
  const sc = await tool_stock_cover(po);
  const s = sc.stock_cover_days;
  await log(runId, poId, "TOOL_RESULT", `Stock covers ${s} days (${sc.current_inventory} units @ ${sc.daily_demand}/day) — risk ${sc.risk_level}`, { tool: "stock_cover", ...sc });
  await sleep(pace);

  const cands: Candidate[] = [];
  const mk = (c: Omit<Candidate, "feasible" | "meets_required" | "stockout_risk" | "expected_arrival"> & { blocked?: string | undefined }): Candidate => {
    const feasible = !c.blocked && c.arrival_day <= s && !excluded.includes(c.key);
    const meets = c.arrival_day <= r;
    return {
      ...c,
      expected_arrival: dayToDate(c.arrival_day),
      feasible,
      meets_required: meets,
      stockout_risk: c.arrival_day > s ? "HIGH" : meets ? "LOW" : "MEDIUM",
      note: c.blocked ?? (excluded.includes(c.key) ? "Rejected by planner" : c.arrival_day > s ? `Arrives day ${c.arrival_day}, after stockout on day ${s}` : c.note),
    };
  };

  // NO_ACTION: wait out the disruption
  const supplierDown = dis.target_type === "SUPPLIER" && po.supplier_id === dis.target_id;
  cands.push(mk({ key: "NO_ACTION", type: "NO_ACTION", label: `Hold on ${po.route.name}`, route_id: po.current_route_id, supplier_id: po.supplier_id, additional_cost: 0, arrival_day: po.eta_offset_days + dis.duration_days, reliability: Number(po.route.reliability), note: `Delayed ${dis.duration_days} days by disruption` }));

  await log(runId, poId, "TOOL_CALL", `route_options(${po.supplier.region} → ${PLANT}) — excluding disrupted infrastructure`, { tool: "route_options" });
  const routes = await tool_route_options(po.supplier.region, r, dis);
  await log(runId, poId, "TOOL_RESULT", routes.length ? `${routes.length} viable route(s): ${routes.map((x) => `${x.name} ${x.transit_days}d`).join(", ")}` : "No alternate routes from origin", { tool: "route_options", routes });
  await sleep(pace);
  for (const rt of routes) {
    if (rt.route_id === po.current_route_id) continue;
    const isAir = rt.transport_mode === "AIR";
    cands.push(mk({ key: `${isAir ? "EXPEDITE" : "REROUTE"}:${rt.route_id}`, type: isAir ? "EXPEDITE" : "REROUTE", label: rt.name, route_id: rt.route_id, supplier_id: po.supplier_id, additional_cost: rt.cost - Number(po.route.cost), arrival_day: rt.transit_days, reliability: rt.reliability, note: `${rt.transport_mode} ${rt.transit_days}d`, blocked: supplierDown ? "Supplier is shut down — route change cannot help" : undefined }));
  }

  await log(runId, poId, "TOOL_CALL", `alt_suppliers(${po.product.name}, qty ${po.quantity}, exclude ${po.supplier.name})`, { tool: "alt_suppliers" });
  const alts = await tool_alt_suppliers(po.product_id, po.quantity, po.supplier_id);
  await log(runId, poId, "TOOL_RESULT", alts.length ? alts.map((a) => `${a.name}: ${a.available_quantity} avail${a.sufficient ? "" : " (insufficient — excluded)"}`).join("; ") : "No alternate suppliers qualified for this product", { tool: "alt_suppliers", alts });
  await sleep(pace);
  for (const a of alts.filter((x) => x.sufficient)) {
    const aroutes = await tool_route_options(a.region, r, dis);
    for (const rt of aroutes) {
      cands.push(mk({ key: `SUBSTITUTE:${a.supplier_id}:${rt.route_id}`, type: "SUBSTITUTE", label: `${a.name} via ${rt.name}`, route_id: rt.route_id, supplier_id: a.supplier_id, additional_cost: (a.unit_cost - Number(po.unit_cost)) * po.quantity + (rt.cost - Number(po.route.cost)), arrival_day: a.lead_days + rt.transit_days, reliability: a.reliability_score, note: `${a.lead_days}d lead + ${rt.transit_days}d ${rt.transport_mode}` }));
    }
  }

  // Decision: P1 avoid stockout (feasible), P2 meet required date, P3 minimise cost, P4 reliability
  const feasible = cands.filter((c) => c.feasible).sort((a, b) => Number(b.meets_required) - Number(a.meets_required) || a.additional_cost - b.additional_cost || b.reliability - a.reliability);
  const chosen = feasible[0] ?? null;
  for (const c of cands) c.status = c === chosen ? "SELECTED" : excluded.includes(c.key) ? "REJECTED_BY_PLANNER" : c.feasible ? "FEASIBLE" : "INFEASIBLE";
  await log(runId, poId, "REASONING", `Evaluated ${cands.length} candidates — ${feasible.length} feasible`, { candidates: cands.map((c) => ({ key: c.key, cost: c.additional_cost, day: c.arrival_day, feasible: c.feasible })) });
  return { po, sc, cands, chosen };
}

function explain(po: any, sc: any, chosen: Candidate | null, cands: Candidate[]) {
  const s = sc.stock_cover_days;
  if (!chosen) {
    const best = [...cands].sort((a, b) => a.arrival_day - b.arrival_day)[0];
    return `No option avoids stockout: stock covers ${s} days but the fastest option (${best?.label}) arrives in ${best?.arrival_day} days. Escalated to planner.`;
  }
  const req = dateToDay(po.required_date);
  const others = cands.filter((c) => c !== chosen && c.feasible);
  const hold = cands.find((c) => c.type === "NO_ACTION")!;
  switch (chosen.type) {
    case "NO_ACTION":
      return `Inventory covers ${s} days and the delayed shipment still arrives on day ${chosen.arrival_day}, within the required date (day ${req}). No change needed.`;
    case "REROUTE":
      return `Holding arrives day ${hold.arrival_day}, after the required date (day ${req}). ${chosen.label} arrives day ${chosen.arrival_day} for only ${inr(chosen.additional_cost)} extra — the cheapest option that meets the deadline.`;
    case "EXPEDITE":
      return `Stock covers only ${s} days; surface routes arrive too late. ${chosen.label} arrives day ${chosen.arrival_day} at ${inr(chosen.additional_cost)} extra${others.length ? `, cheaper than ${others.length} other feasible option(s)` : ", the only option that avoids stockout"}.`;
    case "SUBSTITUTE":
      return `Stock covers only ${s} days and the original supplier cannot deliver in time. ${chosen.label} arrives day ${chosen.arrival_day} at ${chosen.additional_cost >= 0 ? inr(chosen.additional_cost) + " extra" : inr(-chosen.additional_cost) + " saved"}, cheaper than expedited transport.`;
  }
}

async function aiExplain(fallback: string, payload: any): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return fallback;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: "You are Detour, a supply-chain disruption agent. Rewrite the given decision explanation as ONE concise sentence (max 40 words) for a planner. Keep every number exactly. No preamble." },
          { role: "user", content: JSON.stringify({ draft: fallback, ...payload }) },
        ],
      }),
    });
    clearTimeout(t);
    if (!res.ok) return fallback;
    const j: any = await res.json();
    const txt = j?.choices?.[0]?.message?.content?.trim();
    return txt && txt.length < 400 ? txt : fallback;
  } catch {
    return fallback;
  }
}

async function decideAndAct(runId: string, dis: any, poId: string, excluded: string[], attempt: number) {
  const { po, sc, cands, chosen } = await evaluatePO(runId, dis, poId, excluded);
  const draft = explain(po, sc, chosen, cands);
  const reason = await aiExplain(draft, { po: poId, action: chosen?.type ?? "ESCALATE" });
  const action_type = chosen?.type ?? "ESCALATE";
  const needsApproval = action_type === "EXPEDITE" && chosen!.additional_cost > APPROVAL_THRESHOLD;
  const confidence = !chosen ? 0.97 : chosen.meets_required ? 0.9 + Math.min(0.08, chosen.reliability / 20) : 0.74;

  const action: any = await one(
    db.from("agent_actions").insert({
      agent_run_id: runId, po_id: poId, action_type, route_id: chosen?.route_id ?? null, supplier_id: chosen?.supplier_id ?? null, reason,
      confidence: Number(confidence.toFixed(2)), estimated_cost: chosen?.additional_cost ?? 0, expected_arrival: chosen?.expected_arrival ?? null,
      stockout_risk: chosen?.stockout_risk ?? "HIGH", requires_approval: needsApproval, approval_status: needsApproval ? "PENDING" : "NOT_REQUIRED",
      execution_status: "PENDING", candidates: cands, attempt,
    }).select().single(),
  );
  await log(runId, poId, "DECISION", `${poId} → ${action_type}${chosen ? ` (${chosen.label}, ${inr(chosen.additional_cost)})` : ""}`, { action_id: action.id, action_type, reason });

  if (needsApproval) {
    await one(db.from("purchase_orders").update({ status: "AT_RISK", disruption_status: "AWAITING_APPROVAL" }).eq("id", poId));
    await log(runId, poId, "APPROVAL_REQUIRED", `Expedite costs ${inr(chosen!.additional_cost)} — above ${inr(APPROVAL_THRESHOLD)} threshold. Waiting for planner.`, { action_id: action.id });
    return;
  }
  await execute(runId, dis, action, excluded, attempt);
}

async function execute(runId: string, dis: any, action: any, excluded: string[], attempt: number) {
  const poId = action.po_id;
  try {
    if (action.action_type === "REROUTE") await tool_reroute_po(poId, action.route_id, dis);
    else if (action.action_type === "EXPEDITE") await tool_reroute_po(poId, action.route_id, dis, "EXPEDITED");
    else if (action.action_type === "SUBSTITUTE") await tool_substitute_supplier(poId, action.supplier_id, action.route_id, dis);
    else if (action.action_type === "NO_ACTION") {
      const po: any = await one(db.from("purchase_orders").select("eta_offset_days,base_status").eq("id", poId).single());
      await one(db.from("purchase_orders").update({ expected_arrival: dayToDate(po.eta_offset_days + dis.duration_days), status: po.base_status, disruption_status: "MONITORED" }).eq("id", poId));
    } else if (action.action_type === "ESCALATE") {
      await one(db.from("purchase_orders").update({ status: "ESCALATED", disruption_status: "STOCKOUT_RISK" }).eq("id", poId));
    }
    if (action.action_type !== "ESCALATE" && action.action_type !== "NO_ACTION")
      await log(runId, poId, "ACTION_EXECUTED", `${action.action_type.toLowerCase()}_po(${poId}) validated & executed`, { action_id: action.id });
  } catch (e: any) {
    await one(db.from("agent_actions").update({ execution_status: "FAILED" }).eq("id", action.id));
    await log(runId, poId, "ACTION_FAILED", `Execution failed: ${e.message}. Recalculating alternatives.`, { action_id: action.id });
    if (attempt < 4) {
      const key = action.action_type === "SUBSTITUTE" ? `SUBSTITUTE:${action.supplier_id}:${action.route_id}` : `${action.action_type}:${action.route_id}`;
      return decideAndAct(runId, dis, poId, [...excluded, key], attempt + 1);
    }
    return;
  }
  const v = await tool_verify_service_impact(poId);
  await one(db.from("agent_actions").update({ execution_status: "EXECUTED", executed_at: new Date().toISOString(), verification: v, stockout_risk: v.stockout_risk }).eq("id", action.id));
  await log(runId, poId, action.action_type === "ESCALATE" ? "ESCALATED" : "VERIFIED",
    action.action_type === "ESCALATE" ? `${poId} escalated — STOCKOUT_RISK. Planner intervention required.` : `verify_service_impact(${poId}) → ${v.service_level_status}`, v);
}

/* ------------------------------ RUN LIFECYCLE ------------------------------ */

export async function startRun(disruptionId: string) {
  await one(db.rpc("reset_demo"));
  const dis: any = await one(db.from("disruptions").select("*").eq("id", disruptionId).single());
  if (dis.target_type === "PORT") {
    await one(db.from("ports").update({ status: "CLOSED" }).eq("id", dis.target_id));
    await one(db.from("routes").update({ active: false }).eq("associated_port_id", dis.target_id));
  } else if (dis.target_type === "ROUTE") await one(db.from("routes").update({ active: false }).eq("id", dis.target_id));
  else await one(db.from("suppliers").update({ status: "SHUTDOWN" }).eq("id", dis.target_id));
  await one(db.from("disruptions").update({ status: "ANALYZING" }).eq("id", disruptionId));

  const run: any = await one(db.from("agent_runs").insert({ disruption_id: disruptionId, status: "RUNNING" }).select().single());
  await log(run.id, null, "DISRUPTION_DETECTED", `${dis.title} — ${dis.severity}, ${dis.duration_days} days`, { disruption_id: disruptionId });
  await log(run.id, null, "TOOL_CALL", `exposed_orders(${disruptionId})`, { tool: "exposed_orders" });
  const exposed = await tool_exposed_orders(dis);
  for (const e of exposed) await one(db.from("purchase_orders").update({ status: "AT_RISK", disruption_status: "EXPOSED" }).eq("id", e.po_id));
  await one(db.from("agent_runs").update({ total_pos: exposed.length, queue: exposed.map((e) => e.po_id) }).eq("id", run.id));
  await log(run.id, null, "TOOL_RESULT", `${exposed.length} POs identified: ${exposed.map((e) => e.po_id).join(", ")}`, { tool: "exposed_orders", exposed });
  await one(db.from("disruptions").update({ status: "ACTIVE" }).eq("id", disruptionId));
  return { runId: run.id as string };
}

export async function stepRun(runId: string) {
  const run: any = await one(db.from("agent_runs").select("*, disruption:disruptions(*)").eq("id", runId).single());
  if (run.status !== "RUNNING") return { done: true };
  if (run.processed_pos >= run.total_pos) {
    await finalize(runId);
    return { done: true };
  }
  const poId = run.queue[run.processed_pos];
  // optimistic lock: claim this index
  const claimed: any[] = await one(db.from("agent_runs").update({ processed_pos: run.processed_pos + 1 }).eq("id", runId).eq("processed_pos", run.processed_pos).select());
  if (!claimed.length) return { done: false };
  await log(runId, poId, "PO_START", `Evaluating ${poId}`);
  await decideAndAct(runId, run.disruption, poId, [], 1);
  if (run.processed_pos + 1 >= run.total_pos) await finalize(runId);
  return { done: false };
}

async function finalize(runId: string) {
  const pending: any[] = await one(db.from("agent_actions").select("id").eq("agent_run_id", runId).eq("approval_status", "PENDING"));
  const run: any = await one(db.from("agent_runs").select("*").eq("id", runId).single());
  if (run.processed_pos < run.total_pos) return;
  if (pending.length) {
    if (run.status !== "WAITING_APPROVAL") {
      await one(db.from("agent_runs").update({ status: "WAITING_APPROVAL" }).eq("id", runId));
      await log(runId, null, "WAITING", `All POs evaluated — ${pending.length} decision(s) waiting for planner approval`);
    }
    return;
  }
  const actions: any[] = await one(db.from("agent_actions").select("*").eq("agent_run_id", runId).eq("execution_status", "EXECUTED"));
  const counts: Record<string, number> = { REROUTE: 0, EXPEDITE: 0, SUBSTITUTE: 0, NO_ACTION: 0, ESCALATE: 0 };
  let cost = 0, prevented = 0;
  for (const a of actions) {
    counts[a.action_type] = (counts[a.action_type] ?? 0) + 1;
    cost += Number(a.estimated_cost);
    const noAct = (a.candidates as Candidate[] | null)?.find((c) => c.type === "NO_ACTION");
    if (a.action_type !== "ESCALATE" && noAct && noAct.stockout_risk === "HIGH" && a.verification?.service_level_status === "SAFE") prevented++;
  }
  const { count: approvals } = await db.from("agent_actions").select("id", { count: "exact", head: true }).eq("agent_run_id", runId).in("approval_status", ["APPROVED", "REJECTED"]);
  const summary = { counts, total_cost: cost, stockouts_prevented: prevented, human_approvals: approvals ?? 0, exposed: run.total_pos };
  const status = counts["ESCALATE"] ? "ESCALATED" : "COMPLETED";
  await one(db.from("agent_runs").update({ status, completed_at: new Date().toISOString(), summary }).eq("id", runId));
  await log(runId, null, "RUN_COMPLETE", `Disruption response complete — ${actions.length} POs handled, ${inr(cost)} additional cost`, summary);
}

export async function decideApproval(actionId: string, approve: boolean) {
  const action: any = await one(db.from("agent_actions").select("*, run:agent_runs(*, disruption:disruptions(*))").eq("id", actionId).single());
  if (action.approval_status !== "PENDING") throw new Error("Action is not awaiting approval");
  const runId = action.agent_run_id;
  const dis = action.run.disruption;
  if (approve) {
    await one(db.from("agent_actions").update({ approval_status: "APPROVED" }).eq("id", actionId));
    await log(runId, action.po_id, "APPROVED", `Planner approved expedite for ${action.po_id}`, { action_id: actionId }, "PLANNER");
    await execute(runId, dis, action, [], action.attempt);
  } else {
    await one(db.from("agent_actions").update({ approval_status: "REJECTED", execution_status: "SKIPPED" }).eq("id", actionId));
    await log(runId, action.po_id, "REJECTED", `Planner rejected expedite for ${action.po_id} — agent searching remaining alternatives`, { action_id: actionId }, "PLANNER");
    const prior: any[] = await one(db.from("agent_actions").select("*").eq("agent_run_id", runId).eq("po_id", action.po_id).eq("approval_status", "REJECTED"));
    const excluded = prior.map((a) => (a.action_type === "SUBSTITUTE" ? `SUBSTITUTE:${a.supplier_id}:${a.route_id}` : `${a.action_type}:${a.route_id}`));
    await decideAndAct(runId, dis, action.po_id, excluded, action.attempt + 1);
  }
  await one(db.from("agent_runs").update({ status: "RUNNING" }).eq("id", runId).eq("status", "WAITING_APPROVAL"));
  await finalize(runId);
}

export async function resetDemo() {
  await one(db.rpc("reset_demo"));
}
