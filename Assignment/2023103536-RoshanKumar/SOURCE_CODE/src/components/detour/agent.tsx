import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleDot, Loader2, Radar, ShieldAlert, User, Wrench, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { respondApproval, simulateDisruption } from "@/lib/agent.functions";
import { clock, inr, shortDate, toneFor, toneText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./bits";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function SimulateButton({ disruptionId = "DIS-MER", label = "Simulate Port Closure", size = "default" }: { disruptionId?: string; label?: string; size?: "default" | "sm" | "lg" }) {
  const sim = useServerFn(simulateDisruption);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size={size}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await sim({ data: { disruptionId } });
          await qc.invalidateQueries();
          nav({ to: "/disruptions/$id", params: { id: disruptionId } });
        } catch (e: any) {
          toast.error(e?.message ?? "Could not start simulation");
        } finally {
          setBusy(false);
        }
      }}
      className="gap-2 bg-crit font-semibold text-destructive-foreground hover:bg-crit/85"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
      {label}
    </Button>
  );
}

const ICON: Record<string, any> = {
  TOOL_CALL: Wrench,
  TOOL_RESULT: Check,
  DECISION: CircleDot,
  APPROVAL_REQUIRED: ShieldAlert,
  APPROVED: User,
  REJECTED: User,
  ESCALATED: ShieldAlert,
  DISRUPTION_DETECTED: Radar,
  ACTION_FAILED: X,
};
const EVT_TONE: Record<string, string> = {
  DISRUPTION_DETECTED: "text-crit",
  DECISION: "text-agent",
  APPROVAL_REQUIRED: "text-warn",
  WAITING: "text-warn",
  ESCALATED: "text-crit",
  ACTION_FAILED: "text-crit",
  VERIFIED: "text-ok",
  ACTION_EXECUTED: "text-ok",
  RUN_COMPLETE: "text-ok",
  APPROVED: "text-ok",
  REJECTED: "text-crit",
};

export function ActivityStream({ logs, active, compact }: { logs: any[]; active?: boolean; compact?: boolean }) {
  return (
    <div className="relative">
      {active && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 font-mono text-[11px] text-agent">
          <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-agent opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-agent" /></span>
          Agent operating…
        </div>
      )}
      <ul className={cn("divide-y divide-border/50 overflow-y-auto", compact ? "max-h-[340px]" : "max-h-[620px]")}>
        <AnimatePresence initial={false}>
          {logs.map((l) => {
            const Icon = ICON[l.event_type] ?? Check;
            return (
              <motion.li key={l.id} layout initial={{ opacity: 0, x: -12, backgroundColor: "color-mix(in oklab, var(--agent) 14%, transparent)" }} animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 0.5 }} className="flex gap-3 px-4 py-2">
                <Icon className={cn("mt-0.5 size-3.5 shrink-0", EVT_TONE[l.event_type] ?? "text-muted-foreground")} />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] leading-snug", l.event_type === "DECISION" && "font-semibold", l.event_type.startsWith("TOOL") && "font-mono text-xs text-muted-foreground")}>{l.message}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                    {clock(l.created_at)} · {l.actor} · {l.event_type}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function ApprovalButtons({ action, onDone }: { action: any; onDone?: () => void }) {
  const respond = useServerFn(respondApproval);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<null | "a" | "r">(null);
  const go = async (approve: boolean) => {
    setBusy(approve ? "a" : "r");
    try {
      await respond({ data: { actionId: action.id, approve } });
      toast.success(approve ? `Expedite approved — ${action.po_id} executing` : `Rejected — agent found next alternative for ${action.po_id}`);
      await qc.invalidateQueries();
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex gap-2">
      <Button disabled={!!busy} onClick={() => go(true)} className="flex-1 gap-2 bg-ok text-primary-foreground hover:bg-ok/85">
        {busy === "a" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve
      </Button>
      <Button disabled={!!busy} variant="outline" onClick={() => go(false)} className="flex-1 gap-2 border-crit/40 text-crit hover:bg-crit/10 hover:text-crit">
        {busy === "r" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}Reject
      </Button>
    </div>
  );
}

export function ApprovalSpotlight({ pending }: { pending: any[] }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const a = pending.find((p) => p.id !== dismissed);
  return (
    <AnimatePresence>
      {a && (
        <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="glow-warn w-full max-w-lg rounded-xl bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="label-mono !text-warn">Human-in-the-loop · approval required</span>
              <button onClick={() => setDismissed(a.id)} className="text-muted-foreground hover:text-foreground" aria-label="Later"><X className="size-4" /></button>
            </div>
            <h3 className="mt-3 text-xl font-semibold">Expedite {a.po_id} — {a.po?.product?.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.reason}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border p-3">
              <div><div className="label-mono">Additional</div><div className="mt-1 font-mono text-lg text-warn">+{inr(a.estimated_cost)}</div></div>
              <div><div className="label-mono">Threshold</div><div className="mt-1 font-mono text-lg">{inr(5000)}</div></div>
              <div><div className="label-mono">Arrival</div><div className="mt-1 font-mono text-lg">{shortDate(a.expected_arrival)}</div></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Approve executes the reroute. Reject sends the agent to search the next viable alternative.</p>
            <div className="mt-5"><ApprovalButtons action={a} /></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TYPE_LABEL: Record<string, string> = { NO_ACTION: "No action", REROUTE: "Reroute", EXPEDITE: "Expedite", SUBSTITUTE: "Substitute" };

export function CandidateTable({ candidates }: { candidates: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="label-mono text-left">
            <th className="py-2 pr-3 font-normal">Option</th>
            <th className="py-2 pr-3 text-right font-normal">Cost</th>
            <th className="py-2 pr-3 font-normal">Arrival</th>
            <th className="py-2 pr-3 font-normal">Risk</th>
            <th className="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.key} className={cn("border-t border-border/60", c.status === "SELECTED" && "bg-agent/8")}>
              <td className="py-2 pr-3">
                <div className="font-medium">{TYPE_LABEL[c.type]}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                {!c.feasible && <div className="text-[11px] text-crit/80">{c.note}</div>}
              </td>
              <td className="py-2 pr-3 text-right font-mono">{c.additional_cost >= 0 ? "+" : ""}{inr(c.additional_cost)}</td>
              <td className="py-2 pr-3 font-mono text-xs">{shortDate(c.expected_arrival)}{c.meets_required ? "" : " ⚠"}</td>
              <td className={cn("py-2 pr-3 font-mono text-xs", toneText[toneFor(c.stockout_risk === "LOW" ? "SAFE" : c.stockout_risk)])}>{c.stockout_risk}</td>
              <td className="py-2"><StatusBadge status={c.status ?? (c.feasible ? "FEASIBLE" : "INFEASIBLE")} tone={c.status === "SELECTED" ? "agent" : c.status === "FEASIBLE" ? "idle" : "crit"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DecisionDrawer({ po, actions, onClose }: { po: any | null; actions: any[]; onClose: () => void }) {
  const mine = po ? actions.filter((a) => a.po_id === po.id) : [];
  const latest = mine[mine.length - 1];
  return (
    <Sheet open={!!po} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-xl">
        {po && (
          <>
            <SheetHeader>
              <div className="label-mono">Decision record</div>
              <SheetTitle className="font-mono text-2xl">{po.id}</SheetTitle>
              <div className="text-sm text-muted-foreground">{po.product?.name} · {po.quantity} units</div>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 text-sm">
                <div><div className="label-mono">Original</div><div className="mt-1">{po.original_supplier?.name}</div><div className="text-xs text-muted-foreground">{po.original_route?.name}</div></div>
                <div><div className="label-mono">Now</div><div className="mt-1">{po.supplier?.name}</div><div className="text-xs text-muted-foreground">{po.route?.name}</div></div>
                <div><div className="label-mono">Required</div><div className="mt-1 font-mono">{shortDate(po.required_date)}</div></div>
                <div><div className="label-mono">Expected</div><div className="mt-1 font-mono">{shortDate(po.expected_arrival)}</div></div>
              </div>
              {!latest && <div className="text-sm text-muted-foreground">Agent has not evaluated this PO yet.</div>}
              {mine.map((a) => (
                <div key={a.id} className={cn("rounded-lg border p-4", a.approval_status === "PENDING" ? "glow-warn border-warn" : "border-border")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="label-mono">Attempt {a.attempt}</span>
                    <StatusBadge status={a.action_type} />
                    {a.requires_approval && <StatusBadge status={a.approval_status} />}
                    <StatusBadge status={a.execution_status} />
                    <span className="ml-auto font-mono text-xs text-muted-foreground">conf {Number(a.confidence).toFixed(2)}</span>
                  </div>
                  <p className="mt-3 text-sm">{a.reason}</p>
                  {a.verification && <div className="mt-2 font-mono text-xs text-muted-foreground">verify → <span className={toneText[toneFor(a.verification.service_level_status)]}>{a.verification.service_level_status}</span> · stockout {shortDate(a.verification.stockout_date)}</div>}
                  <div className="mt-3"><CandidateTable candidates={a.candidates ?? []} /></div>
                  {a.approval_status === "PENDING" && <div className="mt-4"><ApprovalButtons action={a} /></div>}
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
