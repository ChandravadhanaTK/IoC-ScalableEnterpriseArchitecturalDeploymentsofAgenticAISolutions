import { QuizResult, StudyPlan, User } from './types';

const KEYS = {
  user: 'quizmate_user',
  results: 'quizmate_results',
  plans: 'quizmate_plans',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getUser(): User | null {
    return read<User | null>(KEYS.user, null);
  },
  setUser(user: User | null) {
    if (user) write(KEYS.user, user);
    else localStorage.removeItem(KEYS.user);
  },

  getResults(): QuizResult[] {
    return read<QuizResult[]>(KEYS.results, []);
  },
  addResult(result: QuizResult) {
    const results = storage.getResults();
    results.unshift(result);
    write(KEYS.results, results);
  },
  clearResults() {
    localStorage.removeItem(KEYS.results);
  },

  getPlans(): StudyPlan[] {
    return read<StudyPlan[]>(KEYS.plans, []);
  },
  addPlan(plan: StudyPlan) {
    const plans = storage.getPlans();
    plans.unshift(plan);
    write(KEYS.plans, plans);
  },
};
