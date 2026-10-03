function analyzeCustomer(customer) {
  if (!customer) {
    return {
      success: false,
      message: "Customer data is required",
    };
  }

  const totalOrders = customer.totalOrders || 0;
  const totalSpent = customer.totalSpent || 0;

  let segment = "New Customer";

  if (totalOrders >= 10 && totalSpent >= 100000) {
    segment = "VIP Customer";
  } else if (totalOrders >= 5 && totalSpent >= 50000) {
    segment = "Loyal Customer";
  } else if (totalOrders >= 2) {
    segment = "Returning Customer";
  }

  return {
    success: true,
    agent: "Customer Analysis Agent",
    customerId: customer.id,
    customerName: customer.name,
    totalOrders,
    totalSpent,
    segment,
    recommendation:
      segment === "VIP Customer"
        ? "Offer exclusive rewards and personalized discounts"
        : "Recommend products based on previous purchases",
  };
}

module.exports = {
  analyzeCustomer,
};