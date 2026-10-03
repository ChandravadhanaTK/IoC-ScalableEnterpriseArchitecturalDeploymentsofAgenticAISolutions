export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Subject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Computer Science' | 'General Knowledge';
export type QuestionType = 'MCQ' | 'True-False' | 'Mixed';
export type AgentPhase = 'Understanding' | 'Planning' | 'Selecting Tool' | 'Executing' | 'Responding';

export interface Question {
  id: string;
  type: 'MCQ' | 'True-False';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
  difficulty: Difficulty;
}

export interface QuizConfig {
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  numQuestions: 5 | 10 | 15 | 20;
  type: QuestionType;
}

export interface QuizResult {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  questions: Question[];
  answers: (number | null)[];
  score: number;
  total: number;
  percentage: number;
  accuracy: number;
  completedAt: string;
}

export interface StudyPlan {
  examDate: string;
  subjects: Subject[];
  weakTopics: string[];
  hoursPerDay: number;
  days: StudyPlanDay[];
  createdAt: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  date: string;
  sessions: { subject: Subject; topic: string; duration: number }[];
  totalHours: number;
  isExamDay: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AgentStep {
  phase: AgentPhase;
  label: string;
  status: 'pending' | 'active' | 'done';
}

export interface AgentAction {
  tool: string;
  description: string;
}

export const SUBJECTS: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'General Knowledge'];
