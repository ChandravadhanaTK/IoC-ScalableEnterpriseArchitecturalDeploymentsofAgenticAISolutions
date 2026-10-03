export interface ResumeProfile {
  candidateName: string;
  headline: string;
  skills: string[];
  languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
  cloud: string[];
  projects: Array<{ name: string; summary: string; technologies: string[] }>;
  education: Array<{ degree: string; institution: string; details: string }>;
  certifications: string[];
}

export interface JobFocusArea {
  area: string;
  priority: 'critical' | 'high' | 'medium';
  why: string;
  suggestedTopics: string[];
}

export interface InterviewRound {
  round: string;
  purpose: string;
  questionTypes: string[];
  exampleQuestions: string[];
}

export interface JobProfile {
  role: string;
  company: string;
  seniority: string;
  roleSummary: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  technologies: string[];
  softSkills: string[];
  keywords: string[];
  focusAreas: JobFocusArea[];
  interviewRounds: InterviewRound[];
  exampleQuestions: string[];
  signals: string[];
}

export interface SkillGapItem {
  skill: string;
  reason: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SkillGapResult {
  matchPercentage: number;
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  priorityGaps: SkillGapItem[];
  strengths: string[];
  summary: string;
}

export interface PreparationDay {
  day: number;
  focus: string;
  tasks: string[];
  minutes: number;
}

export type QuestionType = 'mcq' | 'coding' | 'technical' | 'behavioral' | 'project' | 'system-design' | 'case';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface InterviewQuestion {
  category: 'technical' | 'behavioral' | 'project' | 'system-design';
  question: string;
  whatGoodLooksLike: string;
}

export interface InterviewPlan {
  questions: InterviewQuestion[];
  focusAreas: string[];
}

export interface CareerPlan {
  headline: string;
  summary: string;
  sevenDayPlan: PreparationDay[];
  nextActions: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface TrainingQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  title: string;
  prompt: string;
  options?: string[];
  answerIndex?: number;
  starterCode?: string;
  examples?: Array<{ input: string; output: string }>;
  timeLimitMinutes: number;
  skills: string[];
  evaluationRubric: string[];
  hints?: string[];
  referenceAnswer?: string;
  referenceExplanation?: string;
}

export interface TrainingCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface TrainingEvaluation {
  score: number;
  verdict: 'strong' | 'good' | 'needs-work' | 'redo';
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
  criteria?: TrainingCriterion[];
  tested?: boolean;
}

export type AgentStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentStep {
  id: string;
  agent: string;
  purpose: string;
  status: AgentStatus;
  durationMs?: number;
  tokens?: number;
  detail?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PlacementAnalysis {
  resume: ResumeProfile;
  job: JobProfile;
  skillGap: SkillGapResult;
  interview: InterviewPlan;
  careerPlan: CareerPlan;
  agentRun: {
    runId: string;
    totalDurationMs: number;
    status: 'completed' | 'failed';
    model: string;
    steps: AgentStep[];
  };
  generatedAt: string;
}

export interface PlacementRequest {
  resumeText: string;
  jobDescription: string;
  careerGoal: string;
}

export interface TrainingRequest {
  mode: 'generate' | 'evaluate';
  type: QuestionType;
  difficulty: Difficulty;
  job: JobProfile;
  skillGap: SkillGapResult;
  resume: ResumeProfile;
  question?: TrainingQuestion;
  answer?: string;
  selectedOption?: number;
  recentQuestionIds?: string[];
  recentQuestionFingerprints?: string[];
}

export interface StoredRun {
  id: string;
  createdAt: string;
  jobTitle: string;
  company: string;
  matchPercentage: number;
  steps: AgentStep[];
}
