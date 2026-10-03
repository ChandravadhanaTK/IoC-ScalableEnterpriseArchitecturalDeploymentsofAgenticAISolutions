const { runInSandbox } = require('../tools/codeSandbox');
const { queryDatabase } = require('../tools/databaseQuery');

/**
 * Execution & Coding Agent
 * Generates and runs code in sandboxed runtime environment.
 */
async function runExecution(taskDescription) {
  const codeSnippet = `
    const state = "PROCESSING";
    result = "Executed enterprise DAG sub-task for: " + "${taskDescription.substring(0, 30)}...";
  `;

  const sandboxRes = runInSandbox(codeSnippet);
  const dbRes = queryDatabase('SELECT * FROM agent_logs;', false);

  return {
    agent: 'ExecutionAgent',
    status: sandboxRes.success ? 'COMPLETED' : 'FAILED',
    sandboxOutput: sandboxRes.output,
    dbQueryOutput: dbRes,
    tokensUsed: { prompt: 310, completion: 220, total: 530 },
    latencyMs: 410
  };
}

module.exports = { runExecution };
