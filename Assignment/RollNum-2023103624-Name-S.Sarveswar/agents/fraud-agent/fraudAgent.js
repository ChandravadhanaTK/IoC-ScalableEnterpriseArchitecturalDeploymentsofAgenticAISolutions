function fraudDetectionAgent(transactions = []) {
  const alerts = [];

  for (const transaction of transactions) {
    let riskScore = 0;
    const reasons = [];

    // High-value transaction
    if (transaction.amount >= 20000) {
      riskScore += 45;
      reasons.push("Unusually high transaction amount");
    }

    // Unknown location
    if (
      transaction.location &&
      transaction.location.toLowerCase() === "unknown"
    ) {
      riskScore += 20;
      reasons.push("Unknown transaction location");
    }

    // Unknown merchant
    if (
      transaction.merchant &&
      transaction.merchant.toLowerCase().includes("unknown")
    ) {
      riskScore += 30;
      reasons.push("Unknown merchant");
    }

    if (riskScore > 100) {
      riskScore = 100;
    }

    let riskLevel = "Low";

    if (riskScore >= 71) {
      riskLevel = "High";
    } else if (riskScore >= 31) {
      riskLevel = "Medium";
    }

    if (riskScore >= 31) {
      alerts.push({
        transactionId: transaction.transactionId,
        merchant: transaction.merchant,
        amount: transaction.amount,
        riskScore,
        riskLevel,
        reason: reasons.join(", "),
        status: "Pending Review",
      });
    }
  }

  return {
    agent: "Fraud Detection Agent",
    success: true,
    alerts,
    summary: {
      transactionsAnalyzed: transactions.length,
      suspiciousTransactions: alerts.length,
      highRisk: alerts.filter((a) => a.riskLevel === "High").length,
      mediumRisk: alerts.filter((a) => a.riskLevel === "Medium").length,
      lowRisk: alerts.filter((a) => a.riskLevel === "Low").length,
    },
  };
}

module.exports = fraudDetectionAgent;