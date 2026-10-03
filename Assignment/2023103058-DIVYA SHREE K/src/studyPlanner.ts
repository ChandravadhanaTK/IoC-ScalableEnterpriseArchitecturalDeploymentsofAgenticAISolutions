import { StudyPlan, StudyPlanDay, Subject } from './types';

const TOPIC_MAP: Record<Subject, string[]> = {
  Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Integration', 'Limits'],
  Physics: ["Newton's Laws", 'Kinematics', 'Energy', 'Electricity', 'Waves', 'Gravitation', 'Momentum'],
  Chemistry: ['Atomic Structure', 'Chemical Bonds', 'Organic Chemistry', 'Acids and Bases', 'Periodic Table', 'Stoichiometry', 'Gas Laws'],
  'Computer Science': ['Data Structures', 'Algorithms', 'OOP', 'Programming', 'Databases', 'Networks'],
  'General Knowledge': ['Geography', 'History', 'Science', 'Literature', 'Current Affairs'],
};

export function generateStudyPlan(
  examDate: string,
  subjects: Subject[],
  weakTopics: string[],
  hoursPerDay: number
): StudyPlan {
  const today = new Date();
  const exam = new Date(examDate);
  const diffMs = exam.getTime() - today.getTime();
  const totalDays = Math.max(1, Math.ceil(diffMs / 86400000));

  const days: StudyPlanDay[] = [];
  const isReviewDay = (d: number) => (d + 1) % 6 === 0;
  const isMockDay = (d: number) => (d + 1) % 7 === 0;

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    const subject = subjects[d % subjects.length];
    const topics = TOPIC_MAP[subject] || ['General Review'];

    let topic: string;
    if (d === totalDays - 1) {
      topic = 'Final Review & Mock Exam';
    } else if (isMockDay(d) && d > 2) {
      topic = `Mock Test - ${subjects[d % subjects.length]}`;
    } else if (isReviewDay(d)) {
      topic = 'Review & Practice Quiz';
    } else if (weakTopics.length > 0) {
      topic = weakTopics[d % weakTopics.length];
    } else {
      topic = topics[d % topics.length];
    }

    days.push({
      dayNumber: d + 1,
      date: dateStr,
      sessions: [{ subject, topic, duration: hoursPerDay }],
      totalHours: hoursPerDay,
      isExamDay: d === totalDays - 1,
    });
  }

  return {
    examDate,
    subjects,
    weakTopics,
    hoursPerDay,
    days,
    createdAt: new Date().toISOString(),
  };
}
