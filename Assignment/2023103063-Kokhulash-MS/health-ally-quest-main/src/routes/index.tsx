import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertOctagon, Bot, CalendarCheck, Check, FileText, Phone, RotateCcw, Send, Siren, User, BellRing, Stethoscope, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EsiBadge } from "@/components/EsiBadge";
import { BookingDialog } from "@/components/BookingDialog";
import { cn } from "@/lib/utils";
import {
  QUESTIONS, SCENARIOS, buildFollowUpSteps, classify, detectRedFlags, parsePain,
  type AgentName, type Classification, type Intake, type Msg, type Scenario,
} from "@/lib/triage-engine";
import { makeEncounter, store, uid, type Appointment } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Patient Triage & Booking — CareRoute" },
      { name: "description", content: "Conversational symptom triage with ESI acuity, red-flag lockout and appointment booking." },
      { property: "og:title", content: "Patient Triage & Booking — CareRoute" },
      { property: "og:description", content: "Conversational symptom triage with ESI acuity, red-flag lockout and appointment booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TriagePage,
});

type Phase = "intake" | "emergency" | "scheduling" | "confirmed";
type Conv = {
  messages: Msg[];
  step: number;
  intake: Intake;
  cls: Classification | null;
  phase: Phase;
  agent: AgentName;
  thinking: boolean;
  patient: { name: string; age: number };
  appointment?: Appointment;
};

const fresh = (patient = { name: "Guest Patient", age: 35 }): Conv => ({
  messages: [{ role: "agent", agent: "Symptom Triage Agent", text: QUESTIONS[0]! }],
  step: 0,
  intake: { complaint: "", onset: "", pain: null, history: "" },
  cls: null,
  phase: "intake",
  agent: "Symptom Triage Agent",
  thinking: false,
  patient,
});

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function advance(s: Conv, text: string): Conv {
  const intake = { ...s.intake };
  if (s.step === 0) intake.complaint = text;
  else if (s.step === 1) intake.onset = text;
  else if (s.step === 2) intake.pain = parsePain(text);
  else intake.history = text;

  const flags = detectRedFlags(text);
  if (flags.length) {
    const cls = classify({ ...intake, complaint: `${intake.complaint} ${text}` }, s.patient.age);
    return {
      ...s, intake, cls, phase: "emergency", agent: "Orchestrator", thinking: false,
      messages: [
        ...s.messages,
        { role: "agent", agent: "Symptom Triage Agent", tone: "emergency", text: `⚠ RED FLAG DETECTED: ${cls.redFlags.join(", ")}. Your symptoms may indicate a medical emergency. Call 911 now or go to the nearest Emergency Room. Do not drive yourself.` },
        { role: "system", text: "Guardrail G-01 fired · automated scheduling halted · on-call triage nurse paged · ED pre-notification sent." },
      ],
    };
  }
  if (s.step < 3) {
    const q = QUESTIONS[s.step + 1] ?? "";
    return { ...s, intake, step: s.step + 1, thinking: false, messages: [...s.messages, { role: "agent", agent: "Symptom Triage Agent", text: q }] };
  }
  const cls = classify(intake, s.patient.age);
  return {
    ...s, intake, cls, step: 4, thinking: false, phase: "scheduling", agent: "Scheduling Agent",
    messages: [
      ...s.messages,
      { role: "agent", agent: "Symptom Triage Agent", text: `Assessment complete: ESI ${cls.esi}. ${cls.rationale} This is not a diagnosis — a clinician will review your case.` },
      { role: "system", text: `Orchestrator handoff → Scheduling Agent · specialty match: ${cls.specialty}` },
      { role: "agent", agent: "Scheduling Agent", text: `I've found ${cls.specialty} availability for: ${cls.disposition.toLowerCase()}. Please pick a slot.` },
    ],
  };
}

const STAGES = ["Intake", "Triage Assessment", "Specialty Match", "Slot Selection", "Confirmation"];
const AGENTS: { name: AgentName; icon: typeof Bot; color: string }[] = [
  { name: "Symptom Triage Agent", icon: Stethoscope, color: "bg-agent-1" },
  { name: "Scheduling Agent", icon: CalendarCheck, color: "bg-agent-2" },
  { name: "Doctor Summary Agent", icon: FileText, color: "bg-agent-3" },
  { name: "Follow-Up Reminder Agent", icon: BellRing, color: "bg-agent-4" },
];

function TriagePage() {
  const [s, setS] = useState<Conv>(() => fresh());
  const ref = useRef(s);
  const runId = useRef(0);
  const [input, setInput] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const commit = (n: Conv) => { ref.current = n; setS(n); };

  useEffect(() => { scroller.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [s.messages.length, s.thinking]);

  async function send(text: string) {
    const t = text.trim().slice(0, 600);
    if (!t || ref.current.thinking || ref.current.phase !== "intake") return;
    const my = runId.current;
    commit({ ...ref.current, thinking: true, messages: [...ref.current.messages, { role: "patient", text: t, flags: detectRedFlags(t) }] });
    await wait(900);
    if (my !== runId.current) return;
    const n = advance(ref.current, t);
    commit(n);
    if (n.phase === "emergency" && n.cls) {
      store.addEncounter(makeEncounter(n.patient.name, n.patient.age, n.intake, n.cls, n.messages));
      toast.error("Emergency escalation dispatched", { description: "Scheduling halted. On-call nurse paged." });
    }
    if (n.phase === "scheduling") { await wait(500); if (my === runId.current) setBookingOpen(true); }
  }

  async function runScenario(sc: Scenario) {
    runId.current++;
    const my = runId.current;
    setBookingOpen(false);
    commit(fresh(sc.patient));
    for (const a of sc.answers) {
      await wait(700);
      if (my !== runId.current || ref.current.phase !== "intake") return;
      await send(a);
    }
  }

  function reset() { runId.current++; setBookingOpen(false); commit(fresh()); }

  async function confirm(a: Appointment) {
    const c = ref.current;
    if (!c.cls) return;
    setBookingOpen(false);
    const enc = makeEncounter(c.patient.name, c.patient.age, c.intake, c.cls, c.messages, a);
    commit({ ...c, appointment: a, phase: "confirmed", agent: "Doctor Summary Agent", messages: [...c.messages, { role: "agent", agent: "Scheduling Agent", text: `Confirmed: ${a.visitType} with ${a.doctor}, ${a.date} at ${a.time}. FHIR ${a.fhirId} status=booked.` }] });
    await wait(800);
    commit({ ...ref.current, messages: [...ref.current.messages, { role: "agent", agent: "Doctor Summary Agent", text: `SOAP note and SBAR briefing drafted and queued for ${a.doctor}'s sign-off.` }] });
    store.addEncounter(enc);
    await wait(800);
    store.addFollowUp({ id: uid("FU"), encounterId: enc.id, patient: c.patient.name, cls: c.cls, escalated: false, steps: buildFollowUpSteps(c.cls) });
    commit({ ...ref.current, agent: "Follow-Up Reminder Agent", messages: [...ref.current.messages, { role: "agent", agent: "Follow-Up Reminder Agent", text: "Check-ins scheduled at +24h (SMS), +48h (portal) and +7d (email). Reply WORSE at any time to re-triage." }] });
    toast.success("Appointment booked", { description: `${a.doctor} · ${a.date} ${a.time}` });
  }

  const stageIdx = s.phase === "intake" ? 0 : s.phase === "emergency" ? 1 : s.phase === "scheduling" ? 3 : 5;
  const flagsSeen = Array.from(new Set(s.messages.flatMap((m) => m.flags ?? [])));
  const risk = s.cls?.risk ?? Math.min(10 + s.step * 6 + (s.intake.pain ?? 0) * 3, 60);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Patient Triage & Booking</h1>
          <p className="text-sm text-muted-foreground">Run a clinical scenario or describe symptoms yourself.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" /> New intake</Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {SCENARIOS.map((sc) => (
          <button key={sc.id} onClick={() => runScenario(sc)} className="group rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{sc.title}</span>
              <EsiBadge esi={sc.expected} className="text-[10px]" />
            </div>
            <div className="text-xs text-muted-foreground">{sc.subtitle} · {sc.patient.name}, {sc.patient.age}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex h-[620px] flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm">
            <User className="h-4 w-4 text-muted-foreground" /> <span className="font-semibold">{s.patient.name}</span>
            <span className="text-muted-foreground">· {s.patient.age}y</span>
            <span className="ml-auto text-xs text-muted-foreground">No medication advice · No diagnosis</span>
          </div>
          {s.phase === "emergency" && (
            <div className="flex flex-wrap items-center gap-3 bg-emergency px-4 py-3 text-emergency-foreground">
              <Siren className="h-6 w-6 animate-pulse" />
              <div className="flex-1">
                <div className="font-bold">EMERGENCY — Call 911 or go to the nearest ER</div>
                <div className="text-xs opacity-90">Automated scheduling is locked for this encounter.</div>
              </div>
              <a href="tel:911" className="flex items-center gap-1.5 rounded-md bg-emergency-foreground px-3 py-1.5 text-sm font-bold text-emergency"><Phone className="h-4 w-4" /> Dial 911</a>
            </div>
          )}
          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
            {s.messages.map((m, i) => <Bubble key={i} m={m} />)}
            {s.thinking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" /> <span className="flex gap-1">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d * 120}ms` }} />)}</span> Triage agent is evaluating…
              </div>
            )}
            {s.phase === "scheduling" && !bookingOpen && (
              <Button onClick={() => setBookingOpen(true)}><CalendarCheck className="h-4 w-4" /> Open slot picker</Button>
            )}
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); const v = input; setInput(""); send(v); }}>
            <Input value={input} onChange={(e) => setInput(e.target.value)} maxLength={600} disabled={s.phase !== "intake" || s.thinking} placeholder={s.phase === "intake" ? "Type your answer…" : "Intake closed — start a new intake"} />
            <Button type="submit" disabled={s.phase !== "intake" || s.thinking || !input.trim()}><Send className="h-4 w-4" /></Button>
          </form>
        </div>

        <aside className="space-y-4">
          <Panel title="Orchestration state" icon={Workflow}>
            <ol className="space-y-2">
              {STAGES.map((st, i) => {
                const halted = s.phase === "emergency" && i >= 1;
                const done = i < stageIdx && !halted;
                const active = i === stageIdx || (s.phase === "intake" && i === 0);
                return (
                  <li key={st} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold transition-all",
                      done && "border-routine bg-routine text-primary-foreground",
                      active && !halted && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                      halted && i === 1 && "border-emergency bg-emergency text-emergency-foreground",
                    )}>{done ? <Check className="h-3.5 w-3.5" /> : halted && i === 1 ? "!" : i + 1}</span>
                    <span className={cn(halted && i > 1 && "text-muted-foreground line-through", active && "font-semibold")}>{st}</span>
                    {halted && i === 1 && <span className="ml-auto text-xs font-semibold text-emergency">HALTED</span>}
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title="Active agent" icon={Bot}>
            <div className="space-y-1.5">
              {AGENTS.map(({ name, icon: Icon, color }) => {
                const on = s.agent === name;
                return (
                  <div key={name} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all", on ? "bg-primary/10 font-semibold" : "text-muted-foreground")}>
                    <span className={cn("grid h-6 w-6 place-items-center rounded text-primary-foreground", color, !on && "opacity-40")}><Icon className="h-3.5 w-3.5" /></span>
                    {name}
                    {on && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Clinical signals" icon={AlertOctagon}>
            <div className="space-y-3 text-sm">
              <div>
                <div className="mb-1 flex justify-between"><span>Risk score</span><span className="font-mono font-semibold">{risk}/100</span></div>
                <Progress value={risk} className="h-2" />
              </div>
              <div className="flex justify-between"><span>Acuity</span>{s.cls ? <EsiBadge esi={s.cls.esi} /> : <span className="text-muted-foreground">Pending</span>}</div>
              <div className="flex justify-between"><span>Confidence</span><span className="font-mono">{s.cls ? `${Math.round(s.cls.confidence * 100)}%` : "—"}</span></div>
              <div className="flex justify-between"><span>Specialty</span><span>{s.cls?.specialty ?? "—"}</span></div>
              <div>
                <div className="mb-1">Red flags</div>
                {(s.cls?.redFlags.length ? s.cls.redFlags : flagsSeen).length ? (
                  <div className="flex flex-wrap gap-1">{(s.cls?.redFlags.length ? s.cls.redFlags : flagsSeen).map((f) => <span key={f} className="rounded border border-emergency/30 bg-emergency/10 px-1.5 py-0.5 text-xs text-emergency">{f}</span>)}</div>
                ) : <span className="text-xs text-muted-foreground">None detected</span>}
              </div>
              <dl className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 border-t pt-2 text-xs">
                <dt className="text-muted-foreground">Complaint</dt><dd className="truncate">{s.intake.complaint || "—"}</dd>
                <dt className="text-muted-foreground">Onset</dt><dd className="truncate">{s.intake.onset || "—"}</dd>
                <dt className="text-muted-foreground">Pain</dt><dd>{s.intake.pain ?? "—"}</dd>
                <dt className="text-muted-foreground">History</dt><dd className="truncate">{s.intake.history || "—"}</dd>
              </dl>
            </div>
          </Panel>

          {s.appointment && (
            <div className="rounded-xl border border-routine/40 bg-routine/10 p-4 text-sm">
              <div className="mb-1 flex items-center gap-2 font-semibold text-routine"><Check className="h-4 w-4" /> Booked</div>
              {s.appointment.doctor} · {s.appointment.date} {s.appointment.time} · {s.appointment.visitType}
            </div>
          )}
        </aside>
      </div>

      {s.cls && s.phase === "scheduling" && (
        <BookingDialog key={s.cls.specialty + s.patient.name} open={bookingOpen} onOpenChange={setBookingOpen} cls={s.cls} onConfirm={confirm} />
      )}
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4" /> {title}</h3>
      {children}
    </section>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "system")
    return <div className="mx-auto max-w-[90%] animate-in fade-in rounded-md border border-dashed bg-muted px-3 py-1.5 text-center font-mono text-[11px] text-muted-foreground">{m.text}</div>;
  const patient = m.role === "patient";
  return (
    <div className={cn("flex animate-in fade-in slide-in-from-bottom-2 duration-300", patient && "justify-end")}>
      <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
        patient ? "rounded-br-sm bg-primary text-primary-foreground" : m.tone === "emergency" ? "rounded-bl-sm border-2 border-emergency bg-emergency/10 font-semibold text-emergency" : "rounded-bl-sm bg-muted")}>
        {!patient && <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-60">{m.agent}</div>}
        {m.text}
      </div>
    </div>
  );
}
