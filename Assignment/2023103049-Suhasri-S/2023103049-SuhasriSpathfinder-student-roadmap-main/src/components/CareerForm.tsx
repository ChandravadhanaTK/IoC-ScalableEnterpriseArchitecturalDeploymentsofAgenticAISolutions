import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEVELS, type UserSkill } from "@/lib/types";

export type CareerData = {
  full_name: string; education: string; experience_level: string;
  target_role: string; target_industry: string; timeline_months: number;
  skills: UserSkill[]; hours_per_week: number;
  learning_preferences: string; project_types: string; goals: string;
};

const sel = "h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

export function emptyCareer(p?: { [K in keyof CareerData]?: CareerData[K] | null } | null): CareerData {
  return {
    full_name: p?.full_name ?? "", education: p?.education ?? "", experience_level: p?.experience_level ?? "",
    target_role: p?.target_role ?? "", target_industry: p?.target_industry ?? "", timeline_months: p?.timeline_months ?? 6,
    skills: p?.skills?.length ? p.skills : [{ name: "", level: 1 }], hours_per_week: p?.hours_per_week ?? 10,
    learning_preferences: p?.learning_preferences ?? "", project_types: p?.project_types ?? "", goals: p?.goals ?? "",
  };
}

export function validateStep(d: CareerData, step: number): string | null {
  if (step === 0) {
    if (!d.full_name.trim()) return "Please enter your name.";
    if (!d.education.trim()) return "Please enter your education.";
    if (!d.experience_level) return "Please choose your experience level.";
  }
  if (step === 1) {
    if (!d.target_role.trim()) return "Please enter a target role.";
    if (!d.target_industry.trim()) return "Please enter a target industry.";
    if (!(d.timeline_months >= 1 && d.timeline_months <= 36)) return "Timeline must be 1–36 months.";
  }
  if (step === 2) {
    const s = d.skills.filter((x) => x.name.trim());
    if (!s.length) return "Add at least one current skill.";
  }
  if (step === 3) {
    if (!(d.hours_per_week >= 1 && d.hours_per_week <= 80)) return "Hours per week must be 1–80.";
  }
  return null;
}

export const STEPS = ["About you", "Career goal", "Current skills", "Availability", "Preferences"];

export function CareerFields({ d, set, step }: { d: CareerData; set: (d: CareerData) => void; step: number | "all" }) {
  const show = (n: number) => step === "all" || step === n;
  const up = <K extends keyof CareerData>(k: K, v: CareerData[K]) => set({ ...d, [k]: v });
  return (
    <div className="space-y-8">
      {show(0) && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          {step === "all" && <legend className="mb-2 text-lg font-semibold">About you</legend>}
          <div><Label htmlFor="fn">Name</Label><Input id="fn" value={d.full_name} onChange={(e) => up("full_name", e.target.value)} /></div>
          <div><Label htmlFor="ed">Education</Label><Input id="ed" placeholder="e.g. B.Tech Computer Science" value={d.education} onChange={(e) => up("education", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label htmlFor="ex">Experience level</Label>
            <select id="ex" className={sel} value={d.experience_level} onChange={(e) => up("experience_level", e.target.value)}>
              <option value="">Choose…</option>
              {["Student", "Entry level (0–2 yrs)", "Mid level (2–5 yrs)", "Senior (5+ yrs)", "Career switcher"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </fieldset>
      )}
      {show(1) && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          {step === "all" && <legend className="mb-2 text-lg font-semibold">Career goal</legend>}
          <div><Label htmlFor="tr">Target role</Label><Input id="tr" placeholder="e.g. Data Scientist" value={d.target_role} onChange={(e) => up("target_role", e.target.value)} /></div>
          <div><Label htmlFor="ti">Industry / domain</Label><Input id="ti" placeholder="e.g. Fintech" value={d.target_industry} onChange={(e) => up("target_industry", e.target.value)} /></div>
          <div><Label htmlFor="tm">Timeline (months)</Label><Input id="tm" type="number" min={1} max={36} value={d.timeline_months} onChange={(e) => up("timeline_months", Number(e.target.value))} /></div>
        </fieldset>
      )}
      {show(2) && (
        <fieldset className="space-y-3">
          {step === "all" && <legend className="mb-2 text-lg font-semibold">Current skills</legend>}
          {d.skills.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label="Skill name" placeholder="Skill, e.g. Python" value={s.name} onChange={(e) => up("skills", d.skills.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <select aria-label="Proficiency" className={sel + " max-w-40"} value={s.level} onChange={(e) => up("skills", d.skills.map((x, j) => (j === i ? { ...x, level: Number(e.target.value) } : x)))}>
                {LEVELS.map((l, k) => <option key={l} value={k + 1}>{l}</option>)}
              </select>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove skill" disabled={d.skills.length === 1} onClick={() => up("skills", d.skills.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => up("skills", [...d.skills, { name: "", level: 1 }])}><Plus className="h-4 w-4" /> Add skill</Button>
        </fieldset>
      )}
      {show(3) && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          {step === "all" && <legend className="mb-2 text-lg font-semibold">Availability</legend>}
          <div><Label htmlFor="hw">Hours per week</Label><Input id="hw" type="number" min={1} max={80} value={d.hours_per_week} onChange={(e) => up("hours_per_week", Number(e.target.value))} /></div>
        </fieldset>
      )}
      {show(4) && (
        <fieldset className="grid gap-4">
          {step === "all" && <legend className="mb-2 text-lg font-semibold">Preferences</legend>}
          <div><Label htmlFor="lp">How do you like to learn?</Label><Input id="lp" placeholder="e.g. video courses, hands-on projects" value={d.learning_preferences} onChange={(e) => up("learning_preferences", e.target.value)} /></div>
          <div><Label htmlFor="pt">Preferred project types</Label><Input id="pt" placeholder="e.g. dashboards, NLP apps" value={d.project_types} onChange={(e) => up("project_types", e.target.value)} /></div>
          <div><Label htmlFor="go">Other goals (optional)</Label><Textarea id="go" value={d.goals} onChange={(e) => up("goals", e.target.value)} /></div>
        </fieldset>
      )}
    </div>
  );
}

export function cleanCareer(d: CareerData) {
  return { ...d, skills: d.skills.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), level: s.level })) as never };
}

export function useStepper() {
  const [step, setStep] = useState(0);
  return { step, setStep, toastErr: (m: string) => toast.error(m) };
}
