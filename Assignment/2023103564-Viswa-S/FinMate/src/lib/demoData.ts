import type { AppData, Transaction, Budget } from '@/types';
import { generateId } from './storage';
import { todayISO, currentMonth, previousMonth, dateToISO } from './dateUtils';

export function createDemoData(): AppData {
  const now = new Date();
  const thisMonth = currentMonth(now);
  const prevMonth = previousMonth(thisMonth);

  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];

  // Helper to create a date in a given month
  const dayInMonth = (month: string, day: number): string => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    return dateToISO(d);
  };

  // --- Current month transactions ---
  const t = todayISO();

  transactions.push(
    { id: generateId(), type: 'income', amount: 35000, category: 'Salary', description: 'Monthly salary', date: dayInMonth(thisMonth, 1), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'income', amount: 5000, category: 'Freelance', description: 'Web design project', date: dayInMonth(thisMonth, 8), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 8500, category: 'Housing', description: 'Monthly rent', date: dayInMonth(thisMonth, 2), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 420, category: 'Food & Dining', description: 'Groceries', date: dayInMonth(thisMonth, 3), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 250, category: 'Food & Dining', description: 'Lunch with friends', date: dayInMonth(thisMonth, 5), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 180, category: 'Transport', description: 'Fuel', date: dayInMonth(thisMonth, 6), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 1200, category: 'Bills & Utilities', description: 'Electricity bill', date: dayInMonth(thisMonth, 7), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 650, category: 'Shopping', description: 'New shoes', date: dayInMonth(thisMonth, 9), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 320, category: 'Entertainment', description: 'Movie night', date: dayInMonth(thisMonth, 10), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 1500, category: 'Education', description: 'Online course', date: Math.min(Number(t.split('-')[2]), 15) >= 12 ? dayInMonth(thisMonth, 12) : dayInMonth(thisMonth, 12), createdAt: new Date().toISOString() },
  );

  // --- Previous month transactions ---
  transactions.push(
    { id: generateId(), type: 'income', amount: 35000, category: 'Salary', description: 'Monthly salary', date: dayInMonth(prevMonth, 1), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'income', amount: 2000, category: 'Allowance', description: 'Monthly allowance', date: dayInMonth(prevMonth, 5), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 8500, category: 'Housing', description: 'Monthly rent', date: dayInMonth(prevMonth, 2), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 380, category: 'Food & Dining', description: 'Groceries', date: dayInMonth(prevMonth, 3), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 220, category: 'Food & Dining', description: 'Dinner out', date: dayInMonth(prevMonth, 7), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 200, category: 'Transport', description: 'Bus pass', date: dayInMonth(prevMonth, 6), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 1100, category: 'Bills & Utilities', description: 'Electricity bill', date: dayInMonth(prevMonth, 8), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 800, category: 'Shopping', description: 'Winter jacket', date: dayInMonth(prevMonth, 10), createdAt: new Date().toISOString() },
    { id: generateId(), type: 'expense', amount: 450, category: 'Health', description: 'Pharmacy', date: dayInMonth(prevMonth, 12), createdAt: new Date().toISOString() },
  );

  // --- Budgets for current month ---
  budgets.push(
    { id: generateId(), category: 'Food & Dining', monthlyLimit: 3000, month: thisMonth },
    { id: generateId(), category: 'Transport', monthlyLimit: 1000, month: thisMonth },
    { id: generateId(), category: 'Shopping', monthlyLimit: 2000, month: thisMonth },
    { id: generateId(), category: 'Entertainment', monthlyLimit: 500, month: thisMonth },
  );

  // --- Budget for previous month ---
  budgets.push(
    { id: generateId(), category: 'Food & Dining', monthlyLimit: 3000, month: prevMonth },
  );

  return {
    version: 1,
    transactions,
    budgets,
  };
}
