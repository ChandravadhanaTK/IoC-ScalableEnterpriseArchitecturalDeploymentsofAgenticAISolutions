import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen,
  BrainCircuit, CalendarDays, Check, CheckCircle2, ChevronDown, Clipboard,
  Clock3, Copy, GraduationCap, HeartHandshake, History, ListChecks, Mail,
  MessageCircle, MessagesSquare, RotateCw, Send, ShieldAlert, Sparkles,
  UsersRound, WandSparkles, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeCrisis, buildCommunication, sampleScenario,
  type CrisisAnalysis, type CrisisCategory, type MessageKind, type MessageTone,
} from "@/lib/crisis-analysis";

type View = "dashboard" | "how-it-works" | "history";
type SavedCrisis = {
  id: string;
  situation: string;
  deadline: string;
  category: CrisisCategory;
  savedAt: string;
  analysis: CrisisAnalysis;
};

const historyStorageKey = "campus-crisis-manager-history-v1";
const kinds: MessageKind[] = ["Professor email", "Teammate message", "Extension request", "Meeting request"];
const workflow = [
  { title: "Situation Analyzer", detail: "Pulls out the deadlines, dependencies, and missing details.", icon: BrainCircuit },
  { title: "Strategy Agent", detail: "Weighs workable options and identifies what matters most.", icon: Activity },
  { title: "Recovery Planner", detail: "Turns your next steps into a clear, prioritized sequence.", icon: ListChecks },
  { title: "Communication Agent", detail: "Prepares a specific note for the person who can help.", icon: MessagesSquare },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Crisis Manager — Find your next step" },
      { name: "description", content: "A clear, practical recovery plan for academic and campus emergencies." },
      { property: "og:title", content: "Campus Crisis Manager — Find your next step" },
      { property: "og:description", content: "Turn a campus crisis into a practical recovery plan, one clear step at a time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampusCrisisManager,
});

function CampusCrisisManager() {
  const [view, setView] = useState<View>("dashboard");
  const [situation, setSituation] = useState(sampleScenario);
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState<CrisisCategory>("Auto-detect");
  const [analysis, setAnalysis] = useState<CrisisAnalysis>(() => analyzeCrisis(sampleScenario, "", "Auto-detect"));
  const [history, setHistory] = useState<SavedCrisis[]>([]);
  const [activeKind, setActiveKind] = useState<MessageKind>("Professor email");
  const [tone, setTone] = useState<MessageTone>("warm");
  const [variation, setVariation] = useState(0);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(historyStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedCrisis[];
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const persistHistory = (next: SavedCrisis[]) => {
    setHistory(next);
    try {
      window.localStorage.setItem(historyStorageKey, JSON.stringify(next));
    } catch {
      setNotice("This browser could not save your history.");
    }
  };

  const runAnalysis = () => {
    if (!situation.trim()) {
      setNotice("Describe what’s going wrong to get a plan.");
      return;
    }
    setRunning(true);
    setNotice("");
    window.setTimeout(() => {
      const result = analyzeCrisis(situation, deadline, category);
      setAnalysis(result);
      const entry: SavedCrisis = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        situation: situation.trim(),
        deadline,
        category,
        savedAt: new Date().toISOString(),
        analysis: result,
      };
      persistHistory([entry, ...history.filter((item) => item.situation !== entry.situation)].slice(0, 12));
      setRunning(false);
      setNotice("Your recovery plan is ready.");
      document.getElementById("recovery-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 320);
  };

  const selectHistory = (item: SavedCrisis) => {
    setSituation(item.situation);
    setDeadline(item.deadline);
    setCategory(item.category);
    setAnalysis(item.analysis);
    setView("dashboard");
    setNotice("Saved situation restored.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const message = buildCommunication(activeKind, situation, tone, variation);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Clipboard access is unavailable in this browser.");
    }
  };

  const switchTone = (nextTone: MessageTone) => {
    setTone(nextTone);
    setVariation((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/80">
        <div className="page-wrap flex min-h-[76px] items-center justify-between gap-5">
          <button type="button" onClick={() => setView("dashboard")} className="flex items-center gap-3 text-left" aria-label="Campus Crisis Manager dashboard">
            <span className="flex size-10 items-center justify-center rounded-[11px] bg-primary text-primary-foreground"><Activity className="size-5" strokeWidth={2.5} /></span>
            <span>
              <span className="font-heading block text-sm font-extrabold leading-tight tracking-normal">Campus Crisis</span>
              <span className="block text-xs font-medium text-muted-foreground">MANAGER</span>
            </span>
          </button>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-md border border-border bg-background p-1 sm:flex">
            <NavButton label="Dashboard" selected={view === "dashboard"} icon={<Activity />} onClick={() => setView("dashboard")} />
            <NavButton label="How it works" selected={view === "how-it-works"} icon={<BookOpen />} onClick={() => setView("how-it-works")} />
            <NavButton label="History" selected={view === "history"} icon={<History />} onClick={() => setView("history")} />
          </nav>
          <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" onClick={() => { setView("dashboard"); document.getElementById("crisis-form")?.scrollIntoView({ behavior: "smooth" }); }}>
            <WandSparkles className="size-4" />
            <span className="hidden sm:inline">New analysis</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
        <nav aria-label="Mobile navigation" className="page-wrap flex gap-1 pb-3 sm:hidden">
          <NavButton label="Dashboard" selected={view === "dashboard"} icon={<Activity />} onClick={() => setView("dashboard")} />
          <NavButton label="How it works" selected={view === "how-it-works"} icon={<BookOpen />} onClick={() => setView("how-it-works")} />
          <NavButton label="History" selected={view === "history"} icon={<History />} onClick={() => setView("history")} />
        </nav>
      </header>

      {notice && (
        <div role="status" className="fixed right-5 top-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-2 border border-border bg-card px-4 py-3 text-sm shadow-lg enter-up">
          <CheckCircle2 className="size-4 shrink-0 text-positive" />
          <span>{notice}</span>
          <Button aria-label="Dismiss notice" variant="ghost" size="icon" className="-mr-2 ml-1 size-7" onClick={() => setNotice("")}><X className="size-4" /></Button>
        </div>
      )}

      {view === "dashboard" && (
        <DashboardView
          situation={situation}
          setSituation={setSituation}
          deadline={deadline}
          setDeadline={setDeadline}
          category={category}
          setCategory={setCategory}
          analysis={analysis}
          onSubmit={runAnalysis}
          running={running}
          activeKind={activeKind}
          setActiveKind={setActiveKind}
          tone={tone}
          switchTone={switchTone}
          message={message}
          copyMessage={copyMessage}
          copied={copied}
          regenerate={() => setVariation((current) => current + 1)}
          historyCount={history.length}
          openHistory={() => setView("history")}
        />
      )}
      {view === "how-it-works" && <HowItWorks setView={setView} />}
      {view === "history" && <HistoryView history={history} onSelect={selectHistory} onClear={() => persistHistory([])} />}

      <footer className="page-wrap mt-16 flex flex-col gap-3 border-t border-border pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Campus Crisis Manager <span aria-hidden="true">·</span> One clear next step at a time.</span>
        <span>Plans are a starting point. When you feel unsafe or overwhelmed, reach out to someone you trust.</span>
      </footer>
    </main>
  );
}

function NavButton({ label, selected, icon, onClick }: { label: string; selected: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Button type="button" variant={selected ? "secondary" : "ghost"} onClick={onClick} aria-current={selected ? "page" : undefined} className="h-9 gap-2 px-2.5 text-xs sm:px-3 sm:text-sm">
      <span className="[&_svg]:size-4">{icon}</span>{label}
    </Button>
  );
}

type DashboardProps = {
  situation: string;
  setSituation: (value: string) => void;
  deadline: string;
  setDeadline: (value: string) => void;
  category: CrisisCategory;
  setCategory: (value: CrisisCategory) => void;
  analysis: CrisisAnalysis;
  onSubmit: () => void;
  running: boolean;
  activeKind: MessageKind;
  setActiveKind: (value: MessageKind) => void;
  tone: MessageTone;
  switchTone: (value: MessageTone) => void;
  message: string;
  copyMessage: () => void;
  copied: boolean;
  regenerate: () => void;
  historyCount: number;
  openHistory: () => void;
};

function DashboardView(props: DashboardProps) {
  const severityClass = `severity-${props.analysis.severity.toLowerCase()}`;
  return (
    <div className="page-wrap enter-up">
      <section className="grid gap-8 py-9 lg:grid-cols-[minmax(0,1.45fr)_minmax(315px,.75fr)] lg:items-end lg:gap-12 lg:py-12">
        <div>
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase text-primary"><span className="size-2 rounded-full bg-positive" /> Your campus support desk</div>
          <h1 className="font-heading max-w-3xl text-[clamp(2rem,4.2vw,3.75rem)] font-extrabold leading-[1.08] text-foreground">Something went wrong?<br /><span className="text-primary">Let’s figure out what to do next.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Get a clear read on what’s at risk, which move matters most, and what to say to the people involved.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2"><BrainCircuit className="size-4 text-ocean" /> Four specialist perspectives</span>
            <span className="inline-flex items-center gap-2"><ListChecks className="size-4 text-positive" /> Prioritized recovery steps</span>
            <span className="inline-flex items-center gap-2"><HeartHandshake className="size-4 text-caution" /> Ready-to-send support</span>
          </div>
        </div>
        <div className="relative hidden overflow-hidden rounded-[6px] border border-border lg:block">
          <img src={campusStudyImage} alt="A student planning her coursework in a sunny campus library" width={1152} height={768} className="h-[218px] w-full object-cover object-center" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/85 px-4 py-3 text-primary-foreground">
            <span className="text-sm font-semibold">A steady plan starts with one clear next step.</span>
            <GraduationCap className="size-5 shrink-0" />
          </div>
        </div>
      </section>

      <section id="crisis-form" className="panel scroll-mt-5 p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-primary">Start here</div>
            <h2 className="font-heading mt-1 text-xl font-bold sm:text-2xl">What’s going wrong?</h2>
          </div>
          <span className="text-xs text-muted-foreground">Your situation stays in this browser.</span>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); props.onSubmit(); }}>
          <label htmlFor="situation" className="sr-only">Describe what’s going wrong</label>
          <Textarea id="situation" value={props.situation} onChange={(event) => props.setSituation(event.target.value)} placeholder="My project demo is tomorrow, one teammate isn’t responding, my code isn’t working, and I have an exam tomorrow." className="min-h-[124px] resize-y border-border bg-background px-4 py-3 text-sm leading-6 shadow-none placeholder:text-muted-foreground/75 focus-visible:ring-primary/30" />
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-xs font-semibold text-muted-foreground">Deadline <span className="font-normal">(optional)</span>
              <span className="relative mt-2 block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Deadline" type="datetime-local" value={props.deadline} onChange={(event) => props.setDeadline(event.target.value)} className="h-10 w-full min-w-0 border border-input bg-background pl-9 pr-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></span>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">Crisis category
              <span className="relative mt-2 block"><select aria-label="Crisis category" value={props.category} onChange={(event) => props.setCategory(event.target.value as CrisisCategory)} className="h-10 w-full appearance-none border border-input bg-background px-3 pr-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><option>Auto-detect</option><option>Deadlines</option><option>Exams</option><option>Team project</option><option>Attendance</option><option>Other</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></span>
            </label>
            <Button type="button" onClick={props.onSubmit} disabled={props.running} className="h-10 gap-2 px-5 sm:min-w-[202px]">
              {props.running ? <RotateCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {props.running ? "Building your plan…" : "Run crisis analysis"}
              {!props.running && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </form>
      </section>

      <section aria-label="Crisis overview" className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="panel flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="text-xs font-bold uppercase text-muted-foreground">Current assessment</div>
            <div className="mt-2 flex flex-wrap items-center gap-3"><h2 className="font-heading text-2xl font-extrabold">{props.analysis.severity} priority</h2><span className={`rounded-sm px-2.5 py-1 text-xs font-bold ${severityClass}`}>{props.analysis.category}</span></div>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{props.analysis.urgency}</p>
          </div>
          <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${severityClass}`}><ShieldAlert className="size-6" /></span>
        </div>
        <OverviewMetric icon={<Clock3 />} label="Time pressure" value={props.deadline ? new Date(props.deadline).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : props.analysis.urgency.includes("near-term") || props.analysis.urgency.includes("little room") ? "Near-term" : "Check exact due times"} detail="Confirm the hard cut-off" tone="ocean" />
        <OverviewMetric icon={<Clipboard />} label="Detected pressure points" value={`${props.analysis.detectedProblems.length} identified`} detail={props.analysis.missingInformation.length ? `${props.analysis.missingInformation.length} details to confirm` : "Plan set around the next step"} tone="positive" />
      </section>

      <section className="mt-12" aria-labelledby="agents-heading">
        <SectionHeading eyebrow="Different perspectives. One grounded plan." title="The support team" detail="Four focused passes turn a tangled situation into practical next steps." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {props.analysis.agents.map((agent, index) => <AgentCard key={agent.name} agent={agent} index={index} />)}
        </div>
      </section>

      <section id="recovery-plan" className="mt-12 scroll-mt-6" aria-labelledby="plan-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Small moves. Real momentum." title="Your recovery plan" detail="Start at the top; adjust the order if an exact deadline changes." />
          <span className="inline-flex items-center gap-2 pb-1 text-xs font-medium text-muted-foreground"><CheckCircle2 className="size-4 text-positive" /> {props.analysis.plan.length} next steps</span>
        </div>
        <div className="panel divide-y divide-border">
          {props.analysis.plan.map((step, index) => <PlanRow key={`${step.window}-${index}`} step={step} index={index} />)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoList title="What’s putting pressure on you" items={props.analysis.detectedProblems} icon={<ShieldAlert />} tone="caution" />
          <InfoList title="Details worth confirming" items={props.analysis.missingInformation} icon={<CheckCircle2 />} tone="ocean" />
        </div>
      </section>

      <section className="mt-12" aria-labelledby="communication-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="A hard conversation, made easier." title="Communication center" detail="Choose who to contact and get a starting draft you can make your own." />
          <span className="pb-1 text-xs text-muted-foreground">Personalize bracketed details before sending.</span>
        </div>
        <div className="panel p-4 sm:p-6">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Message type">
            {kinds.map((kind) => <Button key={kind} type="button" role="tab" aria-selected={props.activeKind === kind} variant={props.activeKind === kind ? "default" : "outline"} className="h-9 px-3 text-xs sm:text-sm" onClick={() => { props.setActiveKind(kind); props.regenerate(); }}>{kind}</Button>)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
            <pre className="max-h-[330px] min-h-[188px] overflow-auto whitespace-pre-wrap break-words border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground">{props.message}</pre>
            <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:items-stretch">
              <Button type="button" className="gap-2" onClick={props.copyMessage}>{props.copied ? <Check className="size-4" /> : <Copy className="size-4" />}{props.copied ? "Copied" : "Copy message"}</Button>
              <Button type="button" variant="outline" className="gap-2" onClick={props.regenerate}><RotateCw className="size-4" />Regenerate</Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => props.switchTone("formal")}><Mail className="size-4" />Make more formal</Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => props.switchTone("concise")}><ArrowDown className="size-4" />Make concise</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-4 border border-ocean/20 bg-ocean-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-ocean"><HeartHandshake className="size-5" /></span><div><h3 className="font-heading text-sm font-bold">A real person can help carry this with you.</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Consider looping in an advisor, instructor, or someone you trust.</p></div></div>
        <Button type="button" variant="outline" className="gap-2 self-start border-ocean/30 bg-card lg:self-center" onClick={props.openHistory}><History className="size-4" />Saved situations <span className="tabular-nums">{props.historyCount}</span><ArrowUpRight className="size-4" /></Button>
      </section>
    </div>
  );
}

import campusStudyImage from "@/assets/campus-study.jpg";

function OverviewMetric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "ocean" | "positive" }) {
  return (
    <div className="panel flex min-h-[128px] items-center gap-4 p-5">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tone === "ocean" ? "bg-ocean-soft text-ocean" : "bg-positive-soft text-positive"}`}><span className="[&_svg]:size-5">{icon}</span></span>
      <div className="min-w-0"><div className="text-xs font-medium text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm font-bold leading-5">{value}</div><div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div><div className="text-xs font-bold uppercase text-primary">{eyebrow}</div><h2 className="font-heading mt-1 text-2xl font-extrabold sm:text-[28px]">{title}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{detail}</p></div>;
}

function AgentCard({ agent, index }: { agent: CrisisAnalysis["agents"][number]; index: number }) {
  const iconByType = { analyzer: BrainCircuit, strategy: Activity, planner: ListChecks, communication: MessageCircle };
  const iconColor = ["text-ocean bg-ocean-soft", "text-positive bg-positive-soft", "text-primary bg-secondary", "text-caution bg-caution-soft"][index] ?? "text-ocean bg-ocean-soft";
  const Icon = iconByType[agent.icon];
  return (
    <article className="panel min-w-0 p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2"><span className={`flex size-11 items-center justify-center rounded-full ${iconColor}`}><Icon className="size-5" /></span><span className="text-xs font-bold tabular-nums text-muted-foreground">0{index + 1}</span></div>
      <h3 className="font-heading mt-4 text-base font-bold">{agent.name}</h3><p className="mt-1 text-xs font-medium text-muted-foreground">{agent.role}</p>
      <p className="mt-4 text-sm leading-6 text-foreground/85">{agent.finding}</p>
      <div className="mt-4 border-t border-border pt-3"><div className="text-[10px] font-bold uppercase text-primary">Recommended move</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{agent.recommendation}</p></div>
    </article>
  );
}

function PlanRow({ step, index }: { step: CrisisAnalysis["plan"][number]; index: number }) {
  const priorityTone = step.priority === "P1" ? "severity-high" : step.priority === "P2" ? "severity-medium" : "severity-low";
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[70px_42px_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-5">
      <span className="text-xs font-extrabold uppercase text-primary">{step.window}</span>
      <span className={`flex size-9 items-center justify-center rounded-full text-sm font-extrabold ${priorityTone}`}>{index + 1}</span>
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-sm font-bold">{step.title}</h3><span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${priorityTone}`}>{step.priority}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p></div>
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-self-end"><Clock3 className="size-3.5" />{step.effort}</span>
    </div>
  );
}

function InfoList({ title, items, icon, tone }: { title: string; items: string[]; icon: React.ReactNode; tone: "caution" | "ocean" }) {
  const toneClass = tone === "caution" ? "text-caution bg-caution-soft" : "text-ocean bg-ocean-soft";
  return (
    <div className="border border-border bg-card p-4 sm:p-5"><div className="flex items-center gap-2 text-sm font-bold"><span className={`flex size-7 items-center justify-center rounded-full ${toneClass}`}><span className="[&_svg]:size-4">{icon}</span></span>{title}</div><ul className="mt-3 space-y-2 pl-2">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />{item}</li>)}</ul></div>
  );
}

function HowItWorks({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="page-wrap min-h-[70vh] py-12 sm:py-16">
      <Button type="button" variant="ghost" className="mb-8 -ml-3 gap-2" onClick={() => setView("dashboard")}><ArrowLeft className="size-4" />Back to dashboard</Button>
      <SectionHeading eyebrow="A steady sequence, not another thing to worry about." title="From tangled to doable." detail="Four distinct perspectives help surface the facts, compare options, and settle on a next move you can actually take." />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workflow.map((stage, index) => {
          const Icon = stage.icon;
          return <article key={stage.title} className="panel relative flex min-h-[230px] flex-col p-6">{index < workflow.length - 1 && <ArrowRight aria-hidden="true" className="absolute right-4 top-7 hidden size-4 text-primary/50 xl:block" />}<div className="flex size-12 items-center justify-center rounded-full bg-ocean-soft text-ocean"><Icon className="size-6" /></div><span className="mt-5 text-xs font-bold uppercase text-primary">Pass 0{index + 1}</span><h3 className="font-heading mt-2 text-lg font-bold">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.detail}</p></article>;
        })}
      </div>
      <div className="mt-8 flex flex-col justify-between gap-5 bg-primary px-6 py-7 text-primary-foreground sm:flex-row sm:items-center sm:px-8"><div><div className="text-xs font-bold uppercase opacity-80">The outcome</div><h3 className="font-heading mt-2 text-xl font-extrabold">A plan you can start right now.</h3><p className="mt-2 text-sm leading-6 opacity-85">Clear priorities. A realistic timeline. A message ready to personalize.</p></div><Button type="button" variant="secondary" className="gap-2 self-start sm:self-center" onClick={() => { setView("dashboard"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Analyze my crisis <ArrowRight className="size-4" /></Button></div>
    </section>
  );
}

function HistoryView({ history, onSelect, onClear }: { history: SavedCrisis[]; onSelect: (item: SavedCrisis) => void; onClear: () => void }) {
  return (
    <section className="page-wrap min-h-[70vh] py-12 sm:py-16">
      <SectionHeading eyebrow="Your saved situations" title="History" detail="This list is saved only in this browser." />
      {history.length === 0 ? (
        <div className="mt-8 flex min-h-[240px] flex-col items-center justify-center border border-dashed border-border bg-card px-6 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-ocean-soft text-ocean"><History className="size-5" /></span><h3 className="font-heading mt-4 text-base font-bold">Your saved analyses will appear here.</h3><p className="mt-1 text-sm text-muted-foreground">Run a crisis analysis to keep a copy in this browser.</p></div>
      ) : (
        <div className="mt-7 space-y-3">{history.map((item) => <article key={item.id} className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-sm px-2 py-1 text-[10px] font-bold ${`severity-${item.analysis.severity.toLowerCase()}`}`}>{item.analysis.severity}</span><span className="text-xs text-muted-foreground">{new Date(item.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span></div><h3 className="font-heading mt-2 truncate text-sm font-bold">{item.situation}</h3><p className="mt-1 text-xs text-muted-foreground">{item.analysis.category} <span aria-hidden="true">·</span> {item.analysis.plan.length} recovery steps</p></div><Button type="button" variant="outline" className="gap-2 self-start sm:self-center" onClick={() => onSelect(item)}>Open plan <ArrowRight className="size-4" /></Button></article>)}</div>
      )}
      {history.length > 0 && <Button type="button" variant="ghost" className="mt-5 gap-2 text-muted-foreground" onClick={onClear}><X className="size-4" />Clear saved history</Button>}
    </section>
  );
}