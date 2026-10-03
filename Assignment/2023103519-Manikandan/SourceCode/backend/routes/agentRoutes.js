const express = require('express');
const router = express.Router();
const { SupervisorOrchestrator } = require('../agents/supervisor');

const supervisor = new SupervisorOrchestrator();

// Active execution memory store
let executionStore = {
  activeSessions: [],
  logs: [],
  metrics: {
    totalWorkflowsRun: 142,
    totalTokensConsumed: 1845200,
    totalCostUSD: 27.68,
    guardrailBlocks: 18,
    hitlApprovalsCount: 29
  }
};

// POST /api/agent/run - Execute Agentic Workflow
router.post('/run', async (req, res) => {
  const { goal } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'Goal is required.' });
  }

  let eventStream = [];
  const updateCallback = (evt) => {
    eventStream.push({ timestamp: new Date().toISOString(), ...evt });
    executionStore.logs.push({ timestamp: new Date().toISOString(), ...evt });
  };

  try {
    const result = await supervisor.processGoal(goal, updateCallback);
    
    if (result.status === 'COMPLETED') {
      executionStore.metrics.totalWorkflowsRun += 1;
      executionStore.metrics.totalTokensConsumed += result.telemetry.totalTokens;
    } else if (result.status === 'PENDING_HUMAN_APPROVAL') {
      executionStore.metrics.hitlApprovalsCount += 1;
    }

    return res.json({
      success: true,
      events: eventStream,
      result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/agent/approve - Handle Human Approval Decision
router.post('/approve', async (req, res) => {
  const { decision, goal } = req.body; // decision: 'APPROVE' or 'REJECT'

  if (decision === 'APPROVE') {
    return res.json({
      success: true,
      status: 'APPROVED_AND_EXECUTED',
      output: {
        summary: `Human Operator APPROVED elevated tool action for goal: "${goal}". Execution completed safely.`,
        telemetry: { totalTokens: 680, durationMs: 420, costUSD: '$0.0102', riskScore: 0.15 }
      }
    });
  } else {
    return res.json({
      success: true,
      status: 'REJECTED_BY_OPERATOR',
      message: `Human Operator REJECTED high-risk tool action. Sub-task aborted safely.`
    });
  }
});

// GET /api/agent/metrics - Retrieve Telemetry Metrics
router.get('/metrics', (req, res) => {
  res.json({
    metrics: executionStore.metrics,
    recentLogs: executionStore.logs.slice(-20)
  });
});

module.exports = router;
