function analyzeBusiness(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      success: false,
      message: "Order data is required",
    };
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.amount || 0),
    0
  );

  const totalOrders = orders.length;

  const averageOrderValue =
    totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  return {
    success: true,
    agent: "Analysis Agent",
    totalRevenue,
    totalOrders,
    averageOrderValue: Math.round(averageOrderValue),
    deliveredOrders,
    pendingOrders,
    summary: `The business processed ${totalOrders} orders with total revenue of ₹${totalRevenue}.`,
  };
}

module.exports = {
  analyzeBusiness,
};