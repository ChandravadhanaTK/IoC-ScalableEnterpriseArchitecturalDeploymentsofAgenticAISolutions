export type Severity = "Low" | "Medium" | "High" | "Critical";
export type CrisisCategory = "Auto-detect" | "Deadlines" | "Exams" | "Team project" | "Attendance" | "Other";

export type AgentFinding = {
  name: string;
  role: string;
  finding: string;
  recommendation: string;
  icon: "analyzer" | "strategy" | "planner" | "communication";
};

export type RecoveryStep = {
  window: "NOW" | "NEXT" | "TODAY" | "AFTER";
  title: string;
  detail: string;
  priority: "P1" | "P2" | "P3";
  effort: string;
};

export type CrisisAnalysis = {
  severity: Severity;
  category: Exclude<CrisisCategory, "Auto-detect">;
  urgency: string;
  detectedProblems: string[];
  constraints: string[];
  missingInformation: string[];
  agents: AgentFinding[];
  plan: RecoveryStep[];
};

export const sampleScenario =
  "My project demo is tomorrow, one teammate isn't responding, my code isn't working, and I have an exam tomorrow.";

const contains = (text: string, pattern: RegExp) => pattern.test(text);

export function analyzeCrisis(
  rawSituation: string,
  deadline: string,
  selectedCategory: CrisisCategory,
): CrisisAnalysis {
  const situation = rawSituation.trim();
  const text = situation.toLowerCase();
  const hasExam = contains(text, /\b(exam|test|midterm|final|quiz)\b/);
  const hasProject = contains(text, /\b(project|demo|presentation|code|prototype|lab)\b/);
  const hasTeam = contains(text, /\b(teammate|team member|group|partner|isn't responding|not responding|unresponsive)\b/);
  const hasAttendance = contains(text, /\b(attendance|absent|absence|missed classes)\b/);
  const hasSubmission = contains(text, /\b(missed|late|submission|submit|assignment|paper|deadline)\b/);
  const urgentLanguage = contains(text, /\b(today|tonight|tomorrow|in \d+ hours|overdue|already missed)\b/);
  const issueCount = [hasExam, hasProject, hasTeam, hasAttendance, hasSubmission].filter(Boolean).length;
  const isUrgent = Boolean(deadline) || urgentLanguage;
  const severity: Severity = isUrgent && issueCount >= 2 ? "Critical" : isUrgent || issueCount >= 3 ? "High" : issueCount > 0 ? "Medium" : "Low";

  const category = selectedCategory !== "Auto-detect"
    ? selectedCategory
    : hasAttendance
      ? "Attendance"
      : hasTeam && hasProject
        ? "Team project"
        : hasExam
          ? "Exams"
          : hasSubmission || hasProject
            ? "Deadlines"
            : "Other";

  const detectedProblems: string[] = [];
  if (hasExam) detectedProblems.push("Exam preparation is competing for the same time window");
  if (hasProject) detectedProblems.push("A project or demo still needs a reliable completion path");
  if (hasTeam) detectedProblems.push("A teammate dependency may put shared work at risk");
  if (hasAttendance) detectedProblems.push("Attendance may affect course standing or eligibility");
  if (hasSubmission) detectedProblems.push("A submission or assignment deadline needs confirmation");
  if (!detectedProblems.length) detectedProblems.push("The situation needs a clearer first priority and next checkpoint");

  const constraints = [
    deadline ? `Deadline provided: ${deadline}` : urgentLanguage ? "A near-term deadline is mentioned, but no exact time is confirmed" : "Exact due dates and times were not provided",
    hasTeam ? "Progress depends partly on another person responding" : "Plan assumes you can work independently for the next short block",
    hasExam && hasProject ? "Study time and project work are competing for limited focus" : "Protect a short, uninterrupted work block before adding new tasks",
  ];

  const missingInformation = [
    deadline ? "Confirm the submission cut-off time and time zone" : "Add the exact due date and submission cut-off time",
    hasTeam ? "Set a clear reply-by time and decide who can take over" : "Confirm who needs to review or approve the next step",
  ];

  const agents: AgentFinding[] = [
    {
      name: "Situation Analyzer",
      role: "Finds the pressure points",
      finding: `${severity} urgency, with ${Math.max(issueCount, 1)} linked pressure point${Math.max(issueCount, 1) === 1 ? "" : "s"}${urgentLanguage ? " and a near-term deadline" : ""}.`,
      recommendation: "Confirm the earliest hard deadline before choosing what to drop or defer.",
      icon: "analyzer",
    },
    {
      name: "Strategy Agent",
      role: "Compares realistic options",
      finding: hasProject && hasExam ? "A minimum viable demo protects the presentation while preserving a focused study block." : "A smaller, finished deliverable is safer than spreading effort across every task.",
      recommendation: hasTeam ? "Set a short response window, then reassign the blocked task instead of waiting." : "Choose one high-impact task and defer nonessential polish.",
      icon: "strategy",
    },
    {
      name: "Recovery Planner",
      role: "Turns choices into a sequence",
      finding: "The work is split into short checkpoints so new information can change the plan early.",
      recommendation: "Start with the smallest action that lowers the biggest immediate risk.",
      icon: "planner",
    },
    {
      name: "Communication Agent",
      role: "Gets the right people involved",
      finding: hasTeam ? "A specific ask and a reply-by time will make the team dependency visible." : "A concise, factual note can open a conversation before a deadline passes.",
      recommendation: "Send one clear message with the situation, your ask, and a proposed next step.",
      icon: "communication",
    },
  ];

  const plan: RecoveryStep[] = [
    {
      window: "NOW",
      title: hasProject ? "Get one demo path working" : "Write down the earliest hard deadline",
      detail: hasProject ? "Run only the core flow, capture a backup recording, and stop adding features." : "Check the course page and calendar; put the cut-off time where you can see it.",
      priority: "P1",
      effort: "20–30 min",
    },
    {
      window: "NEXT",
      title: hasTeam ? "Send a specific handoff message" : "Protect one focused work block",
      detail: hasTeam ? "Name one task, ask for a reply by a set time, and identify a backup owner." : "Work on the highest-impact unfinished task for 25 minutes without switching contexts.",
      priority: "P1",
      effort: "10 min",
    },
    {
      window: "TODAY",
      title: hasExam ? "Review the most testable material" : "Contact the person who can unblock you",
      detail: hasExam ? "Use practice questions and lecture summaries; skip rewriting notes from scratch." : "Share the facts, explain what you have completed, and make one clear request.",
      priority: "P2",
      effort: "45–60 min",
    },
    {
      window: "AFTER",
      title: "Re-check the plan against the real cut-off",
      detail: "Submit the strongest complete version, confirm it went through, then return to deferred work.",
      priority: "P3",
      effort: "10–15 min",
    },
  ];

  const urgency = severity === "Critical"
    ? "Several near-term demands are colliding. Reduce scope and make the next decision first."
    : severity === "High"
      ? "There is little room for delay. Confirm timing and protect the next focused block."
      : severity === "Medium"
        ? "A few moving parts need attention. Resolve the key dependency before it grows."
        : "This looks manageable with a clear priority and a check-in point.";

  return { severity, category, urgency, detectedProblems, constraints, missingInformation, agents, plan };
}

export type MessageKind = "Professor email" | "Teammate message" | "Extension request" | "Meeting request";
export type MessageTone = "warm" | "formal" | "concise";

export function buildCommunication(
  kind: MessageKind,
  situation: string,
  tone: MessageTone,
  variation: number,
): string {
  const summary = situation.trim().replace(/\s+/g, " ").slice(0, 190);
  const opener = [
    "I wanted to reach out early about",
    "I'm writing to give you a clear update on",
    "I'm getting in touch about",
  ][variation % 3];
  const request = [
    "Could you let me know the best next step?",
    "Would you be available to advise me on the next step?",
    "Please let me know what you recommend.",
  ][variation % 3];

  if (kind === "Teammate message") {
    const greeting = tone === "formal" ? "Hello," : "Hi,";
    const ask = tone === "concise" ? "Can you confirm by [time] whether you can finish [task]?" : "Could you take ownership of [specific task] and confirm by [time?] If you’re blocked, please tell us now so we can reassign it.";
    return `${greeting} ${opener} ${summary || "our project deadline"}. ${ask} I'll handle [your task] and share a progress update at [time].`;
  }

  if (kind === "Meeting request") {
    const greeting = tone === "formal" ? "Dear Professor," : "Hello,";
    return `${greeting}\n\n${opener} ${summary || "a time-sensitive course issue"}. Could we meet for 10–15 minutes ${tone === "concise" ? "today or tomorrow" : "at a time that works for you today or tomorrow"}? ${request}\n\nThank you,\n[Your name]`;
  }

  const isExtension = kind === "Extension request";
  const subject = isExtension ? "Subject: Request to discuss a short extension" : "Subject: Quick guidance on a time-sensitive course issue";
  const greeting = tone === "formal" ? "Dear Professor," : "Hello Professor,";
  const detail = tone === "concise"
    ? `I'm dealing with ${summary || "overlapping academic deadlines"}. Could I request a short extension until [proposed date/time]? I have completed [work done] and can submit [next step] by then.`
    : `${opener} ${summary || "overlapping academic deadlines"}. I have completed [work done] and my next step is [specific action]. ${isExtension ? "Would a short extension until [proposed date/time] be possible?" : request}`;
  const close = tone === "formal" ? "Thank you for considering my request.\n\nSincerely," : "Thank you for your time.\n\nBest,";
  return `${subject}\n\n${greeting}\n\n${detail}\n\n${close}\n[Your name]\n[Course / section]`;
}