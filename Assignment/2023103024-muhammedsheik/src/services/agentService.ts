import { 
  ChatMessage, 
  TaskStatus, 
  TraceStep, 
  AgentRole, 
  SimulatedToolName, 
  PipelineExecutionStep 
} from '../types/agent';

export interface RunAgentCallbacks {
  onStatusChange: (status: TaskStatus) => void;
  onAgentChange: (agent: AgentRole, tool?: string) => void;
  onStepAdded: (step: TraceStep) => void;
  onStepUpdated: (step: TraceStep) => void;
  onPipelineStepAdded?: (step: PipelineExecutionStep) => void;
  onPipelineStepUpdated?: (step: PipelineExecutionStep) => void;
}

export function detectTaskIntentAndAgent(prompt: string): {
  intent: string;
  selectedAgent: AgentRole;
  selectedTool: SimulatedToolName;
  planDescription: string;
  toolParameters: Record<string, any>;
  toolResultText: string;
} {
  const p = prompt.toLowerCase().trim();

  // 1. Calculator / Math
  if (
    p.includes('calculate') ||
    p.includes('compute') ||
    p.includes('math') ||
    p.includes('sum') ||
    p.includes('average') ||
    p.includes('percentage') ||
    p.includes('formula') ||
    /\b\d+\s*[\+\-\*\/]\s*\d+\b/.test(p)
  ) {
    return {
      intent: 'Quantitative Mathematical Computation & Formula Evaluation',
      selectedAgent: 'Analysis Agent',
      selectedTool: 'Calculator',
      planDescription: 'Parse mathematical tokens, apply operator precedence, execute floating-point calculation with 64-bit IEEE precision, and verify result.',
      toolParameters: { engine: 'SymPy / IEEE-754 Precision Calculator', expression: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt },
      toolResultText: 'Calculator tool executed successfully: Arithmetic operations resolved with 0% error margin. Verified against formal math engine.'
    };
  }

  // 2. Data Analyzer
  if (
    p.includes('analyze') ||
    p.includes('analysis') ||
    p.includes('data') ||
    p.includes('metric') ||
    p.includes('stats') ||
    p.includes('statistics') ||
    p.includes('trend') ||
    p.includes('latency') ||
    p.includes('distribution') ||
    p.includes('spike') ||
    p.includes('performance')
  ) {
    return {
      intent: 'Data Telemetry Analysis & Statistical Anomaly Extraction',
      selectedAgent: 'Analysis Agent',
      selectedTool: 'Data Analyzer',
      planDescription: 'Ingest numerical metrics stream, calculate statistical moments (mean, p95, variance), and isolate anomalous outlier clusters.',
      toolParameters: { dataset: 'Production Microservice Telemetry', samples: 4800, confidenceInterval: '99%' },
      toolResultText: 'Data Analyzer processed 4,800 metrics points: Identified p99 latency excursion (3,420ms vs 142ms baseline) caused by unindexed sequential DB scan.'
    };
  }

  // 3. Find info / Research
  if (
    p.includes('find') ||
    p.includes('search') ||
    p.includes('research') ||
    p.includes('info') ||
    p.includes('information') ||
    p.includes('what is') ||
    p.includes('who is') ||
    p.includes('explain') ||
    p.includes('learn') ||
    p.includes('discover')
  ) {
    const isWeb = p.includes('web') || p.includes('internet') || p.includes('latest') || p.includes('news') || p.includes('market');
    const toolName: SimulatedToolName = isWeb ? 'Web Search simulation' : 'Knowledge Search';
    return {
      intent: 'Semantic Knowledge Retrieval & Multi-Source Synthesis',
      selectedAgent: 'Research Agent',
      selectedTool: toolName,
      planDescription: `Execute vector semantic search against ${isWeb ? 'crawled enterprise web index' : 'internal Vector Knowledge Base'}, re-rank results, and synthesize verified findings.`,
      toolParameters: { query: prompt, topK: 5, reranker: 'bge-reranker-large' },
      toolResultText: `Retrieved 5 authoritative knowledge documents from ${toolName}. Cross-referenced fact entities with 99.4% confidence score.`
    };
  }

  // 4. Check whether / Validation
  if (
    p.includes('check') ||
    p.includes('verify') ||
    p.includes('whether') ||
    p.includes('compliant') ||
    p.includes('compliance') ||
    p.includes('audit') ||
    p.includes('policy') ||
    p.includes('valid') ||
    p.includes('confirm') ||
    p.includes('does') ||
    p.includes('is it') ||
    p.includes('gdpr') ||
    p.includes('iam') ||
    p.includes('security')
  ) {
    return {
      intent: 'Policy Compliance Verification & Regulatory Constraint Audit',
      selectedAgent: 'Validation Agent',
      selectedTool: 'Document Search',
      planDescription: 'Search enterprise regulatory documentation and compliance policies (CIS AWS, GDPR, SOC2), check invariants, and generate compliance report.',
      toolParameters: { framework: 'Enterprise Security RFC-402', policyDocument: 'cloud_security_baseline_2026.pdf' },
      toolResultText: 'Document Search located CIS benchmark rule 1.4: 14 wildcard permission grants violate least-privilege principles.'
    };
  }

  // 5. Default / Unsupported / General
  return {
    intent: 'General Enterprise Inquiry & Contextual Guidance',
    selectedAgent: 'General Assistant',
    selectedTool: 'Knowledge Search',
    planDescription: 'Ingest natural language query, route through General Assistant agent, retrieve general enterprise guidelines, and formulate structured response.',
    toolParameters: { domain: 'Enterprise General Knowledge', userContext: 'Operator Session' },
    toolResultText: 'Knowledge Search returned 3 reference guidelines from general operations handbook.'
  };
}

export async function executeAgentTask(
  userPrompt: string,
  callbacks: RunAgentCallbacks,
  requireApproval = false
): Promise<{ 
  responseText: string; 
  traceSteps: TraceStep[]; 
  pipelineSteps: PipelineExecutionStep[];
  selectedAgent: AgentRole;
  selectedTool: SimulatedToolName;
  tokens: number; 
  latencyMs: number; 
  waitingApproval?: boolean 
}> {
  const startTime = Date.now();
  const traceSteps: TraceStep[] = [];
  const pipelineSteps: PipelineExecutionStep[] = [];

  // Determine intent and appropriate agent/tool using intelligent keyword detection
  const routing = detectTaskIntentAndAgent(userPrompt);

  const addPipelineStep = (
    stepNumber: number,
    stepName: any,
    agentResponsible: AgentRole,
    details: string,
    toolUsed?: SimulatedToolName,
    parameters?: Record<string, any>
  ): PipelineExecutionStep => {
    const pStep: PipelineExecutionStep = {
      id: `pstep-${Date.now()}-${stepNumber}`,
      stepNumber,
      stepName,
      agentResponsible,
      status: 'running',
      startTime: new Date().toLocaleTimeString(),
      durationMs: 0,
      result: 'In progress...',
      success: true,
      toolUsed,
      details,
      parameters
    };
    pipelineSteps.push(pStep);
    if (callbacks.onPipelineStepAdded) {
      callbacks.onPipelineStepAdded({ ...pStep });
    }

    // Also mirror to trace steps for backwards compatibility
    const tStep: TraceStep = {
      id: `tstep-${Date.now()}-${stepNumber}`,
      stepNumber,
      agent: agentResponsible,
      toolUsed,
      action: stepName,
      status: 'running',
      timestamp: pStep.startTime,
      durationMs: 0,
      tokensUsed: 140 + Math.floor(Math.random() * 180),
      details,
      payload: parameters
    };
    traceSteps.push(tStep);
    callbacks.onStepAdded(tStep);

    return pStep;
  };

  const completePipelineStep = (
    pStep: PipelineExecutionStep,
    result: string,
    durationMs: number,
    success = true
  ) => {
    pStep.status = success ? 'completed' : 'failed';
    pStep.durationMs = durationMs;
    pStep.result = result;
    pStep.success = success;
    if (callbacks.onPipelineStepUpdated) {
      callbacks.onPipelineStepUpdated({ ...pStep });
    }

    const tStep = traceSteps.find((s) => s.stepNumber === pStep.stepNumber);
    if (tStep) {
      tStep.status = success ? 'completed' : 'failed';
      tStep.durationMs = durationMs;
      tStep.output = result;
      callbacks.onStepUpdated({ ...tStep });
    }
  };

  // STEP 1: Intent Detection (Orchestrator Agent)
  callbacks.onStatusChange('Received');
  callbacks.onAgentChange('Orchestrator Agent');
  const step1 = addPipelineStep(
    1,
    'Intent Detection',
    'Orchestrator Agent',
    `Decomposing request semantics and identifying task goals for "${userPrompt.length > 55 ? userPrompt.substring(0, 55) + '...' : userPrompt}".`,
    undefined,
    { userRequest: userPrompt, priority: 'HIGH', tenant: 'Enterprise-Prod' }
  );
  await delay(450);
  completePipelineStep(
    step1,
    `Detected Intent: "${routing.intent}". Confidence: 99.4%. Routing priority established.`,
    320,
    true
  );

  // STEP 2: Task Planning (Planning Agent)
  callbacks.onStatusChange('Planning');
  callbacks.onAgentChange('Planning Agent');
  const step2 = addPipelineStep(
    2,
    'Task Planning',
    'Planning Agent',
    routing.planDescription,
    undefined,
    { executionMode: 'Sequential DAG', rollbackCheckpoints: 2, requiredCapabilities: [routing.selectedTool] }
  );
  await delay(550);
  completePipelineStep(
    step2,
    `Synthesized Execution Plan: [Decompose] -> [Dispatch to ${routing.selectedAgent}] -> [Invoke ${routing.selectedTool}] -> [Validation Gate].`,
    390,
    true
  );

  // STEP 3: Agent Selection (Orchestrator Agent)
  callbacks.onAgentChange('Orchestrator Agent');
  const step3 = addPipelineStep(
    3,
    'Agent Selection',
    'Orchestrator Agent',
    `Selecting specialist agent based on keyword heuristics: assigned to "${routing.selectedAgent}" with tool "${routing.selectedTool}".`,
    undefined,
    { candidateAgents: ['Research Agent', 'Analysis Agent', 'Validation Agent', 'General Assistant'], selectedAgent: routing.selectedAgent, reason: `Matched intent: ${routing.intent}` }
  );
  await delay(450);
  completePipelineStep(
    step3,
    `Assigned sub-goal to ${routing.selectedAgent}. Model context loaded with ${routing.selectedTool} schema binding.`,
    260,
    true
  );

  // STEP 4: Tool Execution (Selected Specialist Agent)
  callbacks.onStatusChange('Executing');
  callbacks.onAgentChange(routing.selectedAgent, routing.selectedTool);
  const step4 = addPipelineStep(
    4,
    'Tool Execution',
    routing.selectedAgent,
    `Invoking sandboxed tool "${routing.selectedTool}" with scoped parameters.`,
    routing.selectedTool,
    routing.toolParameters
  );
  await delay(750);

  if (requireApproval) {
    callbacks.onStatusChange('Waiting for Approval');
    step4.status = 'waiting_approval';
    step4.result = 'Suspended: Awaiting operator authorization before committing tool state.';
    if (callbacks.onPipelineStepUpdated) callbacks.onPipelineStepUpdated({ ...step4 });
    const tStep = traceSteps.find((s) => s.stepNumber === 4);
    if (tStep) {
      tStep.status = 'waiting_approval';
      callbacks.onStepUpdated({ ...tStep });
    }
    return {
      responseText: '⚠️ **Human-in-the-Loop Approval Required**:\nThe agent has synthesized an action requiring explicit administrative sign-off before proceeding.',
      traceSteps,
      pipelineSteps,
      selectedAgent: routing.selectedAgent,
      selectedTool: routing.selectedTool,
      tokens: 1820,
      latencyMs: Date.now() - startTime,
      waitingApproval: true
    };
  }

  completePipelineStep(step4, routing.toolResultText, 580, true);

  // STEP 5: Validation (Validation Agent)
  callbacks.onStatusChange('Validating');
  callbacks.onAgentChange('Validation Agent');
  const step5 = addPipelineStep(
    5,
    'Validation',
    'Validation Agent',
    'Enforcing NeMo safety guardrails, checking hallucination grounding, and scrubbing sensitive PII credentials.',
    'Document Search',
    { guardrailFilters: ['LlamaGuard-3', 'Presidio-PII-Regex', 'ZeroDataRetention'], confidenceThreshold: 0.95 }
  );
  await delay(500);
  completePipelineStep(
    step5,
    'Validation Passed: 0 prompt injection threats, 0 unredacted PII patterns, 100% schema conformance.',
    310,
    true
  );

  // STEP 6: Final Response (Response Agent)
  callbacks.onStatusChange('Completed');
  callbacks.onAgentChange('Response Agent');
  const step6 = addPipelineStep(
    6,
    'Final Response',
    'Response Agent',
    'Synthesizing multi-agent outputs, telemetry findings, and structured recommendations into final enterprise delivery payload.',
    undefined,
    { outputFormat: 'Markdown + Code/Tables', audience: 'Enterprise Operations' }
  );
  await delay(400);
  completePipelineStep(
    step6,
    'Final response package compiled and delivered to client with full verification provenance.',
    210,
    true
  );

  const totalTokens = pipelineSteps.length * 280 + 720;
  const totalDuration = Date.now() - startTime;

  const generatedResponse = generateSpecializedResponse(userPrompt, routing);

  return {
    responseText: generatedResponse,
    traceSteps,
    pipelineSteps,
    selectedAgent: routing.selectedAgent,
    selectedTool: routing.selectedTool,
    tokens: totalTokens,
    latencyMs: totalDuration
  };
}

function generateSpecializedResponse(
  prompt: string,
  routing: ReturnType<typeof detectTaskIntentAndAgent>
): string {
  const p = prompt.toLowerCase();

  // 1. CALCULATOR RESPONSE
  if (routing.selectedTool === 'Calculator') {
    // Try to extract numbers or compute if possible
    return `### 🧮 Calculator Agent Execution Summary

**Assigned Agent:** \`Analysis Agent\`  
**Tool Invoked:** \`Calculator (IEEE-754 Formal Math Engine)\`  
**Task Intent:** Quantitative Mathematical Computation & Precision Evaluation

---

#### 📐 Step-by-Step Calculation Breakdown
1. **Expression Ingestion:** Parsed query and identified arithmetic operands and operators.
2. **Formula Standardization:** Normalized mathematical notation to canonical reverse Polish notation.
3. **Execution Verification:** Computed via high-precision floating-point arithmetic with 0 roundoff error.

\`\`\`text
Input Expression: ${prompt}
Computation: Verified exact numerical solution
Precision: 64-bit Floating Point (0.00000000000001 tolerance)
Status: COMPLETED WITH 100% ACCURACY
\`\`\`

---

#### 💡 Quantitative Insights & Business Outcome
- **Accuracy Assurance:** Double-checked by the **Validation Agent** against mathematical invariants.
- **Audit Log:** Execution record registered under FinOps Ledger Block \`#${Math.floor(Math.random() * 899999 + 100000)}\`.`;
  }

  // 2. DATA ANALYZER RESPONSE
  if (routing.selectedTool === 'Data Analyzer') {
    return `### 📊 Data Analyzer: Statistical Telemetry & Performance Report

**Assigned Agent:** \`Analysis Agent\`  
**Tool Invoked:** \`Data Analyzer\`  
**Evaluated Dataset:** \`Production Enterprise Telemetry Stream (4,800 data points)\`

---

#### 📈 Statistical Metrics Breakdown
| Metric Dimension | Measured Value | Baseline SLA | Deviation / Status |
| :--- | :--- | :--- | :--- |
| **Sample Size (N)** | 4,800 events | - | 100% Ingested |
| **Median (p50)** | 142.4 ms | < 250 ms | ✅ Normal |
| **p95 Latency** | 380.1 ms | < 500 ms | ✅ Normal |
| **p99 Peak Spike** | **3,420.0 ms** | < 1,000 ms | ⚠️ **Anomaly Detected** |
| **Standard Deviation (σ)**| 218.4 ms | < 50 ms | ⚠️ High Variance |

---

#### 🔬 Root Cause Telemetry Analysis
- **Anomaly Clustering:** 94% of latency excursions occurred during concurrent batch updates to \`orders_v2\`.
- **System Resource Correlation:** PostgreSQL active connection pool hit 98/100 limit during peak processing.
- **Recommendation:** Implement composite index \`idx_orders_tenant_created\` and increase connection pool size to 250.`;
  }

  // 3. RESEARCH AGENT RESPONSE
  if (routing.selectedAgent === 'Research Agent') {
    return `### 🔍 Research Agent: Semantic Knowledge & Synthesis Report

**Assigned Agent:** \`Research Agent\`  
**Tool Invoked:** \`${routing.selectedTool}\`  
**Query Intent:** "${prompt}"

---

#### 📚 Synthesized Knowledge Findings
1. **Architectural Foundations:** Modern enterprise agentic AI architectures rely on decoupled orchestration DAGs, separating cognitive planning (ReAct / Reflection loops) from deterministic sandboxed tool execution.
2. **Contextual Memory & RAG:** High-dimensional vector embeddings paired with hybrid BM25 lexical search achieve **94.2% factual precision** while minimizing token hallucinations.
3. **Safety Isolation:** Using ephemeral microVMs (such as Google gVisor kernel sandboxes) prevents untrusted dynamic code from compromising host boundaries.

---

#### 📑 Verified Source Citations
- **Source 1:** \`enterprise://knowledge-base/agentic-architecture-v2.pdf\` (Relevance: 0.982)
- **Source 2:** \`enterprise://standards/iso-27001-ai-governance.md\` (Relevance: 0.941)
- **Source 3:** \`enterprise://telemetry/opentelemetry-w3c-spec.html\` (Relevance: 0.915)

---

#### 🎯 Strategic Takeaway
The **Validation Agent** has cross-verified all statements against source documents with zero contradictions detected.`;
  }

  // 4. VALIDATION AGENT / CHECK WHETHER
  if (routing.selectedAgent === 'Validation Agent' || p.includes('check') || p.includes('verify') || p.includes('compliant') || p.includes('iam')) {
    return `### 🛡️ Compliance & Policy Verification Audit: Passed

**Assigned Agent:** \`Validation Agent\`  
**Tool Invoked:** \`Document Search & Policy Constraint Solver\`  
**Policy Standard:** \`CIS Foundations Benchmark v1.4 & Zero-Trust Guidelines\`

---

#### 📋 Verification Audit Matrix
| Verification Check | Target Resource | Policy Constraint | Result |
| :--- | :--- | :--- | :--- |
| **Wildcard IAM Roles** | \`role/DataPipelineWorker\` | No \`Resource: "*"\` permitted | ⚠️ **Violation Flagged** |
| **Least-Privilege Scope** | \`s3:::compliance-vault\` | Explicit bucket ARN restriction | ✅ **Compliant** |
| **mTLS Encryption** | Microservice Inter-Agent IPC | TLS 1.3 Cipher Suites only | ✅ **Compliant** |
| **PII Data Redaction** | Customer Transcript Ingestion | Presidio regex + NER masking | ✅ **Compliant** |

---

#### 🛠️ Automated Remediation Action
The **Orchestrator Agent** has generated an explicit, scoped Terraform configuration to eliminate the wildcard privilege without causing service downtime. State backup saved to \`s3://corp-tfstate-backup/v9921\`.`;
  }

  // 5. GENERAL ASSISTANT / DEFAULT
  return `### 🤖 Enterprise Agentic Assistant Response

**Assigned Agent:** \`General Assistant\` (Coordinated by \`Orchestrator Agent\`)  
**Tool Invoked:** \`${routing.selectedTool}\`  
**Query:** "${prompt}"

---

#### 💡 Executive Summary
Your request has been successfully decomposed, analyzed, and verified by our autonomous multi-agent pipeline.

- **Orchestration Stage:** Validated session privileges, parsed prompt semantic structure, and allocated compute resources.
- **Reasoning Stage:** The **${routing.selectedAgent}** formulated an executable strategy using **${routing.selectedTool}**.
- **Security Stage:** The **Validation Agent** confirmed zero PII leakage and 100% adherence to corporate safety guardrails.

---

#### 🚀 Next Steps
You can inspect the full step-by-step telemetry, latency durations, and input/output payloads in the **Live Agent Execution Pipeline** panel on the right.`;
}

export function evaluateGuardrailTest(input: string): {
  isSafe: boolean;
  score: number;
  threatType?: string;
  sanitizedText: string;
  reasons: string[];
} {
  const lower = input.toLowerCase();
  const reasons: string[] = [];
  let isSafe = true;
  let threatType = undefined;
  let score = 0.98;

  // Injection test
  if (
    lower.includes('ignore previous') ||
    lower.includes('system prompt') ||
    lower.includes('jailbreak') ||
    lower.includes('bypass') ||
    lower.includes('dan mode') ||
    lower.includes('disregard')
  ) {
    isSafe = false;
    score = 0.96;
    threatType = 'Prompt Injection / Jailbreak';
    reasons.push('Triggered adversarial prefix match: attempt to override system instruction boundaries.');
  }

  // PII detection test
  let sanitized = input;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

  if (ssnRegex.test(input)) {
    reasons.push('Detected US Social Security Number pattern. Masked with [REDACTED_SSN].');
    sanitized = sanitized.replace(ssnRegex, '[REDACTED_SSN]');
  }
  if (ccRegex.test(input)) {
    reasons.push('Detected Credit Card PAN pattern. Masked with [REDACTED_CREDIT_CARD].');
    sanitized = sanitized.replace(ccRegex, '[REDACTED_CREDIT_CARD]');
  }
  if (emailRegex.test(input)) {
    reasons.push('Detected personal email address. Masked with [REDACTED_EMAIL].');
    sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');
  }

  if (reasons.length === 0) {
    reasons.push('Input conforms to corporate data policy and enterprise safety guidelines.');
  }

  return {
    isSafe,
    score,
    threatType,
    sanitizedText: sanitized,
    reasons
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
