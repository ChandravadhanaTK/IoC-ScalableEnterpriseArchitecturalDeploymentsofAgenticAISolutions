import type { Transaction, Budget, AppData } from '@/types';
import { generateId } from './storage';
import {
  getMonthlySummary,
  getCategorySpending,
  getRemainingBudget,
  getRecentTransactions,
  getOverBudgetCategories,
  getExpenseBreakdown,
  getBudgetVsActual,
  getExpenseComparison,
  getCategoryComparison,
} from './financeCalculations';
import { previousMonth } from './dateUtils';
import { formatCurrency, formatMonthLabel } from './formatters';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export function addTransaction(
  data: AppData,
  params: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }
): { result: ToolResult; updatedData: AppData } {
  const { type, amount, category, description, date } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      result: { success: false, message: 'Invalid amount. Please provide a positive number.' },
      updatedData: data,
    };
  }
  if (!category || !category.trim()) {
    return {
      result: { success: false, message: 'A category is required.' },
      updatedData: data,
    };
  }
  if (!description || !description.trim()) {
    return {
      result: { success: false, message: 'A description is required.' },
      updatedData: data,
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      result: { success: false, message: 'A valid date is required.' },
      updatedData: data,
    };
  }

  const transaction: Transaction = {
    id: generateId(),
    type,
    amount,
    category: category.trim(),
    description: description.trim(),
    date,
    createdAt: new Date().toISOString(),
  };

  const updatedData: AppData = {
    ...data,
    transactions: [...data.transactions, transaction],
  };

  return {
    result: {
      success: true,
      message: `Saved ${type} of ${formatCurrency(amount)} for ${category} on ${date}.`,
      data: transaction,
    },
    updatedData,
  };
}

export function getMonthlySummaryTool(data: AppData, month: string): ToolResult {
  const summary = getMonthlySummary(data.transactions, month);
  const message =
    `For ${formatMonthLabel(month)}:\n` +
    `  Income: ${formatCurrency(summary.totalIncome)}\n` +
    `  Expenses: ${formatCurrency(summary.totalExpenses)}\n` +
    `  Net balance: ${formatCurrency(summary.netBalance)}\n` +
    `  Transactions: ${summary.transactionCount}`;
  return { success: true, message, data: summary };
}

export function getCategorySpendingTool(data: AppData, category: string, month: string): ToolResult {
  const spent = getCategorySpending(data.transactions, category, month);
  return {
    success: true,
    message: `You spent ${formatCurrency(spent)} on ${category} in ${formatMonthLabel(month)}.`,
    data: { category, month, spent },
  };
}

export function getRemainingBudgetTool(data: AppData, category: string, month: string): ToolResult {
  const remaining = getRemainingBudget(data.budgets, data.transactions, category, month);
  const budget = data.budgets.find(
    (b) => b.month === month && b.category.toLowerCase() === category.toLowerCase()
  );
  if (!budget) {
    return {
      success: false,
      message: `No budget found for ${category} in ${formatMonthLabel(month)}. You can set one on the Budgets page.`,
    };
  }
  return {
    success: true,
    message: `Your remaining budget for ${category} in ${formatMonthLabel(month)} is ${formatCurrency(remaining)}.`,
    data: { category, month, remaining, limit: budget.monthlyLimit },
  };
}

export function getRecentTransactionsTool(data: AppData, limit: number): ToolResult {
  const recent = getRecentTransactions(data.transactions, limit);
  if (recent.length === 0) {
    return { success: true, message: 'You have no transactions yet.' };
  }
  const lines = recent.map((t) =>
    `  ${t.date} | ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} | ${t.category} — ${t.description}`
  );
  return {
    success: true,
    message: `Here are your ${recent.length} most recent transaction(s):\n${lines.join('\n')}`,
    data: recent,
  };
}

export function getOverBudgetCategoriesTool(data: AppData, month: string): ToolResult {
  const overBudget = getOverBudgetCategories(data.budgets, data.transactions, month);
  if (overBudget.length === 0) {
    return { success: true, message: `No categories are over or near budget for ${formatMonthLabel(month)}.` };
  }
  const lines = overBudget.map((s) => {
    const label = s.status === 'over' ? 'OVER' : s.status === 'reached' ? 'REACHED' : 'APPROACHING';
    return `  ${s.budget.category}: ${formatCurrency(s.spent)} of ${formatCurrency(s.budget.monthlyLimit)} (${label})`;
  });
  return {
    success: true,
    message: `Budget status for ${formatMonthLabel(month)}:\n${lines.join('\n')}`,
    data: overBudget,
  };
}

export function getSpendingAnalysisTool(data: AppData, month: string): ToolResult {
  const summary = getMonthlySummary(data.transactions, month);
  const breakdown = getExpenseBreakdown(data.transactions, month);
  const prevMonth = previousMonth(month);
  const comparison = getExpenseComparison(data.transactions, month, prevMonth);
  const budgetVsActual = getBudgetVsActual(data.budgets, data.transactions, month);

  const lines: string[] = [];
  lines.push(`Spending analysis for ${formatMonthLabel(month)}:`);
  lines.push(`  Total income: ${formatCurrency(summary.totalIncome)}`);
  lines.push(`  Total expenses: ${formatCurrency(summary.totalExpenses)}`);

  if (breakdown.length > 0) {
    lines.push('  Expense by category:');
    for (const c of breakdown) {
      lines.push(`    ${c.category}: ${formatCurrency(c.amount)} (${c.percentage.toFixed(1)}%)`);
    }
  }

  if (comparison.percentChange !== null) {
    const dir = comparison.difference >= 0 ? 'up' : 'down';
    lines.push(`  Compared to ${formatMonthLabel(prevMonth)}: expenses ${dir} by ${Math.abs(comparison.percentChange).toFixed(1)}%`);
  } else {
    lines.push(`  No comparable data from ${formatMonthLabel(prevMonth)}.`);
  }

  if (budgetVsActual.length > 0) {
    lines.push('  Budget vs actual:');
    for (const b of budgetVsActual) {
      lines.push(`    ${b.category}: ${formatCurrency(b.actual)} / ${formatCurrency(b.budget)}`);
    }
  }

  return { success: true, message: lines.join('\n'), data: { summary, breakdown, comparison, budgetVsActual } };
}

export function getCategoryComparisonTool(data: AppData, category: string, month: string): ToolResult {
  const prevMonth = previousMonth(month);
  const comp = getCategoryComparison(data.transactions, category, month, prevMonth);
  if (comp.percentChange !== null) {
    const dir = comp.difference >= 0 ? 'increase' : 'decrease';
    return {
      success: true,
      message: `${category}: ${formatCurrency(comp.current)} this month vs ${formatCurrency(comp.previous)} last month (${dir} of ${Math.abs(comp.percentChange).toFixed(1)}%).`,
    };
  }
  return {
    success: true,
    message: `${category}: ${formatCurrency(comp.current)} this month. No comparable data from last month for a percentage comparison.`,
  };
}


