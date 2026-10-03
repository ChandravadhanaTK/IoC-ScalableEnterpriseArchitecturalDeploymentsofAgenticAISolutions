import type { AppData, TransactionType } from '@/types';
import { TransactionList } from '@/components/TransactionList';

interface TransactionsPageProps {
  data: AppData;
  onAdd: (data: { type: TransactionType; amount: number; category: string; description: string; date: string }) => void;
  onEdit: (id: string, data: { type: TransactionType; amount: number; category: string; description: string; date: string }) => void;
  onDelete: (id: string) => void;
}

export function TransactionsPage({ data, onAdd, onEdit, onDelete }: TransactionsPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Add, edit, search, and filter your income and expenses.</p>
      </div>
      <TransactionList
        transactions={data.transactions}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        showActions
      />
    </div>
  );
}
