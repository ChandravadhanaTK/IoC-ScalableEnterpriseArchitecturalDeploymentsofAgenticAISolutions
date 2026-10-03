const { processOrder } = require("../order-agent/orderAgent");
const { detectFraud } = require("../fraud-agent/fraudAgent");
const { analyzeCustomer } = require("../customer-agent/customerAgent");
const { analyzeBusiness } = require("../analysis-agent/analysisAgent");
const { generateReport } = require("../report-agent/reportAgent");

async function runECommerceWorkflow(order, customer, orders) {
  const orderResult = processOrder(order);

  const fraudResult = detectFraud(order);

  const customerResult = analyzeCustomer(customer);

  const analysisResult = analyzeBusiness(orders);

  const reportResult = generateReport(analysisResult);

  return {
    success: true,
    workflow: "AI E-Commerce Multi-Agent Workflow",
    agents: {
      orderAgent: orderResult,
      fraudAgent: fraudResult,
      customerAgent: customerResult,
      analysisAgent: analysisResult,
      reportAgent: reportResult,
    },
  };
}

module.exports = {
  runECommerceWorkflow,
};