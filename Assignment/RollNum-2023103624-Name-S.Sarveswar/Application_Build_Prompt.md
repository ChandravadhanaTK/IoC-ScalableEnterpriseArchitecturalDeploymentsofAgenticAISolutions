# Build Prompt — AI Financial Assistant

## 1. Application Overview

Build a complete web application called **AI Financial Assistant**.

The application is an Agentic AI financial analysis platform that helps users understand financial transaction data, identify potentially suspicious transactions, analyze financial activity, and generate financial reports.

The application must use multiple specialized AI agents coordinated by an AI Agent Orchestrator.

The application will use synthetic/sample financial data for demonstration and must not connect to real bank accounts.

---

## 2. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- MongoDB Atlas

### AI

- LLM API
- AI Agent Orchestrator

### Authentication

- JWT
- Role-Based Access Control

### Data Processing

- Python
- Pandas

---

## 3. User Roles

Implement three roles:

### User

Can:

- View personal dashboard
- Upload transaction data
- View personal transactions
- View fraud alerts
- View financial analysis
- Generate reports
- Use the AI Financial Assistant
- View profile

### Financial Analyst

Can:

- View financial data
- Analyze transactions
- Review fraud alerts
- View financial analytics
- Generate reports
- Review flagged transactions

### Administrator

Can:

- Manage users
- Manage roles
- View system analytics
- View transactions
- View fraud alerts
- View reports
- View audit logs
- Manage application settings

---

## 4. Main Application Pages

Create the following pages:

### Login

- Email
- Password
- Login button
- Registration link

### Registration

- Full name
- Email
- Password
- Confirm password
- Role

### Dashboard

Display:

- Total income
- Total expenses
- Current balance
- Total transactions
- Fraud alerts
- Spending by category
- Monthly spending trend
- Recent transactions

### Transactions

Provide:

- Transaction table
- Search
- Filters
- Category
- Date
- Amount
- Merchant
- Transaction type
- Transaction details

### Fraud Detection

Display:

- Suspicious transactions
- Risk score
- Risk level
- Reason for alert
- Alert date
- Review status

### Financial Analysis

Display:

- Income analysis
- Expense analysis
- Category spending
- Monthly trends
- Spending patterns
- Financial insights

### Reports

Provide:

- Monthly financial report
- Spending report
- Fraud report
- Financial summary
- Generate report
- View report
- Export report

### AI Assistant

Provide a chat interface where users can ask questions about their uploaded financial data.

Example questions:

- "How much did I spend this month?"
- "What is my highest spending category?"
- "Show unusual transactions."
- "Summarize my financial activity."
- "Why was this transaction flagged?"

### Profile

Display:

- Name
- Email
- Role
- Account information

### Admin Panel

Provide:

- User management
- Role management
- System statistics
- Audit logs
- Application activity

---

## 5. AI Agent Architecture

Implement the following agents.

### Transaction Agent

Responsibilities:

- Read transaction data
- Validate transaction records
- Categorize transactions
- Detect duplicate transactions
- Identify transaction patterns
- Generate transaction summaries

### Fraud Detection Agent

Responsibilities:

- Analyze transaction patterns
- Detect unusual transactions
- Calculate fraud risk scores
- Identify suspicious transactions
- Explain fraud alerts

### Financial Analysis Agent

Responsibilities:

- Analyze income
- Analyze expenses
- Calculate spending by category
- Identify spending trends
- Compare income and expenses
- Generate financial insights

### Report Generation Agent

Responsibilities:

- Combine results from other agents
- Generate financial summaries
- Generate spending reports
- Generate fraud reports
- Generate monthly reports

---

## 6. Agent Orchestrator

Create an Agent Orchestrator that coordinates the agents.

The orchestrator must:

- Receive user requests
- Identify the required agent
- Execute agents in the correct order
- Pass data between agents
- Track agent states
- Handle failures
- Retry failed operations
- Return final results

---

## 7. Agent Workflow

For a complete financial analysis:

```text
User
 ↓
Authentication
 ↓
Agent Orchestrator
 ↓
Transaction Agent
 ↓
Fraud Detection Agent
 ↓
Financial Analysis Agent
 ↓
Report Generation Agent
 ↓
Final Result
 ↓
Dashboard
````

---

## 8. Transaction Processing

Support CSV transaction uploads.

Example fields:

* transactionId
* date
* merchant
* amount
* transactionType
* category
* location

Example transaction:

```json
{
  "transactionId": "TXN001",
  "date": "2026-09-01",
  "merchant": "Amazon",
  "amount": 2499,
  "transactionType": "debit",
  "category": "Shopping",
  "location": "Chennai"
}
```

Use synthetic data for the application.

---

## 9. Fraud Detection

Implement a demonstration fraud detection mechanism.

Consider factors such as:

* Unusually high transaction amount
* Unusual transaction frequency
* Unusual location
* Sudden spending changes
* Repeated transactions
* Transactions outside normal patterns

Generate:

* Risk score from 0 to 100
* Risk level
* Reason for the alert

Risk levels:

```text
0–30   Low
31–70  Medium
71–100 High
```

Fraud detection results must be treated as risk indicators and not as proof of fraud.

---

## 10. Financial Analysis

Calculate:

* Total income
* Total expenses
* Current balance
* Average transaction amount
* Spending by category
* Monthly spending
* Income versus expenses
* Highest spending category
* Spending trends

Use charts to visualize the results.

---

## 11. Dashboard Charts

Use Recharts to create:

### Expense Category Chart

Display spending by:

* Food
* Shopping
* Transport
* Bills
* Entertainment
* Healthcare
* Other

### Monthly Trend Chart

Display:

* Monthly income
* Monthly expenses

### Fraud Chart

Display:

* Low-risk transactions
* Medium-risk transactions
* High-risk transactions

---

## 12. AI Assistant

Create a conversational interface.

The assistant should answer questions using the user's available financial data.

Example:

User:

"How much did I spend on food this month?"

Assistant:

"Your total food spending this month is ₹8,450."

User:

"Which category has the highest spending?"

Assistant:

"Shopping is currently your highest spending category."

The assistant must use available application data rather than inventing transaction information.

---

## 13. Database Collections

Create collections for:

### users

Store:

* name
* email
* password hash
* role
* createdAt

### transactions

Store:

* transactionId
* userId
* date
* merchant
* amount
* transactionType
* category
* location

### fraudAlerts

Store:

* transactionId
* riskScore
* riskLevel
* reason
* status
* createdAt

### financialAnalyses

Store:

* userId
* income
* expenses
* balance
* categoryAnalysis
* monthlyAnalysis
* insights
* createdAt

### reports

Store:

* userId
* reportType
* reportData
* createdAt

### auditLogs

Store:

* userId
* action
* resource
* timestamp
* result

---

## 14. Authentication

Implement JWT authentication.

Requirements:

* Secure password hashing
* Login
* Registration
* Logout
* Protected routes
* Role-based authorization
* Token validation

Never store plain-text passwords.

---

## 15. Security Requirements

Implement:

* HTTPS-ready configuration
* JWT authentication
* Role-Based Access Control
* Input validation
* API authorization
* Rate limiting
* Secure error handling
* Audit logging
* Environment variables for secrets

Never expose:

* Database credentials
* JWT secrets
* LLM API keys
* User passwords

Never commit secrets to GitHub.

---

## 16. AI Security

Protect the AI agents from:

* Prompt injection
* Unauthorized tool usage
* Unauthorized data access
* Sensitive data exposure

Agents should only access tools required for their responsibilities.

Sensitive actions must require appropriate authorization or human approval.

---

## 17. Error Handling

Handle:

* Invalid login
* Invalid transaction files
* Invalid transaction data
* Database failures
* AI API failures
* Agent failures
* Network failures

Provide user-friendly error messages.

Do not expose internal stack traces or credentials.

---

## 18. Agent Failure Handling

Implement:

```text
Agent Failure
 ↓
Log Error
 ↓
Retry
 ↓
Successful → Continue
 ↓
Failed Again
 ↓
Escalate / Return Safe Error
```

---

## 19. Monitoring

Create a monitoring dashboard for administrators.

Track:

* API requests
* API latency
* API errors
* Agent executions
* Agent success rate
* Agent failures
* Fraud alerts
* Transactions processed
* Reports generated
* LLM usage
* Token consumption
* Security events

---

## 20. Application UI

Use a professional modern financial dashboard.

Design requirements:

* Responsive layout
* Desktop and mobile support
* Sidebar navigation
* Dashboard cards
* Tables
* Charts
* Status badges
* Risk indicators
* Loading states
* Error states
* Empty states
* Toast notifications

Use a clean professional finance-oriented design.

---

## 21. Navigation

Create sidebar navigation:

```text
Dashboard
Transactions
Fraud Detection
Financial Analysis
Reports
AI Assistant
Profile
Admin
Logout
```

Show Admin only for administrators.

---

## 22. Testing

Implement tests for:

* Authentication
* Role authorization
* Transaction validation
* Transaction categorization
* Fraud risk calculation
* Financial calculations
* Report generation
* API endpoints
* Agent workflows

Test both successful and failure scenarios.

---

## 23. Project Structure

Use the following structure:

```text
AI-Financial-Assistant/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── agents/
│   ├── transaction-agent/
│   ├── fraud-agent/
│   ├── analysis-agent/
│   ├── report-agent/
│   └── orchestrator/
│
├── database/
│   ├── schemas/
│   └── seed-data/
│
├── docs/
│
├── Application_Build_Prompt.md
└── README.md
```

---

## 24. Seed Data

Provide realistic synthetic financial transaction data for demonstration.

Include transactions across:

* Food
* Shopping
* Transport
* Bills
* Entertainment
* Healthcare
* Salary
* Other

Include some deliberately suspicious transactions so that the Fraud Detection Agent can demonstrate its functionality.

---

## 25. Final Application Requirements

The final application must:

* Run locally
* Have working frontend and backend
* Support authentication
* Support role-based access
* Process transaction data
* Run the AI agent workflow
* Detect suspicious transactions
* Generate financial analysis
* Generate reports
* Display dashboard charts
* Provide AI assistant functionality
* Maintain audit logs
* Provide monitoring information
* Use synthetic financial data
* Have clear error handling
* Have a professional responsive UI

---

## 26. Important Constraints

* Do not connect to real bank accounts.
* Do not request real banking passwords.
* Do not store real financial credentials.
* Use synthetic/demo financial data.
* Do not expose API keys.
* Do not hardcode secrets.
* Do not allow unauthorized agent tool access.
* Do not treat AI fraud predictions as confirmed fraud.
* Require appropriate authorization for sensitive operations.

---

## 27. Final Goal

Build a complete, working, professional **AI Financial Assistant** that demonstrates:

* Multi-agent AI architecture
* Transaction processing
* Fraud detection
* Financial analysis
* Automated report generation
* Secure authentication
* Role-based authorization
* Enterprise deployment architecture
* Monitoring and observability
* AI safety and security

