import { useCallback, useEffect, useState } from 'react';
import type { AppData, Transaction, Budget } from '@/types';
import { loadData, saveData, generateId } from '@/lib/storage';
import { createDemoData } from '@/lib/demoData';

export function useFinanceData() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existing = loadData();
    if (existing) {
      setData(existing);
    } else {
      const demo = createDemoData();
      const ok = saveData(demo);
      if (ok) {
        setData(demo);
      } else {
        setError('Unable to save data to local storage. Changes may not persist.');
        setData(demo);
      }
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((newData: AppData): boolean => {
    const ok = saveData(newData);
    if (!ok) {
      setError('Failed to save to local storage. Your change may not persist after refresh.');
    } else {
      setError(null);
    }
    setData(newData);
    return ok;
  }, []);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>): boolean => {
      if (!data) return false;
      const newTx: Transaction = {
        ...tx,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      return persist({ ...data, transactions: [...data.transactions, newTx] });
    },
    [data, persist]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): boolean => {
      if (!data) return false;
      const newData = {
        ...data,
        transactions: data.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      };
      return persist(newData);
    },
    [data, persist]
  );

  const deleteTransaction = useCallback(
    (id: string): boolean => {
      if (!data) return false;
      return persist({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
    },
    [data, persist]
  );

  const addBudget = useCallback(
    (budget: Omit<Budget, 'id'>): boolean => {
      if (!data) return false;
      // Prevent duplicates
      const exists = data.budgets.some(
        (b) => b.month === budget.month && b.category.toLowerCase() === budget.category.toLowerCase()
      );
      if (exists) {
        setError(`A budget for ${budget.category} in ${budget.month} already exists.`);
        return false;
      }
      const newBudget: Budget = { ...budget, id: generateId() };
      return persist({ ...data, budgets: [...data.budgets, newBudget] });
    },
    [data, persist]
  );

  const updateBudget = useCallback(
    (id: string, updates: Partial<Omit<Budget, 'id'>>): boolean => {
      if (!data) return false;
      const newData = {
        ...data,
        budgets: data.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      };
      return persist(newData);
    },
    [data, persist]
  );

  const deleteBudget = useCallback(
    (id: string): boolean => {
      if (!data) return false;
      return persist({ ...data, budgets: data.budgets.filter((b) => b.id !== id) });
    },
    [data, persist]
  );

  const resetDemoData = useCallback((): boolean => {
    const demo = createDemoData();
    return persist(demo);
  }, [persist]);

  const setDataDirect = useCallback(
    (newData: AppData): boolean => {
      return persist(newData);
    },
    [persist]
  );

  return {
    data,
    error,
    loaded,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    resetDemoData,
    setDataDirect,
  };
}
