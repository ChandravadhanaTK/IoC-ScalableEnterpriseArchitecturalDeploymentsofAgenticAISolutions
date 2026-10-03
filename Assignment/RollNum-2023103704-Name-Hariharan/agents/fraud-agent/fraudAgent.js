function detectFraud(order) {
  if (!order) {
    return {
      success: false,
      message: "Order data is required",
    };
  }

  let riskScore = 0;
  const reasons = [];

  if (order.amount > 50000) {
    riskScore += 40;
    reasons.push("High-value transaction");
  }

  if (order.status === "Pending") {
    riskScore += 20;
    reasons.push("Order is still pending");
  }

  if (order.customer && order.customer.length < 5) {
    riskScore += 20;
    reasons.push("Unusual customer information");
  }

  let riskLevel = "Low";

  if (riskScore >= 60) {
    riskLevel = "High";
  } else if (riskScore >= 30) {
    riskLevel = "Medium";
  }

  return {
    success: true,
    agent: "Fraud Detection Agent",
    orderId: order.id,
    riskScore,
    riskLevel,
    reasons,
  };
}

module.exports = {
  detectFraud,
};