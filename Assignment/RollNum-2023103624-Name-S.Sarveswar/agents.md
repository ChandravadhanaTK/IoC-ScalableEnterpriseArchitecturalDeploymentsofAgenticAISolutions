# AI Financial Assistant — AI Agents

## 1. Transaction Agent

### Purpose

Manage and understand financial transactions.

### Responsibilities

- Read transaction data
- Validate transaction data
- Categorize transactions
- Detect duplicate transactions
- Summarize transactions
- Identify transaction patterns

### Input

- Transaction records
- Transaction amount
- Transaction date
- Merchant
- Transaction category

### Output

- Categorized transactions
- Transaction summary
- Detected duplicates
- Transaction insights

---

## 2. Fraud Detection Agent

### Purpose

Identify potentially fraudulent or suspicious transactions.

### Responsibilities

- Analyze transaction patterns
- Detect unusual transactions
- Calculate fraud risk scores
- Flag suspicious transactions
- Explain fraud alerts

### Input

- Transaction data
- Transaction history
- Transaction patterns
- Transaction location
- Transaction amount

### Output

- Fraud risk score
- Fraud alerts
- Suspicious transaction details
- Reason for the alert

---

## 3. Financial Analysis Agent

### Purpose

Analyze financial activity and generate financial insights.

### Responsibilities

- Analyze income
- Analyze expenses
- Calculate spending by category
- Identify spending trends
- Analyze monthly financial activity
- Compare income and expenses
- Identify unusual spending patterns
- Generate savings insights

### Input

- Transaction data
- Income data
- Expense data
- Historical financial data

### Output

- Financial insights
- Spending analysis
- Monthly analysis
- Income and expense comparison
- Savings insights

---

## 4. Report Generation Agent

### Purpose

Generate financial reports using the results from other agents.

### Responsibilities

- Generate monthly reports
- Generate spending reports
- Generate fraud reports
- Generate financial summaries
- Prepare downloadable reports

### Input

- Transaction analysis
- Fraud analysis
- Financial analysis

### Output

- Financial report
- Spending report
- Fraud report
- Financial summary

---

# Agent Orchestration

The AI Orchestrator coordinates communication between all agents.

## Workflow

Transaction Agent
        ↓
Fraud Detection Agent
        ↓
Financial Analysis Agent
        ↓
Report Generation Agent

## Agent Handoffs

Transaction Agent
→ sends validated transaction data to Fraud Detection Agent

Fraud Detection Agent
→ sends fraud findings to Financial Analysis Agent

Financial Analysis Agent
→ sends financial insights to Report Generation Agent

Report Generation Agent
→ generates the final report for the user