import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: 'income' | 'expense' | 'balance' | 'budget';
  subtitle?: string;
  accent?: 'teal' | 'red' | 'navy' | 'amber';
}

const iconMap = {
  income: TrendingUp,
  expense: TrendingDown,
  balance: Wallet,
  budget: PiggyBank,
};

const accentMap = {
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', ring: 'ring-teal-100' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', ring: 'ring-red-100' },
  navy: { bg: 'bg-slate-100', icon: 'text-slate-700', ring: 'ring-slate-200' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
};

export function SummaryCard({ title, value, icon, subtitle, accent = 'navy' }: SummaryCardProps) {
  const Icon = iconMap[icon];
  const colors = accentMap[accent];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.icon} ring-1 ${colors.ring}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Card({ title, children, className = '', action }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-slate-300 mb-3">{icon}</div>}
      <h3 className="text-slate-600 font-medium">{title}</h3>
      {message && <p className="text-slate-400 text-sm mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ProgressBarProps {
  percent: number;
  status: 'normal' | 'approaching' | 'reached' | 'over';
}

export function ProgressBar({ percent, status }: ProgressBarProps) {
  const colorMap = {
    normal: 'bg-teal-500',
    approaching: 'bg-amber-500',
    reached: 'bg-orange-500',
    over: 'bg-red-500',
  };
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[status]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface StatusBadgeProps {
  status: 'normal' | 'approaching' | 'reached' | 'over';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    normal: { label: 'Normal', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    approaching: { label: 'Approaching', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    reached: { label: 'Limit reached', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    over: { label: 'Over budget', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

interface MonthSelectorProps {
  months: string[];
  value: string;
  onChange: (month: string) => void;
  label?: string;
}

export function MonthSelector({ months, value, onChange, label = 'Month' }: MonthSelectorProps) {
  const formatLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 cursor-pointer"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {formatLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
