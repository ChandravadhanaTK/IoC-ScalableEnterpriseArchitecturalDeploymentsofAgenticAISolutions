import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, Calendar } from 'lucide-react';
import type { AppData, Budget } from '@/types';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import {
  getBudgetStatuses,
  type BudgetStatus,
} from '@/lib/financeCalculations';
import { formatCurrency, formatMonthLabel } from '@/lib/formatters';
import { lastNMonths, currentMonth } from '@/lib/dateUtils';
import { Button } from '@/components/Button';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { Card, EmptyState, ProgressBar, StatusBadge, MonthSelector } from '@/components/ui';

interface BudgetsPageProps {
  data: AppData;
  onAdd: (budget: Omit<Budget, 'id'>) => boolean;
  onEdit: (id: string, updates: Partial<Omit<Budget, 'id'>>) => boolean;
  onDelete: (id: string) => boolean;
}

interface BudgetFormData {
  category: string;
  monthlyLimit: string;
  month: string;
}

export function BudgetsPage({ data, onAdd, onEdit, onDelete }: BudgetsPageProps) {
  const months = useMemo(() => lastNMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    monthlyLimit: '',
    month: currentMonth(),
  });
  const [formError, setFormError] = useState<string | null>(null);

  const statuses = useMemo(
    () => getBudgetStatuses(data.budgets, data.transactions, selectedMonth),
    [data, selectedMonth]
  );

  function openAddForm() {
    setEditTarget(null);
    setFormData({ category: '', monthlyLimit: '', month: selectedMonth });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(budget: Budget) {
    setEditTarget(budget);
    setFormData({
      category: budget.category,
      monthlyLimit: String(budget.monthlyLimit),
      month: budget.month,
    });
    setFormError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.category) {
      setFormError('Please select a category.');
      return;
    }
    const limit = Number(formData.monthlyLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      setFormError('Monthly limit must be a positive number.');
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(formData.month)) {
      setFormError('Invalid month.');
      return;
    }

    if (editTarget) {
      onEdit(editTarget.id, { category: formData.category, monthlyLimit: limit, month: formData.month });
    } else {
      const ok = onAdd({ category: formData.category, monthlyLimit: limit, month: formData.month });
      if (!ok) {
        setFormError(`A budget for ${formData.category} in ${formatMonthLabel(formData.month)} already exists. Edit it instead.`);
        return;
      }
    }
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budgets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Set monthly spending limits for each category.</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />
          <Button onClick={openAddForm}>
            <Plus size={18} />
            Add Budget
          </Button>
        </div>
      </div>

      {statuses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank size={48} />}
            title="No budgets for this month"
            message="Create a budget to track spending limits for your expense categories."
            action={<Button onClick={openAddForm}><Plus size={16} /> Add Budget</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statuses.map((s: BudgetStatus) => (
            <Card key={s.budget.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-700">{s.budget.category}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{formatMonthLabel(s.budget.month)}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <ProgressBar percent={s.percentUsed} status={s.status} />

              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Spent</p>
                  <p className="font-semibold text-slate-700 tabular-nums">{formatCurrency(s.spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Limit</p>
                  <p className="font-semibold text-slate-700 tabular-nums">{formatCurrency(s.budget.monthlyLimit)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className={`font-semibold tabular-nums ${s.remaining < 0 ? 'text-red-500' : 'text-teal-600'}`}>
                    {formatCurrency(s.remaining)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                <span className="text-xs text-slate-400">{s.percentUsed.toFixed(1)}% used</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(s.budget)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                    aria-label="Edit budget"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(s.budget)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    aria-label="Delete budget"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Budget' : 'Add Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="budget-category">
              Category
            </label>
            <select
              id="budget-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={!!editTarget}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="budget-limit">
              Monthly Limit (₹)
            </label>
            <input
              id="budget-limit"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="budget-month">
              Month
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="budget-month"
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editTarget ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete budget?"
        message={`Delete the budget for ${deleteTarget?.category} (${formatMonthLabel(deleteTarget?.month || '')})? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
}
