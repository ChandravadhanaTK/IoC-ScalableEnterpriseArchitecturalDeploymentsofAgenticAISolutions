import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

export type Page =
  | 'landing' | 'auth' | 'dashboard' | 'quizmate' | 'generate'
  | 'takequiz' | 'results' | 'progress' | 'history' | 'planner' | 'profile';

interface NavContextType {
  page: Page;
  navigate: (page: Page, params?: any) => void;
  params: any;
}

const NavContext = createContext<NavContextType | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('landing');
  const [params, setParams] = useState<any>(null);

  const navigate = useCallback((p: Page, params?: any) => {
    setPage(p);
    setParams(params ?? null);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <NavContext.Provider value={{ page, navigate, params }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
