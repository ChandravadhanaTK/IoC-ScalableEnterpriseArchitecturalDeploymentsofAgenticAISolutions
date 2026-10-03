# FinMate — Personal Finance Assistant

FinMate is a personal finance web application that helps you track income and expenses, manage monthly budgets, understand spending patterns, and interact with a rule-based Finance Agent through natural-language commands.

## Overview

FinMate is a college assignment demonstrating an agentic assistant workflow. All data is stored locally in the browser — no external API, backend service, database, or AI model is required.

## Main Features

- **Dashboard**: Summary cards (income, expenses, net balance, remaining budget), expense breakdown donut chart, income vs expenses bar chart, budget overview, and recent transactions.
- **Transactions**: Add, edit, delete, search, filter, and sort income and expense transactions. Full validation and inline error messages.
- **Budgets**: Create, edit, and delete monthly category budgets. Visual progress bars with status indicators (normal, approaching, limit reached, over budget).
- **Spending Analysis**: Month-over-month expense comparison, category breakdown with percentages, budget vs actual spending, and a descriptive spending summary.
- **Finance Agent**: A rule-based chat assistant that can add transactions, query spending, check budgets, list recent transactions, summarize finances, identify over-budget categories, and provide help — all through natural language.

## Technology Stack

- **React** with **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Recharts** (charts)
- **Lucide React** (icons)
- **React Router** (navigation)
- **Browser Local Storage** (data persistence)

## Prerequisites

- Node.js 18+ and npm

## Installation and Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

The dev server runs at `http://localhost:5173` by default.

## Finance Agent

The Finance Agent uses **rule-based, deterministic logic** — not an LLM or generative AI. It works through a pipeline:

1. Normalize the input text.
2. Identify the intended action using deterministic rules.
3. Extract entities (amount, category, description, date/month).
4. Validate required information.
5. Ask a clarification question if essential information is missing.
6. Invoke the appropriate application tool.
7. Return a human-readable response based on actual data.

### Supported Commands

- **Add expense**: "I spent ₹250 on lunch today."
- **Add income**: "I received ₹5000 as salary today."
- **Query total expenses**: "How much did I spend this month?"
- **Query category spending**: "How much did I spend on transport this month?"
- **Query remaining budget**: "What is my remaining food budget this month?"
- **List recent transactions**: "Show my recent transactions."
- **Summarize finances**: "Give me a summary of my finances this month."
- **Over-budget categories**: "Which categories are over budget?"
- **Help**: "Help"

The agent will ask for clarification if information is missing (e.g., amount or category) rather than guessing.

## Data Storage

All data is stored in the browser's **Local Storage** under the key `finmate:data:v1`. Data does **not** sync between devices or users. On first visit, sample demo data is generated relative to the current date. A "Reset demo data" action is available in the sidebar.

## Limitations

- No external AI API (the agent is rule-based).
- No backend server.
- No cross-device synchronization.
- No authentication or multi-user support.
- Data is local to the current browser and origin.

## Manual Testing

1. **Dashboard**: Verify summary cards match transaction totals. Check charts render with data.
2. **Transactions**: Add, edit, delete transactions. Use search and filters. Verify invalid inputs are rejected.
3. **Budgets**: Create a budget, verify spending calculations. Check status changes at 80%, 100%, and over 100%.
4. **Spending Analysis**: Compare current and previous month. Verify summary text is accurate.
5. **Finance Agent**: Try each supported command. Test missing information (e.g., "I spent 250" without a category). Verify transactions are saved and reflected on other pages.
6. **Persistence**: Refresh the page and verify data persists.
7. **Reset**: Use the reset action and confirm data is replaced.
8. **Responsive**: Resize the browser to test mobile layout.
