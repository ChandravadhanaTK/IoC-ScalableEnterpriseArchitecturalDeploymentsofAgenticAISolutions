import { QuizResult, Subject, Question } from '../types';

export interface PerformanceAnalysis {
  totalQuizzes: number;
  averageScore: number;
  averagePercentage: number;
  overallAccuracy: number;
  bySubject: { subject: Subject; count: number; avgPercentage: number }[];
  byDifficulty: { difficulty: string; count: number; avgPercentage: number }[];
  strongTopics: { topic: string; accuracy: number; count: number }[];
  weakTopics: { topic: string; accuracy: number; count: number }[];
  recentScores: { id: string; subject: Subject; topic: string; percentage: number; date: string }[];
}

export function analyzePerformance(results: QuizResult[]): PerformanceAnalysis {
  if (results.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      averagePercentage: 0,
      overallAccuracy: 0,
      bySubject: [],
      byDifficulty: [],
      strongTopics: [],
      weakTopics: [],
      recentScores: [],
    };
  }

  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total, 0);
  const totalPercentage = results.reduce((s, r) => s + r.percentage, 0);

  const subjectMap = new Map<Subject, { count: number; pct: number }>();
  const diffMap = new Map<string, { count: number; pct: number }>();
  const topicMap = new Map<string, { correct: number; total: number }>();

  results.forEach(r => {
    const s = subjectMap.get(r.subject) || { count: 0, pct: 0 };
    s.count++; s.pct += r.percentage;
    subjectMap.set(r.subject, s);

    const d = diffMap.get(r.difficulty) || { count: 0, pct: 0 };
    d.count++; d.pct += r.percentage;
    diffMap.set(r.difficulty, d);

    r.questions.forEach((q, i) => {
      const ans = r.answers[i];
      const t = topicMap.get(q.topic) || { correct: 0, total: 0 };
      t.total++;
      if (ans === q.correct) t.correct++;
      topicMap.set(q.topic, t);
    });
  });

  const bySubject = Array.from(subjectMap.entries()).map(([subject, v]) => ({
    subject, count: v.count, avgPercentage: Math.round(v.pct / v.count),
  })).sort((a, b) => b.avgPercentage - a.avgPercentage);

  const byDifficulty = Array.from(diffMap.entries()).map(([difficulty, v]) => ({
    difficulty, count: v.count, avgPercentage: Math.round(v.pct / v.count),
  }));

  const topicStats = Array.from(topicMap.entries()).map(([topic, v]) => ({
    topic, accuracy: Math.round((v.correct / v.total) * 100), count: v.total,
  })).sort((a, b) => a.accuracy - b.accuracy);

  const strongTopics = topicStats.filter(t => t.accuracy >= 70).slice(-5).reverse();
  const weakTopics = topicStats.filter(t => t.accuracy < 60).slice(0, 5);

  const recentScores = results.slice(0, 10).map(r => ({
    id: r.id, subject: r.subject, topic: r.topic,
    percentage: r.percentage, date: r.completedAt,
  }));

  return {
    totalQuizzes: results.length,
    averageScore: Math.round(totalScore / results.length * 10) / 10,
    averagePercentage: Math.round(totalPercentage / results.length),
    overallAccuracy: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    bySubject,
    byDifficulty,
    strongTopics,
    weakTopics,
    recentScores,
  };
}

export function recommendTopics(results: QuizResult[]): { topic: string; subject: Subject; reason: string }[] {
  const analysis = analyzePerformance(results);
  if (analysis.totalQuizzes === 0) {
    return [
      { topic: 'Algebra', subject: 'Mathematics', reason: 'Start with fundamentals' },
      { topic: "Newton's Laws", subject: 'Physics', reason: 'Core physics concept' },
      { topic: 'Periodic Table', subject: 'Chemistry', reason: 'Foundation of chemistry' },
    ];
  }
  const result = new Map<string, { topic: string; subject: Subject; reason: string }>();
  const topicToSubject = new Map<string, Subject>();
  results.forEach(r => r.questions.forEach(q => topicToSubject.set(q.topic, r.subject)));

  analysis.weakTopics.forEach(wt => {
    const subject = topicToSubject.get(wt.topic) || 'Mathematics';
    result.set(wt.topic, {
      topic: wt.topic,
      subject,
      reason: `Accuracy at ${wt.accuracy}% — needs improvement`,
    });
  });

  if (result.size < 3) {
    const subjectsCovered = new Set(results.map(r => r.subject));
    const allSubjects: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'General Knowledge'];
    allSubjects.filter(s => !subjectsCovered.has(s)).slice(0, 3 - result.size).forEach(s => {
      const defaultTopics: Record<Subject, string> = {
        Mathematics: 'Calculus',
        Physics: 'Energy',
        Chemistry: 'Organic Chemistry',
        'Computer Science': 'Algorithms',
        'General Knowledge': 'Geography',
      };
      result.set(s, { topic: defaultTopics[s], subject: s, reason: 'New subject to explore' });
    });
  }

  return Array.from(result.values()).slice(0, 5);
}
