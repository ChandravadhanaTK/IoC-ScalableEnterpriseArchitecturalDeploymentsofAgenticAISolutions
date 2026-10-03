import type { AppData, Transaction, Budget } from '@/types';

const STORAGE_KEY = 'finmate:data:v1';
const DATA_VERSION = 1;

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeData(parsed);
  } catch {
    return null;
  }
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasData(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeData(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.transactions) || !Array.isArray(obj.budgets)) return null;

  const transactions = obj.transactions
    .map(normalizeTransaction)
    .filter((t): t is Transaction => t !== null);
  const budgets = obj.budgets
    .map(normalizeBudget)
    .filter((b): b is Budget => b !== null);

  return { version: DATA_VERSION, transactions, budgets };
}

function normalizeTransaction(raw: unknown): Transaction | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  if (t.type !== 'income' && t.type !== 'expense') return null;
  const amount = Number(t.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (typeof t.category !== 'string' || typeof t.description !== 'string') return null;
  if (typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return null;
  const createdAt = typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString();
  const id = typeof t.id === 'string' && t.id ? t.id : generateId();
  return {
    id,
    type: t.type,
    amount,
    category: t.category,
    description: t.description,
    date: t.date,
    createdAt,
  };
}

function normalizeBudget(raw: unknown): Budget | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;
  const monthlyLimit = Number(b.monthlyLimit);
  if (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0) return null;
  if (typeof b.category !== 'string' || typeof b.month !== 'string') return null;
  if (!/^\d{4}-\d{2}$/.test(b.month)) return null;
  const id = typeof b.id === 'string' && b.id ? b.id : generateId();
  return { id, category: b.category, monthlyLimit, month: b.month };
}

export { STORAGE_KEY, DATA_VERSION };
