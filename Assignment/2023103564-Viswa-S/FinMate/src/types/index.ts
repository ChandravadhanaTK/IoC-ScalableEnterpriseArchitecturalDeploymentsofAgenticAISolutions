export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
}

export interface AppData {
  version: number;
  transactions: Transaction[];
  budgets: Budget[];
}

export type AgentRole = 'user' | 'agent';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  text: string;
  timestamp: string; // ISO
}
