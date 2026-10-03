const express = require("express");
const cors = require("cors");
require("dotenv").config();

const agentOrchestrator = require("../../agents/orchestrator/orchestrator");

const app = express();

const PORT = process.env.PORT || 5000;

/* =========================
   Middleware
========================= */

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =========================
   Root API
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "AI Financial Assistant API is running",
    status: "healthy",
  });
});

/* =========================
   Health Check
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "AI Financial Assistant Backend",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   Transactions
========================= */

app.get("/api/transactions", (req, res) => {
  res.json({
    success: true,

    transactions: [
      {
        transactionId: "TXN001",
        date: "2026-09-30",
        merchant: "Amazon",
        amount: 2499,
        transactionType: "debit",
        category: "Shopping",
        location: "Chennai",
      },

      {
        transactionId: "TXN002",
        date: "2026-09-29",
        merchant: "Swiggy",
        amount: 850,
        transactionType: "debit",
        category: "Food",
        location: "Chennai",
      },

      {
        transactionId: "TXN003",
        date: "2026-09-28",
        merchant: "Unknown Merchant",
        amount: 28500,
        transactionType: "debit",
        category: "Other",
        location: "Unknown",
      },

      {
        transactionId: "TXN004",
        date: "2026-09-27",
        merchant: "Salary",
        amount: 50000,
        transactionType: "credit",
        category: "Income",
        location: "Chennai",
      },

      {
        transactionId: "TXN005",
        date: "2026-09-26",
        merchant: "Uber",
        amount: 420,
        transactionType: "debit",
        category: "Transport",
        location: "Chennai",
      },
    ],
  });
});

/* =========================
   Fraud Alerts
========================= */

app.get("/api/fraud-alerts", (req, res) => {
  res.json({
    success: true,

    alerts: [
      {
        transactionId: "TXN003",
        merchant: "Unknown Merchant",
        amount: 28500,
        riskScore: 95,
        riskLevel: "High",
        reason:
          "Unusually high transaction amount and unknown merchant",
        status: "Pending Review",
      },

      {
        transactionId: "TXN005",
        merchant: "International Store",
        amount: 17200,
        riskScore: 78,
        riskLevel: "High",
        reason: "Unusual transaction location",
        status: "Pending Review",
      },
    ],
  });
});

/* =========================
   Financial Analysis
========================= */

app.get("/api/financial-analysis", (req, res) => {
  res.json({
    success: true,

    analysis: {
      totalIncome: 50000,
      totalExpenses: 31849,
      balance: 18151,

      highestSpendingCategory: "Other",

      categorySpending: {
        Shopping: 2499,
        Food: 850,
        Other: 28500,
        Transport: 420,
      },

      insights: [
        "Income is currently higher than expenses.",
        "Other is currently the highest spending category.",
        "1 suspicious transaction requires review.",
      ],
    },
  });
});

/* =========================
   Reports
========================= */

app.get("/api/reports", (req, res) => {
  res.json({
    success: true,

    reports: [
      {
        id: "RPT001",
        name: "September 2026 Financial Report",
        type: "Monthly Report",
        date: "30 Sep 2026",
      },

      {
        id: "RPT002",
        name: "September 2026 Fraud Report",
        type: "Fraud Report",
        date: "30 Sep 2026",
      },

      {
        id: "RPT003",
        name: "September 2026 Spending Analysis",
        type: "Spending Report",
        date: "29 Sep 2026",
      },
    ],
  });
});

/* =========================
   AI Financial Assistant
========================= */

app.post("/api/ai-assistant", (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Message is required",
    });
  }

  const lowerMessage = message.toLowerCase();

  let response =
    "I can analyze your transactions, spending, fraud alerts, and financial reports.";

  if (
    lowerMessage.includes("food") ||
    lowerMessage.includes("restaurant")
  ) {
    response = "Your current food spending is ₹850.";
  } else if (
    lowerMessage.includes("highest") ||
    lowerMessage.includes("category")
  ) {
    response =
      "Based on the current transaction data, Other is the highest spending category.";
  } else if (
    lowerMessage.includes("balance") ||
    lowerMessage.includes("money")
  ) {
    response = "Your current calculated balance is ₹18,151.";
  } else if (
    lowerMessage.includes("income") ||
    lowerMessage.includes("salary")
  ) {
    response = "Your current recorded income is ₹50,000.";
  } else if (
    lowerMessage.includes("expense") ||
    lowerMessage.includes("spending")
  ) {
    response = "Your current recorded expenses are ₹31,849.";
  } else if (
    lowerMessage.includes("fraud") ||
    lowerMessage.includes("suspicious")
  ) {
    response =
      "There is currently a high-risk transaction that requires review.";
  } else if (
    lowerMessage.includes("transaction") ||
    lowerMessage.includes("transactions")
  ) {
    response =
      "There are 5 sample transactions currently available for analysis.";
  }

  res.json({
    success: true,
    response,
  });
});

/* =========================
   AGENTIC AI WORKFLOW
========================= */

app.post("/api/agent/analyze", (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: "transactions must be an array",
      });
    }

    console.log("");
    console.log("========================================");
    console.log("AI FINANCIAL AGENT WORKFLOW");
    console.log("========================================");

    console.log(
      `Received ${transactions.length} transaction(s)`,
    );

    const result = agentOrchestrator(transactions);

    if (!result.success) {
      return res.status(500).json(result);
    }

    console.log("========================================");
    console.log("AGENT WORKFLOW COMPLETED");
    console.log("========================================");

    res.json(result);
  } catch (error) {
    console.error("Agent workflow error:", error);

    res.status(500).json({
      success: false,
      message: "Agent workflow failed",
      error: error.message,
    });
  }
});

/* =========================
   Demo Agent Workflow
========================= */

app.get("/api/agent/demo", (req, res) => {
  try {
    const demoTransactions = [
      {
        transactionId: "TXN001",
        date: "2026-09-30",
        merchant: "Amazon",
        amount: 2499,
        transactionType: "debit",
        category: "Shopping",
        location: "Chennai",
      },

      {
        transactionId: "TXN002",
        date: "2026-09-29",
        merchant: "Swiggy",
        amount: 850,
        transactionType: "debit",
        category: "Food",
        location: "Chennai",
      },

      {
        transactionId: "TXN003",
        date: "2026-09-28",
        merchant: "Unknown Merchant",
        amount: 28500,
        transactionType: "debit",
        category: "Other",
        location: "Unknown",
      },

      {
        transactionId: "TXN004",
        date: "2026-09-27",
        merchant: "Salary",
        amount: 50000,
        transactionType: "credit",
        category: "Income",
        location: "Chennai",
      },

      {
        transactionId: "TXN005",
        date: "2026-09-26",
        merchant: "Uber",
        amount: 420,
        transactionType: "debit",
        category: "Transport",
        location: "Chennai",
      },
    ];

    const result = agentOrchestrator(demoTransactions);

    res.json(result);
  } catch (error) {
    console.error("Demo agent workflow error:", error);

    res.status(500).json({
      success: false,
      message: "Demo agent workflow failed",
      error: error.message,
    });
  }
});

/* =========================
   404 Handler
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

/* =========================
   Error Handler
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================
   Start Server
========================= */

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("AI FINANCIAL ASSISTANT BACKEND");
  console.log("========================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(
    `Agent Demo: http://localhost:${PORT}/api/agent/demo`,
  );
  console.log("========================================");
  console.log("");
});