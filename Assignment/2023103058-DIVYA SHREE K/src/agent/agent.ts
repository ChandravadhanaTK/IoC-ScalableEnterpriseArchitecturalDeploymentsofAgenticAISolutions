import { generateQuiz } from '../questionBank';
import { analyzePerformance, recommendTopics } from './analyzer';
import { QuizConfig, QuizResult, Subject, Question, Difficulty } from '../types';
import { storage } from '../storage';

export interface AgentResponse {
  message: string;
  action?: { tool: string; label: string };
  quiz?: Question[];
  quizConfig?: QuizConfig;
  studyPlan?: any;
}

type StepCallback = (phase: string, label: string, status: 'pending' | 'active' | 'done') => void;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseSubject(text: string): Subject | null {
  const t = text.toLowerCase();
  if (t.includes('math')) return 'Mathematics';
  if (t.includes('physic')) return 'Physics';
  if (t.includes('chem')) return 'Chemistry';
  if (t.includes('computer') || t.includes('coding') || t.includes('programming') || t.includes('cs ')) return 'Computer Science';
  if (t.includes('general') || t.includes('knowledge') || t.includes('gk')) return 'General Knowledge';
  return null;
}

function parseDifficulty(text: string): Difficulty {
  const t = text.toLowerCase();
  if (t.includes('hard') || t.includes('difficult') || t.includes('challeng') || t.includes('tough')) return 'Hard';
  if (t.includes('medium') || t.includes('moderate') || t.includes('normal')) return 'Medium';
  if (t.includes('easy') || t.includes('simple') || t.includes('basic')) return 'Easy';
  return 'Medium';
}

function parseTopic(text: string): string {
  const t = text.toLowerCase();
  const subjectKeywords = ['math', 'physic', 'chem', 'computer', 'coding', 'programming', 'general knowledge', 'biology', 'quiz', 'study plan', 'study', 'revise', 'weak', 'create', 'generate', 'difficult', 'easy', 'hard', 'medium', 'questions', 'me on'];
  let cleaned = t.replace(/\b(quiz|me|on|create|generate|a|an|the|make|give|test|about|of|for|please|can you|i am|i'm|im|want|need|help|my|in|with|should|what|revise|do|to)\b/g, ' ');
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !subjectKeywords.includes(w));
  return words.slice(0, 4).join(' ').trim();
}

function parseCount(text: string): 5 | 10 | 15 | 20 {
  const match = text.match(/(\d+)\s*(question|q|quiz)/i);
  if (match) {
    const n = parseInt(match[1]);
    if (n <= 5) return 5;
    if (n <= 10) return 10;
    if (n <= 15) return 15;
    return 20;
  }
  return 10;
}

export async function runAgent(
  input: string,
  results: QuizResult[],
  onStep: StepCallback
): Promise<AgentResponse> {
  const steps = [
    { phase: 'Understanding', label: 'Parsing your request' },
    { phase: 'Planning', label: 'Determining the best approach' },
    { phase: 'Selecting Tool', label: 'Choosing the right tool' },
    { phase: 'Executing', label: 'Running the selected tool' },
    { phase: 'Responding', label: 'Formulating your answer' },
  ];

  for (let i = 0; i < steps.length; i++) {
    for (let j = 0; j < i; j++) onStep(steps[j].phase, steps[j].label, 'done');
    onStep(steps[i].phase, steps[i].label, 'active');
    for (let j = i + 1; j < steps.length; j++) onStep(steps[j].phase, steps[j].label, 'pending');
    await delay(450);
  }

  const intent = detectIntent(input);

  // Execute
  onStep('Executing', steps[3].label, 'active');
  let response: AgentResponse;

  if (intent === 'quiz') {
    response = await handleGenerateQuiz(input, onStep);
  } else if (intent === 'performance') {
    response = handleAnalyzePerformance(results, onStep);
  } else if (intent === 'recommend') {
    response = handleRecommendTopics(results, onStep);
  } else if (intent === 'studyplan') {
    response = handleCreateStudyPlan(input, results, onStep);
  } else if (intent === 'explain') {
    response = handleExplain(results, onStep);
  } else {
    response = handleGeneral(input, results, onStep);
  }

  for (const s of steps) onStep(s.phase, s.label, 'done');
  return response;
}

type Intent = 'quiz' | 'performance' | 'recommend' | 'studyplan' | 'explain' | 'general';

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (t.includes('study plan') || t.includes('study schedule') || t.includes('plan for')) return 'studyplan';
  if (t.includes('quiz me') || t.includes('generate') || t.includes('create') && t.includes('quiz') || t.includes('make a quiz') || t.includes('test me') || t.includes('give me a quiz')) return 'quiz';
  if (t.includes('performance') || t.includes('how am i doing') || t.includes('my progress') || t.includes('analyze')) return 'performance';
  if (t.includes('recommend') || t.includes('what should i') || t.includes('suggest') || t.includes('weak') || t.includes('improve') || t.includes('revise')) return 'recommend';
  if (t.includes('explain') || t.includes('why') || t.includes('how does') || t.includes('what is')) return 'explain';
  if (t.includes('quiz') || t.includes('test')) return 'quiz';
  return 'general';
}

async function handleGenerateQuiz(input: string, onStep: StepCallback): Promise<AgentResponse> {
  const subject = parseSubject(input) || 'General Knowledge';
  const difficulty = parseDifficulty(input);
  const topic = parseTopic(input);
  const numQuestions = parseCount(input);

  const config: QuizConfig = {
    subject,
    topic,
    difficulty,
    numQuestions,
    type: 'MCQ',
  };

  onStep('Selecting Tool', 'generateQuiz()', 'active');
  await delay(300);
  const quiz = generateQuiz(config);

  return {
    message: `I've generated a **${difficulty}** ${subject} quiz${topic ? ` on **${topic}**` : ''} with **${quiz.length} questions**. You can start taking it now!`,
    action: { tool: 'generateQuiz()', label: `Created ${quiz.length} ${difficulty} ${subject} questions` },
    quiz,
    quizConfig: config,
  };
}

function handleAnalyzePerformance(results: QuizResult[], onStep: StepCallback): AgentResponse {
  onStep('Selecting Tool', 'analyzePerformance()', 'active');
  const analysis = analyzePerformance(results);

  if (analysis.totalQuizzes === 0) {
    return {
      message: "You haven't completed any quizzes yet! Take a quiz first and I'll analyze your performance in detail — strengths, weaknesses, accuracy trends, and personalized recommendations.",
      action: { tool: 'analyzePerformance()', label: 'No data yet' },
    };
  }

  const msg = `Here's your performance analysis:\n\n• **Quizzes completed:** ${analysis.totalQuizzes}\n• **Average score:** ${analysis.averagePercentage}%\n• **Overall accuracy:** ${analysis.overallAccuracy}%\n\n**Strong areas:** ${analysis.strongTopics.map(t => `${t.topic} (${t.accuracy}%)`).join(', ') || 'None yet'}\n\n**Areas to improve:** ${analysis.weakTopics.map(t => `${t.topic} (${t.accuracy}%)`).join(', ') || 'None — great job!'}\n\nKeep practicing your weak topics to boost your overall accuracy.`;

  return {
    message: msg,
    action: { tool: 'analyzePerformance()', label: `Analyzed ${analysis.totalQuizzes} quizzes` },
  };
}

function handleRecommendTopics(results: QuizResult[], onStep: StepCallback): AgentResponse {
  onStep('Selecting Tool', 'recommendTopics()', 'active');
  const recs = recommendTopics(results);

  if (recs.length === 0) {
    return {
      message: "Take a few quizzes and I'll recommend specific topics to focus on based on your performance!",
      action: { tool: 'recommendTopics()', label: 'Need more data' },
    };
  }

  const msg = `Based on your performance, here's what I recommend:\n\n${recs.map((r, i) => `${i + 1}. **${r.topic}** (${r.subject}) — ${r.reason}`).join('\n')}\n\nWant me to generate a quiz on any of these topics? Just say "Quiz me on [topic]".`;

  return {
    message: msg,
    action: { tool: 'recommendTopics()', label: `Found ${recs.length} recommendations` },
  };
}

function handleCreateStudyPlan(input: string, results: QuizResult[], onStep: StepCallback): AgentResponse {
  onStep('Selecting Tool', 'createStudyPlan()', 'active');

  const subject = parseSubject(input);
  const subjects: Subject[] = subject ? [subject] : Array.from(new Set(results.map(r => r.subject)));
  const weakTopics = analyzePerformance(results).weakTopics.map(t => t.topic);

  const dateMatch = input.match(/(\d{1,2})\s*(days|weeks|months)/i);
  let days = 7;
  if (dateMatch) {
    const n = parseInt(dateMatch[1]);
    const unit = dateMatch[2].toLowerCase();
    days = unit === 'weeks' ? n * 7 : unit === 'months' ? n * 30 : n;
  }

  const plan = generateStudyPlanLocal(subjects.length > 0 ? subjects : ['Mathematics'], weakTopics, days, 2);

  const msg = `I've created a personalized **${days}-day study plan**${subject ? ` focused on ${subject}` : ''}.${weakTopics.length > 0 ? ` I've prioritized your weak topics: ${weakTopics.join(', ')}.` : ''} Check the Study Planner page for the full schedule!`;

  return {
    message: msg,
    action: { tool: 'createStudyPlan()', label: `Generated ${days}-day plan` },
    studyPlan: plan,
  };
}

function handleExplain(results: QuizResult[], onStep: StepCallback): AgentResponse {
  onStep('Selecting Tool', 'explainAnswer()', 'active');
  const lastResult = results[0];

  if (!lastResult) {
    return {
      message: "I can explain answers from your recent quizzes! Take a quiz first, and then ask me to explain any question or concept you're unsure about.",
      action: { tool: 'explainAnswer()', label: 'No quiz data' },
    };
  }

  const wrongQs = lastResult.questions.filter((q, i) => lastResult.answers[i] !== q.correct);
  if (wrongQs.length === 0) {
    return {
      message: `Great news — you got everything right in your last quiz on ${lastResult.topic}! If you want explanations for specific concepts, just ask.`,
      action: { tool: 'explainAnswer()', label: 'All correct' },
    };
  }

  const q = wrongQs[0];
  const msg = `Here's an explanation from your last quiz:\n\n**Question:** ${q.question}\n\n**Correct answer:** ${q.options[q.correct]}\n\n**Why:** ${q.explanation}\n\nWould you like me to generate a practice quiz on ${q.topic} to help reinforce this?`;

  return {
    message: msg,
    action: { tool: 'explainAnswer()', label: `Explained ${q.topic} question` },
  };
}

function handleGeneral(input: string, results: QuizResult[], onStep: StepCallback): AgentResponse {
  return {
    message: `I'm QuizMate, your AI learning assistant! Here's what I can do:\n\n• **Generate quizzes** — say "Quiz me on cell biology" or "Create a hard Physics quiz"\n• **Analyze performance** — ask "How am I doing?" or "Analyze my progress"\n• **Recommend topics** — ask "What should I revise?"\n• **Create study plans** — say "Create a study plan for Chemistry"\n• **Explain answers** — ask me to explain any concept\n\nWhat would you like to do?`,
    action: { tool: 'help()', label: 'Showing capabilities' },
  };
}

function generateStudyPlanLocal(subjects: Subject[], weakTopics: string[], days: number, hoursPerDay: number) {
  const planDays = [];
  const today = new Date();
  const topicsBySubject: Record<string, string[]> = {
    Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Statistics', 'Integration'],
    Physics: ["Newton's Laws", 'Energy', 'Kinematics', 'Electricity', 'Waves'],
    Chemistry: ['Atomic Structure', 'Chemical Bonds', 'Organic Chemistry', 'Acids and Bases', 'Periodic Table'],
    'Computer Science': ['Data Structures', 'Algorithms', 'OOP', 'Programming', 'Databases'],
    'General Knowledge': ['Geography', 'History', 'Science', 'Literature'],
  };

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const subject = subjects[d % subjects.length];
    const topics = topicsBySubject[subject] || ['General Review'];
    const isReviewDay = (d + 1) % 5 === 0;
    const topic = isReviewDay ? 'Review & Practice' : (weakTopics[d % Math.max(weakTopics.length, 1)] || topics[d % topics.length]);

    planDays.push({
      dayNumber: d + 1,
      date: date.toISOString().split('T')[0],
      sessions: [{ subject, topic, duration: hoursPerDay }],
      totalHours: hoursPerDay,
      isExamDay: false,
    });
  }

  return {
    examDate: new Date(today.getTime() + days * 86400000).toISOString().split('T')[0],
    subjects,
    weakTopics,
    hoursPerDay,
    days: planDays,
    createdAt: new Date().toISOString(),
  };
}

export { generateStudyPlanLocal as generateStudyPlan };
