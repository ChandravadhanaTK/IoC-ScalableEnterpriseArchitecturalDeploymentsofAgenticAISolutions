import type { Transaction, Budget } from '@/types';
import { dateInMonth } from './dateUtils';

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export function getTransactionsForMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => dateInMonth(t.date, month));
}

export function getMonthlySummary(transactions: Transaction[], month: string): MonthlySummary {
  const monthTx = getTransactionsForMonth(transactions, month);
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of monthTx) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }
  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: monthTx.length,
  };
}

export function getCategorySpending(transactions: Transaction[], category: string, month: string): number {
  return getTransactionsForMonth(transactions, month)
    .filter((t) => t.type === 'expense' && t.category.toLowerCase() === category.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryIncome(transactions: Transaction[], category: string, month: string): number {
  return getTransactionsForMonth(transactions, month)
    .filter((t) => t.type === 'income' && t.category.toLowerCase() === category.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export function getExpenseBreakdown(transactions: Transaction[], month: string): CategoryBreakdown[] {
  const monthExpenses = getTransactionsForMonth(transactions, month).filter((t) => t.type === 'expense');
  const totals: Record<string, number> = {};
  for (const t of monthExpenses) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getBudgetsForMonth(budgets: Budget[], month: string): Budget[] {
  return budgets.filter((b) => b.month === month);
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'normal' | 'approaching' | 'reached' | 'over';
}

export function getBudgetStatus(budget: Budget, transactions: Transaction[]): BudgetStatus {
  const spent = getCategorySpending(transactions, budget.category, budget.month);
  const remaining = budget.monthlyLimit - spent;
  const percentUsed = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
  let status: BudgetStatus['status'] = 'normal';
  if (percentUsed > 100) status = 'over';
  else if (percentUsed === 100) status = 'reached';
  else if (percentUsed >= 80) status = 'approaching';
  return { budget, spent, remaining, percentUsed, status };
}

export function getBudgetStatuses(budgets: Budget[], transactions: Transaction[], month: string): BudgetStatus[] {
  return getBudgetsForMonth(budgets, month).map((b) => getBudgetStatus(b, transactions));
}

export function getRemainingBudget(budgets: Budget[], transactions: Transaction[], category: string, month: string): number {
  const budget = budgets.find(
    (b) => b.month === month && b.category.toLowerCase() === category.toLowerCase()
  );
  if (!budget) return 0;
  return budget.monthlyLimit - getCategorySpending(transactions, category, month);
}

export function getTotalRemainingBudget(budgets: Budget[], transactions: Transaction[], month: string): number {
  const statuses = getBudgetStatuses(budgets, transactions, month);
  return statuses.reduce((sum, s) => sum + s.remaining, 0);
}

export function getOverBudgetCategories(budgets: Budget[], transactions: Transaction[], month: string): BudgetStatus[] {
  return getBudgetStatuses(budgets, transactions, month).filter((s) => s.status === 'over' || s.status === 'reached' || s.status === 'approaching');
}

export function getRecentTransactions(transactions: Transaction[], limit: number): Transaction[] {
  return [...transactions]
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, limit);
}

export interface BudgetVsActual {
  category: string;
  budget: number;
  actual: number;
}

export function getBudgetVsActual(budgets: Budget[], transactions: Transaction[], month: string): BudgetVsActual[] {
  return getBudgetsForMonth(budgets, month).map((b) => ({
    category: b.category,
    budget: b.monthlyLimit,
    actual: getCategorySpending(transactions, b.category, b.month),
  }));
}

export interface MonthComparison {
  current: number;
  previous: number;
  difference: number;
  percentChange: number | null;
}

export function getExpenseComparison(
  transactions: Transaction[],
  currentMonth: string,
  previousMonth: string
): MonthComparison {
  const current = getMonthlySummary(transactions, currentMonth).totalExpenses;
  const previous = getMonthlySummary(transactions, previousMonth).totalExpenses;
  const difference = current - previous;
  const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : null;
  return { current, previous, difference, percentChange };
}

export function getCategoryComparison(
  transactions: Transaction[],
  category: string,
  currentMonth: string,
  previousMonth: string
): MonthComparison {
  const current = getCategorySpending(transactions, category, currentMonth);
  const previous = getCategorySpending(transactions, category, previousMonth);
  const difference = current - previous;
  const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : null;
  return { current, previous, difference, percentChange };
}
