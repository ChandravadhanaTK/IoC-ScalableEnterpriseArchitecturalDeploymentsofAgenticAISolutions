const transactionAgent = require("../transaction-agent/transactionAgent");
const fraudDetectionAgent = require("../fraud-agent/fraudAgent");
const financialAnalysisAgent = require("../analysis-agent/analysisAgent");
const reportGenerationAgent = require("../report-agent/reportAgent");

function agentOrchestrator(transactions = []) {
  console.log("Starting Agent Orchestrator...");

  // Step 1
  console.log("Running Transaction Agent...");
  const transactionResult = transactionAgent(transactions);

  if (!transactionResult.success) {
    return {
      success: false,
      error: "Transaction Agent failed",
    };
  }

  // Step 2
  console.log("Running Fraud Detection Agent...");
  const fraudResult = fraudDetectionAgent(
    transactionResult.transactions,
  );

  if (!fraudResult.success) {
    return {
      success: false,
      error: "Fraud Detection Agent failed",
    };
  }

  // Step 3
  console.log("Running Financial Analysis Agent...");
  const analysisResult = financialAnalysisAgent(
    transactionResult.transactions,
    fraudResult,
  );

  if (!analysisResult.success) {
    return {
      success: false,
      error: "Financial Analysis Agent failed",
    };
  }

  // Step 4
  console.log("Running Report Generation Agent...");
  const reportResult = reportGenerationAgent(
    transactionResult,
    fraudResult,
    analysisResult,
  );

  if (!reportResult.success) {
    return {
      success: false,
      error: "Report Generation Agent failed",
    };
  }

  console.log("Agent workflow completed.");

  return {
    success: true,

    workflow: [
      "Transaction Agent",
      "Fraud Detection Agent",
      "Financial Analysis Agent",
      "Report Generation Agent",
    ],

    transactionResult,
    fraudResult,
    analysisResult,
    reportResult,
  };
}

module.exports = agentOrchestrator;