import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import type { AppData } from '@/types';
import {
  getMonthlySummary,
  getExpenseBreakdown,
  getBudgetVsActual,
  getExpenseComparison,
  getCategoryComparison,
  getCategorySpending,
} from '@/lib/financeCalculations';
import { formatCurrency, formatCurrencyShort, formatMonthLabel, formatPercent } from '@/lib/formatters';
import { lastNMonths, currentMonth, previousMonth } from '@/lib/dateUtils';
import { Card, EmptyState, MonthSelector, SummaryCard } from '@/components/ui';

const CHART_COLORS = [
  '#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#64748b',
];

const SPENDING_INCREASE_THRESHOLD = 15; // percent

interface AnalysisPageProps {
  data: AppData;
}

export function AnalysisPage({ data }: AnalysisPageProps) {
  const months = useMemo(() => lastNMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const prevMonth = previousMonth(selectedMonth);

  const summary = useMemo(() => getMonthlySummary(data.transactions, selectedMonth), [data, selectedMonth]);
  const breakdown = useMemo(() => getExpenseBreakdown(data.transactions, selectedMonth), [data, selectedMonth]);
  const budgetVsActual = useMemo(() => getBudgetVsActual(data.budgets, data.transactions, selectedMonth), [data, selectedMonth]);
  const expenseComparison = useMemo(() => getExpenseComparison(data.transactions, selectedMonth, prevMonth), [data, selectedMonth, prevMonth]);

  // Category comparisons for categories that have spending in current month
  const categoryComparisons = useMemo(() => {
    return breakdown.map((b) => {
      const comp = getCategoryComparison(data.transactions, b.category, selectedMonth, prevMonth);
      return { category: b.category, ...comp };
    });
  }, [data, selectedMonth, prevMonth, breakdown]);

  // Previous month breakdown for reference
  const prevBreakdown = useMemo(() => getExpenseBreakdown(data.transactions, prevMonth), [data, prevMonth]);
  const prevSummary = useMemo(() => getMonthlySummary(data.transactions, prevMonth), [data, prevMonth]);

  // Budget vs actual bar data
  const budgetChartData = budgetVsActual.map((b) => ({
    category: b.category.length > 12 ? b.category.slice(0, 10) + '…' : b.category,
    Budget: b.budget,
    Actual: b.actual,
  }));

  // Category breakdown pie data
  const pieData = breakdown.map((b) => ({ name: b.category, value: b.amount }));

  // Generate summary text
  const summaryTexts = useMemo(() => {
    const texts: string[] = [];

    if (summary.totalExpenses === 0) {
      texts.push(`You have no recorded expenses for ${formatMonthLabel(selectedMonth)}.`);
    } else {
      texts.push(`You spent ${formatCurrency(summary.totalExpenses)} in ${formatMonthLabel(selectedMonth)} across ${breakdown.length} categor${breakdown.length === 1 ? 'y' : 'ies'}.`);
    }

    if (expenseComparison.percentChange !== null) {
      if (expenseComparison.difference > 0) {
        texts.push(`Your total spending increased by ${formatPercent(Math.abs(expenseComparison.percentChange))} compared to ${formatMonthLabel(prevMonth)}.`);
      } else if (expenseComparison.difference < 0) {
        texts.push(`Your total spending decreased by ${formatPercent(Math.abs(expenseComparison.percentChange))} compared to ${formatMonthLabel(prevMonth)}.`);
      } else {
        texts.push(`Your total spending was the same as ${formatMonthLabel(prevMonth)}.`);
      }
    } else {
      if (prevSummary.totalExpenses === 0) {
        texts.push(`No spending data from ${formatMonthLabel(prevMonth)}, so a percentage comparison is unavailable.`);
      }
    }

    // Flag categories with significant increases
    const increased = categoryComparisons.filter(
      (c) => c.percentChange !== null && c.percentChange > SPENDING_INCREASE_THRESHOLD
    );
    if (increased.length > 0) {
      const list = increased.map((c) => `${c.category} (+${formatPercent(c.percentChange!)})`).join(', ');
      texts.push(`Categories with notably higher spending: ${list}.`);
    }

    // Budget warnings
    const overBudget = budgetVsActual.filter((b) => b.actual > b.budget);
    if (overBudget.length > 0) {
      texts.push(`You exceeded the budget for: ${overBudget.map((b) => b.category).join(', ')}.`);
    }

    if (breakdown.length === 0 && budgetVsActual.length === 0) {
      texts.push('More transaction history is needed for a meaningful analysis.');
    }

    return texts;
  }, [summary, breakdown, expenseComparison, prevMonth, prevSummary, categoryComparisons, budgetVsActual, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Spending Analysis</h1>
          <p className="text-sm text-slate-500 mt-0.5">Understand your spending patterns over time.</p>
        </div>
        <MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Income" value={formatCurrency(summary.totalIncome)} icon="income" accent="teal" />
        <SummaryCard title="Expenses" value={formatCurrency(summary.totalExpenses)} icon="expense" accent="red" />
        <SummaryCard
          title="Net Balance"
          value={formatCurrency(summary.netBalance)}
          icon="balance"
          accent={summary.netBalance >= 0 ? 'teal' : 'red'}
        />
        <ComparisonCard
          title="vs Last Month"
          comparison={expenseComparison}
          prevLabel={formatMonthLabel(prevMonth)}
        />
      </div>

      {/* Expense by category + Budget vs actual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Expense by Category">
          {pieData.length === 0 ? (
            <EmptyState title="No expenses this month" message="Add expense transactions to see category breakdown." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {breakdown.map((b, idx) => (
                  <div key={b.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-slate-600">{b.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-700 tabular-nums">{formatCurrency(b.amount)}</span>
                      <span className="text-slate-400 text-xs w-14 text-right">{formatPercent(b.percentage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="Budget vs Actual">
          {budgetChartData.length === 0 ? (
            <EmptyState title="No budgets for this month" message="Set up budgets on the Budgets page to compare against actual spending." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Legend formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
                <Bar dataKey="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Actual" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Category comparison table */}
      {breakdown.length > 0 && (
        <Card title="Category Comparison with Previous Month">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left font-semibold text-slate-500 py-2 px-2">Category</th>
                  <th className="text-right font-semibold text-slate-500 py-2 px-2">{formatMonthLabel(selectedMonth)}</th>
                  <th className="text-right font-semibold text-slate-500 py-2 px-2">{formatMonthLabel(prevMonth)}</th>
                  <th className="text-right font-semibold text-slate-500 py-2 px-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {categoryComparisons.map((c) => {
                  const prevSpent = getCategorySpending(data.transactions, c.category, prevMonth);
                  return (
                    <tr key={c.category} className="border-b border-slate-50">
                      <td className="py-2.5 px-2 text-slate-700 font-medium">{c.category}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">{formatCurrency(c.current)}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">
                        {prevSpent > 0 ? formatCurrency(c.previous) : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {c.percentChange === null ? (
                          <span className="text-slate-400 text-xs">N/A</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            c.difference > 0 ? 'text-red-500' : c.difference < 0 ? 'text-teal-600' : 'text-slate-400'
                          }`}>
                            {c.difference > 0 ? <TrendingUp size={14} /> : c.difference < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {c.difference > 0 ? '+' : ''}{formatPercent(c.percentChange)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary text */}
      <Card title="Spending Summary">
        <div className="space-y-2">
          {summaryTexts.map((text, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
              <Info size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
          This page provides descriptive budgeting information only, not professional financial advice.
        </p>
      </Card>
    </div>
  );
}

function ComparisonCard({
  title,
  comparison,
  prevLabel,
}: {
  title: string;
  comparison: { current: number; previous: number; difference: number; percentChange: number | null };
  prevLabel: string;
}) {
  const hasComparison = comparison.percentChange !== null;
  const isUp = comparison.difference > 0;
  const isDown = comparison.difference < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-slate-800 tabular-nums">
          {hasComparison ? formatPercent(comparison.percentChange!) : 'N/A'}
        </p>
        {hasComparison && (
          <span className={`text-sm ${isUp ? 'text-red-500' : isDown ? 'text-teal-600' : 'text-slate-400'}`}>
            {isUp ? <TrendingUp size={16} className="inline" /> : isDown ? <TrendingDown size={16} className="inline" /> : <Minus size={16} className="inline" />}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {hasComparison
          ? `${formatCurrency(comparison.current)} vs ${formatCurrency(comparison.previous)}`
          : `No data from ${prevLabel}`}
      </p>
    </div>
  );
}
