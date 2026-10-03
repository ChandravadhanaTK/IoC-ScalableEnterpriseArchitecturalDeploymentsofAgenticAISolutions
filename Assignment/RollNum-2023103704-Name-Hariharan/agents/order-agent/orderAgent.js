function processOrder(order) {
  if (!order || !order.id) {
    return {
      success: false,
      message: "Invalid order data",
    };
  }

  return {
    success: true,
    agent: "Order Agent",
    orderId: order.id,
    customer: order.customer,
    product: order.product,
    amount: order.amount,
    status: order.status || "Pending",
    message: `Order ${order.id} processed successfully`,
  };
}

module.exports = {
  processOrder,
};