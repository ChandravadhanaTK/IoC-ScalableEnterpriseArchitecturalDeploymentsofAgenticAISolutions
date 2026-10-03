# FinMate — Personal Finance Assistant
## Complete Application Build Prompt

Build a complete, polished, functional personal finance web application named **FinMate**. This is a college assignment demonstrating an agentic assistant workflow. Implement the application, not just a landing page, static mockup, or UI prototype.

Follow every requirement below. Prioritize a working, maintainable application over unnecessary complexity.

## 1. Project objective

FinMate helps a user track personal income and expenses, manage monthly budgets, understand spending patterns, and interact with a rule-based Finance Agent through natural-language commands.

The application must work locally without any external API, backend service, database service, AI model, or paid integration.

The Finance Agent must be implemented using deterministic, rule-based intent recognition, entity extraction, validation, and application tools. Do not describe it as an LLM-powered or generative AI agent.

## 2. Technology requirements

Use:
- React with TypeScript.
- Vite.
- Tailwind CSS for styling.
- React Router if multiple routes are needed.
- Recharts for charts.
- Lucide React for icons.
- Browser Local Storage for persistence.

Use reusable React components, TypeScript interfaces/types, and a clear component and utility structure.

Do not add Supabase, Firebase, a server, external database, authentication service, external AI model, Gemini API, OpenAI API, API keys, or other third-party runtime APIs.

Do not add dependencies or integrations that are unnecessary for the requirements. Use INR (₹) throughout.

## 3. Design and user experience

Create a professional, modern personal finance dashboard suitable for a college project demonstration.

Visual direction:
- Clean fintech dashboard aesthetic.
- Light neutral background with white or subtle card surfaces.
- Deep navy or dark slate text.
- Teal/emerald accents for positive balances and income.
- Restrained red/orange accents for expenses and budget warnings.
- Consistent spacing, rounded cards, subtle borders, and restrained shadows.
- Clear typography, readable labels, and meaningful empty states.
- Avoid excessive gradients, oversized decorative elements, and clutter.
- Use Lucide icons consistently.
- Use charts only where they help users understand their finances.

Create a responsive layout for desktop, tablet, and mobile. On desktop, use a sidebar navigation and a main content area. On mobile, collapse the navigation into a usable menu or compact navigation. Ensure buttons, forms, tables, and charts remain usable on small screens.

Provide clear hover, focus, disabled, success, and error states. Use accessible labels and semantic HTML. Do not rely on color alone to convey status.

## 4. Application navigation and pages

Implement these sections:

1. Dashboard
2. Transactions
3. Budgets
4. Spending Analysis
5. Finance Agent

Use a consistent application shell with:
- FinMate logo/name.
- Navigation links with active states.
- Current month/date context where appropriate.
- A clearly accessible Finance Agent entry point.
- A reset-demo-data action in an appropriate settings/menu area, with a confirmation dialog.

Each navigation item must open the corresponding functional page. Do not create nonfunctional navigation links.

## 5. Data model and persistence

Store data in Local Storage using versioned, clearly named keys. Handle missing, malformed, or unavailable stored data safely. Initialize sensible demo data on the first visit, without overwriting existing user data on subsequent visits.

Use TypeScript types similar to the following:

Transaction:
- id: string
- type: "income" | "expense"
- amount: number
- category: string
- description: string
- date: string in YYYY-MM-DD format
- createdAt: string

Budget:
- id: string
- category: string
- monthlyLimit: number
- month: string in YYYY-MM format

Use stable unique IDs. Keep storage logic in reusable utility functions or a small data layer, rather than duplicating Local Storage operations across components.

Validate data before saving. Use one consistent source of truth for application data so the dashboard, transaction list, budget calculations, analysis, and Finance Agent always show consistent values.

Use custom React hooks or an equivalent centralized state approach to load and update data. Update the UI immediately after successful changes. Catch storage errors and show a helpful message rather than falsely confirming success.

All data is local to the current browser and origin. Do not claim that data synchronizes between devices or users.

## 6. Dashboard

Build a functional dashboard containing:

### Summary cards
- Total income for the selected month.
- Total expenses for the selected month.
- Net balance for the selected month (income minus expenses).
- Total remaining budget across configured budgets for that month.

Use the selected month consistently in all applicable totals. Clearly label the period. Handle months with no transactions and avoid displaying NaN or undefined.

### Charts
- Category-wise expense breakdown using a donut or pie chart.
- Income versus expenses comparison using a bar chart.
- A recent transactions list.

Charts must be derived from actual stored transactions for the selected month, not hardcoded chart values. Include readable labels, tooltips, and empty states.

### Budget overview
Display configured category budgets with amount spent, monthly limit, amount remaining, and percentage used. Visually flag budgets approaching or exceeding their limits.

Provide quick actions to add a transaction, manage budgets, and open the Finance Agent.

## 7. Transaction management

Implement a complete Transactions page.

### Required operations
- Add income.
- Add an expense.
- View transactions.
- Edit an existing transaction.
- Delete a transaction after confirmation.

### Transaction form
Include:
- Transaction type.
- Amount.
- Category.
- Description.
- Date.

Use sensible category lists:
- Expense: Food & Dining, Transport, Shopping, Education, Bills & Utilities, Health, Entertainment, Housing, Personal Care, Other.
- Income: Salary, Freelance, Allowance, Scholarship, Investment, Other.

Allow users to select a category and provide a description. Keep the category lists consistent throughout the application.

### Validation
- Amount must be a valid finite number greater than zero.
- Required fields must be completed.
- Date must be valid.
- Trim descriptions and reject blank descriptions if the form marks them required.
- Display understandable inline validation messages.
- Do not save invalid transactions.

### Search and filtering
Provide:
- Search by description or category.
- Filter by transaction type.
- Filter by category.
- Filter by date/month where practical.
- Sort by date, newest first by default.
- A clear-filters action.

Display a helpful empty state when no transactions match. Show transaction type and formatted INR amounts. Editing or deleting a transaction must update all dependent summaries and charts.

## 8. Budget management

Implement a complete Budgets page.

Allow users to:
- Create a monthly budget for an expense category.
- Edit the monthly limit.
- Delete a budget after confirmation.
- Select the applicable month.
- View amount spent, limit, remaining amount, and percentage used.

Use the same expense categories as the transaction form. Prevent duplicate budgets for the same category and month; allow the existing budget to be edited instead.

Calculate spending using expense transactions matching both the budget category and budget month.

Budget status:
- Normal: below 80% used.
- Approaching limit: 80% to less than 100%.
- Limit reached: exactly 100%.
- Over budget: greater than 100%.

Show a progress bar, amount remaining, and a clear status label. Avoid division-by-zero and negative-value display bugs.

A budget warning must be based on actual calculated spending. Do not create notifications that claim an expense was prevented or a payment was blocked.

## 9. Spending analysis

Create a Spending Analysis page with a month selector.

Show:
- Total income and expenses for the selected month.
- Expense totals by category.
- Each category's share of total expenses.
- Budget versus actual spending for categories with budgets.
- Comparison with the previous calendar month where data exists.
- A concise, rule-based summary of the user's spending.

Flag a category as having increased spending only when both months have comparable data and the current amount is meaningfully higher. Define the threshold in code and make the wording descriptive, not judgmental. If the previous month has zero spending or no data, explain that a meaningful percentage comparison is unavailable.

Do not fabricate trends, transactions, or financial insights. When data is insufficient, explain that more transaction history is needed.

This page provides descriptive budgeting information only, not professional financial advice.

## 10. Finance Agent — core assignment feature

Build a dedicated Finance Agent chat page that looks like a lightweight assistant interface.

The agent is rule-based and must run entirely in the browser. Do not call any external AI API.

### Supported user intents

Implement at least these intents:

1. Add an expense.
2. Add income.
3. Query total expenses for a month.
4. Query spending for a category.
5. Query remaining budget for a category.
6. List recent transactions.
7. Summarize monthly finances.
8. Identify categories over budget.
9. Provide help listing supported commands.

### Example requests to support

- "I spent ₹250 on lunch today."
- "Add an expense of 150 for transport yesterday."
- "I received ₹5000 as salary today."
- "How much did I spend this month?"
- "How much did I spend on transport this month?"
- "Show my food expenses for September 2026."
- "What is my remaining food budget this month?"
- "Show my recent transactions."
- "Give me a summary of my finances this month."
- "Which categories are over budget?"
- "Help"

The examples are illustrative; implement robust matching for the supported patterns and gracefully handle variations in capitalization, whitespace, common wording, and punctuation.

### Agent architecture

Implement the agent as a clear pipeline:

1. Normalize the input text.
2. Identify the intended action using deterministic rules.
3. Extract entities such as amount, category, description, and date/month.
4. Validate required information.
5. Ask a clarification question if essential information is missing or ambiguous.
6. Select and invoke the appropriate application tool.
7. Read the latest application data and calculate the result.
8. Return a human-readable response based on the actual tool result.
9. Update the UI and persistent state after successful mutations.

Keep intent recognition, entity extraction, tool functions, and response generation in separate, understandable functions/modules.

### Required application tools

Create explicit, reusable functions that the agent calls, such as:
- addTransaction(...)
- getMonthlySummary(month)
- getCategorySpending(category, month)
- getRemainingBudget(category, month)
- getRecentTransactions(limit)
- getOverBudgetCategories(month)
- getSpendingAnalysis(month)

These functions must operate on the same application data source used by the UI. Avoid a fake agent that only returns hardcoded text.

For mutations, validate the extracted values before calling addTransaction. After a successful save, confirm the actual saved amount, category, and date. If the save fails, explain that it was not saved.

### Ambiguity and safety

- If the user says "I spent 250" without enough information to identify a category, ask for the missing category before saving.
- If the amount is missing, ask for it.
- Do not infer a missing amount, invent a date, or silently choose a category when the choice is materially ambiguous.
- If a request could refer to multiple supported actions, ask a concise clarification question.
- Do not create a transaction from a question about spending.
- Do not save a transaction twice because of repeated rendering or state updates.
- Treat user input as data, not executable code.
- Do not claim that an operation succeeded unless the relevant tool completed successfully.
- For unsupported questions, politely explain the supported capabilities and provide example commands.
- The agent must not offer investment recommendations, credit decisions, tax advice, or other professional financial advice.

### Chat UI
Include:
- Message bubbles for user and agent.
- Input field and send button.
- Enter-to-send behavior, while preserving usable multiline/input behavior if implemented.
- Loading/processing indicator while a command is handled.
- Empty state with example prompts that users can click to populate or send.
- Clear error messages.
- Scrollable message history.
- A clear-chat action with confirmation if it removes history.

Do not simulate an external model's thinking or pretend the application is calling an LLM. The interface can say "Processing request" while deterministic logic executes.

## 11. Demo data and first-run experience

On first launch only, initialize a small, realistic sample dataset spanning the current month and previous month. Include a variety of income, expenses, categories, and a few monthly budgets so all dashboard sections can be demonstrated.

Use realistic INR values and dates. Generate dates relative to the actual current date when initializing data, rather than permanently hardcoding dates that will become stale.

Clearly identify sample data in the UI or provide a dismissible note explaining that the initial transactions are demo data.

Never replace existing user data with demo data on page reload. Provide a reset-demo-data action with a confirmation dialog that restores the initial demo dataset. Clearly explain that this action replaces the current local demo data.

If the user has no data, show appropriate empty states and provide a way to add their first transaction.

## 12. Formatting and calculation rules

- Use the Indian Rupee symbol and Indian number formatting, such as ₹12,500.00 or ₹12,500, depending on consistent design choices.
- Store amounts as numbers, not formatted strings.
- Store dates in a consistent date-only format.
- Avoid timezone-related date shifts when parsing or formatting date-only strings.
- Use a single, reusable currency formatter.
- Use consistent month utilities for selected month and previous month calculations.
- Exclude income transactions from expense category totals and budget calculations.
- Net balance equals income minus expenses for the selected period.
- Remaining budget equals monthly limit minus qualifying expenses; allow a negative result when over budget and label it clearly.
- Do not silently treat missing data as a successful calculation.
- Avoid division by zero in percentage calculations.

## 13. Code quality and maintainability

- Keep components reasonably small and reusable.
- Use TypeScript types for transactions, budgets, agent intents, and tool results.
- Separate storage, calculations, agent logic, and UI components.
- Avoid unnecessary duplication.
- Remove unused imports, placeholder links, dead buttons, and debug output.
- Use stable React keys.
- Handle empty arrays and missing Local Storage data.
- Do not store secrets because no external API keys are needed.
- Do not claim authentication or multi-user isolation.
- Ensure the project can be installed and started using standard npm commands.

Suggested organization (adapt as needed):

src/
  components/
  pages/
  hooks/
  lib/
    storage.ts
    financeCalculations.ts
    financeAgent.ts
    financeTools.ts
    dateUtils.ts
    formatters.ts
  types/

The final code structure may differ if it remains clean and understandable.

## 14. README and project documentation

Generate a useful README.md containing:
- Project name and overview.
- Main features.
- Technology stack.
- Prerequisites.
- Installation and run commands.
- Explanation that the Finance Agent uses rule-based logic.
- Explanation that data is stored in browser Local Storage.
- Limitations: no external AI API, no backend, no cross-device synchronization, and no authentication.
- Basic manual testing instructions.

Do not put secrets, real API keys, or unnecessary environment variables in the project.

## 15. Acceptance criteria

Before considering the application complete, verify the following:

1. The application starts without compilation errors.
2. All five sections are accessible and functional.
3. Navigation works on desktop and mobile.
4. Transactions can be added, edited, deleted, searched, filtered, and sorted.
5. Dashboard totals and charts reflect actual transactions.
6. Budgets can be created, edited, deleted, and calculated correctly.
7. Budget status changes correctly at the defined thresholds.
8. Spending analysis uses real stored data and handles missing comparison data.
9. The Finance Agent handles every listed supported intent.
10. Agent transaction commands update Local Storage and the UI.
11. Missing or ambiguous information triggers clarification instead of an invented transaction.
12. Unsupported requests receive a helpful response.
13. Data persists after page refresh.
14. Invalid stored data and invalid form inputs are handled safely.
15. Resetting demo data requires confirmation.
16. Empty states are useful and no page shows NaN, undefined, or broken charts.
17. There are no fake buttons, nonfunctional navigation items, or misleading success messages.
18. The README contains correct local setup instructions.
19. No external API or backend is required for normal operation.

## 16. Final implementation instructions

Build the complete application, not merely a plan or wireframe. Implement the pages, state management, storage utilities, calculations, rule-based Finance Agent, responsive styling, sample data, error handling, and README.

Prioritize correctness, a coherent visual design, and working end-to-end interactions. Use reasonable implementation decisions where minor details are unspecified, while following all explicit constraints above.

Do not add features that require external services. Do not replace required functionality with static placeholders.

When implementation is complete, summarize the pages and features created, explain how to run the application locally, and disclose any acceptance criteria that still need manual verification.