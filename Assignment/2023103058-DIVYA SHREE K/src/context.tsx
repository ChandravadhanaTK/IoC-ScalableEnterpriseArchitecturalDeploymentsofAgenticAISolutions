import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, QuizResult, StudyPlan } from './types';
import { storage } from './storage';

interface AppContextType {
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  results: QuizResult[];
  addResult: (r: QuizResult) => void;
  plans: StudyPlan[];
  addPlan: (p: StudyPlan) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);

  useEffect(() => {
    setUser(storage.getUser());
    setResults(storage.getResults());
    setPlans(storage.getPlans());
  }, []);

  const login = (name: string, email: string) => {
    const u: User = { id: `u-${Date.now()}`, name, email, createdAt: new Date().toISOString() };
    storage.setUser(u);
    setUser(u);
  };

  const logout = () => {
    storage.setUser(null);
    setUser(null);
  };

  const addResult = (r: QuizResult) => {
    storage.addResult(r);
    setResults(storage.getResults());
  };

  const addPlan = (p: StudyPlan) => {
    storage.addPlan(p);
    setPlans(storage.getPlans());
  };

  return (
    <AppContext.Provider value={{ user, login, logout, results, addResult, plans, addPlan }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
