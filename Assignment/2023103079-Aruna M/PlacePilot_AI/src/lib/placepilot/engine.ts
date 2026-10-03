import type {
  Criterion,
  Eligibility,
  EngineMode,
  EventKind,
  Extraction,
  Opportunity,
  PlanItem,
  RecEvent,
  Reminder,
  ResumeMatch,
  Span,
  Student,
  Trace,
} from "./types";

export const NS = "Not specified";
export const ns = (v: unknown) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)
    ? NS
    : Array.isArray(v)
      ? v.join(", ")
      : String(v);

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DATE_RE =
  /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})(?:[,\s]+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm))?/gi;

export function findDates(seg: string): string[] {
  const out: string[] = [];
  for (const m of seg.matchAll(DATE_RE)) {
    const d = Number(m[1]);
    const mo = MONTHS.indexOf((m[2] ?? "").toLowerCase()) + 1;
    const y = Number(m[3]);
    let hh = m[4] ? Number(m[4]) : 0;
    const mm = m[5] ? Number(m[5]) : 0;
    const ap = (m[6] ?? "").toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    const p = (n: number) => String(n).padStart(2, "0");
    out.push(`${y}-${p(mo)}-${p(d)}T${p(hh)}:${p(mm)}:00+05:30`);
  }
  return out;
}

export function fmtDate(iso: string | null) {
  if (!iso) return NS;
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const BRANCHES: [string, RegExp][] = [
  ["CSE", /\bCSE\b|computer science/i],
  ["ECE", /\bECE\b/i],
  ["EEE", /\bEEE\b/i],
  ["IT", /\bIT\b/],
  ["AI&DS", /AI\s*[&/]?\s*DS\b|\bAIDS\b/i],
  ["MECH", /\bMECH/i],
  ["CIVIL", /\bCIVIL\b/i],
  ["MCA", /\bMCA\b/i],
];
const DEGREES: [string, RegExp][] = [
  ["B.E.", /\bB\.?\s?E\b\.?/i],
  ["B.Tech", /\bB\.?\s?Tech/i],
  ["MCA", /\bMCA\b/i],
  ["M.Tech", /\bM\.?\s?Tech/i],
];

function kindOf(key: string): EventKind | null {
  const k = key.toLowerCase();
  if (/regist/.test(k)) return "Registration";
  if (/pre[-\s]?placement|\bppt\b/.test(k)) return "Pre-Placement Talk";
  if (/online assess|\boa\b|aptitude|online test/.test(k)) return "Online Assessment";
  if (/technical|interview/.test(k)) return "Technical Round";
  if (/\bhr\b/.test(k)) return "HR Round";
  return null;
}

/** Deterministic, rule-based extraction. Never invents values. */
export function deterministicExtract(raw: string): Extraction {
  const ex: Extraction = {
    company: null, role: null, ctcLpa: null, ctcNote: null, stipend: null, employmentType: null,
    batch: null, degrees: [], branches: [], minCgpa: null, min10: null, min12: null,
    maxActiveBacklogs: null, bond: null, probation: null, locations: [], skills: [], events: [],
  };
  const lines = raw.split(/\n+/).map((l) => l.replace(/[*_]/g, "").trim()).filter(Boolean);
  for (const line of lines) {
    const ci = line.indexOf(":");
    if (ci < 0) continue;
    const key = line.slice(0, ci).trim();
    const val = line.slice(ci + 1).trim();
    const k = key.toLowerCase();
    const ek = kindOf(key);
    if (ek) {
      const dates = findDates(val);
      ex.events.push({
        kind: ek,
        label: key,
        start: dates[0] ?? null,
        end: dates[1] ?? null,
        rawText: dates.length ? null : val || null,
        tentative: /tentative|tbd|tbc|to be (announced|confirmed)|will be shared/i.test(val),
      });
      continue;
    }
    if (/^company/.test(k)) ex.company = val;
    else if (/^(role|position|designation|profile)/.test(k)) ex.role = val;
    else if (/stipend/.test(k)) ex.stipend = val;
    else if (/ctc|package|salary/.test(k)) {
      const m = val.match(/(\d+(?:\.\d+)?)\s*(lpa|lakhs?|l\b)/i);
      ex.ctcLpa = m ? Number(m[1]) : null;
      ex.ctcNote = val;
    } else if (/batch/.test(k)) ex.batch = val.match(/20\d\d/)?.[0] ?? val;
    else if (/degree/.test(k)) ex.degrees = DEGREES.filter(([, r]) => r.test(val)).map(([n]) => n);
    else if (/branch|discipline|department/.test(k)) ex.branches = BRANCHES.filter(([, r]) => r.test(val)).map(([n]) => n);
    else if (/cgpa|cpi|gpa/.test(k)) ex.minCgpa = Number(val.match(/\d+(\.\d+)?/)?.[0]) || null;
    else if (/10th|sslc/.test(k)) ex.min10 = Number(val.match(/\d+(\.\d+)?/)?.[0]) || null;
    else if (/12th|hsc|diploma/.test(k)) ex.min12 = Number(val.match(/\d+(\.\d+)?/)?.[0]) || null;
    else if (/backlog|arrear/.test(k)) {
      const n = val.match(/\d+/)?.[0];
      ex.maxActiveBacklogs = /no\s+(active\s+)?(backlog|arrear)/i.test(val) ? 0 : n ? Number(n) : null;
    } else if (/bond|service agreement/.test(k)) ex.bond = val;
    else if (/probation/.test(k)) ex.probation = val;
    else if (/location/.test(k)) ex.locations = val.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
    else if (/skill|tech stack|requirement/.test(k)) ex.skills = val.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  }
  if (!ex.company) {
    const m = raw.match(/(?:by|from)\s+\*?([A-Z][\w&]+(?:\s+[A-Z][\w&]+)*)/) ?? raw.match(/\*([A-Z][^*]+)\*/);
    ex.company = m?.[1]?.trim() ?? null;
  }
  if (!ex.role) ex.role = raw.match(/for\s+([A-Z][\w\s]+?)\s+role/)?.[1]?.trim() ?? null;
  if (/intern/i.test(raw)) ex.employmentType = /ppo|fte|full[-\s]?time/i.test(raw) ? "Internship + PPO" : "Internship";
  else if (ex.ctcLpa) ex.employmentType = "Full-time (FTE)";
  return ex;
}

export function normalizeExtraction(o: unknown): Extraction {
  const base = deterministicExtract("");
  if (!o || typeof o !== "object") return base;
  const r = o as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() && !/not specified/i.test(v) ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const events: RecEvent[] = Array.isArray(r["events"])
    ? (r["events"] as Record<string, unknown>[]).map((e) => ({
        kind: (["Registration", "Pre-Placement Talk", "Online Assessment", "Technical Round", "HR Round"].includes(String(e["kind"])) ? e["kind"] : "Other") as EventKind,
        label: str(e["label"]) ?? String(e["kind"] ?? "Event"),
        start: str(e["start"]),
        end: str(e["end"]),
        rawText: str(e["raw_text"]),
        tentative: e["tentative"] === true,
      }))
    : [];
  return {
    company: str(r["company"]), role: str(r["role"]), ctcLpa: num(r["ctc_lpa"]), ctcNote: str(r["ctc_note"]),
    stipend: str(r["stipend"]), employmentType: str(r["employment_type"]), batch: str(r["batch"]),
    degrees: arr(r["degrees"]), branches: arr(r["branches"]), minCgpa: num(r["min_cgpa"]),
    min10: num(r["min_10th"]), min12: num(r["min_12th"]), maxActiveBacklogs: num(r["max_active_backlogs"]),
    bond: str(r["bond"]), probation: str(r["probation"]), locations: arr(r["locations"]),
    skills: arr(r["skills"]), events,
  };
}

export function assessEligibility(ex: Extraction, s: Student): Eligibility {
  const c: Criterion[] = [];
  const numCrit = (label: string, req: number | null, val: number, unit: string) => {
    if (req === null) {
      c.push({ label, required: NS, student: `${val}${unit}`, status: "unknown" });
      return;
    }
    const status = val < req ? "fail" : val - req < (unit ? 2 : 0.25) ? "borderline" : "pass";
    c.push({ label, required: `≥ ${req}${unit}`, student: `${val}${unit}`, status });
  };
  c.push(
    ex.branches.length
      ? { label: "Branch", required: ex.branches.join(", "), student: s.branch, status: ex.branches.includes(s.branch) ? "pass" : "fail" }
      : { label: "Branch", required: NS, student: s.branch, status: "unknown" },
  );
  const degOk = ex.degrees.some((d) => d.replace(/\./g, "").toLowerCase() === s.degree.replace(/\./g, "").toLowerCase() || (d === "B.E." && s.degree === "B.Tech") || (d === "B.Tech" && s.degree === "B.E."));
  c.push(ex.degrees.length ? { label: "Degree", required: ex.degrees.join(", "), student: s.degree, status: degOk ? "pass" : "fail" } : { label: "Degree", required: NS, student: s.degree, status: "unknown" });
  c.push(ex.batch ? { label: "Batch", required: ex.batch, student: s.batch, status: ex.batch.includes(s.batch) ? "pass" : "fail" } : { label: "Batch", required: NS, student: s.batch, status: "unknown" });
  numCrit("CGPA (10-pt)", ex.minCgpa, s.cgpa, "");
  numCrit("10th / SSLC", ex.min10, s.tenth, "%");
  numCrit("12th / HSC", ex.min12, s.twelfth, "%");
  c.push(
    ex.maxActiveBacklogs === null
      ? { label: "Active backlogs", required: NS, student: String(s.activeBacklogs), status: "unknown" }
      : { label: "Active backlogs", required: `≤ ${ex.maxActiveBacklogs}`, student: String(s.activeBacklogs), status: s.activeBacklogs <= ex.maxActiveBacklogs ? "pass" : "fail" },
  );
  const verdict = c.some((x) => x.status === "fail") ? "Ineligible" : c.some((x) => x.status === "borderline") ? "Borderline" : "Eligible";
  return { verdict, criteria: c };
}

export function anonymize(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[EMAIL]")
    .replace(/(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g, "[PHONE]")
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[AADHAAR]")
    .replace(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)(?=\s*\|)/m, "[NAME]");
}

const ROLE_FOCUS: [RegExp, string[]][] = [
  [/full\s?stack/i, ["DSA", "JavaScript/TypeScript", "React", "Node.js", "SQL", "REST APIs", "System Design basics"]],
  [/data analyst|analytics/i, ["SQL", "Excel", "Python", "Statistics", "Power BI"]],
  [/sde|software/i, ["DSA", "OOP", "DBMS", "Operating Systems", "Computer Networks"]],
];

export function matchResume(ex: Extraction, s: Student): ResumeMatch {
  const inferredFocus = ROLE_FOCUS.find(([r]) => r.test(ex.role ?? ""))?.[1] ?? [];
  const have = s.skills.map((x) => x.toLowerCase());
  const has = (k: string) => have.some((h) => h.includes(k.toLowerCase()) || k.toLowerCase().includes(h));
  if (ex.skills.length < 3) {
    return {
      score: null,
      suppressedReason: "The notification does not list enough role skills to compute a reliable match percentage.",
      matched: inferredFocus.filter(has),
      gaps: inferredFocus.filter((k) => !has(k)),
      inferredFocus,
    };
  }
  const matched = ex.skills.filter(has);
  return { score: Math.round((matched.length / ex.skills.length) * 100), suppressedReason: null, matched, gaps: ex.skills.filter((k) => !has(k)), inferredFocus };
}

const CATS = ["DSA", "Core CS", "System Design", "Company Patterns", "Mock Questions"];
const TOPICS: Record<string, string[]> = {
  DSA: ["Arrays & two pointers", "Hashing & sliding window", "Linked lists & stacks", "Trees & BFS/DFS", "Dynamic programming basics", "Graphs & shortest paths", "Greedy & intervals"],
  "Core CS": ["DBMS normalization & joins", "OS processes, threads, deadlocks", "Computer networks: HTTP, TCP, DNS", "OOP pillars with examples"],
  "System Design": ["Design a URL shortener", "REST API design & auth", "Caching & CDN basics", "Database indexing & scaling"],
  "Company Patterns": ["Study past OA patterns & time-boxing", "Review company products & tech blog", "Aptitude: quant & logical reasoning"],
  "Mock Questions": ["Timed 90-min mock OA", "Mock technical interview", "HR: tell me about yourself, why this company"],
};

export function buildPlan(ex: Extraction, gaps: string[], now = new Date()): PlanItem[] {
  const oa = ex.events.find((e) => e.kind === "Online Assessment" && e.start);
  const target = oa?.start ? new Date(oa.start) : null;
  let days = target ? Math.ceil((target.getTime() - now.getTime()) / 864e5) : 7;
  days = Math.max(3, Math.min(14, days));
  const items: PlanItem[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(now.getTime() + d * 864e5).toISOString().slice(0, 10);
    const cats = d === days - 1 ? ["Mock Questions", "Company Patterns"] : [CATS[d % 4]!, CATS[(d + 1) % 4]!];
    cats.forEach((cat, i) => {
      const list = TOPICS[cat]!;
      items.push({ id: `p${d}_${i}`, day: d + 1, date, category: cat, title: list[(d + i) % list.length]!, done: false });
    });
    const gap = gaps[d];
    if (gap) items.push({ id: `p${d}_g`, day: d + 1, date, category: "Skill Gap", title: `Close gap: ${gap}`, done: false });
  }
  return items;
}

export function buildReminders(events: RecEvent[]): Reminder[] {
  const r: Reminder[] = [];
  for (const e of events) {
    const at = e.kind === "Registration" ? e.end ?? e.start : e.start;
    if (!at) continue;
    const t = new Date(at).getTime();
    const label = e.kind === "Registration" ? "Registration closes" : e.label;
    r.push({ id: `${label}-24`, event: label, offset: "24h", at: new Date(t - 864e5).toISOString() });
    r.push({ id: `${label}-1`, event: label, offset: "1h", at: new Date(t - 36e5).toISOString() });
  }
  return r.sort((a, b) => a.at.localeCompare(b.at));
}

export function sortEvents(events: RecEvent[]) {
  return [...events].sort((a, b) => (a.start && b.start ? a.start.localeCompare(b.start) : a.start ? -1 : b.start ? 1 : 0));
}

const est = (s: string) => Math.ceil(s.length / 4);

export function assemble(
  raw: string,
  ex: Extraction,
  student: Student,
  engine: EngineMode,
  fallbackReason: string | null,
  extractionLatency: number,
  extractionTokens: { in: number; out: number },
): { opp: Opportunity; trace: Trace } {
  const id = uid("opp");
  const traceId = uid("trc");
  const eligibility = assessEligibility(ex, student);
  const match = matchResume(ex, student);
  const plan = buildPlan(ex, match.gaps);
  const reminders = buildReminders(ex.events);
  const opp: Opportunity = { ...ex, events: sortEvents(ex.events), id, raw, engine, fallbackReason, createdAt: new Date().toISOString(), eligibility, match, plan, reminders, traceId };
  const h = hash(raw);
  const lat = (n: number, base: number) => base + ((h >> n) % 60);
  const root = `${traceId}_root`;
  let t = 0;
  const spans: Span[] = [];
  const add = (name: string, agent: string, latency: number, parent: string | null, extra: Partial<Span> = {}) => {
    const s: Span = { id: `${traceId}_${spans.length}`, parentId: parent, name, agent, state: "COMPLETED", startOffsetMs: t, latencyMs: latency, tokensIn: 0, tokensOut: 0, engine, ...extra };
    spans.push(s);
    return s;
  };
  const extractSpan = add("agent.extraction", "Notification Extraction", extractionLatency, root, {
    tokensIn: extractionTokens.in, tokensOut: extractionTokens.out, engine: fallbackReason ? "demo" : engine,
    state: fallbackReason ? "FALLBACK" : "COMPLETED", ...(fallbackReason ? { note: fallbackReason } : {}),
  });
  add("tool.parse_notification", "Notification Extraction", Math.round(extractionLatency * 0.7), extractSpan.id, { startOffsetMs: 2 });
  add("tool.validate_schema", "Notification Extraction", 4 + (h % 6), extractSpan.id, { state: "COMPLETED", startOffsetMs: Math.round(extractionLatency * 0.75) });
  t += extractionLatency;
  add("hitl.review_checkpoint", "Human Review", 0, root, { state: "COMPLETED", note: "Student approved extracted fields" });
  const steps: [string, string, number, number, number][] = [
    ["agent.eligibility", "Eligibility Analysis", lat(1, 8), 0, 0],
    ["agent.timeline", "Recruitment Timeline", lat(3, 6), 0, 0],
    ["agent.resume_matching", "Resume Matching", lat(5, 40), est(anonymize(student.resumeText)), 120],
    ["agent.preparation_planner", "Preparation Planner", lat(7, 30), 380, est(JSON.stringify(plan))],
    ["agent.reminder", "Reminder & Alert", lat(9, 5), 0, 0],
  ];
  for (const [name, agent, l, ti, to] of steps) {
    const s = add(name, agent, l, root, { tokensIn: ti, tokensOut: to, engine: "demo" });
    if (name === "agent.resume_matching") add("tool.anonymize_pii", agent, 3, s.id, { startOffsetMs: t + 1, engine: "demo" });
    t += l;
  }
  spans.unshift({ id: root, parentId: null, name: "pipeline.run", agent: "Orchestrator", state: "COMPLETED", startOffsetMs: 0, latencyMs: t, tokensIn: 0, tokensOut: 0, engine });
  const trace: Trace = { id: traceId, opportunityId: id, label: `${ex.company ?? "Unknown company"} — ${ex.role ?? "Role not specified"}`, engine, startedAt: opp.createdAt, spans, safetyFlags: detectInjection(raw).length };
  return { opp, trace };
}

export const INJECTION_PATTERNS: [string, RegExp][] = [
  ["Instruction override", /ignore (all |any )?(previous|prior|above) (instructions|rules)/i],
  ["Role hijack", /you are now|act as (an? )?(admin|system|developer)/i],
  ["System prompt exfiltration", /(reveal|print|show).{0,20}(system prompt|instructions|api key|secret)/i],
  ["Eligibility tampering", /(mark|set|make) (me|student|all).{0,20}eligible/i],
  ["Data exfiltration", /(send|post|upload).{0,30}(https?:\/\/|resume|data)/i],
];
export function detectInjection(text: string) {
  return INJECTION_PATTERNS.filter(([, r]) => r.test(text)).map(([n]) => n);
}
