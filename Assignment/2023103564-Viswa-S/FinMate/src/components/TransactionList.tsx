import { Plus, Search, Filter, X, ArrowDownUp, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Transaction, TransactionType } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES } from '@/lib/categories';
import { formatCurrency, formatDateLabel } from '@/lib/formatters';
import { Button } from './Button';
import { Modal, ConfirmDialog } from './Modal';
import { TransactionForm } from './TransactionForm';
import { EmptyState, Card } from './ui';
import { Inbox } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onAdd: (data: { type: TransactionType; amount: number; category: string; description: string; date: string }) => void;
  onEdit: (id: string, data: { type: TransactionType; amount: number; category: string; description: string; date: string }) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  defaultMonth?: string;
}

type SortField = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

export function TransactionList({ transactions, onAdd, onEdit, onDelete, showActions = true, defaultMonth }: TransactionListProps) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(defaultMonth || 'all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => months.add(t.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (monthFilter !== 'all') {
      result = result.filter((t) => t.date.startsWith(monthFilter));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = a.date.localeCompare(b.date);
        if (cmp === 0) cmp = a.createdAt.localeCompare(b.createdAt);
      } else {
        cmp = a.amount - b.amount;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, monthFilter, sortField, sortDir]);

  const hasFilters = search || typeFilter !== 'all' || categoryFilter !== 'all' || monthFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setMonthFilter('all');
  }

  const categoriesForFilter = ALL_CATEGORIES;

  return (
    <div>
      {showActions && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-800">Transactions</h2>
          <Button onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <Plus size={18} />
            Add Transaction
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or category"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            <option value="all">All categories</option>
            {categoriesForFilter.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Month filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            <option value="all">All months</option>
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-');
              const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <ArrowDownUp size={14} />
              Sort: {sortField === 'date' ? 'Date' : 'Amount'} ({sortDir === 'desc' ? 'desc' : 'asc'})
            </button>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 bg-white"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={48} />}
            title={hasFilters ? 'No transactions match your filters' : 'No transactions yet'}
            message={hasFilters ? 'Try adjusting or clearing your filters.' : 'Add your first transaction to get started.'}
            action={
              !hasFilters && showActions ? (
                <Button onClick={() => navigate('/transactions')}>
                  <Plus size={16} />
                  Go to Transactions
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden" >
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left font-semibold text-slate-500 px-5 py-3">Date</th>
                  <th className="text-left font-semibold text-slate-500 px-3 py-3">Description</th>
                  <th className="text-left font-semibold text-slate-500 px-3 py-3">Category</th>
                  <th className="text-left font-semibold text-slate-500 px-3 py-3">Type</th>
                  <th className="text-right font-semibold text-slate-500 px-3 py-3">Amount</th>
                  {showActions && <th className="text-right font-semibold text-slate-500 px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatDateLabel(t.date)}</td>
                    <td className="px-3 py-3 text-slate-700">{t.description}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          t.type === 'income' ? 'text-teal-600' : 'text-red-500'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'} {t.type}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                        t.type === 'income' ? 'text-teal-600' : 'text-red-500'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    {showActions && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditTarget(t); setShowForm(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          initial={editTarget}
          onSubmit={(data) => {
            if (editTarget) {
              onEdit(editTarget.id, data);
            } else {
              onAdd(data);
            }
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
          submitLabel={editTarget ? 'Update' : 'Add'}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        message={`Are you sure you want to delete "${deleteTarget?.description}" (${formatCurrency(deleteTarget?.amount || 0)})? This action cannot be undone.`}
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
