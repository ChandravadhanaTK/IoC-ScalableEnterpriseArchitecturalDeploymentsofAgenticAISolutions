function reportGenerationAgent(
  transactionAnalysis,
  fraudAnalysis,
  financialAnalysis,
) {
  const report = {
    reportId: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),

    transactionSummary: transactionAnalysis.summary,

    fraudSummary: fraudAnalysis.summary,

    financialSummary: financialAnalysis.analysis,

    insights: financialAnalysis.analysis.insights,

    status: "Generated",
  };

  return {
    agent: "Report Generation Agent",
    success: true,
    report,
  };
}

module.exports = reportGenerationAgent;