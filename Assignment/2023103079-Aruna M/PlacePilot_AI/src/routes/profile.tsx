import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { audit, setState, useApp } from "@/lib/placepilot/store";
import { anonymize, assessEligibility, matchResume } from "@/lib/placepilot/engine";
import { DEFAULT_STUDENT } from "@/lib/placepilot/samples";
import type { Student } from "@/lib/placepilot/types";
import { btn, btnGhost, input, PageHeader, Panel } from "@/components/pp";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — PlacePilot AI" },
      { name: "description", content: "Edit your academic credentials: CGPA, 10th/12th %, backlogs, skills and resume." },
      { property: "og:title", content: "My Profile — PlacePilot AI" },
      { property: "og:description", content: "Configurable demo student profile." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const app = useApp();
  const [s, setS] = useState<Student>(app.student);
  useEffect(() => setS(app.student), [app.student]);
  const f = <K extends keyof Student>(k: K, v: Student[K]) => setS({ ...s, [k]: v });
  const save = () => {
    setState((st) => ({
      ...st,
      student: s,
      opportunities: st.opportunities.map((o) => ({ ...o, eligibility: assessEligibility(o, s), match: matchResume(o, s) })),
    }));
    void audit("student", "profile.update", `CGPA ${s.cgpa}, backlogs ${s.activeBacklogs}`);
  };
  const num = (k: "cgpa" | "tenth" | "twelfth" | "activeBacklogs" | "clearedBacklogs", label: string, step = "0.01") => (
    <label className="text-sm">
      <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">{label}</span>
      <input type="number" step={step} className={input} value={s[k]} onChange={(e) => f(k, Number(e.target.value))} />
    </label>
  );
  return (
    <div>
      <PageHeader kicker="Profile" title="Academic credentials">Demo profile of an Indian B.Tech CSE student — edit anything; eligibility re-evaluates for every tracked drive on save.</PageHeader>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Credentials">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-sm"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Name</span><input className={input} value={s.name} onChange={(e) => f("name", e.target.value)} /></label>
            <label className="text-sm"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Degree</span>
              <select className={input} value={s.degree} onChange={(e) => f("degree", e.target.value)}>{["B.E.", "B.Tech", "MCA"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Branch</span>
              <select className={input} value={s.branch} onChange={(e) => f("branch", e.target.value)}>{["CSE", "ECE", "EEE", "IT", "AI&DS", "MECH", "CIVIL", "MCA"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Batch</span><input className={input} value={s.batch} onChange={(e) => f("batch", e.target.value)} /></label>
            {num("cgpa", "CGPA (10-point)")}
            {num("tenth", "10th / SSLC %")}
            {num("twelfth", "12th / HSC / Diploma %")}
            {num("activeBacklogs", "Active backlogs", "1")}
            {num("clearedBacklogs", "Cleared backlogs (history)", "1")}
            <label className="col-span-2 text-sm"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Skills (comma separated)</span>
              <input className={input} value={s.skills.join(", ")} onChange={(e) => f("skills", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} /></label>
          </div>
        </Panel>
        <Panel title="Resume">
          <textarea className={`${input} h-40 font-mono text-xs`} value={s.resumeText} onChange={(e) => f("resumeText", e.target.value)} />
          <p className="mt-3 font-mono text-[10px] uppercase text-muted-foreground">What the AI sees (PII anonymized before LLM ingestion)</p>
          <pre className="mt-1 whitespace-pre-wrap rounded-sm bg-muted p-3 font-mono text-xs">{anonymize(s.resumeText)}</pre>
        </Panel>
      </div>
      <div className="mt-5 flex gap-2">
        <button className={btn} onClick={save}>Save profile</button>
        <button className={btnGhost} onClick={() => setS(DEFAULT_STUDENT)}>Restore demo student</button>
      </div>
    </div>
  );
}
