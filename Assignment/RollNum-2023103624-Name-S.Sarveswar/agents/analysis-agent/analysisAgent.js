function financialAnalysisAgent(transactions = [], fraudAnalysis = {}) {
  const incomeTransactions = transactions.filter(
    (t) => t.transactionType === "credit",
  );

  const expenseTransactions = transactions.filter(
    (t) => t.transactionType === "debit",
  );

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  const balance = totalIncome - totalExpenses;

  const categorySpending = {};

  for (const transaction of expenseTransactions) {
    const category = transaction.category || "Other";

    categorySpending[category] =
      (categorySpending[category] || 0) + transaction.amount;
  }

  let highestSpendingCategory = "None";
  let highestSpendingAmount = 0;

  for (const [category, amount] of Object.entries(categorySpending)) {
    if (amount > highestSpendingAmount) {
      highestSpendingAmount = amount;
      highestSpendingCategory = category;
    }
  }

  const insights = [];

  if (totalExpenses > totalIncome) {
    insights.push(
      "Expenses are higher than income and should be reviewed.",
    );
  } else {
    insights.push(
      "Income is currently higher than expenses.",
    );
  }

  if (highestSpendingCategory !== "None") {
    insights.push(
      `${highestSpendingCategory} is currently the highest spending category.`,
    );
  }

  if (fraudAnalysis.alerts?.length > 0) {
    insights.push(
      `${fraudAnalysis.alerts.length} suspicious transaction(s) require review.`,
    );
  }

  return {
    agent: "Financial Analysis Agent",
    success: true,

    analysis: {
      totalIncome,
      totalExpenses,
      balance,
      categorySpending,
      highestSpendingCategory,
      highestSpendingAmount,
      transactionCount: transactions.length,
      fraudAlerts: fraudAnalysis.alerts?.length || 0,
      insights,
    },
  };
}

module.exports = financialAnalysisAgent;