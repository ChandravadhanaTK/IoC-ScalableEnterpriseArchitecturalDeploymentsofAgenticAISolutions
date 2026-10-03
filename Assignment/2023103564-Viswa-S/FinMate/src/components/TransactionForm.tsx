import { useState, useEffect } from 'react';
import type { Transaction, TransactionType } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories';
import { todayISO } from '@/lib/dateUtils';
import { Button } from './Button';

interface TransactionFormProps {
  initial?: Transaction | null;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

interface FormErrors {
  amount?: string;
  category?: string;
  description?: string;
  date?: string;
}

export function TransactionForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type || 'expense');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial?.category || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(initial?.date || todayISO());
  const [errors, setErrors] = useState<FormErrors>({});

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Reset category when type changes if current category not in new list
  useEffect(() => {
    if (category && !categories.includes(category as never)) {
      setCategory('');
    }
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const e: FormErrors = {};
    const amt = Number(amount);
    if (!amount.trim()) {
      e.amount = 'Amount is required.';
    } else if (!Number.isFinite(amt) || amt <= 0) {
      e.amount = 'Amount must be a positive number.';
    }
    if (!category) e.category = 'Please select a category.';
    if (!description.trim()) e.description = 'Description is required.';
    if (!date) {
      e.date = 'Date is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      e.date = 'Date must be in YYYY-MM-DD format.';
    } else {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) e.date = 'Invalid date.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      type,
      amount: Number(amount),
      category,
      description: description.trim(),
      date,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${
              type === 'expense'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition border ${
              type === 'income'
                ? 'bg-teal-50 text-teal-600 border-teal-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="tx-amount">
          Amount (₹)
        </label>
        <input
          id="tx-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={`w-full px-3 py-2.5 rounded-lg border text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
            errors.amount ? 'border-red-300' : 'border-slate-200'
          }`}
        />
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="tx-category">
          Category
        </label>
        <select
          id="tx-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg border text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer ${
            errors.category ? 'border-red-300' : 'border-slate-200'
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="tx-desc">
          Description
        </label>
        <input
          id="tx-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Lunch with friends"
          maxLength={100}
          className={`w-full px-3 py-2.5 rounded-lg border text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
            errors.description ? 'border-red-300' : 'border-slate-200'
          }`}
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="tx-date">
          Date
        </label>
        <input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg border text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
            errors.date ? 'border-red-300' : 'border-slate-200'
          }`}
        />
        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
