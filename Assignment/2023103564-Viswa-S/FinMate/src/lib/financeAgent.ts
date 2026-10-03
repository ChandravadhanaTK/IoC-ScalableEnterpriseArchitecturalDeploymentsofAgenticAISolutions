import type { AppData, Transaction } from '@/types';
import { CATEGORY_ALIASES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES } from './categories';
import { resolveDateInput, resolveMonthInput, currentMonth } from './dateUtils';
import { formatCurrency, formatMonthLabel } from './formatters';
import {
  addTransaction,
  getMonthlySummaryTool,
  getCategorySpendingTool,
  getRemainingBudgetTool,
  getRecentTransactionsTool,
  getOverBudgetCategoriesTool,
  getSpendingAnalysisTool,
  type ToolResult,
} from './financeTools';

export type IntentType =
  | 'add_expense'
  | 'add_income'
  | 'query_total_expenses'
  | 'query_category_spending'
  | 'query_remaining_budget'
  | 'list_recent_transactions'
  | 'summarize_finances'
  | 'over_budget_categories'
  | 'spending_analysis'
  | 'help'
  | 'unknown';

export interface AgentContext {
  data: AppData;
}

export interface AgentResponse {
  message: string;
  updatedData?: AppData;
}

// ---------- Normalization ----------

function normalize(text: string): string {
  return text
    .replace(/[₹,\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLower(text: string): string {
  return normalize(text).toLowerCase();
}

// ---------- Intent detection ----------

function detectIntent(raw: string): IntentType {
  const text = normalizeLower(raw);

  // Help
  if (/^(help|what can you do|commands|how to use)\b/.test(text) || text === 'help') {
    return 'help';
  }

  // Add expense
  if (/\b(i spent|spent|add (an? )?expense|expense of|paid|bought|purchased)\b/.test(text) ||
      /\bexpense\b.*\badd\b/.test(text)) {
    // Make sure it's not a question about spending
    if (/\b(how much|what|show|list|query|tell me)\b/.test(text) && !/\b(i spent|spent|paid|bought|purchased)\b/.test(text)) {
      // falls through to query
    } else {
      return 'add_expense';
    }
  }

  // Add income
  if (/\b(i received|received|add (an? )?income|income of|got paid|earned|salary of|received.*salary)\b/.test(text)) {
    return 'add_income';
  }

  // Remaining budget
  if (/\b(remaining|left in|how much.*left|left.*budget)\b.*\b(budget)\b/.test(text) ||
      /\bremaining\b.*\b(budget)\b/.test(text) ||
      /\b(budget)\b.*\bremaining\b/.test(text)) {
    return 'query_remaining_budget';
  }

  // Over budget
  if (/\b(over budget|over the budget|exceeded|which categories.*over|budget.*exceed)\b/.test(text)) {
    return 'over_budget_categories';
  }

  // Spending analysis
  if (/\b(spending analysis|analyze.*spending|spending.*analysis|analysis of.*spending)\b/.test(text)) {
    return 'spending_analysis';
  }

  // Query total expenses
  if (/\b(how much.*spend|total.*expense|total.*spending|spend.*this month|spend.*last month|my expenses)\b/.test(text)) {
    return 'query_total_expenses';
  }

  // Query category spending
  if (/\b(how much.*spend on|spend on|spent on|.*expenses for|.*spending for|show.*expenses for|food expenses|transport expenses)\b/.test(text)) {
    return 'query_category_spending';
  }

  // Recent transactions
  if (/\b(recent transactions|recent|last.*transactions|show.*transactions|list transactions|my transactions|transaction history|show me.*history)\b/.test(text)) {
    return 'list_recent_transactions';
  }

  // Summarize finances
  if (/\b(summary|summarize|overview|my finances|financial.*summary|finance.*summary)\b/.test(text)) {
    return 'summarize_finances';
  }

  return 'unknown';
}

// ---------- Entity extraction ----------

function extractAmount(text: string): number | null {
  // Match patterns like "250", "₹250", "rs 250", "250 rupees"
  const normalized = normalize(text);
  const match = normalized.match(/(?:rs\.?\s*|inr\s*|rupees\s*)?(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|inr)?/i);
  if (match) {
    const val = Number(match[1]);
    if (Number.isFinite(val) && val > 0) return val;
  }
  // Also try matching "₹" prefix which was removed in normalize — check original text
  const rawMatch = text.match(/₹\s*(\d+(?:\.\d{1,2})?)/);
  if (rawMatch) {
    const val = Number(rawMatch[1]);
    if (Number.isFinite(val) && val > 0) return val;
  }
  return null;
}

function extractCategory(text: string): string | null {
  const lower = normalizeLower(text);

  // Check each alias
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    // Use word boundary for short aliases
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
    if (regex.test(lower)) {
      return category;
    }
  }

  // Check exact category names
  for (const cat of ALL_CATEGORIES) {
    if (lower.includes(cat.toLowerCase())) return cat;
  }

  return null;
}

function extractDate(text: string): string | null {
  const lower = normalizeLower(text);
  // Check relative days
  if (/\btoday\b/.test(lower)) return resolveDateInput('today');
  if (/\byesterday\b/.test(lower)) return resolveDateInput('yesterday');
  if (/\bday before yesterday\b/.test(lower)) return resolveDateInput('day before yesterday');

  // Check YYYY-MM-DD
  const dateMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (dateMatch) {
    const resolved = resolveDateInput(dateMatch[0]);
    if (resolved) return resolved;
  }

  // Check "on <date>" patterns or DD/MM/YYYY
  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const [_, dd, mm, yyyy] = slashMatch;
    const dateStr = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const resolved = resolveDateInput(dateStr);
    if (resolved) return resolved;
  }

  return null;
}

function extractMonth(text: string): string {
  const resolved = resolveMonthInput(text);
  return resolved || currentMonth();
}

function extractDescription(text: string): string | null {
  // Try to extract a description from the text
  // Common patterns: "on lunch", "for lunch", "for groceries"
  const lower = normalizeLower(text);
  const forMatch = lower.match(/(?:for|on)\s+(.+?)(?:\s+(?:today|yesterday|this month|last month|on\b|\d|$))/);
  if (forMatch && forMatch[1]) {
    const desc = forMatch[1].trim();
    // Make sure it's not just a number or category name
    if (desc.length > 2 && !/^\d/.test(desc)) {
      // Filter out matched amounts
      return capitalize(desc.replace(/\b\d+(?:\.\d+)?\b/g, '').trim() || desc);
    }
  }

  // Try "as salary" pattern
  const asMatch = lower.match(/\bas\s+(.+?)(?:\s+(?:today|yesterday|this month|on\b|$))/);
  if (asMatch && asMatch[1]) {
    const desc = asMatch[1].trim();
    if (desc.length > 2) return capitalize(desc);
  }

  // Try "lunch", "dinner" etc. as descriptions
  const foodWords = ['lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'tea', 'groceries', 'fuel', 'movie', 'medicine'];
  for (const word of foodWords) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      return capitalize(word);
    }
  }

  return null;
}

// ---------- Helpers ----------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isQuestion(text: string): boolean {
  const lower = normalizeLower(text);
  return /\b(how much|what|which|show|list|tell me|query|is|are|did|do|can you|could you)\b/.test(lower) &&
         !/\b(i spent|paid|bought|purchased|i received|add)\b/.test(lower);
}

// ---------- Intent handlers ----------

function handleAddExpense(text: string, data: AppData): AgentResponse {
  const amount = extractAmount(text);
  const category = extractCategory(text);
  const date = extractDate(text) || currentMonthDateOnly();
  const description = extractDescription(text);

  if (amount === null) {
    return { message: 'I can add that expense, but I need the amount. How much did you spend? For example: "I spent ₹250 on lunch today."' };
  }

  if (!category) {
    const categoryList = EXPENSE_CATEGORIES.join(', ');
    return {
      message: `I see you spent ${formatCurrency(amount)}, but which category does it belong to? Choose from: ${categoryList}. For example: "I spent ₹${amount} on Food & Dining for lunch today."`,
    };
  }

  const finalDescription = description || `Expense via Agent`;

  const { result, updatedData } = addTransaction(data, {
    type: 'expense',
    amount,
    category,
    description: finalDescription,
    date,
  });

  return { message: result.message, updatedData: result.success ? updatedData : undefined };
}

function handleAddIncome(text: string, data: AppData): AgentResponse {
  const amount = extractAmount(text);
  const category = extractCategory(text);
  const date = extractDate(text) || currentMonthDateOnly();
  const description = extractDescription(text);

  if (amount === null) {
    return { message: 'I can add that income, but I need the amount. How much did you receive? For example: "I received ₹5000 as salary today."' };
  }

  if (!category) {
    const categoryList = INCOME_CATEGORIES.join(', ');
    return {
      message: `I see you received ${formatCurrency(amount)}, but which income category is it? Choose from: ${categoryList}.`,
    };
  }

  const finalDescription = description || `Income via Agent`;

  const { result, updatedData } = addTransaction(data, {
    type: 'income',
    amount,
    category,
    description: finalDescription,
    date,
  });

  return { message: result.message, updatedData: result.success ? updatedData : undefined };
}

function currentMonthDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function handleQueryTotalExpenses(text: string, data: AppData): AgentResponse {
  const month = extractMonth(text);
  const result = getMonthlySummaryTool(data, month);
  return { message: result.message };
}

function handleQueryCategorySpending(text: string, data: AppData): AgentResponse {
  const category = extractCategory(text);
  const month = extractMonth(text);
  if (!category) {
    return { message: 'Which category would you like to check spending for? For example: "How much did I spend on transport this month?"' };
  }
  const result = getCategorySpendingTool(data, category, month);
  return { message: result.message };
}

function handleQueryRemainingBudget(text: string, data: AppData): AgentResponse {
  const category = extractCategory(text);
  const month = extractMonth(text);
  if (!category) {
    return { message: 'Which category\'s remaining budget would you like to check? For example: "What is my remaining food budget this month?"' };
  }
  const result = getRemainingBudgetTool(data, category, month);
  return { message: result.message };
}

function handleListRecentTransactions(text: string, data: AppData): AgentResponse {
  // Try to extract a number like "last 5"
  const numMatch = text.match(/\b(\d+)\b/);
  const limit = numMatch ? Math.min(Math.max(Number(numMatch[1]), 1), 50) : 10;
  const result = getRecentTransactionsTool(data, limit);
  return { message: result.message };
}

function handleSummarizeFinances(text: string, data: AppData): AgentResponse {
  const month = extractMonth(text);
  const result = getMonthlySummaryTool(data, month);
  return { message: result.message };
}

function handleOverBudgetCategories(text: string, data: AppData): AgentResponse {
  const month = extractMonth(text);
  const result = getOverBudgetCategoriesTool(data, month);
  return { message: result.message };
}

function handleSpendingAnalysis(text: string, data: AppData): AgentResponse {
  const month = extractMonth(text);
  const result = getSpendingAnalysisTool(data, month);
  return { message: result.message };
}

function handleHelp(): AgentResponse {
  const message = `Here's what I can help you with:

**Add transactions:**
• "I spent ₹250 on lunch today."
• "Add an expense of 150 for transport yesterday."
• "I received ₹5000 as salary today."

**Query spending:**
• "How much did I spend this month?"
• "How much did I spend on transport this month?"
• "Show my food expenses for September 2026."

**Budgets:**
• "What is my remaining food budget this month?"
• "Which categories are over budget?"

**Other:**
• "Show my recent transactions."
• "Give me a summary of my finances this month."
• "Spending analysis"

I work with the same data you see on the other pages. All amounts are in INR (₹).`;
  return { message };
}

function handleUnknown(text: string): AgentResponse {
  const isQ = isQuestion(text);
  const prefix = isQ
    ? "I'm not sure what you're asking. "
    : "I didn't understand that command. ";
  return {
    message: `${prefix}I can help you add transactions, check spending, manage budgets, and more. Type "help" to see what I can do.`,
  };
}

// ---------- Main entry ----------

export function processAgentMessage(text: string, data: AppData): AgentResponse {
  if (!text.trim()) {
    return { message: 'Please type a command. Type "help" to see what I can do.' };
  }

  const intent = detectIntent(text);

  switch (intent) {
    case 'add_expense':
      return handleAddExpense(text, data);
    case 'add_income':
      return handleAddIncome(text, data);
    case 'query_total_expenses':
      return handleQueryTotalExpenses(text, data);
    case 'query_category_spending':
      return handleQueryCategorySpending(text, data);
    case 'query_remaining_budget':
      return handleQueryRemainingBudget(text, data);
    case 'list_recent_transactions':
      return handleListRecentTransactions(text, data);
    case 'summarize_finances':
      return handleSummarizeFinances(text, data);
    case 'over_budget_categories':
      return handleOverBudgetCategories(text, data);
    case 'spending_analysis':
      return handleSpendingAnalysis(text, data);
    case 'help':
      return handleHelp();
    default:
      return handleUnknown(text);
  }
}

export const AGENT_EXAMPLE_PROMPTS = [
  'I spent ₹250 on lunch today.',
  'I received ₹5000 as salary today.',
  'How much did I spend this month?',
  'How much did I spend on transport this month?',
  'What is my remaining food budget this month?',
  'Show my recent transactions.',
  'Give me a summary of my finances this month.',
  'Which categories are over budget?',
  'Help',
];
