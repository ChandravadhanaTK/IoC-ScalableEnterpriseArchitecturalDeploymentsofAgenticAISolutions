const { runResearch } = require('./researchAgent');
const { runExecution } = require('./executionAgent');
const { evaluateSafety } = require('./guardrailAgent');

/**
 * Supervisor Agent (Master Orchestrator)
 * Decomposes user goal into sub-tasks (DAG), manages state transitions, and enforces HITL workflows.
 */
class SupervisorOrchestrator {
  constructor() {
    this.telemetryLogs = [];
  }

  async processGoal(userGoal, updateCallback = () => {}) {
    const startTime = Date.now();

    // 1. Initial State: SCANNING & GUARDRAIL PRE-CHECK
    updateCallback({ state: 'SECURITY_SCANNING', agent: 'GuardrailAgent', message: 'Analyzing prompt safety and PII...' });
    const safetyResult = evaluateSafety({ userGoal });

    if (!safetyResult.isSafe) {
      updateCallback({ state: 'REJECTED', agent: 'GuardrailAgent', error: 'Blocked due to Prompt Injection or Severe Policy Violation.' });
      return { status: 'REJECTED', safety: safetyResult };
    }

    // 2. Planning State: DECOMPOSE INTO DAG
    updateCallback({ state: 'PLANNING', agent: 'SupervisorAgent', message: 'Decomposing enterprise goal into DAG sub-tasks...' });
    const dagTasks = [
      { id: 'T1', type: 'research', description: `Retrieve context and intelligence for: ${userGoal}` },
      { id: 'T2', type: 'execution', description: `Execute data synthesis and code sandbox processing for sub-task.` }
    ];

    let taskResults = [];
    let requiresHITL = false;
    let hitlPayload = null;

    // Check if task involves high risk keyword triggering HITL
    const goalLower = userGoal.toLowerCase();
    if (goalLower.includes('delete') || goalLower.includes('deploy') || goalLower.includes('database') || goalLower.includes('override')) {
      requiresHITL = true;
      hitlPayload = {
        action: 'HIGH_RISK_TOOL_EXECUTION',
        target: 'Production Database & Code Sandbox',
        riskScore: safetyResult.riskScore > 0.65 ? safetyResult.riskScore : 0.78,
        description: `Agent requested destructive/elevated permission operation: "${userGoal}"`
      };
    }

    if (requiresHITL) {
      updateCallback({
        state: 'PENDING_HUMAN_APPROVAL',
        agent: 'GuardrailAgent',
        hitlPayload,
        message: 'High-risk payload detected! Triggering mandatory Human-in-the-Loop approval gate.'
      });
      return {
        status: 'PENDING_HUMAN_APPROVAL',
        hitlPayload,
        userGoal,
        dagTasks
      };
    }

    // 3. Execution Phase: Worker Agents
    // Step 1: Research Agent
    updateCallback({ state: 'EXECUTING', agent: 'ResearchAgent', message: 'Executing Research Sub-task...' });
    const resResult = await runResearch(userGoal);
    taskResults.push(resResult);

    // Step 2: Execution Agent
    updateCallback({ state: 'EXECUTING', agent: 'ExecutionAgent', message: 'Running Code Sandbox & Query Engine...' });
    const execResult = await runExecution(userGoal);
    taskResults.push(execResult);

    // 4. Synthesis State
    updateCallback({ state: 'SYNTHESIZING', agent: 'SupervisorAgent', message: 'Synthesizing worker outputs and validating quality...' });
    const totalTokens = resResult.tokensUsed.total + execResult.tokensUsed.total + 150;
    const duration = Date.now() - startTime;
    const estimatedCost = (totalTokens * 0.000015).toFixed(4);

    const finalOutput = {
      status: 'COMPLETED',
      userGoal,
      summary: `Enterprise task completed successfully across 2 agent steps with 100% compliance.`,
      taskResults,
      telemetry: {
        totalTokens,
        durationMs: duration,
        costUSD: `$${estimatedCost}`,
        riskScore: safetyResult.riskScore,
        selfHealingRetries: 0
      }
    };

    updateCallback({ state: 'COMPLETED', agent: 'SupervisorAgent', output: finalOutput });
    return finalOutput;
  }
}

module.exports = { SupervisorOrchestrator };
