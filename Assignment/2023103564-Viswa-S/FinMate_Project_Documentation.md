# FinMate — Personal Finance Assistant

## 1. Project Overview

**FinMate** is a web-based personal finance assistant designed to help users record transactions, monitor their spending, manage category-wise budgets, and understand their financial activity through a simple dashboard and a conversational Finance Agent.

The application combines a responsive user interface with a rule-based agent that interprets supported user requests and performs relevant actions using the application's finance data.

## 2. Problem Statement

Managing personal finances manually can make it difficult to track daily expenses, monitor monthly spending, and identify budget overruns. Users may need to switch between different records or perform calculations themselves to understand their financial position.

FinMate addresses this problem by providing a single interface for transaction management, budget tracking, spending analysis, and natural-language-style finance queries.

## 3. Objectives

- Provide a centralized interface to record income and expenses.
- Display an overview of financial activity.
- Allow users to create and monitor category-wise budgets.
- Analyze spending patterns using summaries and visualizations.
- Implement a Finance Agent that recognizes supported requests and responds using application data.
- Persist user data in browser Local Storage.
- Provide a responsive and easy-to-use interface.

## 4. Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type safety and maintainable code |
| Vite | Development server and build tool |
| Tailwind CSS | Interface styling |
| Recharts | Financial charts and visualizations |
| Lucide React | Interface icons |
| Browser Local Storage | Client-side data persistence |

The application is designed to run without a separate backend server or external AI API.

## 5. System Modules

### 5.1 Dashboard

The dashboard provides a summary of the user's financial activity, including key income and expense figures, balance information, budget status, and relevant spending visualizations.

### 5.2 Transaction Management

This module allows users to manage financial transactions. Transactions contain relevant details such as the transaction type, amount, category, date, and description.

The interface supports transaction entry and, where implemented, editing, deletion, searching, and filtering.

### 5.3 Budget Management

Users can define spending limits for expense categories and compare recorded spending with the corresponding budget. The module helps identify categories that are approaching or exceeding their limits.

### 5.4 Spending Analysis

This module presents financial information in summarized and visual forms. It helps users examine income, expenses, category-wise spending, and spending patterns over the selected period.

### 5.5 Finance Agent

The Finance Agent provides a conversational interface for supported finance-related requests. It identifies the user's intent, extracts relevant information, and invokes the corresponding application logic.

Examples of supported request types include:

- Adding an expense or income entry.
- Checking monthly spending.
- Checking spending for a particular category.
- Asking how much budget remains.
- Viewing recent transactions.
- Requesting a monthly summary.
- Identifying categories that exceed their budgets.
- Asking for help with supported commands.

The agent uses predefined rules and the application's stored data. It does not depend on an external large language model.

## 6. System Architecture

FinMate follows a client-side application architecture with the following layers:

1. **Presentation Layer:** React components display the dashboard, transactions, budgets, spending analysis, and Finance Agent interface.
2. **Application Logic Layer:** TypeScript functions handle user actions, transaction operations, budget calculations, and agent request processing.
3. **Data Management Layer:** Shared state and storage utilities manage the application's finance records and synchronize changes with Local Storage.
4. **Persistence Layer:** Browser Local Storage retains saved data between sessions on the same browser and origin.

### Data Flow

1. The user interacts with the interface.
2. The relevant component passes the action or request to the application logic.
3. The application logic validates the input and reads or updates the finance data.
4. Updated data is saved to Local Storage when applicable.
5. The interface refreshes to display the latest results.

## 7. Agentic Assistant Design

The Finance Agent demonstrates a basic tool-using agent workflow through deterministic intent recognition and predefined application functions.

### Agent Workflow

1. **Input:** Receive the user's message.
2. **Intent Recognition:** Match the message against supported request patterns.
3. **Entity Extraction:** Extract information such as amount, category, date, or transaction type when required.
4. **Tool Selection:** Select the relevant application function, such as adding a transaction or calculating category spending.
5. **Execution:** Validate the request and execute the selected function against the application data.
6. **Response Generation:** Return a response based on the operation's result.
7. **State Update:** For operations that modify data, persist the changes and refresh the interface.

### Example

**User request:** "How much did I spend on food this month?"

- The agent recognizes a category-spending query.
- It identifies the category and requested period.
- The application filters the relevant expense records.
- The total is calculated and returned to the user.

This design demonstrates intent recognition, tool selection, function execution, and response generation without requiring an external AI service.

## 8. Data Management and Storage

FinMate stores its finance data in the browser's Local Storage. This enables the application to retain records after a page refresh or browser restart on the same browser and origin.

The application may include sample transactions and budgets for demonstration purposes.

**Storage limitation:** Local Storage is specific to the browser and origin. Data is not automatically synchronized across devices or shared between different users. Clearing browser storage may remove saved records. This implementation is intended for demonstration and should not be treated as a secure financial record system.

## 9. User Interface and Usability

The application uses a component-based interface to organize its finance features into separate sections. Responsive layouts support use on different screen sizes. Charts and summary cards help users understand financial information without manually calculating every value.

Input validation and informative responses should help users identify invalid entries or unsupported agent requests.

## 10. Setup and Execution

### Prerequisites

- Node.js and npm installed.
- A code editor such as Visual Studio Code.
- A modern web browser.

### Installation

Open a terminal inside the `FinMate` project directory and run:

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

Open the local URL printed in the terminal.

### Production Build

```bash
npm run build
```

Vite generates the production build in the `dist` directory.

## 11. Testing and Validation

The following checks should be performed before submission:

| Test | Expected result |
|---|---|
| Launch the application | Main interface loads without a blocking error |
| Add an income entry | Valid income is recorded and summaries update |
| Add an expense entry | Valid expense is recorded and summaries update |
| Edit or delete a transaction | The selected record is updated or removed |
| Refresh the page | Previously saved data remains available |
| Create or update a budget | Budget information is reflected in the interface |
| Review spending analysis | Charts and totals correspond to the stored records |
| Ask a supported agent question | The agent returns a response based on application data |
| Submit an unsupported request | The agent responds appropriately rather than inventing a result |
| Use a narrow screen | The interface remains usable and readable |
| Run the production build | The build completes successfully |

The production build was verified using `npm run build`. The remaining checks should be marked complete only after they have been tested in the running application.

## 12. Limitations

- The Finance Agent uses predefined rules and supports a limited set of requests.
- The application does not use a live LLM or external financial data service.
- Data is stored locally and is not synchronized between devices.
- There is no server-side account system or multi-user database.
- The application is a demonstration project and is not connected to bank accounts.

## 13. Future Enhancements

- Add an optional secure backend and database.
- Introduce authentication and user-specific data storage.
- Support data export and import.
- Improve agent intent recognition and handle more complex requests.
- Add recurring transactions and configurable financial reports.
- Provide secure synchronization across devices.

## 14. Conclusion

FinMate demonstrates how a web application can combine personal finance management with a basic agentic workflow. By integrating transaction management, budgeting, spending analysis, browser-based persistence, and a rule-based Finance Agent, the project provides a practical example of a client-side assistant that processes user requests and interacts with application functions.

## 15. Project Deliverables

The assignment folder contains the following deliverables:

1. **FinMate_Build_Prompt.md** — the prompt used to generate the application.
2. **FinMate_Project_Documentation.md** — project overview, architecture, modules, agent workflow, setup instructions, testing, and limitations.
3. **FinMate/** — the complete application source code.
