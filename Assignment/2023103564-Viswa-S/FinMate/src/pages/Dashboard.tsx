import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Plus, PiggyBank, Bot, ArrowUpRight, ArrowDownRight, Inbox, PieChart as PieChartIcon } from 'lucide-react';
import type { AppData } from '@/types';
import {
  getMonthlySummary,
  getExpenseBreakdown,
  getBudgetStatuses,
  getTotalRemainingBudget,
  getRecentTransactions,
} from '@/lib/financeCalculations';
import { formatCurrency, formatCurrencyShort, formatDateLabel, formatMonthLabel } from '@/lib/formatters';
import { lastNMonths, currentMonth } from '@/lib/dateUtils';
import { SummaryCard, Card, EmptyState, ProgressBar, StatusBadge, MonthSelector } from '@/components/ui';
import { Button } from '@/components/Button';

const CHART_COLORS = [
  '#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#64748b',
];

interface DashboardProps {
  data: AppData;
}

export function Dashboard({ data }: DashboardProps) {
  const navigate = useNavigate();
  const months = useMemo(() => lastNMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const summary = useMemo(() => getMonthlySummary(data.transactions, selectedMonth), [data, selectedMonth]);
  const breakdown = useMemo(() => getExpenseBreakdown(data.transactions, selectedMonth), [data, selectedMonth]);
  const budgetStatuses = useMemo(() => getBudgetStatuses(data.budgets, data.transactions, selectedMonth), [data, selectedMonth]);
  const totalRemainingBudget = useMemo(() => getTotalRemainingBudget(data.budgets, data.transactions, selectedMonth), [data, selectedMonth]);
  const recent = useMemo(() => getRecentTransactions(
    data.transactions.filter((t) => t.date.startsWith(selectedMonth)),
    5
  ), [data, selectedMonth]);

  // Income vs expense bar data
  const barData = useMemo(() => {
    const last3 = lastNMonths(3).filter((m) => months.includes(m) || true);
    return last3.map((m) => {
      const s = getMonthlySummary(data.transactions, m);
      return {
        month: m.split('-')[1] + '/' + m.split('-')[0].slice(2),
        Income: s.totalIncome,
        Expenses: s.totalExpenses,
      };
    });
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatMonthLabel(selectedMonth)}</p>
        </div>
        <MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Income"
          value={formatCurrency(summary.totalIncome)}
          icon="income"
          accent="teal"
          subtitle={`${summary.transactionCount} transaction(s)`}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          icon="expense"
          accent="red"
        />
        <SummaryCard
          title="Net Balance"
          value={formatCurrency(summary.netBalance)}
          icon="balance"
          accent={summary.netBalance >= 0 ? 'teal' : 'red'}
          subtitle={summary.netBalance >= 0 ? 'Surplus' : 'Deficit'}
        />
        <SummaryCard
          title="Remaining Budget"
          value={formatCurrency(totalRemainingBudget)}
          icon="budget"
          accent={totalRemainingBudget >= 0 ? 'amber' : 'red'}
          subtitle={`${budgetStatuses.length} budget(s) set`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense breakdown donut */}
        <Card title="Expense Breakdown">
          {breakdown.length === 0 ? (
            <EmptyState
              icon={<PieChartIcon size={48} />}
              title="No expenses this month"
              message="Add some expense transactions to see the breakdown."
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {breakdown.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Income vs expenses bar chart */}
        <Card title="Income vs Expenses (3 months)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(v) => formatCurrencyShort(v)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              <Bar dataKey="Income" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Budget overview + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget overview */}
        <Card
          title="Budget Overview"
          action={
            <button
              onClick={() => navigate('/budgets')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Manage
            </button>
          }
        >
          {budgetStatuses.length === 0 ? (
            <EmptyState
              icon={<PiggyBank size={48} />}
              title="No budgets set"
              message="Create a budget to track your spending limits."
              action={<Button size="sm" onClick={() => navigate('/budgets')}>Set a budget</Button>}
            />
          ) : (
            <div className="space-y-4">
              {budgetStatuses.map((s) => (
                <div key={s.budget.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{s.budget.category}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <ProgressBar percent={s.percentUsed} status={s.status} />
                  <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                    <span>{formatCurrency(s.spent)} of {formatCurrency(s.budget.monthlyLimit)}</span>
                    <span className={s.remaining < 0 ? 'text-red-500 font-medium' : ''}>
                      {s.remaining < 0 ? formatCurrency(s.remaining) : formatCurrency(s.remaining)} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent transactions */}
        <Card
          title="Recent Transactions"
          action={
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              View all
            </button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={<Inbox size={48} />}
              title="No transactions this month"
              message="Your recent transactions will appear here."
            />
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        t.type === 'income' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{t.description}</p>
                      <p className="text-xs text-slate-400">{t.category} · {formatDateLabel(t.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                      t.type === 'income' ? 'text-teal-600' : 'text-red-500'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('/transactions')}>
          <Plus size={18} />
          Add Transaction
        </Button>
        <Button variant="secondary" onClick={() => navigate('/budgets')}>
          <PiggyBank size={18} />
          Manage Budgets
        </Button>
        <Button variant="secondary" onClick={() => navigate('/agent')}>
          <Bot size={18} />
          Finance Agent
        </Button>
      </div>
    </div>
  );
}
