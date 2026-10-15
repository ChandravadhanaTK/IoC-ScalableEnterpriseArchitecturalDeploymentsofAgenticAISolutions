import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCopy, Pause, Play, Send, Siren, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EsiBadge } from "@/components/EsiBadge";
import { store, useClinic, type Encounter } from "@/lib/store";
import { CLINICAL_TERMS, type Soap } from "@/lib/triage-engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor-portal")({
  head: () => ({
    meta: [
      { title: "Clinician Review & SOAP Desk — CareRoute" },
      { name: "description", content: "Review AI-drafted SOAP notes and SBAR handoffs, sign off and push to the EHR." },
      { property: "og:title", content: "Clinician Review & SOAP Desk — CareRoute" },
      { property: "og:description", content: "Review AI-drafted SOAP notes and SBAR handoffs, sign off and push to the EHR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DoctorPortal,
});

function DoctorPortal() {
  const { encounters } = useClinic();
  const sorted = [...encounters].sort((a, b) => a.cls.esi - b.cls.esi);
  const [sel, setSel] = useState<string | null>(null);
  const current = sorted.find((e) => e.id === sel) ?? sorted[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Clinician Review & SOAP Desk</h1>
        <p className="text-sm text-muted-foreground">Human-in-the-loop sign-off for every AI-drafted note. Queue is sorted by acuity.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider queue · {sorted.length}</div>
          {sorted.map((e) => (
            <button key={e.id} onClick={() => setSel(e.id)} className={cn("w-full rounded-xl border bg-card p-3 text-left transition-colors", current?.id === e.id ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted")}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{e.patient}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{e.createdAt}</span>
              </div>
              <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{e.intake.complaint}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <EsiBadge esi={e.cls.esi} className="text-[10px]" />
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  e.status === "Approved" ? "bg-routine/15 text-routine" : e.status === "ED escalation" ? "bg-emergency/15 text-emergency" : "bg-muted text-muted-foreground")}>{e.status}</span>
              </div>
            </button>
          ))}
        </div>
        {current && <Detail key={current.id} e={current} />}
      </div>
    </div>
  );
}

function Detail({ e }: { e: Encounter }) {
  const [soap, setSoap] = useState<Soap>(e.soap);
  const dirty = JSON.stringify(soap) !== JSON.stringify(e.soap);
  const approved = e.status === "Approved";

  const approve = () => {
    store.updateEncounter(e.id, { soap, status: "Approved" });
    toast.success("Signed & pushed to EHR", { description: `DocumentReference + Composition created for ${e.mrn}` });
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div>
          <div className="text-lg font-bold">{e.patient}</div>
          <div className="font-mono text-xs text-muted-foreground">{e.mrn} · {e.age}y · {e.cls.specialty}</div>
        </div>
        <EsiBadge esi={e.cls.esi} />
        {e.appointment && <span className="text-sm text-muted-foreground">{e.appointment.doctor} · {e.appointment.date} {e.appointment.time} · {e.appointment.visitType}</span>}
        {e.status === "ED escalation" && <span className="flex items-center gap-1 text-sm font-semibold text-emergency"><Siren className="h-4 w-4" /> Redirected to ED</span>}
      </div>
      <Tabs defaultValue="soap" className="p-4">
        <TabsList>
          <TabsTrigger value="soap">SOAP note</TabsTrigger>
          <TabsTrigger value="sbar">SBAR handoff</TabsTrigger>
          <TabsTrigger value="audio">Audio summary</TabsTrigger>
          <TabsTrigger value="audit">Transcript audit</TabsTrigger>
        </TabsList>
        <TabsContent value="soap" className="space-y-3">
          {(Object.keys(soap) as (keyof Soap)[]).map((k) => (
            <div key={k}>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-primary">{k}</label>
              <Textarea value={soap[k]} disabled={approved} onChange={(ev) => setSoap({ ...soap, [k]: ev.target.value.slice(0, 2000) })} rows={3} />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button onClick={approve} disabled={approved}>{approved ? <><CheckCircle2 className="h-4 w-4" /> Signed</> : <><Send className="h-4 w-4" /> {dirty ? "Save edits, sign & push to EHR" : "Approve & push to EHR"}</>}</Button>
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(Object.entries(soap).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join("\n\n")); toast("SOAP note copied"); }}><ClipboardCopy className="h-4 w-4" /> Copy</Button>
          </div>
        </TabsContent>
        <TabsContent value="sbar">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(e.sbar) as [string, string][]).map(([k, v]) => (
              <div key={k} className="rounded-lg border bg-muted/40 p-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{k}</div>
                <p className="text-sm">{v}</p>
              </div>
            ))}
          </div>
          <Button className="mt-3" onClick={approve} disabled={approved}>{approved ? "Pushed to EHR" : "Approve & Push to EHR"}</Button>
        </TabsContent>
        <TabsContent value="audio"><Audio e={e} /></TabsContent>
        <TabsContent value="audit">
          <div className="max-h-[440px] space-y-2 overflow-y-auto">
            {e.transcript.map((m, i) => (
              <div key={i} className="grid grid-cols-[150px_1fr] gap-3 border-b pb-2 text-sm last:border-0">
                <span className="font-mono text-[11px] text-muted-foreground">{m.role === "patient" ? "PATIENT" : m.role === "system" ? "SYSTEM" : m.agent}</span>
                <span><Highlight text={m.text} /></span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Highlight({ text }: { text: string }) {
  const parts = text.split(CLINICAL_TERMS);
  return <>{parts.map((p, i) => (i % 2 === 1 && p ? <mark key={i} className="rounded bg-urgent/20 px-0.5 text-foreground">{p}</mark> : <span key={i}>{p}</span>))}</>;
}

function Audio({ e }: { e: Encounter }) {
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const text = Object.values(e.sbar).join(" ");
  useEffect(() => () => { clearInterval(timer.current); if (typeof window !== "undefined") window.speechSynthesis?.cancel(); }, []);
  const toggle = () => {
    if (playing) { window.speechSynthesis?.cancel(); clearInterval(timer.current); setPlaying(false); return; }
    setPct(0); setPlaying(true);
    if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; window.speechSynthesis.speak(u); }
    timer.current = setInterval(() => setPct((p) => { if (p >= 100) { clearInterval(timer.current); setPlaying(false); return 100; } return p + 1.5; }), 150);
  };
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Button size="icon" onClick={toggle}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Volume2 className="h-4 w-4" /> Doctor Summary Agent — 45s briefing</div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </div>
      <div className="mt-3 flex h-10 items-end gap-0.5">
        {Array.from({ length: 64 }).map((_, i) => (
          <span key={i} className={cn("w-full rounded-sm transition-colors", i / 64 * 100 < pct ? "bg-primary" : "bg-muted")} style={{ height: `${20 + ((i * 37) % 80)}%` }} />
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
