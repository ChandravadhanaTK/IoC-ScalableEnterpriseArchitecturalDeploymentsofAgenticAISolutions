function transactionAgent(transactions = []) {
  const validatedTransactions = [];
  const duplicates = [];
  const seen = new Set();

  for (const transaction of transactions) {
    if (
      !transaction.transactionId ||
      !transaction.date ||
      !transaction.merchant ||
      typeof transaction.amount !== "number"
    ) {
      continue;
    }

    if (seen.has(transaction.transactionId)) {
      duplicates.push(transaction);
      continue;
    }

    seen.add(transaction.transactionId);

    const normalizedTransaction = {
      transactionId: transaction.transactionId,
      date: transaction.date,
      merchant: transaction.merchant,
      amount: transaction.amount,
      transactionType:
        transaction.transactionType || "debit",
      category: transaction.category || "Other",
      location: transaction.location || "Unknown",
    };

    validatedTransactions.push(normalizedTransaction);
  }

  const totalTransactions = validatedTransactions.length;

  const totalIncome = validatedTransactions
    .filter((t) => t.transactionType === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = validatedTransactions
    .filter((t) => t.transactionType === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    agent: "Transaction Agent",
    success: true,
    transactions: validatedTransactions,
    duplicates,
    summary: {
      totalTransactions,
      totalIncome,
      totalExpenses,
    },
  };
}

module.exports = transactionAgent;