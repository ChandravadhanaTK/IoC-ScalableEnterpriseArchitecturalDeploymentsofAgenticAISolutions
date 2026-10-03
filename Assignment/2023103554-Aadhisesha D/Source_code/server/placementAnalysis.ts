import type {
  AgentStep,
  CareerPlan,
  InterviewPlan,
  JobProfile,
  PlacementAnalysis,
  PlacementRequest,
  ResumeProfile,
  SkillGapResult,
} from '../src/types/placement';
import { geminiChatJson, GeminiRequestError, getGeminiConfig } from './gemini.js';

export { GeminiRequestError } from './gemini.js';

function getModel() { return getGeminiConfig().model; }

export function now() { return new Date().toISOString(); }
export function runId(prefix = 'RUN') { return `${prefix}-${Date.now().toString(36).toUpperCase()}`; }

function clamp(value: unknown, min = 0, max = 100): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
}
function asStringArray(value: unknown): string[] { return Array.isArray(value) ? value.map(String).map((v) => v.trim()).filter(Boolean) : []; }
function safeText(value: unknown, fallback: string): string { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }

export const resumeSchema = {
  type: 'object', properties: {
    candidateName: { type: 'string' }, headline: { type: 'string' }, skills: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } }, frameworks: { type: 'array', items: { type: 'string' } },
    tools: { type: 'array', items: { type: 'string' } }, databases: { type: 'array', items: { type: 'string' } }, cloud: { type: 'array', items: { type: 'string' } },
    projects: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, summary: { type: 'string' }, technologies: { type: 'array', items: { type: 'string' } } }, required: ['name', 'summary', 'technologies'] } },
    education: { type: 'array', items: { type: 'object', properties: { degree: { type: 'string' }, institution: { type: 'string' }, details: { type: 'string' } }, required: ['degree', 'institution', 'details'] } },
    certifications: { type: 'array', items: { type: 'string' } },
  },
  required: ['candidateName', 'headline', 'skills', 'languages', 'frameworks', 'tools', 'databases', 'cloud', 'projects', 'education', 'certifications'],
} as const;

const focusSchema = {
  type: 'object', properties: {
    area: { type: 'string' }, priority: { type: 'string', enum: ['critical', 'high', 'medium'] }, why: { type: 'string' },
    suggestedTopics: { type: 'array', items: { type: 'string' } },
  }, required: ['area', 'priority', 'why', 'suggestedTopics'],
} as const;

const roundSchema = {
  type: 'object', properties: {
    round: { type: 'string' }, purpose: { type: 'string' }, questionTypes: { type: 'array', items: { type: 'string' } },
    exampleQuestions: { type: 'array', items: { type: 'string' } },
  }, required: ['round', 'purpose', 'questionTypes', 'exampleQuestions'],
} as const;

export const jobSchema = {
  type: 'object', properties: {
    role: { type: 'string' }, company: { type: 'string' }, seniority: { type: 'string' }, roleSummary: { type: 'string' },
    requiredSkills: { type: 'array', items: { type: 'string' } }, preferredSkills: { type: 'array', items: { type: 'string' } },
    responsibilities: { type: 'array', items: { type: 'string' } }, technologies: { type: 'array', items: { type: 'string' } },
    softSkills: { type: 'array', items: { type: 'string' } }, keywords: { type: 'array', items: { type: 'string' } },
    focusAreas: { type: 'array', items: focusSchema }, interviewRounds: { type: 'array', items: roundSchema },
    exampleQuestions: { type: 'array', items: { type: 'string' } }, signals: { type: 'array', items: { type: 'string' } },
  },
  required: ['role', 'company', 'seniority', 'roleSummary', 'requiredSkills', 'preferredSkills', 'responsibilities', 'technologies', 'softSkills', 'keywords', 'focusAreas', 'interviewRounds', 'exampleQuestions', 'signals'],
} as const;

export const gapSchema = {
  type: 'object', properties: {
    matchPercentage: { type: 'integer' }, matchedSkills: { type: 'array', items: { type: 'string' } }, partialSkills: { type: 'array', items: { type: 'string' } },
    missingSkills: { type: 'array', items: { type: 'string' } },
    priorityGaps: { type: 'array', items: { type: 'object', properties: { skill: { type: 'string' }, reason: { type: 'string' }, action: { type: 'string' }, priority: { type: 'string', enum: ['high', 'medium', 'low'] } }, required: ['skill', 'reason', 'action', 'priority'] } },
    strengths: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' },
  }, required: ['matchPercentage', 'matchedSkills', 'partialSkills', 'missingSkills', 'priorityGaps', 'strengths', 'summary'],
} as const;

export const interviewPlanSchema = {
  type: 'object', properties: {
    questions: { type: 'array', items: { type: 'object', properties: { category: { type: 'string', enum: ['technical', 'behavioral', 'project', 'system-design'] }, question: { type: 'string' }, whatGoodLooksLike: { type: 'string' } }, required: ['category', 'question', 'whatGoodLooksLike'] } },
    focusAreas: { type: 'array', items: { type: 'string' } },
  }, required: ['questions', 'focusAreas'],
} as const;

export const careerPlanSchema = {
  type: 'object', properties: {
    headline: { type: 'string' }, summary: { type: 'string' },
    sevenDayPlan: { type: 'array', items: { type: 'object', properties: { day: { type: 'integer' }, focus: { type: 'string' }, tasks: { type: 'array', items: { type: 'string' } }, minutes: { type: 'integer' } }, required: ['day', 'focus', 'tasks', 'minutes'] } },
    nextActions: { type: 'array', items: { type: 'string' } }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  }, required: ['headline', 'summary', 'sevenDayPlan', 'nextActions', 'confidence'],
} as const;

export const callGemini = geminiChatJson;

function normalizeResume(raw: any): ResumeProfile {
  return {
    candidateName: safeText(raw?.candidateName, 'Candidate'), headline: safeText(raw?.headline, 'Early-career software engineering candidate'),
    skills: asStringArray(raw?.skills), languages: asStringArray(raw?.languages), frameworks: asStringArray(raw?.frameworks),
    tools: asStringArray(raw?.tools), databases: asStringArray(raw?.databases), cloud: asStringArray(raw?.cloud),
    projects: Array.isArray(raw?.projects) ? raw.projects.slice(0, 8).map((p: any) => ({ name: safeText(p?.name, 'Project'), summary: safeText(p?.summary, 'Project detected from resume'), technologies: asStringArray(p?.technologies).slice(0, 8) })) : [],
    education: Array.isArray(raw?.education) ? raw.education.slice(0, 5).map((e: any) => ({ degree: safeText(e?.degree, 'Education'), institution: safeText(e?.institution, 'Institution'), details: safeText(e?.details, '') })) : [],
    certifications: asStringArray(raw?.certifications).slice(0, 10),
  };
}

function normalizeJob(raw: any): JobProfile {
  return {
    role: safeText(raw?.role, 'Software Engineer'), company: safeText(raw?.company, ''), seniority: safeText(raw?.seniority, 'Entry level'),
    roleSummary: safeText(raw?.roleSummary, 'A software engineering role focused on building reliable, maintainable products.'),
    requiredSkills: asStringArray(raw?.requiredSkills).slice(0, 14), preferredSkills: asStringArray(raw?.preferredSkills).slice(0, 12),
    responsibilities: asStringArray(raw?.responsibilities).slice(0, 10), technologies: asStringArray(raw?.technologies).slice(0, 14),
    softSkills: asStringArray(raw?.softSkills).slice(0, 10), keywords: asStringArray(raw?.keywords).slice(0, 18),
    focusAreas: Array.isArray(raw?.focusAreas) ? raw.focusAreas.slice(0, 8).map((f: any) => ({ area: safeText(f?.area, 'Role fundamentals'), priority: ['critical','high','medium'].includes(f?.priority) ? f.priority : 'medium', why: safeText(f?.why, 'This appears relevant to the role.'), suggestedTopics: asStringArray(f?.suggestedTopics).slice(0, 6) })) : [],
    interviewRounds: Array.isArray(raw?.interviewRounds) ? raw.interviewRounds.slice(0, 6).map((r: any) => ({ round: safeText(r?.round, 'Technical round'), purpose: safeText(r?.purpose, 'Assess role readiness'), questionTypes: asStringArray(r?.questionTypes).slice(0, 6), exampleQuestions: asStringArray(r?.exampleQuestions).slice(0, 5) })) : [],
    exampleQuestions: asStringArray(raw?.exampleQuestions).slice(0, 12),
    signals: asStringArray(raw?.signals).slice(0, 10),
  };
}

function normalizeGap(raw: any): SkillGapResult {
  return {
    matchPercentage: clamp(raw?.matchPercentage), matchedSkills: asStringArray(raw?.matchedSkills), partialSkills: asStringArray(raw?.partialSkills), missingSkills: asStringArray(raw?.missingSkills),
    priorityGaps: Array.isArray(raw?.priorityGaps) ? raw.priorityGaps.slice(0, 8).map((g: any) => ({ skill: safeText(g?.skill, 'Skill'), reason: safeText(g?.reason, 'Gap detected'), action: safeText(g?.action, 'Practice this skill'), priority: ['high','medium','low'].includes(g?.priority) ? g.priority : 'medium' })) : [],
    strengths: asStringArray(raw?.strengths).slice(0, 8), summary: safeText(raw?.summary, 'The analysis is ready for review.'),
  };
}

function normalizeInterview(raw: any): InterviewPlan {
  return {
    questions: Array.isArray(raw?.questions) ? raw.questions.slice(0, 16).map((q: any) => ({ category: ['technical','behavioral','project','system-design'].includes(q?.category) ? q.category : 'technical', question: safeText(q?.question, 'Explain a technical decision from one of your projects.'), whatGoodLooksLike: safeText(q?.whatGoodLooksLike, 'A concise answer grounded in evidence, trade-offs and outcome.') })) : [],
    focusAreas: asStringArray(raw?.focusAreas).slice(0, 10),
  };
}

function normalizePlan(raw: any): CareerPlan {
  const days = Array.isArray(raw?.sevenDayPlan) ? raw.sevenDayPlan : [];
  const defaults = ['Role fundamentals', 'Core technologies', 'Data structures', 'Systems and APIs', 'Project storytelling', 'Timed practice', 'Final review'];
  return {
    headline: safeText(raw?.headline, 'A focused seven-day placement sprint.'), summary: safeText(raw?.summary, 'Prioritize the highest-impact role gaps, then convert them into timed practice.'),
    sevenDayPlan: Array.from({ length: 7 }, (_, index) => { const src = days[index] ?? {}; return { day: index + 1, focus: safeText(src?.focus, defaults[index]), tasks: asStringArray(src?.tasks).slice(0, 4), minutes: Math.max(20, Math.min(180, Number(src?.minutes) || 60)) }; }),
    nextActions: asStringArray(raw?.nextActions).slice(0, 6), confidence: ['high','medium','low'].includes(raw?.confidence) ? raw.confidence : 'medium',
  };
}

export function demoResult(req: PlacementRequest): PlacementAnalysis {
  const start = Date.now();
  const resume: ResumeProfile = {
    candidateName: 'Demo Candidate', headline: 'Computer science student targeting software engineering roles',
    skills: ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git'], languages: ['Java', 'Python', 'C++'], frameworks: ['React', 'Node.js', 'FastAPI'], tools: ['Git', 'GitHub', 'VS Code'], databases: ['MongoDB', 'MySQL'], cloud: [],
    projects: [
      { name: 'Timetable Auto Scheduler', summary: 'Conflict-free timetable generation with role-based access.', technologies: ['React','Node.js','MongoDB'] },
      { name: 'AI Exam Evaluator', summary: 'OCR and semantic similarity workflow for exam evaluation.', technologies: ['Python','FastAPI','NLP'] },
    ], education: [{ degree: 'B.E. Computer Science Engineering', institution: 'Engineering University', details: 'Undergraduate' }], certifications: ['Data Analytics Job Simulation'],
  };
  const role = req.careerGoal || 'Software Engineer';
  const job: JobProfile = {
    role, company: 'Demo Company', seniority: 'Entry level', roleSummary: `${role} role centered on building maintainable software, solving technical problems and collaborating with engineering teams.`,
    requiredSkills: ['Java','SQL','REST APIs','Git','Data Structures'], preferredSkills: ['React','Docker','Cloud','System Design'],
    responsibilities: ['Build backend services','Debug production issues','Collaborate with engineers','Write maintainable code','Review technical changes'],
    technologies: ['Java','SQL','REST','Git','Docker'], softSkills: ['Communication','Problem solving','Ownership','Collaboration'], keywords: ['Java','SQL','REST API','DSA','Git','backend','debugging'],
    focusAreas: [
      { area: 'Data Structures & Algorithms', priority: 'critical', why: 'Likely central to technical screening and timed problem solving.', suggestedTopics: ['Arrays','Hashing','Strings','Trees','Big-O'] },
      { area: 'Java + OOP', priority: 'high', why: 'The role is Java-heavy and requires strong implementation fundamentals.', suggestedTopics: ['OOP','Collections','Exceptions','Interfaces','JVM basics'] },
      { area: 'SQL + Data', priority: 'high', why: 'The role expects confident data retrieval and debugging.', suggestedTopics: ['Joins','Aggregation','Indexes','Transactions','Normalization'] },
      { area: 'APIs + Backend', priority: 'high', why: 'Backend service construction is an explicit responsibility.', suggestedTopics: ['HTTP','REST','Validation','Status codes','Error handling'] },
      { area: 'Project Depth', priority: 'medium', why: 'Project discussions test whether the candidate can explain trade-offs.', suggestedTopics: ['Architecture','Trade-offs','Failures','Impact','What changed'] },
    ],
    interviewRounds: [
      { round: 'Online Assessment', purpose: 'Fast screening of problem solving and fundamentals.', questionTypes: ['MCQ','Coding','Aptitude'], exampleQuestions: ['What is the time complexity of a hash lookup on average?','Write a function to find the first non-repeating character.'] },
      { round: 'Technical Interview', purpose: 'Validate depth in coding, Java, SQL and APIs.', questionTypes: ['Technical','Coding','SQL','Project'], exampleQuestions: ['Explain polymorphism with a practical example.','Design a REST endpoint for creating an order.'] },
      { round: 'Managerial / HR', purpose: 'Explore ownership, communication and project judgment.', questionTypes: ['Behavioral','Project','Scenario'], exampleQuestions: ['Describe a difficult engineering trade-off you made.','Tell me about a time you handled a production-like bug.'] },
    ],
    exampleQuestions: ['How would you design a REST endpoint for creating a resource?','Explain average vs worst-case hash lookup complexity.','Walk through the hardest technical decision in a project.','How would you debug a slow SQL query?','When would you prefer composition over inheritance?'],
    signals: ['Strong preference for measurable project ownership','Comfort with Java and backend fundamentals','Problem solving is likely to be assessed under time pressure','Role asks for collaboration and clear communication'],
  };
  const skillGap: SkillGapResult = {
    matchPercentage: 78, matchedSkills: ['Java','SQL','Git','React','Node.js','REST basics'], partialSkills: ['Data Structures','Backend depth'], missingSkills: ['Docker','Cloud','System Design'],
    priorityGaps: [
      { skill: 'Data Structures', reason: 'Core requirement and common screening filter.', action: 'Practice arrays, hashing, trees and complexity with timed problems.', priority: 'high' },
      { skill: 'REST APIs', reason: 'Backend service work is explicit in the role.', action: 'Explain one CRUD API with validation, status codes and persistence.', priority: 'medium' },
      { skill: 'Docker', reason: 'Listed as a preferred deployment capability.', action: 'Containerize one project and learn images, containers and ports.', priority: 'low' },
    ], strengths: ['Full-stack project exposure','Java/Python foundation','Database experience','FastAPI/API experience'],
    summary: 'You have a solid software engineering base. The largest preparation opportunity is converting existing project experience into stronger DSA, backend depth and deployment vocabulary.',
  };
  const interview: InterviewPlan = { focusAreas: ['Data Structures','Java + OOP','SQL','REST APIs','Project deep dives'], questions: [
    { category: 'technical', question: 'How would you design a REST endpoint for creating and retrieving a resource?', whatGoodLooksLike: 'HTTP semantics, validation, status codes, persistence, idempotency and error handling.' },
    { category: 'technical', question: 'Explain how a hash table achieves average O(1) lookup.', whatGoodLooksLike: 'Hashing, buckets, collisions and worst-case nuance.' },
    { category: 'project', question: 'Walk me through the hardest technical decision you made in a project.', whatGoodLooksLike: 'Context, alternatives, trade-off, outcome and learning.' },
    { category: 'behavioral', question: 'Tell me about a time you had to learn a technology quickly.', whatGoodLooksLike: 'Specific situation, learning strategy, outcome and reflection.' },
    { category: 'system-design', question: 'Design a small service that accepts a request and processes it asynchronously.', whatGoodLooksLike: 'Queue, worker, retry, idempotency, observability and failure handling.' },
  ] };
  const careerPlan: CareerPlan = { headline: 'Seven days to turn the biggest gaps into interview-ready evidence.', summary: 'Use the first half of the sprint for technical depth and the second half for timed drills, project storytelling and mock rounds.', confidence: 'medium', sevenDayPlan: [
    { day: 1, focus: 'Java + OOP', tasks: ['Review inheritance and polymorphism','Revise Collections','Answer 5 core Java questions'], minutes: 75 },
    { day: 2, focus: 'DSA foundations', tasks: ['Arrays + hashing','Solve 4 timed problems'], minutes: 90 },
    { day: 3, focus: 'SQL', tasks: ['Joins + aggregation','Write 8 queries','Review indexes'], minutes: 70 },
    { day: 4, focus: 'REST + backend', tasks: ['Review CRUD semantics','Explain one API design','Revise error handling'], minutes: 65 },
    { day: 5, focus: 'Projects', tasks: ['Prepare 2 project walkthroughs','Write trade-offs and failure stories'], minutes: 55 },
    { day: 6, focus: 'Mixed training', tasks: ['Take an MCQ drill','Solve a coding question','Answer 4 technical questions'], minutes: 90 },
    { day: 7, focus: 'Final simulation', tasks: ['Run a mixed mock','Revisit priority gaps','Prepare your opening pitch'], minutes: 75 },
  ], nextActions: ['Start with Data Structures today','Prepare a 90-second project pitch','Practice one API design explanation','Take a mixed technical drill'] };
  const steps: AgentStep[] = [
    { id: 'orchestrator', agent: 'Orchestrator', purpose: 'Planning the reasoning chain', status: 'completed', durationMs: 110 },
    { id: 'resume', agent: 'Resume Intelligence Agent', purpose: 'Structuring candidate experience and skills', status: 'completed', durationMs: 480, tokens: 550 },
    { id: 'job', agent: 'Job Analysis Agent', purpose: 'Decoding role requirements, focus areas and interview signals', status: 'completed', durationMs: 570, tokens: 680 },
    { id: 'gap', agent: 'Skill Gap Agent', purpose: 'Comparing candidate evidence with role requirements', status: 'completed', durationMs: 620, tokens: 720 },
    { id: 'interview', agent: 'Interview Agent', purpose: 'Creating role-specific interview examples', status: 'completed', durationMs: 580, tokens: 650 },
    { id: 'planner', agent: 'Career Planner Agent', purpose: 'Turning gaps into a preparation sprint', status: 'completed', durationMs: 630, tokens: 690 },
    { id: 'validator', agent: 'Validation Layer', purpose: 'Checking structured output completeness', status: 'completed', durationMs: 45, detail: 'Schema and required-field checks passed.' },
  ];
  return { resume, job, skillGap, interview, careerPlan, agentRun: { runId: runId(), totalDurationMs: Math.max(3035, Date.now() - start), status: 'completed', model: 'demo-deterministic', steps }, generatedAt: now() };
}

export async function handlePlacementAnalysis(req: PlacementRequest): Promise<PlacementAnalysis> {
  if (!req.resumeText || req.resumeText.trim().length < 80) throw new Error('Resume content is too short.');
  if (!req.jobDescription || req.jobDescription.trim().length < 80) throw new Error('Job description is too short.');
  if (!req.careerGoal || req.careerGoal.trim().length < 2) throw new Error('Please specify a career goal.');
  const workflowStart = Date.now(); const run = runId(); const steps: AgentStep[] = [];
  const push = (id: string, agent: string, purpose: string, status: AgentStep['status'], startedAt: string, completedAt?: string, durationMs?: number, tokens?: number, detail?: string) => steps.push({ id, agent, purpose, status, startedAt, completedAt, durationMs, tokens, detail });
  try {
    const resumeStartedAt = now();
    const jobStartedAt = now();
    const [resumeResult, jobResult] = await Promise.all([
      callGemini(`You are the Resume Intelligence Agent. Extract only facts supported by the candidate resume. Do not invent skills, employers or experience.\nRESUME:\n${req.resumeText.slice(0, 24000)}`, resumeSchema),
      callGemini(`You are the Job Analysis Agent. Deeply decode the target role from the supplied job description. Separate explicit requirements from likely interview focus. Identify responsibilities, tech stack, soft skills, keywords, 5-8 high-impact focus areas, likely interview/assessment rounds, and example questions tightly grounded in the text. If rounds are not stated, label them as likely rather than certain in the wording. Do not invent employer facts.\nJOB DESCRIPTION:\n${req.jobDescription.slice(0, 24000)}`, jobSchema),
    ]);
    const resume = normalizeResume(resumeResult.data);
    push('resume','Resume Intelligence Agent','Structuring candidate experience and skills','completed',resumeStartedAt,now(),resumeResult.durationMs,resumeResult.tokens);
    const job = normalizeJob(jobResult.data);
    push('job','Job Analysis Agent','Decoding role requirements, focus areas and interview signals','completed',jobStartedAt,now(),jobResult.durationMs,jobResult.tokens);

    const start3 = now();
    const gapResult = await callGemini(`You are the Skill Gap Agent. Compare candidate evidence against the target role. Use only supplied evidence, do not infer proficiency from job titles alone, and avoid overconfident scores. Identify matched, partial and missing capabilities. For priority gaps, give practical actions a student can complete before the interview.\nCANDIDATE:\n${JSON.stringify(resume)}\nTARGET ROLE:\n${JSON.stringify(job)}`, gapSchema, 'Return valid JSON with an integer matchPercentage from 0 to 100 and concise arrays.');
    const skillGap = normalizeGap(gapResult.data); push('gap','Skill Gap Agent','Comparing candidate evidence with role requirements','completed',start3,now(),gapResult.durationMs,gapResult.tokens);

    const start4 = now();
    const combined = `You are the Interview Agent and Career Planner Agent. Generate role-specific interview questions and a seven-day plan using only this evidence. Questions should mirror the job's technologies, responsibilities, focus areas and candidate projects. Avoid generic filler.\nCANDIDATE:\n${JSON.stringify(resume)}\nJOB:\n${JSON.stringify(job)}\nSKILL GAP:\n${JSON.stringify(skillGap)}`;
    const finalResult = await callGemini<{ interviewPlan: unknown; careerPlan: unknown }>(`${combined}\n\nReturn JSON with interviewPlan and careerPlan.`, { type:'object', properties:{ interviewPlan: interviewPlanSchema, careerPlan: careerPlanSchema }, required:['interviewPlan','careerPlan'] }, 'Return both interviewPlan and careerPlan with complete sevenDayPlan data.');
    const interview = normalizeInterview(finalResult.data?.interviewPlan); const careerPlan = normalizePlan(finalResult.data?.careerPlan);
    push('interview','Interview Agent','Creating role-specific interview examples','completed',start4,now(),finalResult.durationMs,finalResult.tokens);
    push('planner','Career Planner Agent','Turning gaps into a preparation sprint','completed',start4,now(),finalResult.durationMs,finalResult.tokens);

    const validationStart = Date.now();
    if (!resume.skills.length && !resume.projects.length) throw new Error('Validation could not find enough resume evidence.');
    if (!job.requiredSkills.length && !job.responsibilities.length) throw new Error('Validation could not find enough job requirements.');
    if (!interview.questions.length || careerPlan.sevenDayPlan.length !== 7) throw new Error('Validation could not verify the generated training plan.');
    push('validator','Validation Layer','Checking structured output completeness','completed',now(),now(),Date.now()-validationStart,undefined,'Schema and required-field checks passed.');

    return { resume, job, skillGap, interview, careerPlan, agentRun:{ runId:run, totalDurationMs:Date.now()-workflowStart, status:'completed', model:getModel(), steps }, generatedAt:now() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown agent failure';
    steps.push({ id:'failure', agent:'Workflow', purpose:'Recovering from an agent failure', status:'failed', detail:message });
    if (error instanceof GeminiRequestError) throw error;
    throw new Error(message);
  }
}
